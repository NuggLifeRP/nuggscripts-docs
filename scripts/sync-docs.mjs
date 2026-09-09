/**
 * Builds site pages from the markdown that ships inside each script folder.
 *
 *   npm run sync
 *
 * The script folders stay the source of truth. This splits their long README /
 * CONFIG / INTEGRATION / CHANGELOG files into navigable pages, rewrites the
 * cross-file links to site links, and reports anything a source file gained
 * that no page claims yet.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import GithubSlugger from 'github-slugger';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_ROOT = path.join(ROOT, 'src', 'content', 'docs');
const MANIFEST = path.join(ROOT, 'docs.sources.json');
const INTRO = '__intro__';

const warnings = [];
const warn = (m) => warnings.push(m);

/* -- parsing ------------------------------------------------------------- */

/** Drops the ASCII banner that sits above the first heading. */
function stripBanner(text) {
  const lines = text.split(/\r?\n/);
  const first = lines.findIndex((l) => /^# /.test(l));
  return first === -1 ? text : lines.slice(first).join('\n');
}

/** Splits a document into its intro and its level-2 sections. */
function parse(text) {
  const lines = stripBanner(text).split('\n');
  const title = lines[0].replace(/^#\s+/, '').trim();

  const sections = [];
  let current = { heading: INTRO, lines: [] };
  let fence = null;

  for (const line of lines.slice(1)) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
    }

    if (!fence && /^## /.test(line)) {
      sections.push(current);
      current = { heading: line.replace(/^##\s+/, '').trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  sections.push(current);

  return { title, sections };
}

/** Every heading in a section, in order, with its level. */
function headingsOf(section) {
  const found = [];
  if (section.heading !== INTRO) found.push({ level: 2, text: section.heading });

  let fence = null;
  for (const line of section.lines) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const h = line.match(/^(#{2,6})\s+(.*)$/);
    if (h) found.push({ level: h[1].length, text: h[2].trim() });
  }
  return found;
}

/* -- page addressing ----------------------------------------------------- */

/** The URL directory a page is served from, e.g. /nuggs-multicharacter/config/. */
function urlOf(productSlug, outDir, slug) {
  const parts = [productSlug, outDir, slug === 'index' ? '' : slug].filter(Boolean);
  return `/${parts.join('/')}/`;
}

function fileOf(productSlug, outDir, slug) {
  return path.join(OUT_ROOT, productSlug, outDir || '', `${slug}.md`);
}

/** A base-path agnostic link from one page URL to another. */
function relativeLink(fromUrl, toUrl, anchor) {
  const from = fromUrl.replace(/\/$/, '') || '/';
  const to = toUrl.replace(/\/$/, '') || '/';
  let rel = path.posix.relative(from, to);
  if (rel === '') rel = './';
  else if (!rel.startsWith('.')) rel = `./${rel}`;
  if (!rel.endsWith('/')) rel += '/';
  return anchor ? `${rel}${anchor}` : rel;
}

const yaml = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/* -- build --------------------------------------------------------------- */

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
let written = 0;

for (const product of manifest.products) {
  if (!existsSync(product.source)) {
    warn(`source folder missing for ${product.slug}: ${product.source}`);
    continue;
  }

  await rm(path.join(OUT_ROOT, product.slug), { recursive: true, force: true });

  // Parse each distinct source file once.
  const docs = new Map();
  for (const spec of product.files) {
    if (docs.has(spec.file)) continue;
    const full = path.join(product.source, spec.file);
    if (!existsSync(full)) {
      warn(`${product.slug}: ${spec.file} not found in ${product.source}`);
      continue;
    }
    docs.set(spec.file, parse(await readFile(full, 'utf8')));
  }

  // Work out which page owns each section, across every spec for that file.
  const pages = [];
  const owner = new Map(); // `${file}::${heading}` -> page

  for (const spec of product.files) {
    const doc = docs.get(spec.file);
    if (!doc) continue;

    for (const p of spec.pages) {
      const page = {
        ...p,
        file: spec.file,
        outDir: spec.outDir ?? '',
        url: urlOf(product.slug, spec.outDir ?? '', p.slug),
        out: fileOf(product.slug, spec.outDir ?? '', p.slug),
        wanted:
          p.sections === '*'
            ? doc.sections.map((s) => s.heading)
            : p.sections,
        sections: [],
      };

      for (const heading of page.wanted) {
        const section = doc.sections.find((s) => s.heading === heading);
        if (!section) {
          warn(`${product.slug}/${spec.file}: page "${p.slug}" wants section "${heading}", which is not in the file`);
          continue;
        }
        const key = `${spec.file}::${heading}`;
        if (owner.has(key)) {
          warn(`${product.slug}/${spec.file}: section "${heading}" is claimed by two pages`);
          continue;
        }
        owner.set(key, page);
        page.sections.push(section);
      }
      pages.push(page);
    }
  }

  // Anything the source gained that no page shows.
  for (const [file, doc] of docs) {
    const specs = product.files.filter((s) => s.file === file);
    const dropped = new Set(specs.flatMap((s) => s.drop ?? []));
    for (const section of doc.sections) {
      if (owner.has(`${file}::${section.heading}`)) continue;
      if (dropped.has(section.heading)) continue;
      const label = section.heading === INTRO ? '(intro)' : section.heading;
      warn(`${product.slug}/${file}: section ${label} is not on any page — add it to docs.sources.json`);
    }
  }

  // Anchor index: GitHub anchor in the source -> page and anchor on the site.
  const anchors = new Map(); // `${file}#${sourceAnchor}` -> { page, anchor }

  for (const [file, doc] of docs) {
    const fileSlugger = new GithubSlugger();
    const pageSluggers = new Map();

    for (const section of doc.sections) {
      const page = owner.get(`${file}::${section.heading}`);
      for (const h of headingsOf(section)) {
        const sourceAnchor = fileSlugger.slug(h.text);
        if (!page) continue;
        if (!pageSluggers.has(page)) pageSluggers.set(page, new GithubSlugger());
        const targetAnchor = pageSluggers.get(page).slug(h.text);
        anchors.set(`${file}#${sourceAnchor}`, { page, anchor: `#${targetAnchor}` });
      }
    }
  }

  // First page defined for a file is where a link with no anchor lands.
  const fileIndex = new Map();
  for (const page of pages) if (!fileIndex.has(page.file)) fileIndex.set(page.file, page);

  const bySectionNumber = new Map();
  for (const page of pages) {
    if (page.sectionNumber != null) bySectionNumber.set(`${page.file}::${page.sectionNumber}`, page);
  }

  const linkRe = /\[([^\]]*)\]\((README|CONFIG|INTEGRATION|CHANGELOG)\.md(#[^)\s]*)?\)/g;

  for (const page of pages) {
    const body = page.sections
      .map((s) =>
        (s.heading === INTRO ? s.lines.join('\n') : `## ${s.heading}\n${s.lines.join('\n')}`).trim()
      )
      .filter(Boolean)
      .join('\n\n');

    const resolved = body.replace(linkRe, (match, text, file, hash) => {
      const source = `${file}.md`;
      const index = fileIndex.get(source);

      // "CONFIG.md" and "CONFIG.md § 6" are file references. On the site they
      // should read as the page they lead to.
      const bare = text.match(/^(?:README|CONFIG|INTEGRATION|CHANGELOG)\.md\s*(§+.*)?$/);
      const label = (target) => {
        if (!bare) return text;
        if (bare[1]) return `${index?.title ?? text} ${bare[1].trim()}`;
        return target?.title ?? index?.title ?? text;
      };

      if (hash) {
        const hit = anchors.get(`${source}${hash}`);
        if (hit) {
          return `[${label(hit.page)}](${relativeLink(page.url, hit.page.url, hit.anchor)})`;
        }
      }

      const section = text.match(/§+\s*(\d+)/);
      if (section) {
        const hit = bySectionNumber.get(`${source}::${section[1]}`);
        if (hit) return `[${label(hit)}](${relativeLink(page.url, hit.url)})`;
      }

      if (index) return `[${label(index)}](${relativeLink(page.url, index.url)})`;

      warn(`${product.slug}: could not resolve link ${match} on ${page.url}`);
      return match;
    });

    const frontmatter = [
      '---',
      `title: ${yaml(page.title)}`,
      `description: ${yaml(page.description)}`,
      'sidebar:',
      `  order: ${page.order}`,
      '---',
      '',
      `<!-- Generated by npm run sync from ${product.name}/${page.file}. Edit that file, not this one. -->`,
      '',
    ].join('\n');

    await mkdir(path.dirname(page.out), { recursive: true });
    await writeFile(page.out, `${frontmatter}${resolved}\n`, 'utf8');
    written++;
  }

  console.log(`${product.slug}: ${pages.length} pages from ${docs.size} source files`);
}

console.log(`\n${written} pages written to src/content/docs/`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
} else {
  console.log('no warnings — every source section is on a page');
}

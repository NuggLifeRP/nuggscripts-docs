/**
 * Guards the public docs repository against ever publishing product source.
 *
 *   npm run check:source
 *
 * This repository is public. The scripts it documents are paid, escrowed
 * products, so nothing but documentation may ever be committed here. This runs
 * in CI before the build, so a mistake fails the deploy instead of shipping.
 *
 * It inspects what git actually tracks — the exact set of files that become
 * public — rather than what happens to be sitting in the working directory.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// The site's own code. Everything else of these types is product source.
const SITE_FILES = new Set([
  'astro.config.mjs',
  'site.config.mjs',
  'src/content.config.ts',
  'scripts/sync-docs.mjs',
  'scripts/build-assets.mjs',
  'scripts/check-links.mjs',
  'scripts/check-no-source.mjs',
  'src/styles/custom.css',
]);

const BLOCKED_EXT = new Set([
  '.lua', '.sql', '.fxap', '.rpf', '.ytd', '.ydr', '.ydd', '.yft', '.ymap',
  '.ytyp', '.ybn', '.ynv', '.ynd', '.ycd', '.awc', '.dll', '.exe', '.zip',
  '.rar', '.7z', '.tar', '.gz', '.env', '.pem', '.key',
]);

const BLOCKED_NAME = new Set([
  'fxmanifest.lua', '__resource.lua', 'install.sql', 'config.lua',
  'server.cfg', '.env', 'server.key',
]);

// Tight enough not to fire on documentation that merely discusses secrets.
const SECRET_PATTERNS = [
  [/\b[MNO][A-Za-z\d_-]{23,25}\.[A-Za-z\d_-]{6}\.[A-Za-z\d_-]{27,38}\b/, 'Discord bot token'],
  [/\bcfxk_[A-Za-z\d_]{10,}/, 'Cfx.re license key'],
  [/\bgh[pousr]_[A-Za-z\d]{36,}/, 'GitHub token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\bmysql:\/\/[^\s"'`]*:[^\s"'`@]+@/, 'database URL with a password'],
  [/\b(?!0{8}|x{8})[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/, 'UUID that may be a live secret'],
];

// A documentation example is short. A dump of the product is not.
const MAX_CODE_BLOCK_LINES = 60;

const problems = [];

for (const file of tracked) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).toLowerCase();

  if (!SITE_FILES.has(file)) {
    if (BLOCKED_EXT.has(ext)) {
      problems.push(`${file}: ${ext} files are product source and must never be committed here`);
      continue;
    }
    if (BLOCKED_NAME.has(base)) {
      problems.push(`${file}: "${base}" is a resource file, not documentation`);
      continue;
    }
  }

  if (!/\.(md|mdx|json|mjs|ts|css|yml|yaml)$/i.test(file)) continue;
  if (statSync(file).size > 2_000_000) continue;

  const text = readFileSync(file, 'utf8');

  for (const [pattern, label] of SECRET_PATTERNS) {
    const hit = text.match(pattern);
    if (hit) {
      problems.push(`${file}: looks like a ${label} — "${hit[0].slice(0, 12)}…"`);
    }
  }

  if (/\.mdx?$/i.test(file)) {
    for (const m of text.matchAll(/^```(\w*)\n([\s\S]*?)^```/gm)) {
      const lines = m[2].split('\n').length;
      if (lines > MAX_CODE_BLOCK_LINES) {
        problems.push(
          `${file}: a ${lines}-line ${m[1] || 'code'} block — documentation examples are short, so check this is not a source dump`
        );
      }
    }
  }
}

console.log(`inspected ${tracked.length} tracked files`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s) — this must not be published:`);
  for (const p of problems) console.error(`  x ${p}`);
  process.exit(1);
}
console.log('documentation only — no product source, no credentials');

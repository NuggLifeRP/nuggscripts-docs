/**
 * Adds a Content-Security-Policy to every page in dist/.
 *
 *   node scripts/csp.mjs          (runs as part of `npm run build`)
 *
 * GitHub Pages cannot send security headers, so the policy goes in a <meta>
 * tag at the very top of <head>. Scripts may only come from this site and from
 * Tebex.js; the few inline scripts Starlight emits are allowed by their exact
 * SHA-256 hash, so an injected <script> cannot run even if it reached a page.
 * The build fails if a page ends up without the policy.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const DIST = path.join(path.resolve(import.meta.dirname, '..'), 'dist');

const BASE = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://js.tebex.io', "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https://dunb17ur4ymx4.cloudfront.net', 'https://cdn.tebex.io', 'https://i.ytimg.com'],
  'font-src': ["'self'", 'data:'],
  'media-src': ["'self'", 'blob:'],
  'connect-src': ["'self'", 'https://headless.tebex.io', 'https://*.tebex.io'],
  'frame-src': ['https://pay.tebex.io', 'https://portal.tebex.io', 'https://www.youtube-nocookie.com'],
  'worker-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'", 'https://*.tebex.io'],
  'upgrade-insecure-requests': [],
};

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const NON_JS = /type\s*=\s*["']?(application\/(ld\+)?json|text\/template|text\/plain)/i;

let pages = 0;
for (const file of await htmlFiles(DIST)) {
  let html = await readFile(file, 'utf8');
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  const hashes = new Set();
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? '';
    if (/\ssrc\s*=/i.test(attrs) || NON_JS.test(attrs) || !m[2].trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
  }
  const directives = { ...BASE, 'script-src': [...BASE['script-src'], ...hashes] };
  const policy = Object.entries(directives).map(([k, v]) => [k, ...v].join(' ')).join('; ');
  const tags = `<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="strict-origin-when-cross-origin">`;
  if (!/<head[^>]*>/i.test(html)) throw new Error(`${file}: no <head>`);
  html = html.replace(/<meta name="referrer"[^>]*>/i, '').replace(/<head([^>]*)>/i, (h) => `${h}${tags}`);
  await writeFile(file, html, 'utf8');
  pages++;
}

if (!pages) throw new Error('No pages found in dist/ — run the Astro build first.');
console.log(`Content-Security-Policy added to ${pages} pages`);

/**
 * Snapshots the live Tebex catalogue into src/data/catalog.json.
 *
 *   npm run catalog
 *
 * The store pages are built from this file, so they render with real names,
 * prices and descriptions even with JavaScript off. In the browser the prices
 * are refreshed from the same API, so a sale started in Tebex shows without a
 * rebuild. CI runs this before every build and keeps the committed snapshot if
 * Tebex cannot be reached, so an API outage never blocks a docs deploy.
 */

import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { STORE } from '../src/data/store.config.mjs';

const OUT = path.join(import.meta.dirname, '..', 'src', 'data', 'catalog.json');
const url = `https://headless.tebex.io/api/accounts/${STORE.publicToken}/categories?includePackages=1`;

const res = await fetch(url, { headers: { accept: 'application/json' } });
if (!res.ok) {
  console.error(`Tebex returned ${res.status} for the catalogue; keeping the committed snapshot.`);
  process.exit(1);
}
const { data } = await res.json();

const categories = [];
const packages = [];
for (const c of data) {
  categories.push({ id: c.id, name: c.name, slug: c.slug, order: c.order ?? 0 });
  for (const p of c.packages ?? []) {
    packages.push({
      id: p.id,
      name: p.name,
      category: c.id,
      price: p.total_price,
      basePrice: p.base_price,
      discount: p.discount ?? 0,
      currency: p.currency,
      image: p.image,
      media: (p.media ?? []).filter((m) => m.type === 'image').map((m) => m.url),
      description: p.description,
      updated: p.updated_at,
      created: p.created_at,
      order: p.order ?? 0,
    });
  }
}

if (!packages.length) {
  console.error('Tebex returned an empty catalogue; keeping the committed snapshot.');
  process.exit(1);
}

const next = JSON.stringify({ categories, packages }, null, 1) + '\n';
let prev = '';
try { prev = await readFile(OUT, 'utf8'); } catch {}
if (prev === next) {
  console.log(`catalog unchanged — ${packages.length} packages in ${categories.length} categories`);
} else {
  await writeFile(OUT, next, 'utf8');
  console.log(`catalog written — ${packages.length} packages in ${categories.length} categories`);
}

import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Source image locations live in sources.local.json, which is gitignored, so no
// path from this machine is ever published.
const LOCAL = path.join(path.resolve(import.meta.dirname, '..'), 'sources.local.json');
if (!existsSync(LOCAL)) {
  console.error(
    'sources.local.json not found. Copy sources.local.example.json to ' +
      'sources.local.json and point it at the source images on this machine.'
  );
  process.exit(1);
}
const local = JSON.parse(await readFile(LOCAL, 'utf8'));

const LOGO = local.assets?.logo;
const THUMB = local.assets?.thumbnails?.['nuggs-multicharacter'];

for (const [label, file] of [['logo', LOGO], ['thumbnail', THUMB]]) {
  if (!file || !existsSync(file)) {
    console.error(`the ${label} named in sources.local.json was not found`);
    process.exit(1);
  }
}

await mkdir('src/assets', { recursive: true });
await mkdir('public', { recursive: true });

const logo = sharp(LOGO);
const { width, height } = await logo.metadata();
console.log(`logo source ${width}x${height}`);

await sharp(LOGO)
  .resize({ width: 900 })
  .png({ quality: 90, compressionLevel: 9 })
  .toFile('src/assets/logo-full.png');

const markHeight = Math.round(height * 0.63);
await sharp(LOGO)
  .extract({ left: 0, top: 0, width, height: markHeight })
  .resize({ width: 320 })
  .png({ quality: 90, compressionLevel: 9 })
  .toFile('src/assets/logo-mark.png');

await sharp(LOGO)
  .extract({ left: 0, top: 0, width, height: markHeight })
  .resize({ width: 180, height: 180, fit: 'contain', background: { r: 11, g: 7, b: 16, alpha: 1 } })
  .png()
  .toFile('public/favicon.png');

const t = sharp(THUMB);
const tm = await t.metadata();
console.log(`thumb source ${tm.width}x${tm.height}`);

await sharp(THUMB).resize({ width: 1200 }).jpeg({ quality: 84, mozjpeg: true })
  .toFile('src/assets/multicharacter.jpg');

await sharp(THUMB).resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/og-multicharacter.jpg');

await sharp(LOGO).resize({ width: 1200, height: 630, fit: 'contain', background: { r: 11, g: 7, b: 16, alpha: 1 } })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og-default.jpg');

console.log('assets built');

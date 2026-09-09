import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const LOGO = 'C:/NuggGithub/Multicharacter/NuggAssassinLogo.png';
const THUMB = 'C:/NuggGithub/Multicharacter/NuggsMulticharacterThumbnail.jpg';

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

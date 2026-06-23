/**
 * Generates StayOps PWA icons from the source logo PNG.
 * Uses sharp to trim whitespace then pad to a square before resizing.
 * Run: node generate-icons.mjs
 */
import fs from 'node:fs';
import sharp from 'sharp';

const src = 'public/favicon.png.png';

const icons = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'icon-512.png',         size: 512 },
];

// Trim whitespace, then add small padding, resize to square
for (const { name, size } of icons) {
  const pad = Math.round(size * 0.06);
  const inner = size - pad * 2;

  await sharp(src)
    .trim({ background: '#ffffff', threshold: 10 })
    .resize(inner, inner, { fit: 'contain', background: '#ffffff' })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' })
    .png()
    .toFile(`public/${name}`);

  console.log(`✓ public/${name}  (${size}×${size})`);
}

// favicon.png — 64px for browser tab
await sharp(src)
  .trim({ background: '#ffffff', threshold: 10 })
  .resize(56, 56, { fit: 'contain', background: '#ffffff' })
  .extend({ top: 4, bottom: 4, left: 4, right: 4, background: '#ffffff' })
  .png()
  .toFile('public/favicon.png');

console.log('✓ public/favicon.png  (64×64)');
console.log('\nDone. Commit public/ and deploy.');

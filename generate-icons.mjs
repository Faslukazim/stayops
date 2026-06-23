/**
 * Generates StayOps PWA icons from the source logo PNG using @resvg/resvg-js.
 * Run: node generate-icons.mjs
 */
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const srcPng = fs.readFileSync('public/favicon.png.png');
const base64 = srcPng.toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;

// Source image is 1536x1024 (3:2). We place it centred on a square white canvas
// with 10% padding on each side, preserving aspect ratio.
function makeSvg(size) {
  const pad = Math.round(size * 0.08);
  const imgW = size - pad * 2;
  const imgH = Math.round(imgW * (1024 / 1536));
  const imgY = Math.round((size - imgH) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="white"/>
  <image x="${pad}" y="${imgY}" width="${imgW}" height="${imgH}" xlink:href="${dataUrl}"/>
</svg>`;
}

const icons = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'icon-512.png',         size: 512 },
];

for (const { name, size } of icons) {
  const svg = makeSvg(size);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  fs.writeFileSync(`public/${name}`, png);
  console.log(`✓ public/${name}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

// Also copy the source as favicon.png for the <link rel="icon"> tag
fs.copyFileSync('public/favicon.png.png', 'public/favicon.png');
console.log('✓ public/favicon.png  (copied from source)');

console.log('\nDone. Commit public/ and deploy.');

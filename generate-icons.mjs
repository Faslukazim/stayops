/**
 * Generates StayB PWA icons from SVG using @resvg/resvg-js.
 * Run: node generate-icons.mjs
 */
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

function makeSvg(size) {
  const fontSize = Math.round(size * 0.38);
  const padding = Math.round(size * 0.08);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="white"/>
  <text
    x="${size / 2}"
    y="${size / 2 + fontSize * 0.35}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="black"
    text-anchor="middle"
    letter-spacing="-${Math.round(size * 0.008)}"
  >S</text>
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

console.log('\nDone. Commit public/ and deploy.');

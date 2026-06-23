/**
 * Generates StayOps PWA icons — white background, black "B" lettermark.
 * Run: node generate-icons.mjs
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const o = y * (1 + width * 4) + 1 + x * 4;
      raw[o] = pixels[i]; raw[o+1] = pixels[i+1]; raw[o+2] = pixels[i+2]; raw[o+3] = pixels[i+3];
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeIcon(size) {
  const px = new Uint8Array(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r; px[i+1] = g; px[i+2] = b; px[i+3] = a;
  }

  // White background
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      setPixel(x, y, 255, 255, 255);

  // Draw bold "B" centered — defined as filled rectangles + two right-side bumps
  const s = size;
  const sw = Math.round(s * 0.11);   // stroke width
  const bH = Math.round(s * 0.60);   // letter height
  const bW = Math.round(s * 0.38);   // letter width
  const ox = Math.round(s * 0.30);   // left edge x
  const oy = Math.round(s * 0.20);   // top edge y

  function fillRect(x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        setPixel(x, y, 0, 0, 0);
  }

  function fillArc(cx, cy, r, aStart, aEnd, thickness) {
    const steps = Math.ceil(r * Math.PI * 2);
    for (let i = 0; i <= steps; i++) {
      const a = aStart + (aEnd - aStart) * (i / steps);
      for (let t = -thickness / 2; t <= thickness / 2; t++) {
        const rx = cx + Math.cos(a) * (r + t);
        const ry = cy + Math.sin(a) * (r + t);
        setPixel(Math.round(rx), Math.round(ry), 0, 0, 0);
      }
    }
  }

  // Vertical stem
  fillRect(ox, oy, ox + sw - 1, oy + bH - 1);

  // Top horizontal bar
  fillRect(ox, oy, ox + Math.round(bW * 0.7), oy + sw - 1);

  // Middle horizontal bar
  const midY = oy + Math.round(bH * 0.48);
  fillRect(ox, midY, ox + Math.round(bW * 0.7), midY + sw - 1);

  // Bottom horizontal bar
  fillRect(ox, oy + bH - sw, ox + Math.round(bW * 0.7), oy + bH - 1);

  // Top bump (upper right half of B)
  const topBumpCY = oy + Math.round(bH * 0.24);
  const topBumpR = Math.round(bH * 0.24);
  fillArc(ox + Math.round(bW * 0.3), topBumpCY, topBumpR - Math.round(sw / 2), -Math.PI / 2, Math.PI / 2, sw);

  // Bottom bump (lower right half of B) — slightly larger
  const botBumpCY = oy + Math.round(bH * 0.74);
  const botBumpR = Math.round(bH * 0.26);
  fillArc(ox + Math.round(bW * 0.3), botBumpCY, botBumpR - Math.round(sw / 2), -Math.PI / 2, Math.PI / 2, sw);

  return px;
}

const icons = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'icon-512.png',         size: 512 },
];

for (const { name, size } of icons) {
  const pixels = makeIcon(size);
  const png = encodePNG(size, size, pixels);
  fs.writeFileSync(`public/${name}`, png);
  console.log(`✓ public/${name}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log('\nDone. Commit public/ and deploy.');

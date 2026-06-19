// Generates PNG icons from scratch using only Node built-ins.
// Run: node scripts/gen-icons.mjs
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = crcTable[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([t, data]));
  const out = Buffer.alloc(4 + 4 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  t.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

// Draw a pixel into raw row buffer
function setPixel(rows, size, x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const base = y * (1 + size * 3) + 1 + x * 3;
  rows[base] = r; rows[base + 1] = g; rows[base + 2] = b;
}

// Scale and draw an 8x8 pixel-art letter centered on canvas
function drawLetter(rows, size, pattern, fr, fg, fb) {
  const scale = Math.floor(size * 0.38);
  const offX = Math.floor((size - scale * 8) / 2);
  const offY = Math.floor((size - scale * 8) / 2);
  for (let py = 0; py < 8; py++) {
    for (let px = 0; px < 8; px++) {
      if (pattern[py][px]) {
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++)
            setPixel(rows, size, offX + px * scale + sx, offY + py * scale + sy, fr, fg, fb);
      }
    }
  }
}

// 8x8 pixel "S"
const S = [
  [0,1,1,1,1,1,1,0],
  [1,1,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,0],
  [0,0,0,0,0,1,1,1],
  [1,1,0,0,0,0,1,1],
  [0,1,1,1,1,1,1,0],
];

function makePNG(size, bgR, bgG, bgB, fgR, fgG, fgB) {
  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(size * rowLen);
  // Fill background
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const i = y * rowLen + 1 + x * 3;
      raw[i] = bgR; raw[i + 1] = bgG; raw[i + 2] = bgB;
    }
  }
  drawLetter(raw, size, S, fgR, fgG, fgB);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });

// bg: #0F1117  fg: white
const bg = [15, 17, 23];
const fg = [255, 255, 255];

writeFileSync('public/apple-touch-icon.png', makePNG(180, ...bg, ...fg));
writeFileSync('public/icon-192.png',         makePNG(192, ...bg, ...fg));
writeFileSync('public/icon-512.png',         makePNG(512, ...bg, ...fg));

console.log('✓ public/apple-touch-icon.png (180×180)');
console.log('✓ public/icon-192.png (192×192)');
console.log('✓ public/icon-512.png (512×512)');

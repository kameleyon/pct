// Convert product photos (tool on white background) to transparent-background PNGs.
// Flood-fills near-white pixels connected to the image border, so white
// highlights INSIDE the tool are preserved. Writes <name>.png next to each jpg.
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const DIR = 'public/slots';
const THRESH = 235; // r,g,b all above → "white enough"

const files = readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f) && !/\(1\)/.test(f));
for (const f of files) {
  const src = join(DIR, f);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const idx = (x, y) => (y * W + x) * 4;
  const isWhite = (x, y) => {
    const i = idx(x, y);
    return data[i] >= THRESH && data[i + 1] >= THRESH && data[i + 2] >= THRESH;
  };
  // BFS from every border pixel
  const seen = new Uint8Array(W * H);
  const queue = [];
  for (let x = 0; x < W; x++) { queue.push([x, 0], [x, H - 1]); }
  for (let y = 0; y < H; y++) { queue.push([0, y], [W - 1, y]); }
  while (queue.length) {
    const [x, y] = queue.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const s = y * W + x;
    if (seen[s]) continue;
    seen[s] = 1;
    if (!isWhite(x, y)) continue;
    data[idx(x, y) + 3] = 0; // transparent
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const out = join(DIR, basename(f).replace(/\.jpe?g$/i, '.png'));
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out);
  console.log(`${f} -> ${basename(out)}`);
}
console.log(`\n${files.length} images converted`);

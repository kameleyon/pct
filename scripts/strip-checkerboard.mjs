// Remove a baked-in "transparency checkerboard" (white + light-gray squares)
// from covers by flood-filling background-connected light-gray pixels from the borders.
import sharp from 'sharp';

const files = process.argv.slice(2);
for (const p of files) {
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const idx = (x, y) => (y * W + x) * 4;
  const isBg = (x, y) => {
    const i = idx(x, y);
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx - mn < 14 && mn >= 193; // near-neutral and light: checkerboard white/gray
  };
  const seen = new Uint8Array(W * H);
  const q = [];
  for (let x = 0; x < W; x++) q.push([x, 0], [x, H - 1]);
  for (let y = 0; y < H; y++) q.push([0, y], [W - 1, y]);
  while (q.length) {
    const [x, y] = q.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const s = y * W + x;
    if (seen[s]) continue;
    seen[s] = 1;
    if (!isBg(x, y)) continue;
    data[idx(x, y) + 3] = 0;
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(p + '.out');
  console.log('done:', p);
}

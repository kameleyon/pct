// Extract the designer's placed images (per image-slot) from the local template's
// raw .image-slots.state.json into public/img/<slot>.<ext>, and report the mapping.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const statePath = process.argv[2];
const outDir = 'public/img';
mkdirSync(outDir, { recursive: true });

const state = JSON.parse(readFileSync(statePath, 'utf8'));
for (const [id, v] of Object.entries(state)) {
  const u = v?.u || v?.url || v?.src || (typeof v === 'string' ? v : null);
  if (!u || !String(u).startsWith('data:')) { console.log(`${id.padEnd(16)} -> (no data uri) keys=${JSON.stringify(Object.keys(v ?? {}))}`); continue; }
  const m = String(u).match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) { console.log(`${id.padEnd(16)} -> (unparseable)`); continue; }
  const ext = m[1].split('/')[1].replace('jpeg', 'jpg');
  const buf = Buffer.from(m[2], 'base64');
  const file = `${id}.${ext}`;
  writeFileSync(`${outDir}/${file}`, buf);
  console.log(`${id.padEnd(16)} -> img/${file}  (${Math.round(buf.length / 1024)} KB)`);
}

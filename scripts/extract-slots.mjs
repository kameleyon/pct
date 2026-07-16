// One-off: pull the designer's placed images out of the Claude Design
// .image-slots.state.json envelope and write them into public/slots/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const envelopePath = process.argv[2];
const outDir = 'public/slots';
mkdirSync(outDir, { recursive: true });

const envelope = JSON.parse(readFileSync(envelopePath, 'utf8'));
const state = JSON.parse(envelope.content);

for (const [id, v] of Object.entries(state)) {
  const u = v?.u || v?.url || (typeof v === 'string' ? v : null);
  if (!u || !String(u).startsWith('data:')) { console.log(`${id.padEnd(14)} -> (no image)`); continue; }
  const m = String(u).match(/^data:([^;]+);base64,(.*)$/s);
  if (!m) { console.log(`${id.padEnd(14)} -> (unparseable)`); continue; }
  const ext = m[1].split('/')[1].replace('jpeg', 'jpg');
  const buf = Buffer.from(m[2], 'base64');
  writeFileSync(`${outDir}/${id}.${ext}`, buf);
  console.log(`${id.padEnd(14)} -> ${id}.${ext}  (${Math.round(buf.length / 1024)} KB)`);
}

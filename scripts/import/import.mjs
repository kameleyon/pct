// Generic, descriptor-driven endmill importer.
//
//   node scripts/import/import.mjs
//
// Reads scripts/data/*.csv per its descriptor, unpivots the flute matrix,
// parses fractional/metric dimensions (recovering spreadsheet date-corruption),
// and emits idempotent upsert SQL to scripts/import/out/ plus a report.
// The SQL is applied separately via the linked Supabase CLI.

import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readCsv, parseFraction, parseMetricMm, round5, MM_PER_IN,
  isDateCorrupted, recoverDate, parseHeader, sql,
} from './parse.mjs';
import { DESCRIPTORS, GEOMETRY, MANUFACTURER_SLUG } from './descriptors.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const OUT = join(__dirname, 'out');
const CHUNK = 300;                       // VALUES rows per INSERT statement

const report = { files: [], recovered: [], rejected: [], total: 0, seen: new Map() };

// Parse one dimension cell into { in, display, mm? }; records recoveries/rejections.
function dim(raw, system, ctx) {
  let r = raw;
  if (system === 'Imperial') {
    if (isDateCorrupted(r)) { const to = recoverDate(r); report.recovered.push({ ...ctx, from: raw, to }); r = to; }
    const inches = parseFraction(r);
    if (inches == null) return null;
    return { in: round5(inches), display: `${r}"` };
  }
  const mm = parseMetricMm(r);
  if (mm == null) return null;
  return { in: round5(mm / MM_PER_IN), mm, display: `${r} mm` };
}

function buildName(odDisp, flutes, geometry, radiusDisp, helix, coating) {
  let n = `${odDisp} ${flutes}-Flute ${geometry}`;
  if (radiusDisp) n += ` × ${radiusDisp} Rad`;
  if (helix) n += `, ${helix}° Helix`;
  if (coating === 'PowerA (AlTiN)') n += ' — PowerA';
  return n;
}

// Emit a product record (deduped globally on part_number).
function emit(bucket, d, { partNumber, flutes, coating, od, loc, shk, oal, radius, helix }) {
  if (!partNumber) return;
  if (report.seen.has(partNumber)) {
    report.rejected.push({ file: d.file, part: partNumber, reason: `duplicate of ${report.seen.get(partNumber)}` });
    return;
  }
  report.seen.set(partNumber, d.file);

  const specs = {
    od_in: od.in, od_display: od.display,
    loc_in: loc.in, loc_display: loc.display,
    shk_in: shk.in, shk_display: shk.display,
    oal_in: oal.in, oal_display: oal.display,
    series: partNumber.split('-')[0],
  };
  if (radius) { specs.corner_radius_in = radius.in; specs.corner_radius_display = radius.display; }
  if (helix) specs.helix_angle = helix;
  if (d.system === 'Metric') {
    specs.od_mm = od.mm; specs.loc_mm = loc.mm; specs.shk_mm = shk.mm; specs.oal_mm = oal.mm;
    if (radius) specs.corner_radius_mm = radius.mm;
  }

  const name = buildName(od.display, flutes, GEOMETRY[d.category], radius?.display, helix, coating);
  bucket.push({ part: partNumber, slug: partNumber, name, system: d.system, flutes, coating, specs });
}

function processMatrix(d, headers, rows, bucket) {
  const partStart = d.hasRadius ? 5 : 4;        // OD,LOC,SHK,OAL[,Radius], then part cols
  for (const row of rows) {
    if (!row[0]) continue;
    const ctx = { file: d.file, row: row.join(',') };
    const od = dim(row[0], d.system, ctx), loc = dim(row[1], d.system, ctx),
          shk = dim(row[2], d.system, ctx), oal = dim(row[3], d.system, ctx);
    const radius = d.hasRadius ? dim(row[4], d.system, ctx) : null;
    if (!od || !loc || !shk || !oal || (d.hasRadius && !radius)) {
      report.rejected.push({ file: d.file, part: '(row)', reason: 'unparseable dimension', row: row.join(',') });
      continue;
    }
    for (let i = partStart; i < headers.length; i++) {
      const cell = row[i];
      if (!cell) continue;
      const { flutes, coating } = parseHeader(headers[i], d.fixedFlutes);
      emit(bucket, d, { partNumber: cell, flutes, coating, od, loc, shk, oal, radius });
    }
  }
}

function processRow(d, headers, rows, bucket) {
  const idx = k => headers.findIndex(h => h.trim().toLowerCase() === k);
  const iR = idx('radius'), iF = idx('flutes'), iP = headers.findIndex(h => /power\s*-?\s*a/i.test(h));
  for (const row of rows) {
    if (!row[0]) continue;
    const ctx = { file: d.file, row: row.join(',') };
    const od = dim(row[0], d.system, ctx), loc = dim(row[1], d.system, ctx),
          shk = dim(row[2], d.system, ctx), oal = dim(row[3], d.system, ctx);
    const radius = iR >= 0 ? dim(row[iR], d.system, ctx) : null;
    if (!od || !loc || !shk || !oal) {
      report.rejected.push({ file: d.file, part: row[iP], reason: 'unparseable dimension', row: row.join(',') });
      continue;
    }
    emit(bucket, d, {
      partNumber: row[iP], flutes: parseInt(row[iF], 10), coating: 'PowerA (AlTiN)',
      od, loc, shk, oal, radius, helix: d.fixedHelix,
    });
  }
}

function toSql(categorySlug, products) {
  const stmts = [];
  for (let s = 0; s < products.length; s += CHUNK) {
    const rows = products.slice(s, s + CHUNK).map(p =>
      `  (${sql(p.part)}, ${sql(p.slug)}, ${sql(p.name)}, ${sql(p.system)}, ${p.flutes ?? 'null'}, ` +
      `${sql(p.coating)}, ${sql(JSON.stringify(p.specs))})`).join(',\n');
    stmts.push(
`insert into public.products
  (part_number, slug, category_id, manufacturer_id, name, measurement_system, flutes, coating, material, specs)
select v.part_number, v.slug, c.id, m.id, v.name, v.measurement_system, v.flutes, v.coating, 'Carbide', v.specs::jsonb
from (values
${rows}
) as v(part_number, slug, name, measurement_system, flutes, coating, specs),
  (select id from public.categories    where slug = ${sql(categorySlug)}) as c(id),
  (select id from public.manufacturers where slug = ${sql(MANUFACTURER_SLUG)}) as m(id)
on conflict (part_number) do update set
  slug = excluded.slug, category_id = excluded.category_id, manufacturer_id = excluded.manufacturer_id,
  name = excluded.name, measurement_system = excluded.measurement_system, flutes = excluded.flutes,
  coating = excluded.coating, material = excluded.material, specs = excluded.specs, updated_at = now();`);
  }
  return stmts.join('\n\n');
}

// ---- run ----
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let fileNo = 0;
for (const d of DESCRIPTORS) {
  const path = join(DATA, d.file);
  const { headers, rows } = readCsv(readFileSync(path, 'utf8'));
  const bucket = [];
  if (d.layout === 'row') processRow(d, headers, rows, bucket);
  else processMatrix(d, headers, rows, bucket);

  const out = `-- ${d.file} → ${d.category} (${d.system}) — ${bucket.length} products\n${toSql(d.category, bucket)}\n`;
  const name = `${String(++fileNo).padStart(2, '0')}-${d.file.replace(/\.csv$/, '')}.sql`;
  writeFileSync(join(OUT, name), out);
  report.files.push({ file: d.file, category: d.category, system: d.system, products: bucket.length, out: name });
  report.total += bucket.length;
}

writeFileSync(join(OUT, '_report.json'), JSON.stringify(report, (k, v) => k === 'seen' ? undefined : v, 2));

// ---- summary ----
console.log('\n=== IMPORT BUILD SUMMARY ===');
for (const f of report.files) console.log(`  ${f.products.toString().padStart(4)}  ${f.file}  →  ${f.category} (${f.system})`);
console.log(`  ${'----'}`);
console.log(`  ${report.total.toString().padStart(4)}  TOTAL products`);
console.log(`  recovered (date-corruption): ${report.recovered.length}`);
console.log(`  rejected: ${report.rejected.length}`);
if (report.recovered.length)
  console.log('  recovered rows:', report.recovered.map(r => `${r.from}→${r.to}`).join(', '));
if (report.rejected.length)
  console.log('  first rejections:', report.rejected.slice(0, 5));
console.log(`\n  SQL written to scripts/import/out/ (${report.files.length} files)`);

// Generic, descriptor-driven endmill importer.
//
//   node scripts/import/import.mjs
//
// Resolves columns by header NAME, so every file shape flows through one path:
//   dimensions  → OD, LOC, SHK, OAL, Radius, Small OD, Reach, Neck
//   taper angle → Degree
//   flutes      → explicit "Flutes" column (else header digit, else fixedFlutes)
//   part cells  → everything else; coating from header word, or fixedCoating for PartID
// Parses fractional/metric dimensions, recovers spreadsheet date-corruption,
// and emits idempotent upsert SQL to scripts/import/out/ plus a report.

import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsv, measure, round5, parseHeader, sql } from './parse.mjs';
import { DESCRIPTORS, GEOMETRY, MANUFACTURER_SLUG } from './descriptors.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');
const OUT = join(__dirname, 'out');
const CHUNK = 300;

const report = { files: [], recovered: [], rejected: [], total: 0, seen: new Map() };

// header name → canonical dimension spec key
const DIM_MAP = {
  'od': 'od', 'loc': 'loc', 'shk': 'shk', 'oal': 'oal',
  'd1': 'od', 'l1': 'loc', 'd2': 'shk', 'l2': 'oal',
  'lof': 'flute_length', 'l3': 'flute_length',
  'shk-l': 'shank_length', 'shk l': 'shank_length', 'l4': 'shank_length',
  'pilot': 'pilot',
  'radius': 'corner_radius', 'corner radius': 'corner_radius',
  'small od': 'small_od', 'small diameter': 'small_od',
  'reach': 'reach', 'neck': 'neck',
  'neck od': 'neck_od', 'neck length': 'neck_length', 'neck l': 'neck_length', 'neckl': 'neck_length', 'necklength': 'neck_length',
  'opening': 'opening', 'tip to radius': 'tip_to_radius',
  'upcut': 'upcut_length', 'mortise': 'mortise_length',
};
function classify(header) {
  const raw = header.trim().toLowerCase();
  const h = raw.replace(/\s*\([^)]*\)/g, '').trim();             // drop "(D1)"/"(L3)" code suffixes
  if (h in DIM_MAP) return { kind: 'dim', key: DIM_MAP[h] };
  if (raw in DIM_MAP) return { kind: 'dim', key: DIM_MAP[raw] };
  if (/^(deg(ree)?|angle|taper\s*angle)\s*°?$/.test(h)) return { kind: 'taper' };  // "Degree","DEG","DEG °","Angle"
  if (h === 'flutes') return { kind: 'flutes' };
  if (h === 'lh' || h === 'left hand') return { kind: 'lh' };
  if (/wire|letter/.test(h)) return { kind: 'wire' };            // drill gauge size (e.g. "#56", "70")
  if (/point\s*angle|^point$/.test(h)) return { kind: 'point' }; // drill point angle (e.g. "135°")
  return { kind: 'part' };
}
// "Part ID", "PartID", "Par Id" (vendor typo)
const isPartId = (h) => /par\s*t?\s*id/i.test(h);
// coating/flute/flat words present → header encodes variant, not application
const hasVariantSignals = (h) => /flute|power|flat|uncoated|uncloated/i.test(h);
// bur / fiberglass cut-&-style variant carried in the part-column header
function cutFrom(header) {
  const h = String(header).toLowerCase();
  if (/coarse/.test(h)) return 'Coarse Double Cut';
  if (/single\s*cut|singlecut/.test(h)) return 'Single Cut';
  if (/double\s*cut|doublecut/.test(h)) return 'Double Cut';
  if (/aluma\s*cut|alumacut/.test(h)) return 'Aluma Cut';
  if (/diamond\s*cut|diamondcut/.test(h)) return 'Diamond Cut';
  if (/chip\s*breaker|chipbreaker/.test(h)) return 'Chipbreaker';
  if (/round\s*shank/.test(h)) return 'Round Shank';
  if (/tri-?\s*shank/.test(h)) return 'Tri-Shank';
  if (/burend|bur\s*end/.test(h)) return 'Bur End';
  if (/millend|mill\s*end/.test(h)) return 'Mill End';
  if (/drillend|drill\s*end/.test(h)) return 'Drill End';
  if (/plain/.test(h)) return 'Plain End';
  return null;
}

// application = part-column header minus the Part-ID words (e.g. "Part ID - General Wood" → "General Wood")
function applicationFrom(header) {
  const s = header.replace(/par\s*t?\s*id/ig, ' ').replace(/[-–—:]/g, ' ').replace(/\s+/g, ' ').trim();
  return s || null;
}

function buildName(specs, flutes, d, coating) {
  const size = specs.od_display ?? specs.small_od_display ?? specs.shk_display ?? '';
  const geom = [specs.geometry, GEOMETRY[d.category]].filter(Boolean).join(' ');
  let n = `${size} ${flutes ? `${flutes}-Flute ` : ''}${geom}`.trim();
  if (specs.corner_radius_display) n += ` × ${specs.corner_radius_display} Rad`;
  if (specs.taper_angle) n += `, ${specs.taper_angle}° Taper`;
  if (specs.helix_angle) n += `, ${specs.helix_angle}° Helix`;
  if (specs.point_angle) n += `, ${specs.point_angle}° Point`;
  if (specs.coolant) n += `, ${specs.coolant}`;
  if (specs.reach_display) n += `, ${specs.reach_display} Reach`;
  if (specs.neck_length_display) n += ', Necked';
  if (specs.flat) n += ` (${specs.flat})`;
  if (specs.rotation) n += ' (Left Hand)';
  if (coating && coating !== 'Uncoated') n += ` — ${coating}`;
  if (specs.cut) n += ` — ${specs.cut}`;
  if (specs.application) n += ` — ${specs.application}`;
  return n;
}

function emit(bucket, d, partNumber, flutes, coating, extra, baseSpecs) {
  if (!partNumber) return;
  if (report.seen.has(partNumber)) {
    report.rejected.push({ file: d.file, part: partNumber, reason: `duplicate of ${report.seen.get(partNumber)}` });
    return;
  }
  report.seen.set(partNumber, d.file);
  const specs = { ...baseSpecs, series: partNumber.split('-')[0] };
  if (extra?.flat) specs.flat = extra.flat;
  if (extra?.application) specs.application = extra.application;
  if (extra?.pointAngle != null) specs.point_angle = extra.pointAngle;
  if (extra?.coolant) specs.coolant = extra.coolant;
  if (extra?.cut) specs.cut = extra.cut;
  const name = buildName(specs, flutes, d, coating);
  bucket.push({ part: partNumber, slug: partNumber, name, system: d.system, flutes, coating, specs });
}

function processFile(d, headers, rows, bucket) {
  const cls = headers.map(classify);
  for (const row of rows) {
    if (row.every((c) => !String(c ?? '').trim())) continue;   // skip fully-blank rows
    const specs = {};
    let ok = true, explicitFlutes = null;
    for (let i = 0; i < cls.length; i++) {
      const c = cls[i], val = row[i];
      if (c.kind === 'dim') {
        if (!val) continue;                                     // empty dim cell — skip, don't reject
        const m = measure(val, d.system, (from, to) => report.recovered.push({ file: d.file, from, to }));
        if (!m) { ok = false; break; }
        specs[`${c.key}_in`] = m.in; specs[`${c.key}_display`] = m.display;
        if (m.mm != null) specs[`${c.key}_mm`] = m.mm;
      } else if (c.kind === 'taper' && val) {
        specs.taper_angle = parseFloat(val);
      } else if (c.kind === 'flutes' && val) {
        explicitFlutes = parseInt(val, 10);
      } else if (c.kind === 'lh' && val) {
        specs.rotation = 'Left Hand';
      } else if (c.kind === 'wire' && val) {
        specs.wire_size = String(val).trim();
      } else if (c.kind === 'point' && val) {
        const pa = parseFloat(String(val).replace(/[^\d.]/g, ''));
        if (Number.isFinite(pa)) specs.point_angle = pa;
      }
    }
    if (!ok) { report.rejected.push({ file: d.file, part: '(row)', reason: 'unparseable dimension', row: row.join(',') }); continue; }
    if (d.geometry) specs.geometry = d.geometry;
    if (d.fixedHelix) specs.helix_angle = d.fixedHelix;
    if (d.fixedPointAngle) specs.point_angle = d.fixedPointAngle;

    for (let i = 0; i < cls.length; i++) {
      if (cls[i].kind !== 'part') continue;
      const cell = row[i];
      if (!cell) continue;
      const header = headers[i];
      let coating = 'Uncoated', headerFlutes = null, flat = null, application = null;
      const angleM = String(header).match(/(\d{2,3})\s*°/);              // "90°", "142° PowerA"
      const pointAngle = angleM ? parseFloat(angleM[1]) : null;
      // coolant-through facet (Hurricane drills): header carries "Coolant Through" / "Non-Coolant Through"
      const coolant = /non-?\s*coolant/i.test(header) ? 'Non-Coolant Through'
        : /coolant\s*through/i.test(header) ? 'Coolant Through' : null;
      const cut = cutFrom(header);                                       // bur/fiberglass cut & style
      if (hasVariantSignals(header)) {
        const p = parseHeader(header, null); coating = p.coating; headerFlutes = p.flutes; flat = p.flat;
      } else if (pointAngle != null || coolant || cut) {
        coating = d.fixedCoating ?? 'Uncoated';                          // angle/coolant/cut header — the variant is not an application
      } else {
        coating = d.fixedCoating ?? 'Uncoated';
        application = applicationFrom(header ?? '') ?? d.fixedApplication ?? null;
      }
      const flutes = explicitFlutes ?? headerFlutes ?? d.fixedFlutes ?? null;
      emit(bucket, d, cell, flutes, coating, { flat, application, pointAngle, coolant, cut }, specs);
    }
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
select v.part_number, v.slug, c.id, m.id, v.name, v.measurement_system, v.flutes::int, v.coating, 'Carbide', v.specs::jsonb
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
  // Source CSVs are deleted locally once loaded (data lives in Supabase) — skip absent files.
  if (!existsSync(join(DATA, d.file))) {
    report.files.push({ file: d.file, category: d.category, system: d.system, products: 0, note: 'source not present — already loaded' });
    continue;
  }
  const { headers, rows } = readCsv(readFileSync(join(DATA, d.file), 'utf8'));
  const bucket = [];
  processFile(d, headers, rows, bucket);
  const out = `-- ${d.file} → ${d.category} (${d.system}) — ${bucket.length} products\n${toSql(d.category, bucket)}\n`;
  writeFileSync(join(OUT, `${String(++fileNo).padStart(2, '0')}-${d.file.replace(/\.csv$/, '')}.sql`), out);
  report.files.push({ file: d.file, category: d.category, system: d.system, products: bucket.length });
  report.total += bucket.length;
}
writeFileSync(join(OUT, '_report.json'), JSON.stringify(report, (k, v) => k === 'seen' ? undefined : v, 2));

// ---- summary ----
console.log('\n=== IMPORT BUILD SUMMARY ===');
for (const f of report.files) console.log(`  ${f.products.toString().padStart(4)}  ${f.file}  →  ${f.category} (${f.system})`);
console.log(`  ----\n  ${report.total.toString().padStart(4)}  TOTAL products`);
console.log(`  recovered (date-corruption): ${report.recovered.length}`);
console.log(`  rejected: ${report.rejected.length}`);
if (report.rejected.length) console.log('  first rejections:', report.rejected.slice(0, 8));
console.log(`\n  SQL written to scripts/import/out/ (${report.files.length} files)`);

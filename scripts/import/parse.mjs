// Parsing helpers for the endmill CSV importer.
// Pure functions — no I/O — so they are easy to reason about and test.

// --- minimal quote-aware CSV line splitter ---
export function parseCsvLine(line) {
  const out = [];
  let cur = '', inq = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inq) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inq = false; }
      else cur += ch;
    } else if (ch === '"') inq = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export function readCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  return { headers: parseCsvLine(lines[0]), rows: lines.slice(1).map(parseCsvLine) };
}

// --- spreadsheet fraction→date corruption (e.g. "1/2" became "2020-01-02T08:00:00.000Z") ---
const ISO_RE = /^\d{4}-\d{2}-\d{2}T/;
export const isDateCorrupted = s => ISO_RE.test(String(s).trim());
export function recoverDate(s) {
  const d = new Date(s);                       // recover the original fraction as month/day
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

// --- imperial fraction / mixed / decimal → decimal inches ---
export function parseFraction(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/"/g, '');
  if (s === '') return null;
  let m = s.match(/^(\d+)[-\s](\d+)\/(\d+)$/);          // "1-1/2" or "1 1/2"
  if (m) return (+m[1]) + (+m[2]) / (+m[3]);
  m = s.match(/^(\d+)\/(\d+)$/);                          // "1/32"
  if (m) return (+m[1]) / (+m[2]);
  if (/^\.?\d+(\.\d+)?$/.test(s)) return parseFloat(s);  // ".015", "1.5", "1"
  return null;
}

// --- metric decimal → millimetres ---
export function parseMetricMm(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export const round5 = n => (n == null ? null : Math.round(n * 1e5) / 1e5);
export const MM_PER_IN = 25.4;

// --- tolerant header parser: extract flute count + coating from messy headers ---
// Handles: "2-Flute", "2Flute", "2 Flute - Uncoated", "2-Flute PowerA",
//          "2Flute - PowerA", "2 Flute- Power A", "4-Flute power A", "6 Flute - Power A".
export function parseHeader(header, fixedFlutes = null) {
  const coating = /power\s*-?\s*a/i.test(header) ? 'PowerA (AlTiN)' : 'Uncoated';
  let flutes = fixedFlutes;
  const m = header.match(/(\d+)\s*-?\s*flute/i) || header.match(/^\s*(\d+)/);
  if (m) flutes = parseInt(m[1], 10);
  return { flutes, coating };
}

// --- SQL string literal ---
export const sql = v =>
  v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;

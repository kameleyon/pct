// Per-file import descriptors. Each messy CSV maps to one small declaration
// consumed by the single generic importer (import.mjs).
//
//  layout 'matrix' : dimension cols + flute part-number cols (unpivot).
//                    flutes/coating derived from the column header, unless
//                    fixedFlutes is set (headers lacking a flute count).
//  layout 'row'    : one row = one product; explicit Flutes/Radius columns
//                    and a single part-number column.

export const MANUFACTURER_SLUG = 'mastercut-tool';

// display geometry per category slug (used to build product names)
export const GEOMETRY = {
  'square-end-mills': 'Square End Mill',
  'ball-end-mills': 'Ball End Mill',
  'corner-radius-end-mills': 'Corner Radius End Mill',
  'double-end-square-end-mills': 'Double-End Square End Mill',
  '6-flute-square-end-mills': 'Square End Mill',
  '50-helix-corner-radius-end-mills': 'Corner Radius End Mill',
};

export const DESCRIPTORS = [
  { file: 'fractional-square.csv',              category: 'square-end-mills',                 system: 'Imperial', layout: 'matrix', hasRadius: false },
  { file: 'fractional-ball.csv',                category: 'ball-end-mills',                   system: 'Imperial', layout: 'matrix', hasRadius: false },
  { file: 'fractional-corner-radius.csv',       category: 'corner-radius-end-mills',          system: 'Imperial', layout: 'matrix', hasRadius: true  },
  { file: 'fractional-double-end-square.csv',   category: 'double-end-square-end-mills',      system: 'Imperial', layout: 'matrix', hasRadius: false },
  { file: 'fractional-6-flute-square.csv',      category: '6-flute-square-end-mills',         system: 'Imperial', layout: 'matrix', hasRadius: false },
  { file: 'met-square.csv',                     category: 'square-end-mills',                 system: 'Metric',   layout: 'matrix', hasRadius: false },
  { file: 'met-ball.csv',                       category: 'ball-end-mills',                   system: 'Metric',   layout: 'matrix', hasRadius: false },
  { file: 'met-corner-radius.csv',              category: 'corner-radius-end-mills',          system: 'Metric',   layout: 'matrix', hasRadius: true  },
  { file: 'met-double-end-square.csv',          category: 'double-end-square-end-mills',      system: 'Metric',   layout: 'matrix', hasRadius: false },
  { file: 'met-6-flute-square.csv',             category: '6-flute-square-end-mills',         system: 'Metric',   layout: 'matrix', hasRadius: false, fixedFlutes: 6 },
  { file: 'met-50-helix-corner-radius.csv',     category: '50-helix-corner-radius-end-mills', system: 'Metric',   layout: 'row',    hasRadius: true, fixedHelix: 50 },
];

// Fully-redundant source files intentionally skipped: their part numbers already
// exist inside the main MET Square/Ball files with flute counts resolved.
export const SKIPPED = ['MET Extra Long Length Square Endmills.csv', 'MET Extra Long Length Ball Endmill.csv'];

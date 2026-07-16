// Per-file import descriptors. Each messy CSV maps to one small declaration
// consumed by the single generic importer (import.mjs).
//
// Columns are resolved by HEADER NAME (not position), so files with extra
// dimensions (taper Degree/Small OD, necked Reach/Neck), an explicit Flutes
// column, or a bare PartID column all flow through the same code path.
//
// Per-descriptor overrides:
//   fixedFlutes    — flute count when the header/columns don't state it
//   fixedCoating   — coating for PartID columns (no -1 suffix / no header word)
//   fixedHelix     — helix angle (deg) added to specs
//   fixedPointAngle— drill-mill point angle (deg) added to specs

export const MANUFACTURER_SLUG = 'mastercut-tool';

// display geometry per category slug (used to build product names)
export const GEOMETRY = {
  'square-end-mills': 'Square End Mill',
  'ball-end-mills': 'Ball End Mill',
  'corner-radius-end-mills': 'Corner Radius End Mill',
  'double-end-square-end-mills': 'Double-End Square End Mill',
  '6-flute-square-end-mills': 'Square End Mill',
  '50-helix-corner-radius-end-mills': 'Corner Radius End Mill',
  'square-straight-flute-end-mills': 'Square Straight-Flute End Mill',
  'ball-straight-flute-end-mills': 'Ball Straight-Flute End Mill',
  'double-end-ball-end-mills': 'Double-End Ball End Mill',
  'double-end-square-with-flat': 'Double-End Square End Mill (Flat)',
  'double-end-ball-with-flat': 'Double-End Ball End Mill (Flat)',
  'square-mini-mills': 'Square Mini End Mill',
  'ball-mini-mills': 'Ball Mini End Mill',
  'drill-mills': 'Drill Mill',
  'square-taper-mills': 'Square Taper End Mill',
  'ball-taper-mills': 'Ball Taper End Mill',
  'short-flute-square-end-mills': 'Short-Flute Square End Mill',
  'short-flute-ball-end-mills': 'Short-Flute Ball End Mill',
  'short-flute-corner-radius-end-mills': 'Short-Flute Corner Radius End Mill',
};

const POWERA = 'PowerA (AlTiN)';

export const DESCRIPTORS = [
  // ---- core families (loaded first) ----
  { file: 'fractional-square.csv',            category: 'square-end-mills',                 system: 'Imperial' },
  { file: 'fractional-ball.csv',              category: 'ball-end-mills',                   system: 'Imperial' },
  { file: 'fractional-corner-radius.csv',     category: 'corner-radius-end-mills',          system: 'Imperial' },
  { file: 'fractional-double-end-square.csv', category: 'double-end-square-end-mills',      system: 'Imperial' },
  { file: 'fractional-6-flute-square.csv',    category: '6-flute-square-end-mills',         system: 'Imperial' },
  { file: 'met-square.csv',                   category: 'square-end-mills',                 system: 'Metric' },
  { file: 'met-ball.csv',                     category: 'ball-end-mills',                   system: 'Metric' },
  { file: 'met-corner-radius.csv',            category: 'corner-radius-end-mills',          system: 'Metric' },
  { file: 'met-double-end-square.csv',        category: 'double-end-square-end-mills',      system: 'Metric' },
  { file: 'met-6-flute-square.csv',           category: '6-flute-square-end-mills',         system: 'Metric', fixedFlutes: 6 },
  { file: 'met-50-helix-corner-radius.csv',   category: '50-helix-corner-radius-end-mills', system: 'Metric', fixedHelix: 50 },

  // ---- straight-flute ----
  { file: 'fractional-square-straight-flute.csv', category: 'square-straight-flute-end-mills', system: 'Imperial' },
  { file: 'fractional-ball-straight-flute.csv',   category: 'ball-straight-flute-end-mills',   system: 'Imperial' },
  { file: 'met-square-straight-flute.csv',        category: 'square-straight-flute-end-mills', system: 'Metric' },
  { file: 'met-ball-straight-flute.csv',          category: 'ball-straight-flute-end-mills',   system: 'Metric' },

  // ---- double-end (ball) and double-end "with flat" ----
  { file: 'fractional-double-end-ball.csv',       category: 'double-end-ball-end-mills',   system: 'Imperial' },
  { file: 'met-double-end-ball.csv',              category: 'double-end-ball-end-mills',   system: 'Metric' },
  { file: 'fractional-double-end-square-flat.csv', category: 'double-end-square-with-flat', system: 'Imperial' },
  { file: 'fractional-double-end-ball-flat.csv',  category: 'double-end-ball-with-flat',   system: 'Imperial' },

  // ---- mini mills ----
  { file: 'fractional-square-mini-mills.csv',     category: 'square-mini-mills', system: 'Imperial' },
  { file: 'fractional-ball-mini-mills.csv',       category: 'ball-mini-mills',   system: 'Imperial' },
  { file: 'met-square-mini-mills.csv',            category: 'square-mini-mills', system: 'Metric' },
  { file: 'met-ball-mini-mills.csv',              category: 'ball-mini-mills',   system: 'Metric' },

  // ---- drill mills (Metric line is 90° point) ----
  { file: 'fractional-drill-mills.csv',           category: 'drill-mills', system: 'Imperial' },
  { file: 'met-drill-mills.csv',                  category: 'drill-mills', system: 'Metric', fixedPointAngle: 90 },

  // ---- taper mills (Degree + Small OD dims; flutes stated in header) ----
  { file: 'fractional-square-taper-mills.csv',    category: 'square-taper-mills', system: 'Imperial' },
  { file: 'fractional-ball-taper-mills.csv',      category: 'ball-taper-mills',   system: 'Imperial' },

  // ---- short-flute / necked (PartID → PowerA; ball=2, square=4 unless stated) ----
  { file: 'met-short-flute-square-50.csv',              category: 'short-flute-square-end-mills',        system: 'Metric', fixedCoating: POWERA, fixedFlutes: 4, fixedHelix: 50 },
  { file: 'met-short-flute-ball-50.csv',               category: 'short-flute-ball-end-mills',          system: 'Metric', fixedCoating: POWERA, fixedFlutes: 2, fixedHelix: 50 },
  { file: 'met-short-flute-ball-reduced-shank-50.csv', category: 'short-flute-ball-end-mills',          system: 'Metric', fixedCoating: POWERA, fixedFlutes: 2, fixedHelix: 50 },
  { file: 'met-short-flute-ball-necked.csv',           category: 'short-flute-ball-end-mills',          system: 'Metric', fixedCoating: POWERA, fixedFlutes: 2 },
  { file: 'met-short-flute-square-necked.csv',         category: 'short-flute-square-end-mills',        system: 'Metric', fixedCoating: POWERA, fixedFlutes: 4 },
  { file: 'met-short-flute-corner-radius-necked.csv',  category: 'short-flute-corner-radius-end-mills', system: 'Metric', fixedCoating: POWERA, fixedFlutes: 4 },
  { file: 'met-short-flute-square-40.csv',             category: 'short-flute-square-end-mills',        system: 'Metric', fixedFlutes: 4, fixedHelix: 40 },
];

// Fully-redundant source files intentionally skipped: their part numbers already
// exist inside the main MET Square/Ball files with flute counts resolved.
export const SKIPPED = ['MET Extra Long Length Square Endmills.csv', 'MET Extra Long Length Ball Endmill.csv'];

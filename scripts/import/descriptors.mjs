// Per-file import descriptors for the High Performance End Mills family.
// Columns are resolved by header NAME (see import.mjs). Per-descriptor:
//   category  — product-line slug
//   system    — Imperial | Metric
//   geometry  — Square | Ball | Corner Radius (facet; omitted where not applicable)
//   fixedFlutes — flute count when the file doesn't state it (V4/V5=6, HY5=4, F45=6, Hyper/Aluma=2)

export const MANUFACTURER_SLUG = 'mastercut-tool';

// category slug → line label used in product names
export const GEOMETRY = {
  'hp-v4-end-mills': 'V4 End Mill',
  'hp-v5-end-mills': 'V5 End Mill',
  'hp-hy5-end-mills': 'HY5 End Mill',
  'hp-f45-end-mills': 'F45 End Mill',
  'hp-axmill-end-mills': 'AxMill',
  'hp-roughers': 'Rougher',
  'hp-mold-mills': 'Mold Mill',
  'hp-twister-mills': 'Twistermill',
  'hp-hyper-mills': 'Hypermill',
  'hp-alumazips': 'Alumazip',
};

const V = 'hp-v4-end-mills', V5 = 'hp-v5-end-mills', HY5 = 'hp-hy5-end-mills', F45 = 'hp-f45-end-mills',
  AX = 'hp-axmill-end-mills', RO = 'hp-roughers', MO = 'hp-mold-mills', TW = 'hp-twister-mills',
  HY = 'hp-hyper-mills', AL = 'hp-alumazips';
const SQ = 'Square', BA = 'Ball', CR = 'Corner Radius';

export const DESCRIPTORS = [
  // ---- V4 (flutes 6) ----
  { file: 'FRT V4 Square Endmills.csv', category: V, system: 'Imperial', geometry: SQ, fixedFlutes: 6 },
  { file: 'FRT V4 Ball Endmills.csv', category: V, system: 'Imperial', geometry: BA, fixedFlutes: 6 },
  { file: 'FRT - V4 Corner Radius.csv', category: V, system: 'Imperial', geometry: CR, fixedFlutes: 6 },
  { file: 'MET V4 Square.csv', category: V, system: 'Metric', geometry: SQ, fixedFlutes: 6 },
  { file: 'MET V4 Ball.csv', category: V, system: 'Metric', geometry: BA, fixedFlutes: 6 },
  { file: 'MET V4 Corner Radius.csv', category: V, system: 'Metric', geometry: CR, fixedFlutes: 6 },
  // ---- V5 (flutes 6) ----
  { file: 'FRT V5 Square End.csv', category: V5, system: 'Imperial', geometry: SQ, fixedFlutes: 6 },
  { file: 'FRT V5 Ball Endmills.csv', category: V5, system: 'Imperial', geometry: BA, fixedFlutes: 6 },
  { file: 'FRT V5 Corner Radius.csv', category: V5, system: 'Imperial', geometry: CR, fixedFlutes: 6 },
  { file: 'MET V5 Square.csv', category: V5, system: 'Metric', geometry: SQ, fixedFlutes: 6 },
  { file: 'MET V5 Ball.csv', category: V5, system: 'Metric', geometry: BA, fixedFlutes: 6 },
  { file: 'MET V5 Corner Radius.csv', category: V5, system: 'Metric', geometry: CR, fixedFlutes: 6 },
  // ---- HY5 (flutes 4) ----
  { file: 'FRT HY5 Square End.csv', category: HY5, system: 'Imperial', geometry: SQ, fixedFlutes: 4 },
  { file: 'FRT HY5 Corner Radius.csv', category: HY5, system: 'Imperial', geometry: CR, fixedFlutes: 4 },
  { file: 'MET HY5 Square Endmills.csv', category: HY5, system: 'Metric', geometry: SQ, fixedFlutes: 4 },
  { file: 'MET Hy5 Corner Radius.csv', category: HY5, system: 'Metric', geometry: CR, fixedFlutes: 4 },
  // ---- F45 (6-flute finisher; header also states 6) ----
  { file: 'FRT F45 Square End.csv', category: F45, system: 'Imperial', geometry: SQ, fixedFlutes: 6 },
  { file: 'FRT - F45 Corner Radius.csv', category: F45, system: 'Imperial', geometry: CR, fixedFlutes: 6 },
  { file: 'MET F45 Square.csv', category: F45, system: 'Metric', geometry: SQ, fixedFlutes: 6 },
  { file: 'MET F45 Corner Radius.csv', category: F45, system: 'Metric', geometry: CR, fixedFlutes: 6 },
  // ---- AxMill (flutes from header 2/3) ----
  { file: 'FRT Square End Axmills.csv', category: AX, system: 'Imperial', geometry: SQ },
  { file: 'FRT Ball Axmills.csv', category: AX, system: 'Imperial', geometry: BA },
  { file: 'FRT Corner Radius Axmills.csv', category: AX, system: 'Imperial', geometry: CR },
  { file: 'FRT Square Chipbreaker Axmills.csv', category: AX, system: 'Imperial', geometry: SQ },
  { file: 'FRT Square Necked Axmills.csv', category: AX, system: 'Imperial', geometry: SQ },
  { file: 'FRT Ball Necked Axmills.csv', category: AX, system: 'Imperial', geometry: BA },
  { file: 'FRT Corner Radius Necked Axmills.csv', category: AX, system: 'Imperial', geometry: CR },
  { file: 'MET Square Axmills.csv', category: AX, system: 'Metric', geometry: SQ },
  { file: 'MET Axmills CR.csv', category: AX, system: 'Metric', geometry: CR },
  { file: 'MET SQ Chipbreaker Axmills.csv', category: AX, system: 'Metric', geometry: SQ },
  { file: 'MET Corner Chipbreaker Axmills.csv', category: AX, system: 'Metric', geometry: CR },
  // ---- Roughers (explicit Flutes column) ----
  { file: 'FRT Coarse Pitch Roughers.csv', category: RO, system: 'Imperial' },
  { file: 'FRT - Medium Pitch Roughers.csv', category: RO, system: 'Imperial' },
  { file: 'FRT - Fine Pitch Roughers.csv', category: RO, system: 'Imperial' },
  { file: 'MET Coarse Pitch Rougher.csv', category: RO, system: 'Metric' },
  { file: 'MET Medium Pitch Roughers.csv', category: RO, system: 'Metric' },
  { file: 'MET Fine Pitch Rougher.csv', category: RO, system: 'Metric' },
  // ---- Mold Mills (necked; flutes from header where present) ----
  { file: 'FR Mold Mill CR Necked.csv', category: MO, system: 'Imperial', geometry: CR },
  { file: 'FRT Corner Radius Mold Mills Long.csv', category: MO, system: 'Imperial', geometry: CR },
  { file: 'FRT Mold Mills Square Necked.csv', category: MO, system: 'Imperial', geometry: SQ },
  { file: 'FRT Mold Mills Necked Ball.csv', category: MO, system: 'Imperial', geometry: BA },
  { file: 'MET Mold Mills Ball Necked.csv', category: MO, system: 'Metric', geometry: BA },
  { file: 'MET Ball Necked Extended Mold Mills.csv', category: MO, system: 'Metric', geometry: BA },
  // ---- Twistermills ----
  { file: 'FRT Twistermills.csv', category: TW, system: 'Imperial' },
  { file: 'MET Twistermill.csv', category: TW, system: 'Metric' },
  // ---- Hypermills (2-flute) ----
  { file: 'FRT Hypermills.csv', category: HY, system: 'Imperial', fixedFlutes: 2 },
  { file: 'MET Hypermills.csv', category: HY, system: 'Metric', fixedFlutes: 2 },
  // ---- Alumazips (2-flute) ----
  { file: 'FRT Alumazips.csv', category: AL, system: 'Imperial', fixedFlutes: 2 },
  { file: 'MET Alumazips.csv', category: AL, system: 'Metric', fixedFlutes: 2 },
];

// Exact-duplicate "(1)" exports intentionally skipped.
export const SKIPPED = [
  'FR Mold Mill CR Necked (1).csv', 'FRT Corner Radius Mold Mills Long (1).csv',
  'FRT Corner Radius Necked Axmills (1).csv', 'MET Medium Pitch Roughers (1).csv', 'MET SQ Chipbreaker Axmills (1).csv',
];

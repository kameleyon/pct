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
  'r-v-flute-straight': 'V-Flute Straight Router',
  'r-o-flute-straight': 'O-Flute Straight Router',
  'r-o-flute-straight-edge-rounding': 'O-Flute Straight Edge-Rounding Router',
  'r-o-flute-spiral-edge-rounding': 'O-Flute Spiral Edge-Rounding Router',
  'r-o-flute-upcut-spiral': 'O-Flute Upcut Spiral Router',
  'r-o-flute-downcut-spiral': 'O-Flute Downcut Spiral Router',
  'r-upcut-spiral': 'Upcut Spiral Router',
  'r-downcut-spiral': 'Downcut Spiral Router',
  'r-veining-bits': 'Veining Bit',
  'r-compression': 'Compression Router',
  'r-ball-compression': 'Ball Compression Router',
  'r-mortise-compression': 'Mortise Compression Router',
  'r-ofx-upcut': 'OFX Upcut Router',
  'r-ofx-downcut': 'OFX Downcut Router',
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

  // ==== HIGH PERFORMANCE ROUTERS — 1-flute lines (all Uncoated) ====
  { file: '202 V Flute Straight Cut.csv', category: 'r-v-flute-straight', system: 'Imperial', fixedFlutes: 1 },
  { file: '203 O Flute Straight.csv', category: 'r-o-flute-straight', system: 'Imperial', fixedFlutes: 1 },
  { file: '203 1 Flute O Flute Straight Metric.csv', category: 'r-o-flute-straight', system: 'Metric', fixedFlutes: 1 },
  { file: '204 O Flute Straight Edge Rounding.csv', category: 'r-o-flute-straight-edge-rounding', system: 'Imperial', fixedFlutes: 1 },
  { file: '205 O Flut Spiral Edge Rounding.csv', category: 'r-o-flute-spiral-edge-rounding', system: 'Imperial', fixedFlutes: 1 },
  { file: '1FL O Upcut Spiral.csv', category: 'r-o-flute-upcut-spiral', system: 'Imperial', fixedFlutes: 1 },
  { file: '1FL O Upcut Spiral Metric.csv', category: 'r-o-flute-upcut-spiral', system: 'Metric', fixedFlutes: 1 },
  { file: '1FL O Downcut Spiral.csv', category: 'r-o-flute-downcut-spiral', system: 'Imperial', fixedFlutes: 1 },
  { file: '1FL O Downcut Spiral Metric.csv', category: 'r-o-flute-downcut-spiral', system: 'Metric', fixedFlutes: 1 },
  { file: '1FL STD Upcut.csv', category: 'r-upcut-spiral', system: 'Imperial', fixedFlutes: 1 },
  { file: '212 1FL Upcut Sprial Hard Plastic Metric.csv', category: 'r-upcut-spiral', system: 'Metric', fixedFlutes: 1, fixedApplication: 'Hard Plastic' },
  { file: '1FL STD Downcut.csv', category: 'r-downcut-spiral', system: 'Imperial', fixedFlutes: 1 },
  { file: '213 1FL Downcut Sprial Hard Plastic Metric.csv', category: 'r-downcut-spiral', system: 'Metric', fixedFlutes: 1, fixedApplication: 'Hard Plastic' },
  { file: '216 1FL Veining Bit.csv', category: 'r-veining-bits', system: 'Imperial', fixedFlutes: 1 },
  { file: '217 1FL Compression.csv', category: 'r-compression', system: 'Imperial', fixedFlutes: 1 },
  { file: '217 1FL Compression Metric.csv', category: 'r-compression', system: 'Metric', fixedFlutes: 1 },
  { file: '218 1FL Ball Compression.csv', category: 'r-ball-compression', system: 'Imperial', fixedFlutes: 1 },
  { file: '219 1FL Mortise Compression.csv', category: 'r-mortise-compression', system: 'Imperial', fixedFlutes: 1 },
  { file: '219 1FL Mortise Compression Metric.csv', category: 'r-mortise-compression', system: 'Metric', fixedFlutes: 1 },
  { file: 'OFX FR UPCUT.csv', category: 'r-ofx-upcut', system: 'Imperial', fixedFlutes: 1 },
  { file: 'OFX MT Upcut.csv', category: 'r-ofx-upcut', system: 'Metric', fixedFlutes: 1 },
  { file: 'OFX FR Downcut.csv', category: 'r-ofx-downcut', system: 'Imperial', fixedFlutes: 1 },
  { file: 'OFX MT Downcut.csv', category: 'r-ofx-downcut', system: 'Metric', fixedFlutes: 1 },
];

// Exact-duplicate "(1)" exports intentionally skipped.
export const SKIPPED = [
  'FR Mold Mill CR Necked (1).csv', 'FRT Corner Radius Mold Mills Long (1).csv',
  'FRT Corner Radius Necked Axmills (1).csv', 'MET Medium Pitch Roughers (1).csv', 'MET SQ Chipbreaker Axmills (1).csv',
];

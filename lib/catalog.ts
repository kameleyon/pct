import { getSupabase } from './supabase';

export type Specs = Record<string, string | number | null>;

export type Product = {
  id: string;
  part_number: string;
  slug: string;
  name: string;
  category_id: string;
  measurement_system: 'Imperial' | 'Metric';
  flutes: number | null;
  coating: string;
  material: string;
  specs: Specs;
  price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  primary_image_url: string | null;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  image_url?: string | null;
  count?: number;
};

const PRODUCT_COLS =
  'id,part_number,slug,name,category_id,measurement_system,flutes,coating,material,specs,price,sale_price,stock_quantity,primary_image_url';

// Count products in a category and all its descendants (hub → sub-category → line).
// Our taxonomy is at most 3 levels, so a few BFS hops cover the whole subtree.
async function countSubtreeProducts(sb: ReturnType<typeof getSupabase>, rootId: string): Promise<number> {
  const ids: string[] = [rootId];
  let frontier: string[] = [rootId];
  for (let depth = 0; depth < 3 && frontier.length; depth++) {
    const { data } = await sb.from('categories').select('id').in('parent_id', frontier);
    const next = (data ?? []).map((k: any) => k.id as string);
    ids.push(...next);
    frontier = next;
  }
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).in('category_id', ids);
  return count ?? 0;
}

/** Leaf categories (children of "end-mills"), each with a live product count. */
export async function getCategories(): Promise<Category[]> {
  const sb = getSupabase();
  try {
    const { data: cats } = await sb
      .from('categories')
      .select('id,slug,name,description,parent_id,sort_order,image_url')
      .not('parent_id', 'is', null)
      .order('sort_order');
    if (!cats) return [];
    return await Promise.all(
      cats.map(async (c) => {
        const { count } = await sb
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', c.id);
        return { ...c, count: count ?? 0 } as Category;
      })
    );
  } catch {
    return [];
  }
}

/** Top-level categories (parent_id null), counted across their child lines. */
export async function getTopCategories(): Promise<Category[]> {
  const sb = getSupabase();
  try {
    const { data: cats } = await sb
      .from('categories')
      .select('id,slug,name,description,parent_id,sort_order,image_url')
      .is('parent_id', null)
      .order('sort_order');
    if (!cats) return [];
    return await Promise.all(
      cats.map(async (c) => ({ ...c, count: await countSubtreeProducts(sb, c.id) } as Category))
    );
  } catch {
    return [];
  }
}

/** Direct child categories of a parent, each with a product count. */
export async function getChildCategories(parentId: string): Promise<Category[]> {
  const sb = getSupabase();
  try {
    const { data: cats } = await sb
      .from('categories')
      .select('id,slug,name,description,parent_id,sort_order,image_url')
      .eq('parent_id', parentId)
      .order('sort_order');
    if (!cats) return [];
    return await Promise.all(
      cats.map(async (c) => ({ ...c, count: await countSubtreeProducts(sb, c.id) } as Category))
    );
  } catch {
    return [];
  }
}

/** id → slug map for every category (used to route product cards). */
export async function getCategorySlugMap(): Promise<Record<string, string>> {
  const sb = getSupabase();
  try {
    const { data } = await sb.from('categories').select('id,slug');
    return Object.fromEntries((data ?? []).map((c: any) => [c.id, c.slug]));
  } catch {
    return {};
  }
}

/** Live catalog size, floored to the nearest hundred for display ("8,600+"). */
export async function getProductCountLabel(): Promise<string> {
  const sb = getSupabase();
  try {
    const { count } = await sb.from('products').select('*', { count: 'exact', head: true });
    const n = Math.floor((count ?? 0) / 100) * 100;
    return n > 0 ? `${n.toLocaleString('en-US')}+` : '';
  } catch {
    return '';
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const sb = getSupabase();
  try {
    const { data } = await sb
      .from('categories')
      .select('id,slug,name,description,parent_id,sort_order,image_url')
      .eq('slug', slug)
      .single();
    return (data as Category) ?? null;
  } catch {
    return null;
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const sb = getSupabase();
  try {
    const { data } = await sb
      .from('categories')
      .select('id,slug,name,description,parent_id,sort_order,image_url')
      .eq('id', id)
      .single();
    return (data as Category) ?? null;
  } catch {
    return null;
  }
}

/** A spread of representative products for the homepage. */
// Curated spread of distinct tool types, so the "Customer favorites" row shows
// variety (different geometries/photos) instead of one series in four sizes.
const FEATURED_SLUGS = [
  'square-end-mills', 'ball-end-mills', 'r-upcut-spiral', 'dr-jobber-drills',
  'corner-radius-end-mills', 'hp-axmill-end-mills', 'rm-45-reamers', 'double-end-square-end-mills',
];

export async function getFeatured(limit = 8): Promise<Product[]> {
  const sb = getSupabase();
  try {
    const { data: cats } = await sb.from('categories').select('id,slug').in('slug', FEATURED_SLUGS);
    const idBySlug = new Map((cats ?? []).map((c: any) => [c.slug, c.id]));
    const picks: Product[] = [];
    for (const slug of FEATURED_SLUGS) {
      if (picks.length >= limit) break;
      const cid = idBySlug.get(slug);
      if (!cid) continue;
      // one representative per category — skip past the tiniest first rows when possible
      const { data } = await sb
        .from('products')
        .select(PRODUCT_COLS)
        .eq('category_id', cid)
        .order('part_number')
        .limit(6);
      if (data && data.length) picks.push(data[Math.min(3, data.length - 1)] as Product);
    }
    return picks;
  } catch {
    return [];
  }
}

export type ProductQuery = {
  categoryId: string;
  flutes?: number[];
  coatings?: string[];
  systems?: string[];
  geometries?: string[];
  flats?: string[];
  applications?: string[];
  cuts?: string[];
  diameters?: string[];
  shanks?: string[];
  lengths?: string[];
  pointAngles?: string[];
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function getProducts(q: ProductQuery): Promise<{ items: Product[]; total: number }> {
  const sb = getSupabase();
  const pageSize = q.pageSize ?? 24;
  const page = q.page ?? 1;
  try {
    let query = sb.from('products').select(PRODUCT_COLS, { count: 'exact' }).eq('category_id', q.categoryId);
    if (q.flutes?.length) query = query.in('flutes', q.flutes);
    if (q.coatings?.length) query = query.in('coating', q.coatings);
    if (q.systems?.length) query = query.in('measurement_system', q.systems);
    if (q.geometries?.length) query = query.in('specs->>geometry', q.geometries);
    if (q.flats?.length) query = query.in('specs->>flat', q.flats);
    if (q.applications?.length) query = query.in('specs->>application', q.applications);
    if (q.cuts?.length) query = query.in('specs->>cut', q.cuts);
    if (q.diameters?.length) query = query.in('specs->>od_display', q.diameters);
    if (q.shanks?.length) query = query.in('specs->>shk_display', q.shanks);
    if (q.lengths?.length) query = query.in('specs->>oal_display', q.lengths);
    if (q.pointAngles?.length) query = query.in('specs->>point_angle', q.pointAngles.map((p) => p.replace('°', '')));

    switch (q.sort) {
      case 'dia-asc':
        query = query.order('specs->>od_in', { ascending: true });
        break;
      case 'dia-desc':
        query = query.order('specs->>od_in', { ascending: false });
        break;
      default:
        query = query.order('part_number', { ascending: true });
    }

    // cumulative: page N shows the first N*pageSize rows (drives "Load more")
    query = query.range(0, page * pageSize - 1);
    const { data, count } = await query;
    return { items: (data as Product[]) ?? [], total: count ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export type Facets = {
  flutes: number[];
  coatings: string[];
  systems: string[];
  geometries: string[];
  flats: string[];
  applications: string[];
  cuts: string[];
  diameters: string[];
  shanks: string[];
  lengths: string[];
  pointAngles: string[];
};

// dedupe display strings, keeping a numeric sort key, then return sorted by size
const sortedByNum = (m: Map<string, number>) =>
  [...m.entries()].sort((a, b) => a[1] - b[1]).map(([display]) => display);

/** Distinct facet values actually present in a category, for the filter rail. */
export async function getCategoryFacets(categoryId: string): Promise<Facets> {
  const sb = getSupabase();
  const empty: Facets = { flutes: [], coatings: [], systems: [], geometries: [], flats: [], applications: [], cuts: [], diameters: [], shanks: [], lengths: [], pointAngles: [] };
  try {
    const { data } = await sb
      .from('products')
      .select('flutes,coating,measurement_system,specs')
      .eq('category_id', categoryId)
      .limit(5000);
    const flutes = new Set<number>(), coatings = new Set<string>(), systems = new Set<string>();
    const geometries = new Set<string>(), flats = new Set<string>(), applications = new Set<string>(), cuts = new Set<string>();
    const diameters = new Map<string, number>(), shanks = new Map<string, number>(), lengths = new Map<string, number>();
    const pointAngles = new Map<string, number>();
    (data ?? []).forEach((r: any) => {
      const s = r.specs ?? {};
      if (r.flutes != null) flutes.add(r.flutes);
      if (r.coating) coatings.add(r.coating);
      if (r.measurement_system) systems.add(r.measurement_system);
      if (s.geometry) geometries.add(s.geometry);
      if (s.flat) flats.add(s.flat);
      if (s.application) applications.add(s.application);
      if (s.cut) cuts.add(s.cut);
      if (s.od_display) diameters.set(s.od_display, Number(s.od_in) || 0);
      if (s.shk_display) shanks.set(s.shk_display, Number(s.shk_in) || 0);
      if (s.oal_display) lengths.set(s.oal_display, Number(s.oal_in) || 0);
      if (s.point_angle != null) pointAngles.set(`${s.point_angle}°`, Number(s.point_angle) || 0);
    });
    return {
      flutes: [...flutes].sort((a, b) => a - b),
      coatings: [...coatings].sort(),
      systems: [...systems].sort(),
      geometries: [...geometries].sort(),
      flats: [...flats].sort(),
      applications: [...applications].sort(),
      cuts: [...cuts].sort(),
      diameters: sortedByNum(diameters),
      shanks: sortedByNum(shanks),
      lengths: sortedByNum(lengths),
      pointAngles: sortedByNum(pointAngles),
    };
  } catch {
    return empty;
  }
}

export async function getProductByPart(part: string): Promise<Product | null> {
  const sb = getSupabase();
  try {
    const { data } = await sb.from('products').select(PRODUCT_COLS).eq('part_number', part).single();
    return (data as Product) ?? null;
  } catch {
    return null;
  }
}

/** Human-readable one-line spec summary from the JSONB display fields. */
export function specSummary(p: Product): string {
  const s = p.specs || {};
  const out: string[] = [];
  if (s.od_display) out.push(`Ø ${s.od_display}`);
  if (p.flutes) out.push(`${p.flutes}-Flute`);
  if (s.loc_display) out.push(`LOC ${s.loc_display}`);
  if (s.oal_display) out.push(`OAL ${s.oal_display}`);
  if (s.corner_radius_display) out.push(`R ${s.corner_radius_display}`);
  return out.join(' · ');
}

export const BRAND = 'Precision';

// Real product photography (dropped into public/slots/), mapped by geometry.
const CATEGORY_IMAGE: Record<string, string> = {
  'square-end-mills': '/slots/Standard-Square-Endmill.png',
  'ball-end-mills': '/slots/Standard-Ball-Endmill.png',
  'corner-radius-end-mills': '/slots/Standard-Corner-Radius.png',
  'double-end-square-end-mills': '/slots/DoubleEnd-Square2flute.png',
  '6-flute-square-end-mills': '/slots/6-flute-square.png',
  '50-helix-corner-radius-end-mills': '/slots/Standard-Corner-Radius.png',
  'square-straight-flute-end-mills': '/slots/Standard-Square-Endmill.png',
  'ball-straight-flute-end-mills': '/slots/Standard-Ball-Endmill.png',
  'double-end-ball-end-mills': '/slots/Standard-Ball-Endmill.png',
  'double-end-square-with-flat': '/slots/DoubleEnd-Square2flute.png',
  'double-end-ball-with-flat': '/slots/Standard-Ball-Endmill.png',
  'square-mini-mills': '/slots/Standard-Square-Endmill.png',
  'ball-mini-mills': '/slots/Standard-Ball-Endmill.png',
  'drill-mills': '/slots/Standard-Square-Endmill.png',
  'square-taper-mills': '/slots/Standard-Square-Endmill.png',
  'ball-taper-mills': '/slots/Standard-Ball-Endmill.png',
  'short-flute-square-end-mills': '/slots/Standard-Square-Endmill.png',
  'short-flute-ball-end-mills': '/slots/Standard-Ball-Endmill.png',
  'short-flute-corner-radius-end-mills': '/slots/Standard-Corner-Radius.png',
  // High Performance Routers (1-flute lines)
  'r-upcut-spiral': '/slots/R-Single-Flute-Upcut-Spiral-Wood-1-768x102.png',
  'r-downcut-spiral': '/slots/R-Single-Downcut-Spiral-Endmill-End-Wood-768x138.png',
  'r-o-flute-upcut-spiral': '/slots/R-O-Flute-Upcut-Spiral-768x84.png',
  'r-o-flute-downcut-spiral': '/slots/R-O-Flute-Downcut-Spiral-768x106.png',
  'r-o-flute-straight': '/slots/R-O-Flute-Straight-Cut-Crescent-End-1-768x128.png',
  'r-v-flute-straight': '/slots/R-V-Flute-Straight-Cut-Crescent-End-768x103.png',
  'r-o-flute-straight-edge-rounding': '/slots/R-O-Flute-Straight-Cut-Edge-Rounding-1-768x122.png',
  'r-o-flute-spiral-edge-rounding': '/slots/R-O-Flute-Spiral-Cut-Edge-Rounding-1-768x87.png',
  'r-compression': '/slots/R-1-Flute-Compression-Spiral-Endmill-End-1-768x110.png',
  'r-ball-compression': '/slots/Ball-Compression-Spiral-Endmill-End-21-768x89.png',
  'r-mortise-compression': '/slots/R-Single-Flute-Mortise-Compression-1-768x107.png',
  'r-ofx-upcut': '/slots/R-1-Flute-Upcut-OFX-1-768x161.png',
  'r-ofx-downcut': '/slots/R-1-Flute-Downcut-OFX-1-768x133.png',
  'r-veining-bits': '/slots/R-Veining-Bit-768x139.png',
  // 2-Flute router lines (closest-match photo where the line has none)
  'r2-upcut-spiral': '/slots/R-2-Flute-Upcut-Spiral-Endmill-End-1.png',
  'r2-downcut-spiral': '/slots/R-2-Flute-Downcut-Spiral-Endmill-End.png',
  'r2-upcut-slow': '/slots/R-2-Flute-Upcut-Slow-Helix-1.png',
  'r2-downcut-slow': '/slots/R-2-Flute-Downcut-Slow-Helix-1.png',
  'r2-o-upcut-slow': '/slots/R-2-O-Flute-Downcut-Slow-Spiral-1.png',
  'r2-o-downcut-slow': '/slots/R-2-O-Flute-Downcut-Slow-Spiral-1.png',
  'r2-upcut-chipbreaker': '/slots/R-Two-Flute-Upcut-Spiral-Chipbreaker.png',
  'r2-downcut-chipbreaker': '/slots/R-2-Flute-Downcut-Spiral-Chipbreaker-Finisher.png',
  'r2-upcut-high-impact': '/slots/R-2-Flute-Upcut-Spiral-Endmill-End-1.png',
  'r2-downcut-high-impact': '/slots/R-2-Flute-Downcut-Spiral.png',
  'r2-upcut-chipbreaker-hi': '/slots/R-Two-Flute-Upcut-Spiral-Chipbreaker-1.png',
  'r2-downcut-chipbreaker-hi': '/slots/R-2-Flute-Downcut-Spiral-Chipbreaker-Finisher-1.png',
  'r2-compression': '/slots/R-Two-Flute-Mortise-Compression-Endmill-End.png',
  'r2-mortise-compression': '/slots/R-Two-Flute-Mortise-Compression-Endmill-End.png',
  'r2-chipbreaker-compression': '/slots/R-Two-Flute-Mortise-Compression-Endmill-End.png',
  'r2-up-plunge': '/slots/R-2-Flute-Upcut-Spiral-Plunge-Fishtail-1.png',
  'r2-downcut-fishtail': '/slots/R-2-Flute-Downcut-Fishtail.png',
  'r2-straight-plunge': '/slots/R-2-Flute-Straight-Cut-Plunge-Fishtail-1.png',
  'r2-shear-v-bottom': '/slots/R-2-Flute-V-Bottom-90-Point-1.png',
  'r2-v-edge-rounding': '/slots/R-2-Flute-Straight-V-Edge-Rounding.png',
  'r2-o-edge-rounding': '/slots/R-2-Flute-O-Flute-Straight-Cut-with-Edge-Rounding-1.png',
  'r2-rout-chamfer': '/slots/R-2-Flute-O-Flute-Straight-Cut-Endmill-End-1.png',
  'r2-upcut-bottom-surface': '/slots/R-2-Flute-Upcut-Bottom-Surface-1.png',
  // Reamers
  'rm-45-reamers': '/slots/Reamer-4FL.jpg',
  // Standard Carbide Drills
  'dr-jobber-drills': '/slots/JobberDrills.jpg',
  'dr-stub-drills': '/slots/StubDrill.jpg',
  'dr-straight-flute-drills': '/slots/JobberDrills.jpg',
  'dr-spade-drills': '/slots/Spade-Drill.jpg',
  'dr-nc-spotting-drills': '/slots/NC-Spotting-Drill.jpg',
  'dr-drill-countersink': '/slots/CenterDrill.jpg',
  'dr-medium-length-drills': '/slots/JobberDrills.jpg',
  // Hurricane Drills
  'dr-hurricane-3xd': '/slots/Hurricane3xd.jpg',
  'dr-hurricane-5xd': '/slots/Hurricane5xd.jpg',
  'dr-hurricane-8xd': '/slots/Hurricane8xd.jpg',
  // Carbide Burs (shapes SA–SN)
  'b-sa': '/slots/SA-DC-Bur.jpg',
  'b-sb': '/slots/SB-DC-Bur.jpg',
  'b-sc': '/slots/SC-DC-Bur.jpg',
  'b-sd': '/slots/SD-DC-Bur2.jpg',
  'b-se': '/slots/SE-DC-Bur.jpg',
  'b-sf': '/slots/SF-DC-Bur.jpg',
  'b-sg': '/slots/SG-DC-Bur.jpg',
  'b-sh': '/slots/SH-DC-Bur.jpg',
  'b-sj': '/slots/SJ-SC-Bur.jpg',
  'b-sk': '/slots/SK-DC-Bur.jpg',
  'b-sl': '/slots/SL-DC-Bur.jpg',
  'b-sm': '/slots/SM-DC-Bur.jpg',
  'b-sn': '/slots/SN-DC-Bur.jpg',
  'b-tire-burs': '/slots/TireBur-TriShank.jpg',
  'b-diemills': '/slots/SB-DC-Bur.jpg',
  'b-piloted-diemills': '/slots/SC-DC-Bur.jpg',
  'b-fiberglass-routers': '/slots/Fiberglass-Router-MillEnd.jpg',
};

export const categoryImage = (slug: string): string =>
  CATEGORY_IMAGE[slug] ?? '/slots/Standard-Square-Endmill.png';

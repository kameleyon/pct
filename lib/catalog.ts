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
      cats.map(async (c) => {
        const { data: kids } = await sb.from('categories').select('id').eq('parent_id', c.id);
        const ids = (kids ?? []).map((k: any) => k.id);
        let count = 0;
        if (ids.length) {
          const r = await sb.from('products').select('*', { count: 'exact', head: true }).in('category_id', ids);
          count = r.count ?? 0;
        }
        return { ...c, count } as Category;
      })
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
      cats.map(async (c) => {
        const { count } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('category_id', c.id);
        return { ...c, count: count ?? 0 } as Category;
      })
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
export async function getFeatured(limit = 8): Promise<Product[]> {
  const sb = getSupabase();
  try {
    const { data } = await sb
      .from('products')
      .select(PRODUCT_COLS)
      .eq('coating', 'PowerA')
      .order('part_number')
      .limit(limit);
    return (data as Product[]) ?? [];
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
};

/** Distinct facet values actually present in a category, for the filter rail. */
export async function getCategoryFacets(categoryId: string): Promise<Facets> {
  const sb = getSupabase();
  const empty: Facets = { flutes: [], coatings: [], systems: [], geometries: [], flats: [], applications: [] };
  try {
    const { data } = await sb
      .from('products')
      .select('flutes,coating,measurement_system,specs')
      .eq('category_id', categoryId)
      .limit(5000);
    const flutes = new Set<number>(), coatings = new Set<string>(), systems = new Set<string>();
    const geometries = new Set<string>(), flats = new Set<string>(), applications = new Set<string>();
    (data ?? []).forEach((r: any) => {
      if (r.flutes != null) flutes.add(r.flutes);
      if (r.coating) coatings.add(r.coating);
      if (r.measurement_system) systems.add(r.measurement_system);
      if (r.specs?.geometry) geometries.add(r.specs.geometry);
      if (r.specs?.flat) flats.add(r.specs.flat);
      if (r.specs?.application) applications.add(r.specs.application);
    });
    return {
      flutes: [...flutes].sort((a, b) => a - b),
      coatings: [...coatings].sort(),
      systems: [...systems].sort(),
      geometries: [...geometries].sort(),
      flats: [...flats].sort(),
      applications: [...applications].sort(),
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

export const BRAND = 'Mastercut';

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
};

export const categoryImage = (slug: string): string =>
  CATEGORY_IMAGE[slug] ?? '/slots/Standard-Square-Endmill.png';

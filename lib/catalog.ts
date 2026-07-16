import { supabase } from './supabase';

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
  count?: number;
};

const PRODUCT_COLS =
  'id,part_number,slug,name,category_id,measurement_system,flutes,coating,material,specs,price,sale_price,stock_quantity,primary_image_url';

/** Leaf categories (children of "end-mills"), each with a live product count. */
export async function getCategories(): Promise<Category[]> {
  const { data: cats } = await supabase
    .from('categories')
    .select('id,slug,name,description,parent_id,sort_order')
    .not('parent_id', 'is', null)
    .order('sort_order');
  if (!cats) return [];
  const withCounts = await Promise.all(
    cats.map(async (c) => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', c.id);
      return { ...c, count: count ?? 0 } as Category;
    })
  );
  return withCounts;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from('categories')
    .select('id,slug,name,description,parent_id,sort_order')
    .eq('slug', slug)
    .single();
  return data as Category | null;
}

/** A spread of representative products for the homepage. */
export async function getFeatured(limit = 8): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_COLS)
    .eq('coating', 'PowerA (AlTiN)')
    .order('part_number')
    .limit(limit);
  return (data as Product[]) ?? [];
}

export type ProductQuery = {
  categoryId: string;
  flutes?: number[];
  coatings?: string[];
  systems?: string[];
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function getProducts(q: ProductQuery): Promise<{ items: Product[]; total: number }> {
  const pageSize = q.pageSize ?? 24;
  const page = q.page ?? 1;
  let query = supabase
    .from('products')
    .select(PRODUCT_COLS, { count: 'exact' })
    .eq('category_id', q.categoryId);

  if (q.flutes?.length) query = query.in('flutes', q.flutes);
  if (q.coatings?.length) query = query.in('coating', q.coatings);
  if (q.systems?.length) query = query.in('measurement_system', q.systems);

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
}

/** Distinct flute counts & coatings present in a category, for the filter rail. */
export async function getCategoryFacets(categoryId: string) {
  const { data } = await supabase
    .from('products')
    .select('flutes,coating,measurement_system')
    .eq('category_id', categoryId)
    .limit(5000);
  const flutes = new Set<number>();
  const coatings = new Set<string>();
  const systems = new Set<string>();
  (data ?? []).forEach((r: any) => {
    if (r.flutes != null) flutes.add(r.flutes);
    if (r.coating) coatings.add(r.coating);
    if (r.measurement_system) systems.add(r.measurement_system);
  });
  return {
    flutes: [...flutes].sort((a, b) => a - b),
    coatings: [...coatings].sort(),
    systems: [...systems].sort(),
  };
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { data } = await supabase
    .from('categories')
    .select('id,slug,name,description,parent_id,sort_order')
    .eq('id', id)
    .single();
  return data as Category | null;
}

export async function getProductByPart(part: string): Promise<Product | null> {
  const { data } = await supabase.from('products').select(PRODUCT_COLS).eq('part_number', part).single();
  return (data as Product) ?? null;
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

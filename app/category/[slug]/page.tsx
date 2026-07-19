import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getCategoryPath, getAllCategories, getChildCategories, getCategoryFacets, getProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { FilterRail, SortSelect } from '@/components/browse';

export const revalidate = 300;

type SP = { flutes?: string; coating?: string; system?: string; geometry?: string; flat?: string; app?: string; cut?: string; dia?: string; shk?: string; len?: string; pt?: string; sort?: string; page?: string };

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  // Full ancestry (top-level → immediate parent) for the breadcrumb.
  const ancestors = category.parent_id ? await getCategoryPath(category.parent_id) : [];
  const Breadcrumb = () => (
    <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
      <Link href="/">Home</Link>
      {ancestors.map((c) => (
        <span key={c.id}>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<Link href={`/category/${c.slug}`}>{c.name}</Link></span>
      ))}
      {' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>{category.name}</span>
    </div>
  );

  // Parent category → show its product lines as a subcategory grid.
  const children = await getChildCategories(category.id);
  if (children.length > 0) {
    return (
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 72 }}>
        <Breadcrumb />
        <h1 style={{ fontSize: 34, margin: '0 0 6px' }}>{category.name}</h1>
        <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 600, maxWidth: 640, marginBottom: 28 }}>{category.description}</div>
        <div className="cat-grid">
          {children.map((c) => <CategoryCard key={c.slug} c={c} />)}
        </div>
      </main>
    );
  }

  // Leaf category → product listing with filters.
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const [facets, { items, total }] = await Promise.all([
    getCategoryFacets(category.id),
    getProducts({
      categoryId: category.id,
      flutes: sp.flutes?.split(',').map(Number).filter(Boolean),
      coatings: sp.coating?.split(',').filter(Boolean),
      systems: sp.system?.split(',').filter(Boolean),
      geometries: sp.geometry?.split(',').filter(Boolean),
      flats: sp.flat?.split(',').filter(Boolean),
      applications: sp.app?.split(',').filter(Boolean),
      cuts: sp.cut?.split(',').filter(Boolean),
      diameters: sp.dia?.split(',').filter(Boolean),
      shanks: sp.shk?.split(',').filter(Boolean),
      lengths: sp.len?.split(',').filter(Boolean),
      pointAngles: sp.pt?.split(',').filter(Boolean),
      sort: sp.sort,
      page,
      pageSize: 24,
    }),
  ]);

  const nextParams = new URLSearchParams();
  for (const [k, v] of Object.entries({ flutes: sp.flutes, coating: sp.coating, system: sp.system, geometry: sp.geometry, flat: sp.flat, app: sp.app, cut: sp.cut, dia: sp.dia, shk: sp.shk, len: sp.len, pt: sp.pt, sort: sp.sort })) {
    if (v) nextParams.set(k, v);
  }
  nextParams.set('page', String(page + 1));

  // site-wide category nav for the filter: top categories (checkboxes) → their subcategories
  const allCats = await getAllCategories();
  const tops = allCats.filter((c) => !c.parent_id).map((t) => ({
    slug: t.slug,
    name: t.name,
    children: allCats.filter((c) => c.parent_id === t.id).map((c) => ({ slug: c.slug, name: c.name })),
  }));
  const currentTop = ancestors[0]?.slug ?? slug;
  const activeSlugs = [...ancestors.map((a) => a.slug), slug];
  const catNav = { tops, currentTop, activeSlugs };

  return (
    <main className="wrap" style={{ paddingTop: 20, paddingBottom: 72 }}>
      <Breadcrumb />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 34, margin: '0 0 4px' }}>{category.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, maxWidth: 620 }}>{category.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--muted-2)', fontWeight: 600 }}>Showing {items.length} of {total}</span>
          <SortSelect />
        </div>
      </div>

      <div className="browse-layout">
        <FilterRail facets={facets} catNav={catNav} />
        <div>
          {items.length === 0 ? (
            <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 48, textAlign: 'center', color: 'var(--muted)' }}>No products match these filters.</div>
          ) : (
            <div className="browse-grid">
              {items.map((p) => <ProductCard key={p.id} product={p} categorySlug={slug} />)}
            </div>
          )}
          {items.length < total && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
              <Link href={`?${nextParams.toString()}`} scroll={false} className="btn-outline" style={{ height: 48, padding: '0 32px', display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14 }}>
                Load more tools
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

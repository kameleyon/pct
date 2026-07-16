import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getChildCategories, getCategoryFacets, getProducts } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';
import { FilterRail, SortSelect } from '@/components/browse';

export const revalidate = 300;

type SP = { flutes?: string; coating?: string; system?: string; sort?: string; page?: string };

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

  // Parent category → show its product lines as a subcategory grid.
  const children = await getChildCategories(category.id);
  if (children.length > 0) {
    return (
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 72 }}>
        <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
          <Link href="/">Home</Link> <span style={{ color: '#c9c4ba' }}>/</span> <span style={{ color: 'var(--text)' }}>{category.name}</span>
        </div>
        <h1 style={{ fontSize: 34, margin: '0 0 6px' }}>{category.name}</h1>
        <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 600, maxWidth: 640, marginBottom: 28 }}>{category.description}</div>
        <div className="cat-grid">
          {children.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="h-cat" style={{ color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22, padding: 22, minHeight: 130, borderRadius: 20, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 999 }}>{c.count} items</span>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--gold-100)', display: 'grid', placeItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-700)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg></span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.15 }}>{c.name}</div>
            </Link>
          ))}
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
      sort: sp.sort,
      page,
      pageSize: 24,
    }),
  ]);

  const nextParams = new URLSearchParams();
  if (sp.flutes) nextParams.set('flutes', sp.flutes);
  if (sp.coating) nextParams.set('coating', sp.coating);
  if (sp.system) nextParams.set('system', sp.system);
  if (sp.sort) nextParams.set('sort', sp.sort);
  nextParams.set('page', String(page + 1));

  return (
    <main className="wrap" style={{ paddingTop: 20, paddingBottom: 72 }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/">Home</Link> <span style={{ color: '#c9c4ba' }}>/</span> <span style={{ color: 'var(--text)' }}>{category.name}</span>
      </div>
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
        <FilterRail facets={facets} />
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

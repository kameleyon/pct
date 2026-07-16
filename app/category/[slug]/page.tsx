import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getCategoryFacets, getProducts } from '@/lib/catalog';
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
    <main className="wrap" style={{ padding: '20px 32px 72px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>
        <FilterRail facets={facets} />
        <div>
          {items.length === 0 ? (
            <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 48, textAlign: 'center', color: 'var(--muted)' }}>No products match these filters.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, gridAutoRows: '1fr' }}>
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

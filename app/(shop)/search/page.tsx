import Link from 'next/link';
import { searchProducts, getCategorySlugMap } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const [items, slugById] = await Promise.all([searchProducts(q, 60), getCategorySlugMap()]);

  return (
    <main className="wrap" style={{ paddingTop: 20, paddingBottom: 72 }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/">Home</Link> <span style={{ color: '#c9c4ba' }}>/</span> <span style={{ color: 'var(--text)' }}>Search</span>
      </div>
      <h1 style={{ fontSize: 30, margin: '0 0 6px' }}>{q ? `Results for “${q}”` : 'Search the catalog'}</h1>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 600, marginBottom: 26 }}>
        {q ? `${items.length}${items.length === 60 ? '+' : ''} matching tools` : 'Type a part number, size, or tool type in the search bar above.'}
      </div>

      {q && items.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
          No products matched “{q}”. Try a part-number prefix (e.g. “206-”) or a tool type (e.g. “ball end mill”).
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          {items.map((p) => <ProductCard key={p.id} product={p} categorySlug={slugById[p.category_id] ?? 'square-end-mills'} />)}
        </div>
      )}
    </main>
  );
}

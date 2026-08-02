'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type Product } from '@/lib/catalog';
import { getFavoriteProductsAction } from '@/app/account/actions';
import { ProductCard } from '@/components/ProductCard';

const FAV_KEY = 'pct_favorites';

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [slugById, setSlugById] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      let ids: string[] = [];
      try { ids = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { ids = []; }
      const r = await getFavoriteProductsAction(ids);
      setProducts(r.products);
      setSlugById(r.slugById);
    };
    load();
    window.addEventListener('pct-favorites', load);
    return () => window.removeEventListener('pct-favorites', load);
  }, []);

  return (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/account">My Account</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>Saved tools</span>
      </div>
      <h1 style={{ fontSize: 32, margin: '0 0 24px' }}>Saved tools</h1>

      {products === null ? (
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
      ) : products.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
          No saved tools yet. Tap the heart icon on any product to save it here.
        </div>
      ) : (
        <div className="feat-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} categorySlug={slugById[p.category_id] ?? ''} />)}
        </div>
      )}
    </main>
  );
}

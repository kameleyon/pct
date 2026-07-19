'use client';
import { useState, useEffect } from 'react';

const KEY = 'pct_favorites';
const read = (): string[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export function FavoriteButton({ productId }: { productId: string }) {
  const [fav, setFav] = useState(false);
  useEffect(() => { setFav(read().includes(productId)); }, [productId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = new Set(read());
    cur.has(productId) ? cur.delete(productId) : cur.add(productId);
    localStorage.setItem(KEY, JSON.stringify([...cur]));
    setFav(cur.has(productId));
    window.dispatchEvent(new Event('pct-favorites'));
  };

  return (
    <span
      role="button"
      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={fav}
      onClick={toggle}
      style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(43,42,38,.1)', background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--color-accent)', cursor: 'pointer', zIndex: 2 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" /></svg>
    </span>
  );
}

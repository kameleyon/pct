import Link from 'next/link';
import { type Category } from '@/lib/catalog';

const Arrow = () => (
  <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--color-gold-100)', display: 'grid', placeItems: 'center', flex: 'none' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-700)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
  </span>
);

export function CategoryCard({ c }: { c: Category }) {
  // Cover variant — text on top (level with the other cards), image floating below
  if (c.image_url) {
    return (
      <Link href={`/category/${c.slug}`} className="h-cat" style={{ color: 'inherit', display: 'flex', flexDirection: 'column', gap: 16, padding: 22, borderRadius: 20, background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', background: 'var(--color-surface-2)', padding: '4px 10px', borderRadius: 999 }}>{c.count} items</span>
          <Arrow />
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.15 }}>{c.name}</div>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', marginTop: 'auto' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image_url} alt={c.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </Link>
    );
  }

  // Text variant — categories without a cover yet (same top structure as the cover card)
  return (
    <Link href={`/category/${c.slug}`} className="h-cat" style={{ color: 'inherit', display: 'flex', flexDirection: 'column', gap: 16, padding: 22, minHeight: 130, borderRadius: 20, background: 'var(--color-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', background: 'var(--color-surface-2)', padding: '4px 10px', borderRadius: 999 }}>{c.count} items</span>
        <Arrow />
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.15 }}>{c.name}</div>
    </Link>
  );
}

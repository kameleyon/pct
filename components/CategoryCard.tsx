import Link from 'next/link';
import { type Category } from '@/lib/catalog';

const Arrow = () => (
  <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--color-gold-100)', display: 'grid', placeItems: 'center', flex: 'none' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-700)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
  </span>
);

// Bottom row shared by both variants: name + count on the left (shrinkable), arrow top-right.
const Foot = ({ name, count }: { name: string; count: number }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 'auto' }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25, color: 'var(--color-text)' }}>{name}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-2)', marginTop: 4 }}>{count} items</div>
    </div>
    <Arrow />
  </div>
);

export function CategoryCard({ c }: { c: Category }) {
  const base: React.CSSProperties = {
    color: 'inherit', display: 'flex', flexDirection: 'column', gap: 14,
    padding: 16, minHeight: 150, borderRadius: 20, background: 'var(--color-surface)',
  };

  if (c.image_url) {
    return (
      <Link href={`/category/${c.slug}`} className="h-cat" style={base}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image_url} alt={c.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <Foot name={c.name} count={c.count ?? 0} />
      </Link>
    );
  }

  return (
    <Link href={`/category/${c.slug}`} className="h-cat" style={base}>
      <Foot name={c.name} count={c.count ?? 0} />
    </Link>
  );
}

import Link from 'next/link';
import { type Product, specSummary, BRAND, categoryImage } from '@/lib/catalog';
import { AddToCart } from './cart/AddToCart';

const chip: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
  color: '#4a473f', background: '#fff', border: '1px solid rgba(43,42,38,.08)',
  padding: '5px 10px', borderRadius: 999, whiteSpace: 'nowrap',
};

export function ProductCard({ product, categorySlug }: { product: Product; categorySlug: string }) {
  const coated = product.coating && product.coating !== 'Uncoated';
  // Specials badge: % off when a sale price is set below list. No specials yet → nothing renders.
  const discountPct =
    product.price && product.sale_price && product.sale_price < product.price
      ? Math.round((1 - product.sale_price / product.price) * 100)
      : 0;
  return (
    <article className="prod-card" style={{ display: 'flex', flexDirection: 'column', background: '#F3EFE5', border: '1px solid rgba(43,42,38,.12)', borderRadius: 20, overflow: 'hidden', height: '100%' }}>
      <Link href={`/product/${encodeURIComponent(product.part_number)}`} style={{ display: 'flex', flexDirection: 'column', padding: 16, flex: 1, color: 'inherit' }}>
        {/* image panel — favorite only */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#fff', borderRadius: 14, border: '1px solid rgba(43,42,38,.06)', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={categoryImage(categorySlug)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <span role="button" aria-label="Add to favorites" style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(43,42,38,.1)', background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--color-accent)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" /></svg>
          </span>
        </div>

        {/* title — fixed two-line block so rows align across cards */}
        <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.35, color: 'var(--color-accent)', marginTop: 14, minHeight: '2.7em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</div>

        {/* part number */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-gold-700)' }}>{BRAND} №</span>
            <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--color-text)', lineHeight: 1 }}>{product.part_number}</span>
          </div>
          {coated && <span style={{ ...chip, color: 'var(--color-accent)', background: 'var(--color-accent-100)', border: 0 }}>{product.coating}</span>}
        </div>

        {/* specs */}
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 7, minHeight: '1.5em' }}>{specSummary(product)}</div>

        {/* divider */}
        <div style={{ height: 1, background: 'rgba(43,42,38,.08)', margin: '12px 0' }} />

        {/* uniform chip row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={chip}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
            Made in USA
          </span>
        </div>

        {/* price row — quote left, specials %OFF right (shown only for sale items) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 19, color: 'var(--color-text)', lineHeight: 1 }}>Request Quote</span>
          {/* "Get Details" removed — this slot now shows the specials badge when a sale price is set */}
          {discountPct > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--color-gold)', padding: '5px 10px', borderRadius: 999 }}>{discountPct}% OFF</span>
          )}
        </div>
      </Link>

      {/* footer */}
      <AddToCart productId={product.id} partNumber={product.part_number} name={product.name} image={categoryImage(categorySlug)} />
    </article>
  );
}

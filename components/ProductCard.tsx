import Link from 'next/link';
import { type Product, specSummary, BRAND, categoryImage } from '@/lib/catalog';

export function ProductCard({ product, categorySlug }: { product: Product; categorySlug: string }) {
  const powerA = product.coating === 'PowerA (AlTiN)';
  return (
    <article className="prod-card" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid rgba(43,42,38,.09)', borderRadius: 22, overflow: 'hidden', height: '100%' }}>
      {/* top bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11.5, fontWeight: 600 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 8px', background: '#fff', color: 'var(--color-accent)', borderBottom: '2px solid var(--color-accent-100)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" /></svg>Add To Favorites
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 8px', background: 'var(--color-accent)', color: '#fff', borderBottom: '2px solid var(--color-accent)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" /></svg>Coupon Available
        </span>
      </div>

      <Link href={`/product/${encodeURIComponent(product.part_number)}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, flex: 1, color: 'inherit' }}>
        {/* image */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'var(--color-surface)', borderRadius: 14, overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={categoryImage(categorySlug)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <span style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 8.5, fontWeight: 600, letterSpacing: '.02em', color: 'var(--color-gold-700)', padding: '0 8px', pointerEvents: 'none' }}>Representative image — see specs for exact geometry</span>
        </div>
        {/* title */}
        <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.25, color: 'var(--color-accent)', marginTop: 2 }}>{product.name}</div>
        {/* brand + sku */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--color-gold-700)' }}>{BRAND} No.</div>
          <div style={{ fontWeight: 600, fontSize: 17, color: 'var(--color-accent)', lineHeight: 1.1 }}>{product.part_number}</div>
        </div>
        {/* spec */}
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{specSummary(product)}</div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', color: '#4a473f' }}>MADE IN THE USA</div>
        {/* price */}
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 22, color: 'var(--color-text)', lineHeight: 1 }}>Request Quote</span>
            {powerA && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-accent-100)', padding: '5px 10px', borderRadius: 999 }}><span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.05em', color: 'var(--color-accent)' }}>POWER A</span><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>AlTiN</span></span>}
          </div>
        </div>
        {/* stock rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M3.3 7 12 12l8.7-5" /><path d="M12 22V12" /></svg>Factory-direct
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)', background: '#fff', padding: '2px 10px', borderRadius: 999 }}>{product.measurement_system}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: '#4a473f', padding: '0 2px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>Shipping Deals Available
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: '#4a473f', padding: '0 2px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Accurate Stock
          </div>
        </div>
        {/* get details */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 2 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--color-accent)' }}>Get Details<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
        </div>
      </Link>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'var(--color-surface)', marginTop: 'auto' }}>
        <input defaultValue="1" style={{ width: 52, height: 44, textAlign: 'center', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', background: '#fff', border: '1px solid rgba(43,42,38,.12)', borderRadius: 12, outline: 'none' }} />
        <button className="h-gold" style={{ flex: 1, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', color: '#fff', background: 'var(--color-gold)', border: 0, borderRadius: 12 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>Add to Cart
        </button>
      </div>
    </article>
  );
}

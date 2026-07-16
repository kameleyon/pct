import Link from 'next/link';
import { type Product, specSummary, BRAND, categoryImage } from '@/lib/catalog';
import { Heart, Coupon, Truck, Check, ArrowRight, Cart } from './icons';

export function ProductCard({ product, categorySlug }: { product: Product; categorySlug: string }) {
  const spec = specSummary(product);
  const powerA = product.coating === 'PowerA (AlTiN)';
  return (
    <article className="prod-card" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid rgba(43,42,38,.09)', borderRadius: 22, overflow: 'hidden', height: '100%' }}>
      {/* top bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11.5, fontWeight: 600 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 8px', color: 'var(--green)', borderBottom: '2px solid var(--green-100)' }}>
          <Heart size={13} />Favorite
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 8px', background: 'var(--green)', color: '#fff', borderBottom: '2px solid var(--green)' }}>
          <Check size={13} />In Catalog
        </span>
      </div>

      <Link href={`/product/${encodeURIComponent(product.part_number)}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, flex: 1, color: 'inherit' }}>
        {/* image */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={categoryImage(categorySlug)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <span style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 8.5, fontWeight: 600, color: 'var(--gold-700)' }}>Representative image — see specs for exact geometry</span>
        </div>
        {/* title */}
        <div style={{ fontWeight: 600, fontSize: 15.5, lineHeight: 1.25, color: 'var(--green)', marginTop: 2 }}>{product.name}</div>
        {/* brand + sku */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--gold-700)' }}>{BRAND} No.</div>
          <div style={{ fontWeight: 600, fontSize: 17, color: 'var(--green)', lineHeight: 1.1 }}>{product.part_number}</div>
        </div>
        {/* spec */}
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{spec}</div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', color: '#4a473f' }}>MADE IN THE USA · {product.material.toUpperCase()}</div>
        {/* price / quote */}
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 20, color: 'var(--text)', lineHeight: 1 }}>Request Quote</span>
          {powerA && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--green-100)', padding: '5px 10px', borderRadius: 999 }}><span style={{ fontSize: 9, fontWeight: 600, color: 'var(--green)' }}>POWER A</span><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>AlTiN</span></span>}
        </div>
        {/* meta rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--green)' }}><Truck size={14} />Factory-direct</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', background: '#fff', padding: '2px 10px', borderRadius: 999 }}>{product.measurement_system}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: '#4a473f' }}><Coupon size={13} color="var(--green)" />Volume pricing available</div>
        </div>
        {/* get details */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>Get Details<ArrowRight size={15} strokeWidth={2.4} /></span>
        </div>
      </Link>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'var(--surface)' }}>
        <input defaultValue="1" style={{ width: 52, height: 44, textAlign: 'center', fontWeight: 600, fontSize: 15, color: 'var(--text)', background: '#fff', border: '1px solid rgba(43,42,38,.12)', borderRadius: 12 }} />
        <button className="btn-gold-solid" style={{ flex: 1, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', border: 0, borderRadius: 12 }}>
          <Cart size={17} />Add to Quote
        </button>
      </div>
    </article>
  );
}

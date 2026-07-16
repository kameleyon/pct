import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductByPart, getCategoryById, categoryImage, BRAND, type Product } from '@/lib/catalog';
import { Heart, Coupon, Star, Cart, Truck, Shield, Check } from '@/components/icons';

export const revalidate = 300;

function specRows(p: Product): [string, string][] {
  const s = p.specs || {};
  const rows: [string, string][] = [];
  const push = (label: string, v: unknown) => { if (v !== undefined && v !== null && v !== '') rows.push([label, String(v)]); };
  push('Cutting Diameter', s.od_display);
  push('Tip Diameter', s.small_od_display);
  push('Length of Cut', s.loc_display);
  push('Overall Length', s.oal_display);
  push('Shank Diameter', s.shk_display);
  push('Corner Radius', s.corner_radius_display);
  push('Reach', s.reach_display);
  push('Neck Length', s.neck_display);
  push('Flutes', p.flutes);
  push('Taper Angle', s.taper_angle != null ? `${s.taper_angle}°` : null);
  push('Helix Angle', s.helix_angle != null ? `${s.helix_angle}°` : null);
  push('Point Angle', s.point_angle != null ? `${s.point_angle}°` : null);
  push('Coating', p.coating);
  push('Material', p.material);
  push('Measurement', p.measurement_system);
  push('Series', s.series);
  return rows;
}

export default async function ProductPage({ params }: { params: Promise<{ part: string }> }) {
  const { part } = await params;
  const product = await getProductByPart(decodeURIComponent(part));
  if (!product) notFound();
  const category = await getCategoryById(product.category_id);
  const rows = specRows(product);
  const powerA = product.coating === 'PowerA (AlTiN)';

  return (
    <main className="wrap" style={{ padding: '20px 32px 72px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 20 }}>
        <Link href="/">Home</Link> <span style={{ color: '#c9c4ba' }}>/</span>{' '}
        <Link href={`/category/${category?.slug ?? ''}`}>{category?.name}</Link> <span style={{ color: '#c9c4ba' }}>/</span>{' '}
        <span style={{ color: 'var(--text)' }}>{product.part_number}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 44, alignItems: 'start' }}>
        {/* gallery */}
        <div style={{ background: 'var(--surface)', borderRadius: 24, padding: 16, display: 'grid', gridTemplateColumns: '72px 1fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ aspectRatio: '1/1', borderRadius: 13, overflow: 'hidden', background: '#fff', padding: 8, outline: i === 0 ? '2px solid var(--green)' : undefined, outlineOffset: -2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={categoryImage(category?.slug ?? '')} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>
          <div style={{ aspectRatio: '1/1', borderRadius: 18, overflow: 'hidden', background: '#fff', display: 'grid', placeItems: 'center', padding: 48 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={categoryImage(category?.slug ?? '')} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* info */}
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--green)', background: 'var(--green-100)', padding: '7px 13px', borderRadius: 999 }}><Heart size={14} />Add to Favorites</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--green-800)', background: 'var(--gold-100)', padding: '7px 13px', borderRadius: 999 }}><Coupon size={14} />Volume pricing</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gold-700)', marginBottom: 10 }}>{BRAND} · {product.part_number}</div>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: '0 0 12px' }}>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <span style={{ fontSize: 13, color: 'var(--muted-2)', fontWeight: 600 }}>Part # {product.part_number}</span>
            <span style={{ display: 'inline-flex', gap: 2 }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} color="var(--gold-2)" fill="currentColor" />)}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>Solid carbide{powerA ? ', PowerA (AlTiN) coated' : ''} · <b style={{ color: 'var(--green)' }}>Made in the USA</b></div>

          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 22, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 32, fontWeight: 600, lineHeight: 1 }}>Request a Quote</span>
              <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>volume &amp; contract pricing</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, background: 'var(--surface-2)', borderRadius: 14, padding: '12px 16px' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)', animation: 'pctpulse 1.8s infinite', flex: 'none' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>Factory-direct</span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>· ground &amp; coated to spec in the USA</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
            <input defaultValue="1" style={{ width: 64, height: 52, textAlign: 'center', fontWeight: 600, fontSize: 16, background: '#fff', border: '1px solid rgba(43,42,38,.12)', borderRadius: 14 }} />
            <button className="btn-gold-solid" style={{ flex: 1, height: 52, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, cursor: 'pointer', fontWeight: 600, fontSize: 15, color: '#fff', border: 0, borderRadius: 14 }}><Cart size={18} />Add to Quote</button>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>
            <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}><Truck size={15} color="var(--green)" />Fast UPS shipping</span>
            <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}><Shield size={15} color="var(--green)" />Made in USA carbide</span>
            <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}><Check size={15} color="var(--green)" />Accurate stock</span>
          </div>
        </div>
      </div>

      {/* specs table */}
      <section style={{ marginTop: 44 }}>
        <h2 style={{ fontSize: 22, margin: '0 0 18px' }}>Specifications</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0 40px', background: 'var(--surface)', borderRadius: 20, padding: '8px 24px' }}>
          {rows.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < rows.length - (rows.length % 2 === 0 ? 2 : 1) ? '1px solid rgba(43,42,38,.07)' : undefined }}>
              <span style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

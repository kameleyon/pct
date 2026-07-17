import Link from 'next/link';
import { type Category, type Product } from '@/lib/catalog';
import { ProductCard } from './ProductCard';

const ArrowR = ({ s = 17, w = 2.2 }: { s?: number; w?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}><path d="m9 18 6-6-6-6" /></svg>;
const Chevron = ({ s = 15 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;

export function Hero({ count }: { count: string }) {
  return (
    <section className="hero-a" style={{ background: 'var(--color-surface)', borderRadius: 28 }}>
      <div className="hero-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-gold-700)', background: 'var(--color-gold-100)', padding: '7px 14px', borderRadius: 999, marginBottom: 24 }}>Precision cutting tools · factory direct</div>
        <h1 style={{ lineHeight: 1.0, letterSpacing: '-.02em', margin: '0 0 20px', color: 'var(--color-text)' }}>The right tool.<br /><span style={{ color: 'var(--color-accent)' }}>In stock.</span> On time.</h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 460, margin: '0 0 30px' }}>{count || 'Thousands of'} cutting tools and industrial supplies stocked in Zephyrhills, Florida — plus factory-direct access to 120+ trusted brands.</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 34, flexWrap: 'wrap' }}>
          <Link href="/category/square-end-mills" className="h-green" style={{ height: 52, padding: '0 26px', fontSize: 15, fontWeight: 600, color: '#fff', background: 'var(--color-accent)', border: 0, borderRadius: 14, display: 'inline-flex', alignItems: 'center' }}>Shop Florida Stock<ArrowR /></Link>
          <Link href="/category/square-end-mills" style={{ height: 52, padding: '0 24px', fontSize: 15, fontWeight: 600, color: 'var(--color-text)', background: '#fff', border: '1px solid rgba(43,42,38,.1)', borderRadius: 14, display: 'inline-flex', alignItems: 'center' }}>Browse Brands</Link>
        </div>
        <div className="hero-stats" style={{ background: 'var(--color-surface-2)', borderRadius: 18, padding: '20px 4px' }}>
          {[[count || '8,600+', 'In local FL stock'], ['120+', 'Trusted brands'], ['Same-day', 'Zephyrhills pickup']].map(([a, b], i) => (
            <div key={i} style={{ borderLeft: i ? '1px solid rgba(43,42,38,.09)' : undefined }}>
              <div className="hstat-num" style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{a}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-img" style={{ position: 'relative', background: '#fff', overflow: 'hidden', minHeight: 560 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/hero-a.webp" alt="Lavallee & Ide Reamers — precision ground, made in USA, in stock" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, cta }: { eyebrow: string; title: string; cta: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-gold-700)', marginBottom: 8 }}>{eyebrow}</div>
        <h2 className="section-h1" style={{ margin: 0 }}>{title}</h2>
      </div>
      <Link href="/category/square-end-mills" style={{ fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{cta}<Chevron /></Link>
    </div>
  );
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="section-pad">
      <SectionHead eyebrow="Browse the catalog" title="Shop by category" cta="View all categories" />
      <div className="cat-grid">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="h-cat" style={{ color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22, padding: 22, minHeight: 130, borderRadius: 20, background: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', background: 'var(--color-surface-2)', padding: '4px 10px', borderRadius: 999 }}>{c.count} items</span>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--color-gold-100)', display: 'grid', placeItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-700)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg></span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.15, color: 'var(--color-text)' }}>{c.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FeaturedProducts({ products, slugById }: { products: Product[]; slugById: Record<string, string> }) {
  return (
    <section className="pad-lg" style={{ background: 'var(--color-surface)', borderRadius: 28, marginTop: 40 }}>
      <SectionHead eyebrow="In stock now" title="Customer favorites" cta="Shop all in-stock" />
      <div className="feat-grid">
        {products.map((p) => <ProductCard key={p.id} product={p} categorySlug={slugById[p.category_id] ?? 'square-end-mills'} />)}
      </div>
    </section>
  );
}

export function BrandsStrip() {
  const brands = ['YG-1', 'Guhring', 'Harvey Tool', 'GWS · Monster', 'Balax', 'Ingersoll', 'Micro 100', 'Starrett', 'Titan', 'Fullerton'];
  return (
    <section style={{ padding: '56px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-gold-700)', marginBottom: 24 }}>Factory-direct from the brands your shop runs on</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        {brands.map((b) => <span key={b} className="h-brand" style={{ fontWeight: 600, fontSize: 16, letterSpacing: '.01em', color: 'var(--muted)', background: 'var(--color-surface)', padding: '12px 22px', borderRadius: 999 }}>{b}</span>)}
      </div>
    </section>
  );
}

export function VipBand() {
  const tiers = [
    { name: 'Bronze', pct: '1%', color: '#c17f4a', note: 'Automatic with every online account' },
    { name: 'Silver', pct: '2%', color: '#c3c6c9', note: 'Unlocks VIP-only coupons' },
    { name: 'Gold', pct: '4%', color: '#d4af37', note: 'Free shipping thresholds lowered' },
    { name: 'Platinum', pct: '5%', color: '#e5e9ec', note: 'Top-tier pricing + shipping perks' },
  ];
  return (
    <section className="pad-band" style={{ background: '#103b24', borderRadius: 28, marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 30 }}>
        <div>
          <h2 style={{ fontSize: 38, margin: 0, color: '#fff' }}>PCT <span style={{ color: 'var(--color-gold-2)' }}>VIP</span> Program</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', margin: '12px 0 0', maxWidth: 520 }}>More savings, more rewards. VIP pricing and shipping perks scale with your rolling 12-month purchases — and it starts with every online account.</p>
        </div>
        <button className="h-gold" style={{ height: 52, padding: '0 26px', fontSize: 14, fontWeight: 600, color: '#fff', background: 'var(--color-gold-2)', border: 0, borderRadius: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>View VIP benefits<ArrowR w={2.4} s={16} /></button>
      </div>
      <div className="vip-grid">
        {tiers.map((t) => (
          <div key={t.name} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: t.color }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />{t.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}><span style={{ fontSize: 40, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{t.pct}</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>in rewards</span></div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.64)', marginTop: 14, lineHeight: 1.45 }}>{t.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

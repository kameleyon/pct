import Link from 'next/link';
import { type Category, type Product } from '@/lib/catalog';
import { ProductCard } from './ProductCard';
import { ArrowRight, ChevronRight, External } from './icons';

const upper = { fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' as const };

export function Hero() {
  return (
    <section style={{ background: 'var(--surface)', borderRadius: 28, display: 'grid', gridTemplateColumns: '1.05fr .95fr', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>
        <span style={{ ...upper, alignSelf: 'flex-start', color: 'var(--gold-700)', background: 'var(--gold-100)', padding: '7px 14px', borderRadius: 999, marginBottom: 24 }}>Precision cutting tools · factory direct</span>
        <h1 style={{ fontSize: 60, lineHeight: 1.0, letterSpacing: '-.02em', margin: '0 0 20px', color: 'var(--text)' }}>The right tool.<br /><span style={{ color: 'var(--green)' }}>In stock.</span> On time.</h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 460, margin: '0 0 30px' }}>
          Over 27,500 cutting tools and industrial supplies stocked in Largo, Florida — plus factory-direct access to 120+ trusted brands.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 34 }}>
          <Link href="/category/square-end-mills" className="btn-green" style={{ height: 52, padding: '0 26px', fontSize: 15, fontWeight: 600, color: '#fff', border: 0, borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>Shop Florida Stock<ArrowRight size={17} strokeWidth={2.2} /></Link>
          <Link href="/category/square-end-mills" className="btn-outline" style={{ height: 52, padding: '0 24px', fontSize: 15, fontWeight: 600, color: 'var(--text)', border: '1px solid rgba(43,42,38,.1)', borderRadius: 14, display: 'inline-flex', alignItems: 'center' }}>Browse Brands</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: 'var(--surface-2)', borderRadius: 18, padding: '20px 4px' }}>
          {[['27,500+', 'In local FL stock'], ['120+', 'Trusted brands'], ['Same-day', 'Largo pickup']].map(([a, b], i) => (
            <div key={i} style={{ padding: '0 20px', borderLeft: i ? '1px solid rgba(43,42,38,.09)' : undefined }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--green)', lineHeight: 1 }}>{a}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', background: '#fff', overflow: 'hidden', minHeight: 560 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/vipProgram.png" alt="New VIP Program — Bronze 1%, Silver 2%, Gold 4%, Platinum 5%" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </section>
  );
}

function Head({ eyebrow, title, href, cta }: { eyebrow: string; title: string; href: string; cta: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ ...upper, letterSpacing: '.08em', color: 'var(--gold-700)', marginBottom: 8 }}>{eyebrow}</div>
        <h2 style={{ fontSize: 32, margin: 0 }}>{title}</h2>
      </div>
      <Link href={href} style={{ fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{cta}<ChevronRight size={15} strokeWidth={2.2} /></Link>
    </div>
  );
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section style={{ padding: '56px 0 8px' }}>
      <Head eyebrow="Browse the catalog" title="Shop by category" href="/category/square-end-mills" cta="View all categories" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="cat-card" style={{ color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22, padding: 22, minHeight: 130, borderRadius: 20, background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: 999 }}>{c.count} items</span>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--gold-100)', display: 'grid', placeItems: 'center' }}><External size={16} color="var(--gold-700)" strokeWidth={2.2} /></span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.15 }}>{c.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FeaturedProducts({ products, slugById }: { products: Product[]; slugById: Record<string, string> }) {
  return (
    <section style={{ background: 'var(--surface)', borderRadius: 28, padding: 40, marginTop: 40 }}>
      <Head eyebrow="In stock now" title="Customer favorites" href="/category/square-end-mills" cta="Shop all in-stock" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, gridAutoRows: '1fr' }}>
        {products.map((p) => <ProductCard key={p.id} product={p} categorySlug={slugById[p.category_id] ?? 'square-end-mills'} />)}
      </div>
    </section>
  );
}

export function DealsBanner() {
  return (
    <section style={{ background: 'var(--green-800)', borderRadius: 28, padding: 8, display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: 8, alignItems: 'center', overflow: 'hidden', marginTop: 40 }}>
      <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ ...upper, alignSelf: 'flex-start', color: '#fff', background: 'var(--gold-2)', padding: '6px 13px', borderRadius: 999, marginBottom: 20 }}>Florida Stock</span>
        <h2 style={{ fontSize: 50, lineHeight: .98, margin: 0, color: '#fff' }}>Liquidation<br /><span style={{ color: 'var(--gold-2)' }}>Deals</span></h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', margin: '16px 0 28px', maxWidth: 420 }}>Brand-new tooling, below original selling prices. Limited quantities — once it's gone, it's gone.</p>
        <Link href="/category/square-end-mills" className="btn-gold" style={{ alignSelf: 'flex-start', height: 52, padding: '0 26px', fontSize: 15, fontWeight: 600, color: '#fff', border: 0, borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 9 }}>Shop liquidation inventory<ArrowRight size={16} strokeWidth={2.4} /></Link>
      </div>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0f3320', borderRadius: 22, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/floridaDeal.png" alt="Florida Stock — Liquidation Deals. Brand-new tooling below original selling prices." style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    </section>
  );
}

export function CapabilityStrip() {
  const chips = ['Solid Carbide', 'PowerA (AlTiN)', '2–8 Flute', 'Imperial & Metric', 'Square · Ball · Corner Radius', 'Taper & Drill Mills', 'Made in the USA'];
  return (
    <section style={{ padding: '56px 0', textAlign: 'center' }}>
      <div style={{ ...upper, letterSpacing: '.08em', color: 'var(--gold-700)', marginBottom: 24 }}>Precision tooling, factory-direct</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        {chips.map((b) => <span key={b} className="brand-chip" style={{ fontWeight: 600, fontSize: 16, color: 'var(--muted)', background: 'var(--surface)', padding: '12px 22px', borderRadius: 999 }}>{b}</span>)}
      </div>
    </section>
  );
}

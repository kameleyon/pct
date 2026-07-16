import Link from 'next/link';
import { type Category, type Product } from '@/lib/catalog';
import { ProductCard } from './ProductCard';
import { ToolGlyph } from './ToolGlyph';
import { ArrowRight, ChevronRight, Box, Truck, Shield, External, Star } from './icons';

const upper = { fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' as const };

export function Hero() {
  return (
    <section style={{ background: 'var(--surface)', borderRadius: 28, display: 'grid', gridTemplateColumns: '1.05fr .95fr', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>
        <span style={{ ...upper, alignSelf: 'flex-start', color: 'var(--gold-700)', background: 'var(--gold-100)', padding: '7px 14px', borderRadius: 999, marginBottom: 24 }}>Precision cutting tools · factory direct</span>
        <h1 style={{ fontSize: 58, lineHeight: 1.0, letterSpacing: '-.02em', margin: '0 0 20px' }}>The right tool.<br /><span style={{ color: 'var(--green)' }}>In stock.</span> On time.</h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--muted)', maxWidth: 460, margin: '0 0 30px' }}>
          Solid carbide end mills ground and coated to spec — square, ball, corner-radius, taper, and high-performance geometries. Factory-direct and made in the USA.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 34 }}>
          <Link href="/category/square-end-mills" className="btn-green" style={{ height: 52, padding: '0 26px', fontSize: 15, fontWeight: 600, color: '#fff', border: 0, borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>Shop the catalog<ArrowRight size={17} strokeWidth={2.2} /></Link>
          <Link href="/category/corner-radius-end-mills" className="btn-outline" style={{ height: 52, padding: '0 24px', fontSize: 15, fontWeight: 600, color: 'var(--text)', border: '1px solid rgba(43,42,38,.1)', borderRadius: 14, display: 'inline-flex', alignItems: 'center' }}>Corner Radius</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: 'var(--surface-2)', borderRadius: 18, padding: '20px 4px' }}>
          {[['3,278', 'Endmills cataloged'], ['19', 'Product families'], ['Same-day', 'Largo pickup']].map(([a, b], i) => (
            <div key={i} style={{ padding: '0 20px', borderLeft: i ? '1px solid rgba(43,42,38,.09)' : undefined }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--green)', lineHeight: 1 }}>{a}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', background: 'linear-gradient(150deg,#154a2a,#0c2c19)', display: 'grid', placeItems: 'center', minHeight: 520, padding: 40 }}>
        <div style={{ width: '62%', maxWidth: 280, opacity: .96 }}><ToolGlyph slug="square" /></div>
        <span style={{ position: 'absolute', top: 24, right: 24, ...upper, color: '#fff', background: 'var(--gold)', padding: '7px 14px', borderRadius: 999 }}>Made in USA</span>
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, background: 'rgba(255,255,255,.1)', borderRadius: 18, padding: '14px 20px', display: 'flex', gap: 28, backdropFilter: 'blur(4px)' }}>
          {[['Carbide', 'Micro-grain'], ['2–8', 'Flute options'], ['PowerA', 'AlTiN coating']].map(([a, b], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--gold-2)' }}>{a}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.72)', fontWeight: 600, lineHeight: 1.2 }}>{b}</span>
            </div>
          ))}
        </div>
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
      <Head eyebrow="Factory direct" title="Popular PowerA end mills" href="/category/square-end-mills" cta="Shop the catalog" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, gridAutoRows: '1fr' }}>
        {products.map((p) => <ProductCard key={p.id} product={p} categorySlug={slugById[p.category_id] ?? 'square-end-mills'} />)}
      </div>
    </section>
  );
}

export function DealsBanner() {
  return (
    <section style={{ background: 'var(--green-800)', borderRadius: 28, padding: 8, display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: 8, alignItems: 'center', overflow: 'hidden', marginTop: 40 }}>
      <div style={{ padding: '48px 40px' }}>
        <span style={{ display: 'inline-block', ...upper, color: '#fff', background: 'var(--gold)', padding: '6px 13px', borderRadius: 999, marginBottom: 20 }}>Factory Direct</span>
        <h2 style={{ fontSize: 46, lineHeight: .98, margin: 0, color: '#fff' }}>Built to spec.<br /><span style={{ color: 'var(--gold-2)' }}>Priced to move.</span></h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', margin: '16px 0 28px', maxWidth: 420 }}>Volume pricing on every geometry — request a quote on any part number and we'll turn it around fast.</p>
        <Link href="/category/square-end-mills" className="btn-gold" style={{ height: 52, padding: '0 26px', fontSize: 15, fontWeight: 600, color: '#fff', border: 0, borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 9 }}>Request a quote<ArrowRight size={16} strokeWidth={2.4} /></Link>
      </div>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(135deg,#0f3320,#0c2c19)', borderRadius: 22, display: 'grid', placeItems: 'center', padding: 30 }}>
        <div style={{ width: '46%', maxWidth: 200, opacity: .92 }}><ToolGlyph slug="ball" /></div>
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

export function VipBand() {
  const tiers = [
    { name: 'Member', pct: '1%', color: '#cbb26a', note: 'Every online account — instant access to catalog pricing and order history.' },
    { name: 'Silver', pct: '2%', color: '#c9c9c9', note: 'Rolling 12-month purchases unlock member pricing and priority stock.' },
    { name: 'Gold', pct: '3%', color: 'var(--gold-2)', note: 'Free shipping offers and dedicated tooling support.' },
    { name: 'Platinum', pct: '4%', color: '#e6e6e6', note: 'Best pricing, first access to new geometries, and volume terms.' },
  ];
  return (
    <section style={{ background: 'var(--green-700)', borderRadius: 28, padding: 44, marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 30 }}>
        <div>
          <h2 style={{ fontSize: 38, margin: 0, color: '#fff' }}>PCT <span style={{ color: 'var(--gold-2)' }}>VIP</span> Program</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', margin: '12px 0 0', maxWidth: 520 }}>More savings, more rewards. VIP pricing scales with your rolling 12-month purchases — and it starts with every online account.</p>
        </div>
        <Link href="/" className="btn-gold" style={{ height: 52, padding: '0 26px', fontSize: 14, fontWeight: 600, color: '#fff', border: 0, borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>View VIP benefits<ArrowRight size={16} strokeWidth={2.4} /></Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {tiers.map((t) => (
          <div key={t.name} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...upper, color: t.color }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />{t.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}><span style={{ fontSize: 40, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{t.pct}</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>in rewards</span></div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.64)', marginTop: 14, lineHeight: 1.45 }}>{t.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

import Link from 'next/link';
import { getCategories } from '@/lib/catalog';
import { Pin, Phone, Star, Search, Rows, Heart, Cart } from './icons';

export async function Header() {
  const cats = await getCategories();
  const nav = cats.slice(0, 7);

  return (
    <header style={{ background: '#fff' }}>
      {/* utility bar */}
      <div>
        <div className="wrap" style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <Pin size={14} color="var(--gold)" />
            <span style={{ color: 'var(--green)' }}>3,278 endmills</span>
            <span>in the catalog — same-day pickup in Largo, FL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontWeight: 600 }}>
            <a href="tel:+17275464655" style={{ color: 'inherit', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Phone size={13} />(727) 546-4655</a>
            <span style={{ color: 'var(--gold-700)', display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><Star size={13} color="var(--gold-700)" />VIP Program</span>
            <span style={{ cursor: 'pointer' }}>Sign In / Register</span>
          </div>
        </div>
      </div>

      {/* main bar */}
      <div className="wrap" style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 13, flex: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pct-logo.png" alt="Precise Cut Tools" style={{ height: 54, width: 54, objectFit: 'contain', display: 'block', flex: 'none' }} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 21, color: 'var(--green)' }}>Precise Cut Tools</span>
            <span style={{ fontSize: 10.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold-700)', marginTop: 6, fontWeight: 600 }}>Precision Cutting Tools</span>
          </span>
        </Link>

        <form action={`/category/${nav[0]?.slug ?? 'square-end-mills'}`} style={{ flex: 1, display: 'flex', alignItems: 'stretch', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, height: 50, maxWidth: 640, overflow: 'hidden' }}>
          <input name="q" placeholder="Search part #, coating, or tool type…" style={{ border: 0, background: 'transparent', height: '100%', flex: 1, fontSize: 14, paddingLeft: 16 }} />
          <button type="submit" className="btn-green" style={{ width: 52, margin: 6, border: 0, borderRadius: 11, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Search size={20} strokeWidth={2.2} />
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flex: 'none' }}>
          <button className="iconbtn" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 0, borderRadius: 14, cursor: 'pointer', color: '#4a473f', padding: '8px 12px' }}>
            <Rows size={21} strokeWidth={1.9} /><span style={{ fontSize: 10, fontWeight: 600 }}>Quick Order</span>
          </button>
          <button className="iconbtn" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 0, borderRadius: 14, cursor: 'pointer', color: '#4a473f', padding: '8px 12px' }}>
            <Heart size={21} strokeWidth={1.9} /><span style={{ fontSize: 10, fontWeight: 600 }}>Favorites</span>
          </button>
          <button className="btn-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: 0, borderRadius: 14, cursor: 'pointer', color: '#fff', padding: '13px 20px', marginLeft: 6 }}>
            <Cart size={20} strokeWidth={1.9} /><span style={{ fontSize: 13, fontWeight: 600 }}>Cart</span>
          </button>
        </div>
      </div>

      {/* category nav */}
      <nav style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 20 }}>
        <div className="wrap" style={{ padding: '6px 32px 8px', display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
          {nav.map((c) => (
            <Link key={c.slug} className="navlink" href={`/category/${c.slug}`}>{c.name.replace(' End Mills', '')}</Link>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link className="navlink" href="/" style={{ color: 'var(--gold-700)' }}>Deals</Link>
            <Link className="navlink" href="/">Line Card</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

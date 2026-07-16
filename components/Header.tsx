import Link from 'next/link';

const nav = [
  ['End Mills', '/category/square-end-mills'],
  ['High Performance End Mills', '#'],
  ['Pro+ Performance End Mills', '#'],
  ['High Performance Routers', '#'],
  ['Drills', '#'],
  ['Reamers & Threadmills', '#'],
  ['Burs & Fiberglass Routing', '#'],
  ['Dental Tools', '#'],
];

export function Header() {
  return (
    <>
      {/* ===== UTILITY BAR ===== */}
      <div style={{ background: '#fff' }}>
        <div className="wrap" style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, letterSpacing: '.01em', color: 'var(--muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bf9b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            <span style={{ color: 'var(--color-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>27,500+ items</span><span className="util-hide" style={{ whiteSpace: 'nowrap' }}>in Florida local stock — same-day pickup in Zephyrhills, FL</span>
          </div>
          <div className="util-hide" style={{ display: 'flex', alignItems: 'center', gap: 22, fontWeight: 600 }}>
            <a href="tel:+18137708795" style={{ color: 'inherit', display: 'inline-flex', gap: 6, alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>(813) 770-8795</a>
            <span style={{ color: 'var(--color-gold-700)', cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center', fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 15 9l7 .6-5.3 4.6L18.5 21 12 17.3 5.5 21l1.8-6.8L2 9.6 9 9z" /></svg>VIP Program</span>
            <span style={{ cursor: 'pointer' }}>Sign In / Register</span>
          </div>
        </div>
      </div>

      {/* ===== MAIN BAR ===== */}
      <div style={{ background: '#fff' }}>
        <div className="wrap mainbar" style={{ paddingTop: 18, paddingBottom: 18 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 13, flex: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/pct-logo.png" alt="Precise Cut Tools" style={{ height: 54, width: 54, objectFit: 'contain', display: 'block', flex: 'none' }} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 21, letterSpacing: '.01em', color: 'var(--color-accent)' }}>Precise Cut Tools</span>
              <span style={{ fontSize: 10.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold-700)', marginTop: 6, fontWeight: 600 }}>Precision Cutting Tools</span>
            </span>
          </Link>

          <form action="/category/square-end-mills" className="mainbar-search" style={{ display: 'flex', alignItems: 'stretch', background: '#fff', border: '1px solid var(--line)', borderRadius: 16, height: 50, overflow: 'hidden' }}>
            <select name="cat" style={{ width: 150, border: 0, background: 'transparent', height: '100%', fontWeight: 600, fontSize: 13, paddingLeft: 16, color: '#4a473f' }}>
              <option>All Categories</option><option>End Mills</option><option>High Performance End Mills</option><option>Pro+ Performance End Mills</option><option>High Performance Routers</option><option>Drills</option><option>Reamers &amp; Threadmills</option><option>Burs &amp; Fiberglass Routing</option><option>Dental Tools</option>
            </select>
            <div style={{ width: 1, background: 'rgba(43,42,38,.1)', margin: '11px 0' }} />
            <input name="q" placeholder="Search part #, brand, or tool type…" style={{ border: 0, background: 'transparent', height: '100%', flex: 1, fontSize: 14, minWidth: 60 }} />
            <button type="submit" className="h-green" style={{ width: 52, margin: 6, background: 'var(--color-accent)', border: 0, borderRadius: 11, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flex: 'none' }}>
            <button className="h-icon" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 0, borderRadius: 14, cursor: 'pointer', color: '#4a473f', padding: '8px 12px' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.01em' }}>Quick Order</span>
            </button>
            <button className="h-icon" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 0, borderRadius: 14, cursor: 'pointer', color: '#4a473f', padding: '8px 12px' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" /></svg>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.01em' }}>Favorites</span>
            </button>
            <button className="h-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--color-accent)', border: 0, borderRadius: 14, cursor: 'pointer', color: '#fff', padding: '13px 20px', marginLeft: 6 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.01em' }}>Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== CATEGORY NAV ===== */}
      <div style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 20 }}>
        <div className="wrap noscroll" style={{ padding: '6px 24px 12px', display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
          {nav.map(([label, href]) => (
            <Link key={label} className="pct-navlink" href={href}>{label}</Link>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link className="pct-navlink" href="#">Brands</Link>
            <Link className="pct-navlink" href="#" style={{ color: 'var(--color-gold-700)' }}>Deals</Link>
            <Link className="pct-navlink" href="#">Line Card</Link>
          </div>
        </div>
      </div>
    </>
  );
}

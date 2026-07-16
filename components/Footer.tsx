import Link from 'next/link';

export function Footer() {
  return (
    <div className="wrap" style={{ paddingBottom: 32 }}>
      <footer className="pct-foot" style={{ background: 'var(--color-accent-800)', color: 'rgba(255,255,255,.72)', borderRadius: 28, overflow: 'hidden' }}>
        <div className="foot-grid">
          <div>
            <div style={{ fontWeight: 600, fontSize: 20, color: '#fff', letterSpacing: '.01em' }}>Precise Cut Tools</div>
            <div style={{ fontSize: 10.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-gold-2)', marginTop: 6, fontWeight: 600 }}>Precision Cutting Tools</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '20px 0 0', color: 'rgba(255,255,255,.62)' }}>Zephyrhills, Florida</p>
            <a href="tel:+18137708795" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, color: '#fff', fontWeight: 600, fontSize: 17 }}>(813) 770-8795</a>
            <div style={{ marginTop: 18 }}><span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--color-gold-2)' }}>Get directions<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></span></div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Shop</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {['End Mills', 'Drills', 'Reamers & Threadmills', 'Routers & Burs', 'Dental Tools', 'Liquidation Deals'].map((l) => <Link key={l} href="/category/square-end-mills">{l}</Link>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {['About Us', 'VIP Benefits', 'Contact Us', 'Credit Application', 'Line Card'].map((l) => <Link key={l} href="#">{l}</Link>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: 16 }}>Get deals &amp; tips</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.62)', margin: '0 0 12px' }}>Coupons and discounts via email.</p>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,.08)', borderRadius: 12, height: 46, overflow: 'hidden' }}>
              <input placeholder="Email address" style={{ flex: 1, background: 'transparent', border: 0, color: '#fff', padding: '0 14px', fontSize: 13, outline: 'none', minWidth: 60 }} />
              <button style={{ background: 'var(--color-gold-2)', color: '#fff', border: 0, padding: '0 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sign Up</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,.75)"><path d="M13 22v-8h3l.5-4H13V7.5c0-1.1.3-1.9 1.9-1.9H17V2.2C16.4 2.1 15.3 2 14.2 2 11.6 2 10 3.6 10 6.5V10H7v4h3v8h3z" /></svg></span>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,.75)"><path d="M18 2h4l-8.5 9.7L23 22h-6.4l-5-6.5L5.8 22H1.8l9-10.3L1 2h6.6l4.5 6z" /></svg></span>
            </div>
          </div>
        </div>
        <div className="foot-bottom" style={{ margin: '34px 0 0', borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>© 2026 Precise Cut Tools, Inc. · All rights reserved</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer', fontSize: 12 }}>Privacy</span><span style={{ cursor: 'pointer', fontSize: 12 }}>Returns</span><span style={{ cursor: 'pointer', fontSize: 12 }}>Terms</span>
            <div style={{ display: 'flex', gap: 7 }}>
              {['VISA', 'MC', 'AMEX', 'DISC'].map((c, i) => <span key={c} style={{ width: 40, height: 26, borderRadius: 6, background: 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', fontSize: i ? 8 : 9, fontWeight: 600, color: '#fff' }}>{c}</span>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

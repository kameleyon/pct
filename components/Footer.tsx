import Link from 'next/link';
import { Pin, Phone } from './icons';

const cols = [
  { h: 'Shop', links: ['Square End Mills', 'Ball End Mills', 'Corner Radius', 'Drill Mills', 'Taper Mills', 'All Categories'] },
  { h: 'Company', links: ['About PCT', 'Made in the USA', 'Line Card', 'Careers', 'Contact'] },
  { h: 'Support', links: ['Request a Quote', 'Shipping & Returns', 'Terms', 'Privacy', 'VIP Program'] },
];

export function Footer() {
  return (
    <footer style={{ background: 'var(--green-800)', color: '#fff', marginTop: 8 }}>
      <div className="wrap" style={{ padding: '56px 32px 32px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ height: 44, width: 44, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center' }}>
              <span style={{ color: 'var(--gold-2)', fontWeight: 700, fontSize: 16 }}>PCT</span>
            </span>
            <span style={{ fontWeight: 600, fontSize: 18 }}>Precise Cut Tools</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 320, margin: '0 0 18px' }}>
            Solid carbide end mills and precision cutting tools — factory-direct and made in the USA. Stocked in Largo, Florida.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'rgba(255,255,255,.72)', fontSize: 13 }}>
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Pin size={14} color="var(--gold-2)" />Largo, Florida</span>
            <a className="foot-link" href="tel:+17275464655" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Phone size={14} color="var(--gold-2)" />(727) 546-4655</a>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--gold-2)', marginBottom: 16 }}>{c.h}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {c.links.map((l) => <Link key={l} className="foot-link" href="/">{l}</Link>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div className="wrap" style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 12.5, color: 'rgba(255,255,255,.5)' }}>
          <span>© {new Date().getFullYear()} Precise Cut Tools. All rights reserved.</span>
          <span>Precision cutting tools · Made in the USA</span>
        </div>
      </div>
    </footer>
  );
}

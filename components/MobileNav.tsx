'use client';
import { useState } from 'react';
import Link from 'next/link';

export function MobileNav({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-nav">
      <button onClick={() => setOpen(true)} aria-label="Browse categories" className="h-icon" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 0, borderRadius: 14, cursor: 'pointer', color: '#4a473f', padding: '8px 12px' }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.01em' }}>Categories</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 100, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--color-accent)' }}>Categories</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid var(--line)', background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--color-text)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 20px 24px' }}>
            {items.map(([label, href]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)} style={{ padding: '15px 4px', fontSize: 15.5, fontWeight: 600, color: 'var(--color-text)', borderBottom: '1px solid rgba(43,42,38,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-700)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useTransition } from 'react';
import { useCart } from './CartProvider';
import { requestQuoteAction } from '@/app/cart/actions';
import { useAuthModal } from '@/components/auth/AuthProvider';

export function CartDrawer({ isAuthed }: { isAuthed: boolean }) {
  const { lines, count, open, setOpen, setQty, remove, clear } = useCart();
  const auth = useAuthModal();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submitQuote = () => {
    setErr(null);
    if (!isAuthed) { setOpen(false); auth.open('signin'); return; }
    start(async () => {
      const r = await requestQuoteAction({});
      if (r.ok) { clear(); setDone(true); } else setErr(r.error ?? 'Something went wrong.');
    });
  };

  return (
    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(12,44,25,.4)', display: 'flex', justifyContent: 'flex-end' }}>
      <aside onClick={(e) => e.stopPropagation()} style={{ width: 'min(420px,100%)', height: '100%', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', background: 'var(--color-surface-2)' }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Your Cart{count ? ` · ${count}` : ''}</h3>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ width: 36, height: 36, borderRadius: 11, background: '#fff', border: 0, cursor: 'pointer', color: 'var(--muted)', display: 'grid', placeItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {done ? (
            <div style={{ textAlign: 'center', marginTop: 60, padding: 20 }}>
              <div style={{ fontSize: 40 }}>✓</div>
              <h4 style={{ margin: '10px 0 6px' }}>Quote requested</h4>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Our team will email you pricing shortly.</p>
            </div>
          ) : lines.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--muted)' }}>
              <p style={{ fontWeight: 600 }}>Your cart is empty.</p>
              <p style={{ fontSize: 13 }}>Add tools to request a quote.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lines.map((l) => (
                <div key={l.productId} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 14, padding: 12, border: '1px solid rgba(43,42,38,.08)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--color-surface-2)', flex: 'none', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image ? <img src={l.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: 'var(--color-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>№ {l.partNumber}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid rgba(43,42,38,.14)', borderRadius: 9, overflow: 'hidden' }}>
                        <button onClick={() => setQty(l.productId, l.qty - 1)} style={qtyBtn}>−</button>
                        <span style={{ width: 30, textAlign: 'center', fontWeight: 600, fontSize: 13 }}>{l.qty}</span>
                        <button onClick={() => setQty(l.productId, l.qty + 1)} style={qtyBtn}>+</button>
                      </div>
                      <button onClick={() => remove(l.productId)} style={{ marginLeft: 'auto', background: 'none', border: 0, color: 'var(--muted-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!done && lines.length > 0 && (
          <footer style={{ padding: 18, borderTop: '1px solid rgba(43,42,38,.08)' }}>
            {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 12.5, fontWeight: 600, padding: '8px 10px', borderRadius: 9, marginBottom: 10 }}>{err}</div>}
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>Factory-direct pricing is quoted per order. Submit your list and we’ll email pricing.</p>
            <button onClick={submitQuote} disabled={pending} style={{ width: '100%', height: 48, borderRadius: 13, background: 'var(--color-accent)', color: '#fff', border: 0, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              {pending ? 'Submitting…' : isAuthed ? 'Request Quote' : 'Sign in to Request Quote'}
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}

const qtyBtn: React.CSSProperties = { width: 28, height: 30, background: 'var(--color-surface-2)', border: 0, cursor: 'pointer', fontSize: 16, fontWeight: 600, color: 'var(--color-text)' };

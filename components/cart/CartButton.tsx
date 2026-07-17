'use client';
import { useCart } from './CartProvider';

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button onClick={() => setOpen(true)} className="h-green" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--color-accent)', border: 0, borderRadius: 14, cursor: 'pointer', color: '#fff', padding: '13px 20px', marginLeft: 6 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.01em' }}>Cart</span>
      {count > 0 && (
        <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 999, background: 'var(--color-gold)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', border: '2px solid #fff' }}>{count}</span>
      )}
    </button>
  );
}

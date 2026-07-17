'use client';
import { useState } from 'react';
import { useCart } from './CartProvider';

export function AddToCart({ productId, partNumber, name, image }: { productId: string; partNumber: string; name: string; image: string }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 16px' }}>
      <input
        value={qty}
        onChange={(e) => setQty(Math.max(1, parseInt(e.target.value.replace(/\D/g, '') || '1', 10)))}
        aria-label="Quantity"
        style={{ width: 50, height: 42, textAlign: 'center', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', background: '#fff', border: '1px solid rgba(43,42,38,.12)', borderRadius: 11, outline: 'none' }}
      />
      <button
        onClick={() => add({ productId, partNumber, name, image }, qty)}
        className="h-gold"
        style={{ flex: 1, height: 42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', color: '#fff', background: 'var(--color-gold)', border: 0, borderRadius: 11 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>Add to Cart
      </button>
    </div>
  );
}

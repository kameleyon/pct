'use client';
import { useEffect, useRef } from 'react';
import { useCart } from './CartProvider';

// Empties the cart once when the order-confirmation page loads (covers guests,
// whose cart lives in localStorage and isn't touched by the webhook).
export function ClearCartOnSuccess() {
  const { clear } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
  }, [clear]);
  return null;
}

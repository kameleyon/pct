'use client';
import { useEffect, useRef } from 'react';
import { useCart, CART_STORAGE_KEY } from './CartProvider';

// Empties the cart once when the order-confirmation page loads (covers guests,
// whose cart lives in localStorage and isn't touched by the webhook).
//
// This component is a descendant of CartProvider, and React fires child
// effects before parent effects — so CartProvider's own localStorage
// hydration effect runs AFTER this one. If we only called clear() (which
// resets in-memory state but never touches localStorage), that hydration
// effect would immediately read the still-stale localStorage cart and
// repopulate it. Clearing localStorage directly here, first, prevents that.
export function ClearCartOnSuccess() {
  const { clear } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* storage unavailable — nothing to clear */ }
    clear();
  }, [clear]);
  return null;
}

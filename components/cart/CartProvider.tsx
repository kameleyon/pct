'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CartLine } from '@/app/cart/actions';
import { setCartItemAction, mergeCartAction } from '@/app/cart/actions';

const KEY = 'pct_cart_v1';

type CartCtx = {
  lines: CartLine[];
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart must be used inside <CartProvider>');
  return c;
};

const readLocal = (): CartLine[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export function CartProvider({ isAuthed, serverLines, children }: { isAuthed: boolean; serverLines: CartLine[]; children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(serverLines);
  const [open, setOpen] = useState(false);
  const authed = useRef(isAuthed);

  // Hydrate once on the client — guests from localStorage, members merge any guest cart into their server cart.
  useEffect(() => {
    const local = readLocal();
    if (isAuthed) {
      if (local.length) {
        mergeCartAction(local.map((l) => ({ productId: l.productId, qty: l.qty })));
        localStorage.removeItem(KEY);
        setLines((prev) => {
          const map = new Map(prev.map((l) => [l.productId, { ...l }]));
          for (const l of local) {
            const ex = map.get(l.productId);
            if (ex) ex.qty += l.qty; else map.set(l.productId, l);
          }
          return [...map.values()];
        });
      }
    } else {
      setLines(local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist guest carts locally on every change.
  useEffect(() => {
    if (!authed.current) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const persist = (productId: string, qty: number) => {
    if (authed.current) setCartItemAction(productId, qty);
  };

  const add: CartCtx['add'] = (line, qty = 1) => {
    setLines((prev) => {
      const ex = prev.find((l) => l.productId === line.productId);
      const nextQty = (ex?.qty ?? 0) + qty;
      persist(line.productId, nextQty);
      return ex
        ? prev.map((l) => (l.productId === line.productId ? { ...l, qty: nextQty } : l))
        : [...prev, { ...line, qty }];
    });
    setOpen(true);
  };

  const setQty: CartCtx['setQty'] = (productId, qty) => {
    if (qty <= 0) return remove(productId);
    persist(productId, qty);
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty } : l)));
  };

  const remove: CartCtx['remove'] = (productId) => {
    persist(productId, 0);
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const clear = () => {
    lines.forEach((l) => persist(l.productId, 0));
    setLines([]);
  };

  const count = lines.reduce((n, l) => n + l.qty, 0);

  return (
    <Ctx.Provider value={{ lines, count, open, setOpen, add, setQty, remove, clear }}>
      {children}
    </Ctx.Provider>
  );
}

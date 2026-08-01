import Link from 'next/link';
import { ClearCartOnSuccess } from '@/components/cart/ClearCartOnSuccess';
import { CART_STORAGE_KEY } from '@/components/cart/CartProvider';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <main className="wrap" style={{ padding: '80px 24px', display: 'grid', placeItems: 'center' }}>
      {/* Runs synchronously during HTML parsing, before React hydrates — guarantees
          localStorage is empty before CartProvider's own hydration effect ever reads
          it, regardless of client component mount/effect ordering. */}
      <script dangerouslySetInnerHTML={{ __html: `try{localStorage.removeItem('${CART_STORAGE_KEY}')}catch(e){}` }} />
      <ClearCartOnSuccess />
      <div style={{ background: 'var(--color-surface)', borderRadius: 24, padding: '48px 40px', textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent-100)', color: 'var(--color-accent)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h1 style={{ fontSize: 26, margin: '0 0 10px' }}>Payment received</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px' }}>
          Thank you — your order is confirmed and we’ll get it moving. A receipt is on its way to your email.
        </p>
        {order && <p style={{ color: 'var(--muted-2)', fontSize: 12, fontFamily: 'monospace' }}>Order {order.slice(0, 8)}</p>}
        <Link href="/" style={{ display: 'inline-block', marginTop: 22, height: 48, lineHeight: '48px', padding: '0 28px', borderRadius: 13, background: 'var(--color-accent)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

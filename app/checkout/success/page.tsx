import Link from 'next/link';
import { ClearCartOnSuccess } from '@/components/cart/ClearCartOnSuccess';
import { CART_STORAGE_KEY } from '@/components/cart/CartProvider';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { formatAddress, type ShippingAddress } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;

  // Guests have no session for RLS to scope to, so this reads via the
  // service-role client — read-only confirmation info tied to an order id
  // the visitor was just redirected to by Stripe.
  let shippingAddress: string | null = null;
  let deliveryWindow: string | null = null;
  if (order) {
    const { data: row } = await getSupabaseAdmin()
      .from('orders')
      .select('shipping_address, estimated_delivery_earliest, estimated_delivery_latest')
      .eq('id', order)
      .maybeSingle();
    if (row?.shipping_address) shippingAddress = formatAddress(row.shipping_address as ShippingAddress);
    if (row?.estimated_delivery_earliest && row?.estimated_delivery_latest) {
      const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' };
      const earliest = new Date(row.estimated_delivery_earliest).toLocaleDateString('en-US', opts);
      const latest = new Date(row.estimated_delivery_latest).toLocaleDateString('en-US', opts);
      deliveryWindow = `${earliest} – ${latest}`;
    }
  }

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

        {(shippingAddress || deliveryWindow) ? (
          <div style={{ marginTop: 20, padding: 18, borderRadius: 14, background: 'var(--color-surface-2)', textAlign: 'left' }}>
            {shippingAddress && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted-2)', marginBottom: 6 }}>Shipping to</div>
                <div style={{ whiteSpace: 'pre-line', fontSize: 13.5, marginBottom: deliveryWindow ? 14 : 0 }}>{shippingAddress}</div>
              </>
            )}
            {deliveryWindow && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted-2)', marginBottom: 6 }}>Estimated arrival</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-accent)' }}>{deliveryWindow}</div>
              </>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-2)', fontSize: 12.5, marginTop: 16 }}>Your shipping confirmation and delivery estimate will follow by email shortly.</p>
        )}

        <Link href="/" style={{ display: 'inline-block', marginTop: 22, height: 48, lineHeight: '48px', padding: '0 28px', borderRadius: 13, background: 'var(--color-accent)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

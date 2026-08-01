import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { formatAddress, type ShippingAddress } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  quote_requested: 'Quote requested', pending: 'Pending payment', paid: 'Paid', shipped: 'Shipped', cancelled: 'Cancelled',
};
const STATUS_COLOR: Record<string, string> = {
  quote_requested: 'var(--muted)', pending: 'var(--color-gold-700)', paid: 'var(--color-accent)', shipped: 'var(--color-accent)', cancelled: '#b23b2e',
};

type OrderItem = { id: string; part_number: string; name: string; unit_price: number | null; quantity: number };
type Order = {
  id: string; status: string; total: number | null; created_at: string; items: OrderItem[];
  shipping_address: ShippingAddress | null; estimated_delivery_earliest: string | null; estimated_delivery_latest: string | null;
};

export default async function OrdersPage() {
  const session = await getSession();
  if (session.role === 'guest') redirect('/');

  const sb = await createSupabaseServer();
  const { data: orders } = await sb
    .from('orders')
    .select('id,status,total,created_at,shipping_address,estimated_delivery_earliest,estimated_delivery_latest,items:order_items(id,part_number,name,unit_price,quantity)')
    .eq('profile_id', session.userId as string)
    .order('created_at', { ascending: false });

  const list = (orders ?? []) as unknown as Order[];

  return (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/account">My Account</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>Order history</span>
      </div>
      <h1 style={{ fontSize: 32, margin: '0 0 24px' }}>Order history</h1>

      {list.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
          No orders yet. <Link href="/" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Start browsing the catalog</Link>.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map((o) => (
            <div key={o.id} style={{ background: 'var(--color-surface)', borderRadius: 18, border: '1px solid rgba(43,42,38,.08)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(43,42,38,.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Order</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{o.id.slice(0, 8)}…</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Placed</div>
                    <div style={{ fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Total</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{o.total != null ? `$${Number(o.total).toFixed(2)}` : '—'}</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: STATUS_COLOR[o.status] ?? 'var(--muted)', borderRadius: 999, padding: '6px 14px' }}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
              <div style={{ padding: '4px 20px' }}>
                {o.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(43,42,38,.05)', fontSize: 13.5 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      <div style={{ color: 'var(--muted-2)', fontSize: 12 }}>{it.part_number} · Qty {it.quantity}</div>
                    </div>
                    <div style={{ flex: 'none', fontWeight: 600 }}>{it.unit_price != null ? `$${Number(it.unit_price).toFixed(2)}` : 'Quote'}</div>
                  </div>
                ))}
              </div>
              {(o.shipping_address || (o.estimated_delivery_earliest && o.estimated_delivery_latest)) && (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '14px 20px', borderTop: '1px solid rgba(43,42,38,.07)', background: 'var(--color-surface-2)' }}>
                  {o.shipping_address && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Shipping to</div>
                      <div style={{ whiteSpace: 'pre-line', fontSize: 13 }}>{formatAddress(o.shipping_address)}</div>
                    </div>
                  )}
                  {o.estimated_delivery_earliest && o.estimated_delivery_latest && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>Estimated arrival</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>
                        {new Date(o.estimated_delivery_earliest).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        {' – '}
                        {new Date(o.estimated_delivery_latest).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

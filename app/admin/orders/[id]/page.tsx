import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { OrderStatus } from '@/components/admin/RoleSelect';
import { formatAddress, formatDeliveryWindowFromDates, type ShippingAddress } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

const card: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)' };
const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)' };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 };

type Contact = { name?: string; email?: string; phone?: string };
type OrderItem = { id: string; part_number: string; name: string; unit_price: number | null; quantity: number };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const { data: order } = await sb
    .from('orders')
    .select('id,status,subtotal,tax,shipping,total,contact,shipping_address,estimated_delivery_earliest,estimated_delivery_latest,created_at,profile_id,affiliate_id,referral_code,items:order_items(id,part_number,name,unit_price,quantity)')
    .eq('id', id)
    .maybeSingle();
  if (!order) notFound();

  const contact = (order.contact ?? {}) as Contact;
  const items = (order.items ?? []) as OrderItem[];
  const shippingAddress = formatAddress(order.shipping_address as ShippingAddress | null);
  const deliveryWindow = order.estimated_delivery_earliest && order.estimated_delivery_latest
    ? formatDeliveryWindowFromDates(order.estimated_delivery_earliest, order.estimated_delivery_latest)
    : null;

  let affiliateName: string | null = null;
  if (order.affiliate_id) {
    const { data: ap } = await sb.from('affiliate_profiles').select('id,profile_id').eq('id', order.affiliate_id).maybeSingle();
    if (ap?.profile_id) {
      const { data: p } = await sb.from('profiles').select('full_name').eq('id', ap.profile_id).maybeSingle();
      affiliateName = p?.full_name ?? 'Affiliate';
    }
  }

  return (
    <main className="wrap" style={{ padding: '32px 24px 64px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/admin">Admin dashboard</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>Order {order.id.slice(0, 8)}…</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, margin: '0 0 4px', fontFamily: 'monospace' }}>{order.id}</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13.5 }}>Placed {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <OrderStatus orderId={order.id} status={order.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Contact</div>
          <div style={{ marginBottom: 10 }}><div style={label}>Name</div><div style={{ fontSize: 14 }}>{contact.name || '—'}</div></div>
          <div style={{ marginBottom: 10 }}><div style={label}>Email</div><div style={{ fontSize: 14 }}>{contact.email || '—'}</div></div>
          <div><div style={label}>Phone</div><div style={{ fontSize: 14 }}>{contact.phone || '—'}</div></div>
          {order.profile_id ? (
            <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted-2)' }}>Registered account</div>
          ) : (
            <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted-2)' }}>Guest checkout — no account</div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Shipping</div>
          <div style={{ marginBottom: 10 }}>
            <div style={label}>Ship to</div>
            <div style={{ whiteSpace: 'pre-line', fontSize: 14 }}>{shippingAddress || '—'}</div>
          </div>
          <div>
            <div style={label}>Estimated arrival</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: deliveryWindow ? 'var(--color-accent)' : 'inherit' }}>{deliveryWindow || '—'}</div>
          </div>
        </div>
      </div>

      {order.affiliate_id && (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Referred sale</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
            Attributed to <Link href={`/admin/affiliates/${order.affiliate_id}`} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{affiliateName ?? 'affiliate'}</Link>
            {order.referral_code ? ` (code ${order.referral_code})` : ''}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Items ({items.length})</h2>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
            <thead><tr><th style={th}>Part</th><th style={th}>Name</th><th style={th}>Qty</th><th style={th}>Unit price</th><th style={th}>Line total</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{it.part_number}</td>
                  <td style={td}>{it.name}</td>
                  <td style={td}>{it.quantity}</td>
                  <td style={td}>{it.unit_price != null ? `$${Number(it.unit_price).toFixed(2)}` : 'Quote'}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{it.unit_price != null ? `$${(Number(it.unit_price) * it.quantity).toFixed(2)}` : '—'}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={5}>No items.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, maxWidth: 340, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 8 }}><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{order.subtotal != null ? `$${Number(order.subtotal).toFixed(2)}` : '—'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 8 }}><span style={{ color: 'var(--muted)' }}>Tax</span><span>{order.tax != null ? `$${Number(order.tax).toFixed(2)}` : '—'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 12 }}><span style={{ color: 'var(--muted)' }}>Shipping</span><span>{order.shipping != null ? `$${Number(order.shipping).toFixed(2)}` : '—'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(43,42,38,.1)', paddingTop: 12, fontWeight: 700, fontSize: 16 }}><span>Total</span><span>{order.total != null ? `$${Number(order.total).toFixed(2)}` : '—'}</span></div>
      </div>
    </main>
  );
}

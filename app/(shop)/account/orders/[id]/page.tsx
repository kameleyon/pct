import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { AcceptQuoteForm, PayInvoiceButton } from '@/components/account/OrderActions';

export const dynamic = 'force-dynamic';

const card: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)' };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 };
const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)' };

const STEP_LABEL: Record<string, string> = {
  quote_requested: 'Quote requested', quoted: 'Quote ready', po_issued: 'PO issued', closed: 'Closed', cancelled: 'Cancelled',
};

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session.role === 'guest') redirect('/');

  const sb = await createSupabaseServer();
  const { data: order } = await sb
    .from('orders')
    .select(`
      id,status,subtotal,total,contact,created_at,profile_id,
      po_number,po_issued_at,quoted_at,
      payment_method_type,escrow_status,credit_status,invoice_status,invoiced_at,payment_status,paid_at,delivery_status,delivered_at,closed_at,
      items:order_items(id,part_number,name,unit_price,quantity)
    `)
    .eq('id', id)
    .maybeSingle();
  if (!order || order.profile_id !== session.userId) notFound();

  const { data: events } = await sb
    .from('order_events')
    .select('id,event_type,created_at')
    .eq('order_id', id)
    .order('created_at', { ascending: false });

  const items = (order.items ?? []) as { id: string; part_number: string; name: string; unit_price: number | null; quantity: number }[];
  const priced = items.some((it) => it.unit_price != null);

  return (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/account/orders">Order history</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>{order.id.slice(0, 8)}…</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, margin: 0, fontFamily: 'monospace' }}>{order.id}</h1>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--color-accent)', borderRadius: 999, padding: '6px 14px' }}>
          {STEP_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {order.status === 'quoted' && (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Your quote is ready</div>
          <AcceptQuoteForm orderId={order.id} />
        </div>
      )}

      {order.payment_method_type === 'direct' && order.invoice_status === 'sent' && order.payment_status !== 'paid' && (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Invoice ready</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>Total due: ${Number(order.total ?? 0).toFixed(2)}</p>
          <PayInvoiceButton orderId={order.id} />
        </div>
      )}

      {order.payment_method_type === 'escrow' && (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Escrow</div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0 }}>
            This order is being handled through escrow. Current status: <b>{order.escrow_status.replace(/_/g, ' ')}</b>. Our team will coordinate funding and release with you directly.
          </p>
        </div>
      )}

      {order.po_number && (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={label}>PO number</div>
          <div style={{ fontSize: 14 }}>{order.po_number}{order.po_issued_at ? ` · issued ${new Date(order.po_issued_at).toLocaleDateString()}` : ''}</div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Items ({items.length})</h2>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
            <thead><tr><th style={th}>Part</th><th style={th}>Name</th><th style={th}>Qty</th><th style={th}>Unit price</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{it.part_number}</td>
                  <td style={td}>{it.name}</td>
                  <td style={td}>{it.quantity}</td>
                  <td style={td}>{it.unit_price != null ? `$${Number(it.unit_price).toFixed(2)}` : 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {priced && (
          <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 700, fontSize: 15 }}>Total: ${Number(order.total ?? 0).toFixed(2)}</div>
        )}
      </div>

      {events && events.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, borderTop: '1px solid rgba(43,42,38,.06)', paddingTop: 10 }}>
                <span style={{ fontWeight: 600 }}>{ev.event_type.replace(/_/g, ' ')}</span>
                <span style={{ color: 'var(--muted-2)' }}>{new Date(ev.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

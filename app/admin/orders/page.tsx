import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { OrderStatus } from '@/components/admin/RoleSelect';
import { OrdersFilterBar } from '@/components/admin/OrdersFilterBar';

export const dynamic = 'force-dynamic';

const PER_PAGE = 25;

const STATUSES = ['all', 'quote_requested', 'pending', 'paid', 'shipped', 'cancelled'] as const;
type StatusFilter = (typeof STATUSES)[number];
const STATUS_LABEL: Record<StatusFilter, string> = { all: 'All', quote_requested: 'Quote requested', pending: 'Pending', paid: 'Paid', shipped: 'Shipped', cancelled: 'Cancelled' };

const SORTS = { date_desc: ['created_at', false], date_asc: ['created_at', true], total_desc: ['total', false], total_asc: ['total', true] } as const;
type SortKey = keyof typeof SORTS;

const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700, position: 'sticky', top: 0, background: 'var(--color-surface)' };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)', verticalAlign: 'middle' };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const status: StatusFilter = (STATUSES as readonly string[]).includes(sp.status ?? '') ? (sp.status as StatusFilter) : 'all';
  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : 'date_desc';
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const sb = await createSupabaseServer();

  const counts = await Promise.all(
    STATUSES.map(async (s) => {
      const query = sb.from('orders').select('id', { count: 'exact', head: true });
      const { count } = s === 'all' ? await query : await query.eq('status', s);
      return [s, count ?? 0] as const;
    })
  );
  const countByStatus = Object.fromEntries(counts) as Record<StatusFilter, number>;

  let listQuery = sb.from('orders').select('id,status,total,contact,created_at,items:order_items(id)', { count: 'exact' });
  if (status !== 'all') listQuery = listQuery.eq('status', status);
  if (q) {
    const safe = q.replace(/[,()]/g, ' ').trim();
    if (safe) listQuery = listQuery.or(`id::text.ilike.%${safe}%,contact->>name.ilike.%${safe}%,contact->>email.ilike.%${safe}%,contact->>phone.ilike.%${safe}%`);
  }
  const [col, asc] = SORTS[sort];
  listQuery = listQuery.order(col, { ascending: asc });
  const from = (page - 1) * PER_PAGE;
  const { data: orders, count: totalMatching } = await listQuery.range(from, from + PER_PAGE - 1);

  const totalPages = Math.max(1, Math.ceil((totalMatching ?? 0) / PER_PAGE));

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'all') params.set('status', status);
    if (sort !== 'date_desc') params.set('sort', sort);
    if (page !== 1) params.set('page', String(page));
    for (const [k, v] of Object.entries(overrides)) { if (v === undefined) params.delete(k); else params.set(k, v); }
    const s = params.toString();
    return `/admin/orders${s ? `?${s}` : ''}`;
  };

  return (
    <main className="wrap" style={{ padding: '32px 24px 64px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/admin">Admin dashboard</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>Orders</span>
      </div>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Orders</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{totalMatching ?? 0} order{(totalMatching ?? 0) === 1 ? '' : 's'} matching current filters.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {STATUSES.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={buildHref({ status: s === 'all' ? undefined : s, page: undefined })}
              style={{
                fontSize: 12.5, fontWeight: 700, padding: '7px 14px', borderRadius: 999, textDecoration: 'none',
                background: active ? 'var(--color-accent)' : 'var(--color-surface)', color: active ? '#fff' : 'var(--text)',
                border: active ? 'none' : '1px solid rgba(43,42,38,.14)',
              }}
            >
              {STATUS_LABEL[s]} ({countByStatus[s] ?? 0})
            </Link>
          );
        })}
      </div>

      <OrdersFilterBar q={q} sort={sort} />

      <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid rgba(43,42,38,.08)', maxHeight: 620, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead><tr><th style={th}>Order</th><th style={th}>Contact</th><th style={th}>Placed</th><th style={th}>Items</th><th style={th}>Total</th><th style={th}>Status</th></tr></thead>
          <tbody>
            {(orders ?? []).map((o: any) => (
              <tr key={o.id}>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11.5 }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{o.id.slice(0, 8)}…</Link>
                </td>
                <td style={td}>{o.contact?.email || o.contact?.name || <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                <td style={td}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td style={td}>{o.items?.length ?? 0}</td>
                <td style={{ ...td, fontWeight: 600 }}>{o.total != null ? `$${Number(o.total).toFixed(2)}` : '—'}</td>
                <td style={td}><OrderStatus orderId={o.id} status={o.status} /></td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={6}>No orders match these filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 18 }}>
          <Link
            href={page > 1 ? buildHref({ page: page - 1 === 1 ? undefined : String(page - 1) }) : buildHref({})}
            aria-disabled={page <= 1}
            style={{ pointerEvents: page <= 1 ? 'none' : 'auto', opacity: page <= 1 ? 0.4 : 1, fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}
          >
            ← Prev
          </Link>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Page {page} of {totalPages}</span>
          <Link
            href={page < totalPages ? buildHref({ page: String(page + 1) }) : buildHref({})}
            aria-disabled={page >= totalPages}
            style={{ pointerEvents: page >= totalPages ? 'none' : 'auto', opacity: page >= totalPages ? 0.4 : 1, fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}
          >
            Next →
          </Link>
        </div>
      )}
    </main>
  );
}

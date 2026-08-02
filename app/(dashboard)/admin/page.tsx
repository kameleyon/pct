import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const ORDER_STATUSES = ['quote_requested', 'pending', 'paid', 'shipped', 'cancelled'] as const;
const card: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)', textDecoration: 'none', color: 'inherit', display: 'block' };

export default async function AdminOverviewPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const [{ count: memberCount }, orderCounts, { count: pendingApplicants }, { count: recipientCount }] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    Promise.all(ORDER_STATUSES.map(async (s) => {
      const { count } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', s);
      return count ?? 0;
    })),
    sb.from('affiliate_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('order_notification_recipients').select('id', { count: 'exact', head: true }),
  ]);
  const totalOrders = orderCounts.reduce((s, c) => s + c, 0);

  return (
    <main className="wrap" style={{ padding: '24px 24px 64px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Admin dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Manage member roles, orders, and the affiliate program.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        <Link href="/admin/members" style={card}>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-accent)' }}>{memberCount ?? 0}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Members</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>Manage roles →</div>
        </Link>
        <Link href="/admin/orders" style={card}>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-accent)' }}>{totalOrders}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Orders</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>Search &amp; manage →</div>
        </Link>
        <Link href="/admin/affiliates" style={card}>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-accent)' }}>{pendingApplicants ?? 0}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Pending affiliate applications</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>Review &amp; approve →</div>
        </Link>
        <Link href="/admin/notifications" style={card}>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-accent)' }}>{recipientCount ?? 0}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Order notification recipients</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>Manage list →</div>
        </Link>
      </div>
    </main>
  );
}

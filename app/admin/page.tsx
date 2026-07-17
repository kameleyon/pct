import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { RoleSelect, OrderStatus } from '@/components/admin/RoleSelect';

export const dynamic = 'force-dynamic';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)', verticalAlign: 'middle' };

export default async function AdminPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const [{ data: users }, { data: orders }] = await Promise.all([
    sb.from('profiles').select('id,full_name,role,created_at').order('created_at', { ascending: false }).limit(200),
    sb.from('orders').select('id,status,total,contact,created_at, items:order_items(id)').order('created_at', { ascending: false }).limit(100),
  ]);

  return (
    <main className="wrap" style={{ padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Admin dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Manage member roles and quote requests.</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Members ({users?.length ?? 0})</h2>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead><tr><th style={th}>Name</th><th style={th}>User ID</th><th style={th}>Role</th></tr></thead>
            <tbody>
              {(users ?? []).map((u: any) => (
                <tr key={u.id}>
                  <td style={td}>{u.full_name || <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11.5, color: 'var(--muted-2)' }}>{u.id.slice(0, 8)}…</td>
                  <td style={td}><RoleSelect userId={u.id} role={u.role} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Quote requests & orders ({orders?.length ?? 0})</h2>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><th style={th}>Order</th><th style={th}>Contact</th><th style={th}>Items</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {(orders ?? []).map((o: any) => (
                <tr key={o.id}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11.5, color: 'var(--muted-2)' }}>{o.id.slice(0, 8)}…</td>
                  <td style={td}>{o.contact?.email || o.contact?.name || <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                  <td style={td}>{o.items?.length ?? 0}</td>
                  <td style={td}><OrderStatus orderId={o.id} status={o.status} /></td>
                </tr>
              ))}
              {(!orders || orders.length === 0) && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={4}>No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

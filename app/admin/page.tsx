import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getAllCategories } from '@/lib/catalog';
import { RoleSelect } from '@/components/admin/RoleSelect';
import { AffiliateApplications, AffiliateRateSettings, AffiliateConfigForm } from '@/components/admin/AffiliateProgramAdmin';
import { OrderNotificationSettings } from '@/components/admin/OrderNotificationSettings';

export const dynamic = 'force-dynamic';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700, position: 'sticky', top: 0, background: 'var(--color-surface)' };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)', verticalAlign: 'middle' };

const ORDER_STATUSES = ['quote_requested', 'pending', 'paid', 'shipped', 'cancelled'] as const;
const ORDER_STATUS_LABEL: Record<string, string> = { quote_requested: 'Quote requested', pending: 'Pending', paid: 'Paid', shipped: 'Shipped', cancelled: 'Cancelled' };

export default async function AdminPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const [{ data: users }, { data: recentOrders }, orderCounts, { data: applicants }, { data: rates }, { data: config }, categories, { data: notificationRecipients }] = await Promise.all([
    sb.from('profiles').select('id,full_name,role,created_at').order('created_at', { ascending: false }).limit(200),
    sb.from('orders').select('id,status,total,contact,created_at').order('created_at', { ascending: false }).limit(5),
    Promise.all(ORDER_STATUSES.map(async (s) => {
      const { count } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', s);
      return [s, count ?? 0] as const;
    })),
    sb.from('affiliate_profiles').select('id,status,referral_code,applied_at,profile_id').order('applied_at', { ascending: false }),
    sb.from('affiliate_commission_rates').select('id,category_id,product_id,percent,fixed_amount, product:products(part_number,name)'),
    sb.from('affiliate_config').select('*').eq('id', 1).single(),
    getAllCategories(),
    sb.from('order_notification_recipients').select('id,email').order('created_at', { ascending: true }),
  ]);
  const orderCountByStatus = Object.fromEntries(orderCounts) as Record<string, number>;
  const totalOrders = ORDER_STATUSES.reduce((s, k) => s + (orderCountByStatus[k] ?? 0), 0);

  // affiliate_profiles.profile_id references auth.users, not public.profiles, so
  // PostgREST can't embed the join above — resolve names with a second query instead.
  const applicantIds = (applicants ?? []).map((a: any) => a.profile_id);
  const { data: applicantProfiles } = applicantIds.length
    ? await sb.from('profiles').select('id,full_name').in('id', applicantIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameByProfileId = new Map((applicantProfiles ?? []).map((p) => [p.id, p.full_name]));

  const defaultRate = (rates ?? []).find((r: any) => r.category_id === null && r.product_id === null);
  const categoryRates = (rates ?? []).filter((r: any) => r.category_id !== null);
  const productRates = (rates ?? []).filter((r: any) => r.product_id !== null).map((r: any) => ({
    id: r.id, product_id: r.product_id, percent: r.percent, fixed_amount: r.fixed_amount,
    part_number: r.product?.part_number ?? '—', name: r.product?.name ?? '—',
  }));

  const navLink: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', textDecoration: 'none', padding: '6px 2px' };

  return (
    <main className="wrap" style={{ padding: '32px 24px 64px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Admin dashboard</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Manage member roles, orders, and the affiliate program.</p>

      <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap', borderBottom: '1px solid rgba(43,42,38,.1)', paddingBottom: 14, marginBottom: 32 }}>
        <a href="#members" style={navLink}>Members</a>
        <a href="#orders" style={navLink}>Orders</a>
        <a href="#affiliate-applications" style={navLink}>Affiliate applications</a>
        <a href="#commission-rates" style={navLink}>Commission rates</a>
        <a href="#program-settings" style={navLink}>Program settings</a>
        <a href="#notifications" style={navLink}>Order notifications</a>
      </nav>

      <section id="members" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Members ({users?.length ?? 0})</h2>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)', maxHeight: 420 }}>
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

      <section id="orders" style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Orders ({totalOrders})</h2>
          <Link href="/admin/orders" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>View all orders, search &amp; filter →</Link>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              style={{ fontSize: 12.5, fontWeight: 700, padding: '7px 14px', borderRadius: 999, textDecoration: 'none', background: 'var(--color-surface)', color: 'var(--text)', border: '1px solid rgba(43,42,38,.14)' }}
            >
              {ORDER_STATUS_LABEL[s]} ({orderCountByStatus[s] ?? 0})
            </Link>
          ))}
        </div>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><th style={th}>Order</th><th style={th}>Contact</th><th style={th}>Placed</th><th style={th}>Total</th></tr></thead>
            <tbody>
              {(recentOrders ?? []).map((o: any) => (
                <tr key={o.id}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11.5 }}>
                    <Link href={`/admin/orders/${o.id}`} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{o.id.slice(0, 8)}…</Link>
                  </td>
                  <td style={td}>{o.contact?.email || o.contact?.name || <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                  <td style={td}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{o.total != null ? `$${Number(o.total).toFixed(2)}` : '—'}</td>
                </tr>
              ))}
              {(!recentOrders || recentOrders.length === 0) && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={4}>No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section id="affiliate-applications" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Affiliate applications ({applicants?.length ?? 0})</h2>
        <AffiliateApplications applicants={(applicants ?? []).map((a: any) => ({ ...a, full_name: nameByProfileId.get(a.profile_id) ?? null }))} />
      </section>

      <section id="commission-rates" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Affiliate commission rates</h2>
        <AffiliateRateSettings
          defaultPercent={Number(defaultRate?.percent ?? 10)}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          categoryRates={categoryRates as any}
          productRates={productRates}
        />
      </section>

      <section id="program-settings" style={{ marginTop: 40, marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Affiliate program settings</h2>
        {config && <AffiliateConfigForm config={config} />}
      </section>

      <section id="notifications" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Order notifications</h2>
        <OrderNotificationSettings recipients={notificationRecipients ?? []} />
      </section>
    </main>
  );
}

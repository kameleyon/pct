import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getAllCategories } from '@/lib/catalog';
import { RoleSelect, OrderStatus } from '@/components/admin/RoleSelect';
import { AffiliateApplications, AffiliateRateSettings, AffiliateConfigForm } from '@/components/admin/AffiliateProgramAdmin';

export const dynamic = 'force-dynamic';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)', verticalAlign: 'middle' };

export default async function AdminPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const [{ data: users }, { data: orders }, { data: applicants }, { data: rates }, { data: config }, categories] = await Promise.all([
    sb.from('profiles').select('id,full_name,role,created_at').order('created_at', { ascending: false }).limit(200),
    sb.from('orders').select('id,status,total,contact,created_at, items:order_items(id)').order('created_at', { ascending: false }).limit(100),
    sb.from('affiliate_profiles').select('id,status,referral_code,applied_at,profile_id').order('applied_at', { ascending: false }),
    sb.from('affiliate_commission_rates').select('id,category_id,product_id,percent,fixed_amount, product:products(part_number,name)'),
    sb.from('affiliate_config').select('*').eq('id', 1).single(),
    getAllCategories(),
  ]);

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

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Affiliate applications ({applicants?.length ?? 0})</h2>
        <AffiliateApplications applicants={(applicants ?? []).map((a: any) => ({ ...a, full_name: nameByProfileId.get(a.profile_id) ?? null }))} />
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Affiliate commission rates</h2>
        <AffiliateRateSettings
          defaultPercent={Number(defaultRate?.percent ?? 10)}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          categoryRates={categoryRates as any}
          productRates={productRates}
        />
      </section>

      <section style={{ marginTop: 40, marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Affiliate program settings</h2>
        {config && <AffiliateConfigForm config={config} />}
      </section>
    </main>
  );
}

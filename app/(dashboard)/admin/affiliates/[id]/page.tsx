import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
import { AffiliateStatusActions } from '@/components/admin/AffiliateStatusActions';

export const dynamic = 'force-dynamic';

const card: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)' };
const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)' };

const STATUS_COLOR: Record<string, string> = { pending: 'var(--muted)', approved: 'var(--color-accent)', rejected: '#b23b2e' };

export default async function AdminAffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const { data: ap } = await sb.from('affiliate_profiles').select('*').eq('id', id).maybeSingle();
  if (!ap) notFound();

  const admin = getSupabaseAdmin();
  const [{ data: profile }, { data: userData }] = await Promise.all([
    sb.from('profiles').select('full_name').eq('id', ap.profile_id).maybeSingle(),
    admin.auth.admin.getUserById(ap.profile_id),
  ]);
  const email = userData?.user?.email ?? null;

  const crumb = (
    <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
      <Link href="/admin">Admin dashboard</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>{profile?.full_name || email || 'Affiliate'}</span>
    </div>
  );

  if (ap.status !== 'approved') {
    return (
      <main className="wrap" style={{ padding: '32px 24px 64px' }}>
        {crumb}
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>{profile?.full_name || 'Unnamed'}</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{email}</p>
        <div style={{ ...card, maxWidth: 480 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: STATUS_COLOR[ap.status] ?? 'var(--muted)', borderRadius: 999, padding: '5px 12px', textTransform: 'capitalize' }}>{ap.status}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted-2)' }}>Applied {new Date(ap.applied_at).toLocaleDateString()}</span>
          </div>
          {ap.status === 'pending' && <AffiliateStatusActions affiliateId={ap.id} />}
        </div>
      </main>
    );
  }

  await admin.rpc('refresh_affiliate_commission_statuses');
  const { data: commissions } = await sb.from('affiliate_commissions').select('*').eq('affiliate_id', ap.id).order('created_at', { ascending: false });
  const rows = commissions ?? [];

  let payoutsEnabled = false;
  if (ap.stripe_connect_account_id) {
    try {
      const account = await getStripe().accounts.retrieve(ap.stripe_connect_account_id);
      payoutsEnabled = !!account.payouts_enabled;
    } catch { /* transient Stripe error — treat as not yet enabled */ }
  }

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const referralLink = `${origin}/?ref=${ap.referral_code}`;

  const availableTotal = rows.filter((c) => c.status === 'available').reduce((s, c) => s + Number(c.affiliate_amount), 0);
  const paidTotal = rows.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.affiliate_amount), 0);

  return (
    <main className="wrap" style={{ padding: '32px 24px 64px' }}>
      {crumb}
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>{profile?.full_name || 'Unnamed'}</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{email}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-accent)' }}>${availableTotal.toFixed(2)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>Available balance</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>${paidTotal.toFixed(2)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>Paid out</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{rows.length}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>Referred sales</div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted-2)', marginBottom: 10 }}>Referral link</div>
        <code style={{ display: 'block', background: '#f4f1ea', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, overflow: 'auto' }}>{referralLink}</code>
      </div>

      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Payout account</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {payoutsEnabled ? 'Connected — Stripe payouts enabled.' : ap.stripe_connect_account_id ? 'Stripe onboarding started but not yet complete.' : 'Not connected — this affiliate has not linked a payout account yet.'}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Referred sales ({rows.length})</h2>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead><tr><th style={th}>Date</th><th style={th}>Sale</th><th style={th}>Affiliate cut</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td style={td}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td style={td}>${Number(c.sale_amount).toFixed(2)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>${Number(c.affiliate_amount).toFixed(2)}</td>
                  <td style={{ ...td, textTransform: 'capitalize' }}>{c.status}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={4}>No referred sales yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

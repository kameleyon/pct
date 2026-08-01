import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
import { getAffiliateConfig } from '@/lib/affiliate';
import { AffiliateApply } from '@/components/account/AffiliateApply';
import { AffiliatePortal } from '@/components/account/AffiliatePortal';

export const dynamic = 'force-dynamic';

export default async function AffiliatePage() {
  const session = await getSession();
  if (session.role === 'guest') redirect('/');

  const sb = await createSupabaseServer();
  const { data: ap } = await sb.from('affiliate_profiles').select('*').eq('profile_id', session.userId as string).maybeSingle();

  const crumb = (
    <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
      <Link href="/account">My Account</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>Affiliate program</span>
    </div>
  );
  const shell = (body: React.ReactNode) => (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      {crumb}
      <h1 style={{ fontSize: 32, margin: '0 0 24px' }}>Affiliate program</h1>
      {body}
    </main>
  );

  if (!ap) return shell(<AffiliateApply />);

  if (ap.status === 'pending') {
    return shell(
      <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 32, border: '1px solid rgba(43,42,38,.08)' }}>
        Your application is under review. We&rsquo;ll let you know once it&rsquo;s approved.
      </div>
    );
  }

  if (ap.status === 'rejected') {
    return shell(
      <div style={{ background: 'var(--color-surface)', padding: 32, borderRadius: 20, border: '1px solid rgba(43,42,38,.08)' }}>
        Your application wasn&rsquo;t approved. Contact us if you have questions.
      </div>
    );
  }

  const admin = getSupabaseAdmin();
  await admin.rpc('refresh_affiliate_commission_statuses');

  const [{ data: commissions }, cfg] = await Promise.all([
    sb.from('affiliate_commissions').select('*').eq('affiliate_id', ap.id).order('created_at', { ascending: false }),
    getAffiliateConfig(),
  ]);

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

  return shell(
    <AffiliatePortal
      referralLink={referralLink}
      payoutsEnabled={payoutsEnabled}
      hasStripeAccount={!!ap.stripe_connect_account_id}
      payoutThreshold={cfg.payoutThreshold}
      maturityDays={cfg.maturityDays}
      expiryDays={cfg.expiryDays}
      commissions={(commissions ?? []) as any}
    />
  );
}

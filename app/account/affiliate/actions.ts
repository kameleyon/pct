'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
import { generateReferralCode, getAffiliateConfig } from '@/lib/affiliate';

export type ActionResult = { ok?: boolean; error?: string };

/** Signed-in user applies to join the affiliate program. One application per profile. */
export async function applyForAffiliateAction(): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { data: existing } = await sb.from('affiliate_profiles').select('id').eq('profile_id', user.id).maybeSingle();
  if (existing) return { error: 'You already have an affiliate application on file.' };

  // referral_code has a unique constraint; retry on the rare collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await sb.from('affiliate_profiles').insert({ profile_id: user.id, referral_code: generateReferralCode() });
    if (!error) { revalidatePath('/account/affiliate'); return { ok: true }; }
    if (!/duplicate key.*referral_code/i.test(error.message)) return { error: error.message };
  }
  return { error: 'Could not create your application. Please try again.' };
}

/** Approved affiliate: start (or resume) Stripe Express onboarding so they can receive payouts.
 *  No bank details are ever stored in our own database — Stripe collects them. */
export async function createAffiliateStripeLinkAction(): Promise<{ url?: string; error?: string }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { data: ap } = await sb.from('affiliate_profiles').select('id,status,stripe_connect_account_id').eq('profile_id', user.id).single();
  if (!ap || ap.status !== 'approved') return { error: 'Your affiliate application must be approved first.' };

  const stripe = getStripe();
  let accountId = ap.stripe_connect_account_id as string | null;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express', email: user.email ?? undefined, capabilities: { transfers: { requested: true } } });
    accountId = account.id;
    await sb.from('affiliate_profiles').update({ stripe_connect_account_id: accountId }).eq('id', ap.id);
  }

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/account/affiliate`,
    return_url: `${origin}/account/affiliate`,
    type: 'account_onboarding',
  });
  return { url: link.url };
}

/** Approved affiliate: request payout of everything currently matured & unclaimed,
 *  provided the total meets the configured threshold. Marks those commissions
 *  'requested' and opens an affiliate_payouts batch. Actually moving the money
 *  (the Stripe transfer) is a follow-up ops step, not fired automatically here. */
export async function requestAffiliatePayoutAction(): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { data: ap } = await sb.from('affiliate_profiles').select('id,status').eq('profile_id', user.id).single();
  if (!ap || ap.status !== 'approved') return { error: 'Your affiliate application must be approved first.' };

  const admin = getSupabaseAdmin();
  await admin.rpc('refresh_affiliate_commission_statuses');

  const { data: available } = await admin.from('affiliate_commissions').select('id,affiliate_amount').eq('affiliate_id', ap.id).eq('status', 'available');
  const rows = available ?? [];
  const total = Math.round(rows.reduce((s, r) => s + Number(r.affiliate_amount), 0) * 100) / 100;

  const cfg = await getAffiliateConfig();
  if (rows.length === 0) return { error: 'You have no matured commissions to request yet.' };
  if (total < cfg.payoutThreshold) {
    return { error: `You need at least $${cfg.payoutThreshold.toFixed(2)} matured before you can request a payout (you have $${total.toFixed(2)}).` };
  }

  const { data: payout, error: payoutErr } = await admin.from('affiliate_payouts').insert({ affiliate_id: ap.id, amount: total }).select('id').single();
  if (payoutErr || !payout) return { error: payoutErr?.message ?? 'Could not create the payout request.' };

  await admin.from('affiliate_commissions').update({ status: 'requested', payout_id: payout.id }).in('id', rows.map((r) => r.id));

  revalidatePath('/account/affiliate');
  return { ok: true };
}

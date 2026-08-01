'use server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { Role } from '@/lib/roles';

const ROLES = new Set<Role>(['member', 'vip', 'admin', 'affiliate', 'distributor']);
const ORDER_STATUSES = new Set(['quote_requested', 'pending', 'paid', 'shipped', 'cancelled']);
const AFFILIATE_STATUSES = new Set(['approved', 'rejected']);

/** Admin-only: change a member's role. Enforced here AND by RLS + the role-guard trigger. */
export async function setUserRoleAction(userId: string, role: Exclude<Role, 'guest'>): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!ROLES.has(role)) return { ok: false, error: 'Invalid role.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('profiles').update({ role }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: advance an order's status. Enforced here AND by RLS (owners are SELECT/INSERT-only). */
export async function setOrderStatusAction(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!ORDER_STATUSES.has(status)) return { ok: false, error: 'Invalid status.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: approve or reject a pending affiliate application. Approving also tags profiles.role. */
export async function setAffiliateStatusAction(affiliateId: string, status: 'approved' | 'rejected'): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!AFFILIATE_STATUSES.has(status)) return { ok: false, error: 'Invalid status.' };

  const sb = await createSupabaseServer();
  const { data: ap, error } = await sb
    .from('affiliate_profiles')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: session.userId })
    .eq('id', affiliateId)
    .select('profile_id')
    .single();
  if (error) return { ok: false, error: error.message };

  if (status === 'approved' && ap?.profile_id) {
    await sb.from('profiles').update({ role: 'affiliate' }).eq('id', ap.profile_id);
  }
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: the site-wide default affiliate rate (the bottom rung of the override ladder). */
export async function setDefaultAffiliateRateAction(percent: number): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!(percent >= 0 && percent <= 100)) return { ok: false, error: 'Percent must be between 0 and 100.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('affiliate_commission_rates').update({ percent }).is('category_id', null).is('product_id', null);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: add/update a category-level affiliate rate override. */
export async function setCategoryAffiliateRateAction(categoryId: string, percent: number): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!(percent >= 0 && percent <= 100)) return { ok: false, error: 'Percent must be between 0 and 100.' };

  const sb = await createSupabaseServer();
  const { data: existing } = await sb.from('affiliate_commission_rates').select('id').eq('category_id', categoryId).is('product_id', null).maybeSingle();
  const { error } = existing
    ? await sb.from('affiliate_commission_rates').update({ percent }).eq('id', existing.id)
    : await sb.from('affiliate_commission_rates').insert({ category_id: categoryId, percent });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

export async function removeCategoryAffiliateRateAction(rateId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  const sb = await createSupabaseServer();
  const { error } = await sb.from('affiliate_commission_rates').delete().eq('id', rateId).not('category_id', 'is', null);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: add/update a product-level affiliate rate override (percent and/or fixed $; fixed wins). */
export async function setProductAffiliateRateAction(partNumber: string, percent: number | null, fixedAmount: number | null): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (percent == null && fixedAmount == null) return { ok: false, error: 'Enter a percent or a fixed amount.' };
  if (percent != null && !(percent >= 0 && percent <= 100)) return { ok: false, error: 'Percent must be between 0 and 100.' };

  const sb = await createSupabaseServer();
  const { data: product } = await sb.from('products').select('id').eq('part_number', partNumber.trim()).maybeSingle();
  if (!product) return { ok: false, error: `No product found with part number "${partNumber}".` };

  const { data: existing } = await sb.from('affiliate_commission_rates').select('id').eq('product_id', product.id).maybeSingle();
  const payload = { product_id: product.id, percent, fixed_amount: fixedAmount };
  const { error } = existing
    ? await sb.from('affiliate_commission_rates').update(payload).eq('id', existing.id)
    : await sb.from('affiliate_commission_rates').insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

export async function removeProductAffiliateRateAction(rateId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  const sb = await createSupabaseServer();
  const { error } = await sb.from('affiliate_commission_rates').delete().eq('id', rateId).not('product_id', 'is', null);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: the MasterCut/website split of the remainder + maturity/expiry/threshold windows. */
export async function updateAffiliateConfigAction(fields: {
  manufacturerPct: number; websitePct: number; maturityDays: number; expiryDays: number; payoutThreshold: number;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (Math.round((fields.manufacturerPct + fields.websitePct) * 100) !== 10000) {
    return { ok: false, error: 'Manufacturer and website percentages must add up to 100.' };
  }

  const sb = await createSupabaseServer();
  const { error } = await sb.from('affiliate_config').update({
    manufacturer_pct: fields.manufacturerPct,
    website_pct: fields.websitePct,
    maturity_days: fields.maturityDays,
    expiry_days: fields.expiryDays,
    payout_threshold: fields.payoutThreshold,
  }).eq('id', 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

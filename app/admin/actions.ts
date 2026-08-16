'use server';

import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { Role } from '@/lib/roles';
import { sendEmail, getOrderNotificationRecipients, quoteReadyEmail, invoiceEmail } from '@/lib/email';
import { maybeCloseOrder } from '@/lib/orders';

const ROLES = new Set<Role>(['member', 'vip', 'admin', 'affiliate', 'distributor']);
const ORDER_STATUSES = new Set(['quote_requested', 'quoted', 'po_issued', 'closed', 'pending', 'paid', 'shipped', 'cancelled']);
const AFFILIATE_STATUSES = new Set(['approved', 'rejected']);
const ESCROW_STATUSES = new Set(['pending', 'funded', 'held', 'released', 'disputed']);
const CREDIT_STATUSES = new Set(['not_applicable', 'pending_vetting', 'approved', 'denied']);
const DELIVERY_STATUSES = new Set(['not_shipped', 'shipped', 'delivered']);

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

/** Admin-only: price an RFQ's line items and send the quote to the buyer.
 *  Buyer never saw a price before this — order_items.unit_price is null until now. */
export async function sendQuoteAction(
  orderId: string,
  items: { id: string; unitPrice: number }[]
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!items.length) return { ok: false, error: 'No items to price.' };
  for (const it of items) {
    if (!(it.unitPrice >= 0)) return { ok: false, error: 'Every line needs a price of 0 or more.' };
  }

  const sb = await createSupabaseServer();
  for (const it of items) {
    const { error } = await sb.from('order_items').update({ unit_price: it.unitPrice }).eq('id', it.id).eq('order_id', orderId);
    if (error) return { ok: false, error: error.message };
  }

  const { data: lines } = await sb.from('order_items').select('name,quantity,unit_price').eq('order_id', orderId);
  const subtotal = (lines ?? []).reduce((s, l) => s + Number(l.unit_price ?? 0) * l.quantity, 0);

  const { data: order, error: orderErr } = await sb
    .from('orders')
    .update({ status: 'quoted', quoted_at: new Date().toISOString(), subtotal, total: subtotal })
    .eq('id', orderId)
    .select('contact')
    .single();
  if (orderErr) return { ok: false, error: orderErr.message };
  await sb.from('order_events').insert({ order_id: orderId, event_type: 'quoted', actor_id: session.userId, detail: { subtotal } });

  const contactEmail = (order?.contact as { email?: string } | null)?.email;
  if (contactEmail) {
    const h = await headers();
    const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
    await sendEmail(
      contactEmail,
      'Your quote is ready',
      quoteReadyEmail({ orderId, total: subtotal, items: (lines ?? []) as any, orderUrl: `${origin}/account/orders/${orderId}` })
    );
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Admin-only: decide (and audit) whether an order requires escrow. */
export async function decideEscrowAction(
  orderId: string,
  required: boolean,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };

  const sb = await createSupabaseServer();
  const now = new Date().toISOString();
  const { error } = await sb
    .from('orders')
    .update({
      escrow_required: required,
      escrow_reason: reason.trim() || null,
      escrow_decided_by: session.userId,
      escrow_decided_at: now,
      payment_method_type: required ? 'escrow' : 'direct',
      escrow_status: required ? 'pending' : 'not_applicable',
    })
    .eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  await sb.from('order_events').insert({ order_id: orderId, event_type: 'escrow_decision', actor_id: session.userId, detail: { required, reason } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Admin-only: advance an escrow arrangement's status (tracked manually — no live provider API yet). */
export async function setEscrowStatusAction(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!ESCROW_STATUSES.has(status)) return { ok: false, error: 'Invalid escrow status.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('orders').update({ escrow_status: status }).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  await sb.from('order_events').insert({ order_id: orderId, event_type: 'escrow_status', actor_id: session.userId, detail: { status } });
  await maybeCloseOrder(sb, orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Admin-only: approve/deny credit terms for a buyer on the no-escrow path. */
export async function decideCreditAction(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!CREDIT_STATUSES.has(status)) return { ok: false, error: 'Invalid credit status.' };

  const sb = await createSupabaseServer();
  const { error } = await sb
    .from('orders')
    .update({ credit_status: status, credit_decided_by: session.userId, credit_decided_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  await sb.from('order_events').insert({ order_id: orderId, event_type: 'credit_decision', actor_id: session.userId, detail: { status } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Admin-only: mark an invoice sent and email the buyer a link to pay it (via Stripe, on their account order page). */
export async function sendInvoiceAction(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };

  const sb = await createSupabaseServer();
  const { data: order, error } = await sb
    .from('orders')
    .update({ invoice_status: 'sent', invoiced_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('contact,total')
    .single();
  if (error) return { ok: false, error: error.message };
  await sb.from('order_events').insert({ order_id: orderId, event_type: 'invoice_sent', actor_id: session.userId });

  const contactEmail = (order?.contact as { email?: string } | null)?.email;
  if (contactEmail) {
    const h = await headers();
    const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
    await sendEmail(
      contactEmail,
      'Your invoice is ready',
      invoiceEmail({ orderId, total: Number(order?.total ?? 0), orderUrl: `${origin}/account/orders/${orderId}` })
    );
  }
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Admin-only: advance shipment/delivery status. */
export async function setDeliveryStatusAction(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!DELIVERY_STATUSES.has(status)) return { ok: false, error: 'Invalid delivery status.' };

  const sb = await createSupabaseServer();
  const patch: Record<string, unknown> = { delivery_status: status };
  if (status === 'delivered') patch.delivered_at = new Date().toISOString();
  const { error } = await sb.from('orders').update(patch).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  await sb.from('order_events').insert({ order_id: orderId, event_type: 'delivery_status', actor_id: session.userId, detail: { status } });
  await maybeCloseOrder(sb, orderId);
  revalidatePath(`/admin/orders/${orderId}`);
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

/** Admin-only: add an order-notification recipient email. */
export async function addOrderNotificationEmailAction(email: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { ok: false, error: 'Enter a valid email address.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('order_notification_recipients').insert({ email: trimmed });
  if (error) return { ok: false, error: error.message.includes('duplicate') ? 'That email is already on the list.' : error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: remove an order-notification recipient email. */
export async function removeOrderNotificationEmailAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('order_notification_recipients').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

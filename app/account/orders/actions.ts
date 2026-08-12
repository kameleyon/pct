'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
import { sendEmail, getOrderNotificationRecipients, poIssuedEmail } from '@/lib/email';

/** Owner-only: accept a quote and issue a PO. Orders RLS blocks owners from
 *  updating their own row directly (see auth_hardening migration), so this
 *  verifies ownership in app code, then writes via the service-role client —
 *  same pattern as affiliate payout requests. */
export async function acceptQuoteAction(orderId: string, poNumber: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role === 'guest') return { ok: false, error: 'Please sign in to accept this quote.' };

  const sb = await createSupabaseServer();
  const { data: order } = await sb.from('orders').select('id,profile_id,status,total,contact').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, error: 'Quote not found.' };
  if (order.profile_id !== session.userId) return { ok: false, error: 'Forbidden.' };
  if (order.status !== 'quoted') return { ok: false, error: 'This quote isn’t ready to accept.' };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('orders')
    .update({ status: 'po_issued', po_number: poNumber.trim() || null, po_issued_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  await admin.from('order_events').insert({ order_id: orderId, event_type: 'po_issued', actor_id: session.userId, detail: { po_number: poNumber.trim() || null } });

  const recipients = await getOrderNotificationRecipients();
  if (recipients.length) {
    const contactEmail = (order.contact as { email?: string } | null)?.email ?? session.email;
    await sendEmail(
      recipients,
      `PO issued — ${orderId.slice(0, 8)}`,
      poIssuedEmail({ orderId, poNumber: poNumber.trim() || null, contactEmail: contactEmail ?? null, total: Number(order.total ?? 0) })
    );
  }

  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}

/** Owner-only: pay an already-invoiced PO via Stripe. Line items come from
 *  order_items, priced by admin at the Quote step — never trusted from the
 *  client. Reuses the existing Stripe webhook (checkout.session.completed). */
export async function createInvoicePaymentSession(orderId: string): Promise<{ url?: string; error?: string }> {
  try {
    const session = await getSession();
    if (session.role === 'guest') return { error: 'Please sign in to pay this invoice.' };

    const sb = await createSupabaseServer();
    const { data: order } = await sb
      .from('orders')
      .select('id,profile_id,payment_method_type,invoice_status,payment_status,contact')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) return { error: 'Order not found.' };
    if (order.profile_id !== session.userId) return { error: 'Forbidden.' };
    if (order.payment_method_type !== 'direct') return { error: 'This order is on the escrow path — payment isn’t collected through Stripe here.' };
    if (order.invoice_status !== 'sent') return { error: 'No invoice has been sent yet.' };
    if (order.payment_status === 'paid') return { error: 'This invoice is already paid.' };

    const { data: items } = await sb.from('order_items').select('name,part_number,unit_price,quantity').eq('order_id', orderId);
    const priced = (items ?? []).filter((i) => i.unit_price != null && i.unit_price > 0);
    if (!priced.length) return { error: 'This order has no priced items.' };

    const contactEmail = (order.contact as { email?: string } | null)?.email ?? session.email ?? undefined;
    const h = await headers();
    const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: contactEmail,
      line_items: priced.map((i) => ({
        quantity: i.quantity,
        price_data: { currency: 'usd', unit_amount: Math.round(Number(i.unit_price) * 100), product_data: { name: i.name, metadata: { part_number: i.part_number } } },
      })),
      success_url: `${origin}/account/orders/${orderId}?paid=1`,
      cancel_url: `${origin}/account/orders/${orderId}`,
      metadata: { orderId },
    });
    return { url: checkoutSession.url ?? undefined };
  } catch (e) {
    console.error('invoice payment error:', e);
    return { error: 'Could not start payment. Please try again.' };
  }
}

'use server';

import { headers, cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
import { estimateDelivery } from '@/lib/shipping';

export type CheckoutContact = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/**
 * Build a Stripe Checkout Session from cart lines. The client sends only
 * product ids + quantities; prices are looked up authoritatively from the DB
 * (never trusted from the browser). Items without a price are dropped.
 *
 * Contact/shipping details are collected on our own /checkout page (not
 * Stripe's hosted page) and stored on the order immediately — Stripe only
 * handles payment + the card's billing address (for AVS), not shipping.
 */
export async function createCheckoutSession(
  lines: { productId: string; qty: number }[],
  contact: CheckoutContact
): Promise<{ url?: string; error?: string }> {
  try {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser(); // may be null — guest checkout allowed
  if (!lines?.length) return { error: 'Your cart is empty.' };

  const required: (keyof CheckoutContact)[] = ['fullName', 'email', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
  for (const key of required) {
    if (!contact[key]?.trim()) return { error: 'Please fill in all required shipping and contact fields.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) return { error: 'Enter a valid email address.' };

  const admin = getSupabaseAdmin();
  const ids = lines.map((l) => l.productId);
  const { data: products } = await admin.from('products').select('id,part_number,name,price,sale_price').in('id', ids);
  const byId = new Map((products ?? []).map((p: any) => [p.id, p]));

  const items = lines
    .map((l) => {
      const p = byId.get(l.productId);
      const unit = p ? (p.sale_price ?? p.price) : null;
      return unit ? { p, unit: Number(unit), qty: Math.max(1, Math.floor(l.qty)) } : null;
    })
    .filter((x): x is { p: any; unit: number; qty: number } => x !== null);

  if (!items.length) return { error: 'None of your cart items have online pricing yet — use Request a Quote instead.' };

  // Affiliate attribution: last click sets a 30-day cookie (see middleware.ts).
  // Only trust it if it resolves to an approved affiliate who isn't buying via their own link.
  let affiliateId: string | null = null;
  let referralCode: string | null = null;
  const refCode = (await cookies()).get('pct_ref')?.value;
  if (refCode) {
    const { data: aff } = await admin.from('affiliate_profiles').select('id,profile_id').eq('referral_code', refCode).eq('status', 'approved').maybeSingle();
    if (aff && aff.profile_id !== user?.id) {
      affiliateId = aff.id;
      referralCode = refCode;
    }
  }

  const shippingAddress = {
    name: contact.fullName.trim(),
    line1: contact.addressLine1.trim(),
    line2: contact.addressLine2.trim() || null,
    city: contact.city.trim(),
    state: contact.state.trim().toUpperCase(),
    postal_code: contact.postalCode.trim(),
    country: contact.country.trim() || 'US',
  };
  const estimate = estimateDelivery(shippingAddress.state, new Date());

  const total = items.reduce((s, i) => s + i.unit * i.qty, 0);
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      profile_id: user?.id ?? null,
      status: 'pending',
      subtotal: total, tax: 0, shipping: 0, total,
      contact: { name: contact.fullName.trim(), email: contact.email.trim(), phone: contact.phone.trim() },
      shipping_address: shippingAddress,
      estimated_delivery_earliest: estimate.earliest.toISOString().slice(0, 10),
      estimated_delivery_latest: estimate.latest.toISOString().slice(0, 10),
      referral_code: referralCode,
      affiliate_id: affiliateId,
    })
    .select('id')
    .single();
  if (orderErr || !order) return { error: orderErr?.message ?? 'Could not create order.' };

  await admin.from('order_items').insert(
    items.map((i) => ({ order_id: order.id, product_id: i.p.id, part_number: i.p.part_number, name: i.p.name, unit_price: i.unit, quantity: i.qty }))
  );

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: contact.email.trim(), // pre-filled — Stripe's hosted page still shows this field, but it's not our source of truth
    line_items: items.map((i) => ({
      quantity: i.qty,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(i.unit * 100),
        product_data: { name: i.p.name, metadata: { part_number: i.p.part_number } },
      },
    })),
    success_url: `${origin}/checkout/success?order=${order.id}`,
    cancel_url: `${origin}/checkout`,
    metadata: { orderId: order.id },
  });

  return { url: session.url ?? undefined };
  } catch (e) {
    console.error('checkout error:', e);
    const msg = (e as Error)?.message ?? '';
    if (/STRIPE_SECRET_KEY|service-role/i.test(msg)) return { error: 'Online checkout isn’t configured yet. Please try Request a Quote.' };
    return { error: 'Checkout could not start. Please try again.' };
  }
}

'use server';

import { headers, cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';

/**
 * Build a Stripe Checkout Session from cart lines. The client sends only
 * product ids + quantities; prices are looked up authoritatively from the DB
 * (never trusted from the browser). Items without a price are dropped.
 */
export async function createCheckoutSession(
  lines: { productId: string; qty: number }[]
): Promise<{ url?: string; error?: string }> {
  try {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser(); // may be null — guest checkout allowed
  if (!lines?.length) return { error: 'Your cart is empty.' };

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

  const total = items.reduce((s, i) => s + i.unit * i.qty, 0);
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({ profile_id: user?.id ?? null, status: 'pending', subtotal: total, tax: 0, shipping: 0, total, contact: user?.email ? { email: user.email } : {}, referral_code: referralCode, affiliate_id: affiliateId })
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
    customer_email: user?.email ?? undefined, // guests: Stripe collects the email on its page
    shipping_address_collection: { allowed_countries: ['US'] },
    phone_number_collection: { enabled: true },
    line_items: items.map((i) => ({
      quantity: i.qty,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(i.unit * 100),
        product_data: { name: i.p.name, metadata: { part_number: i.p.part_number } },
      },
    })),
    success_url: `${origin}/checkout/success?order=${order.id}`,
    cancel_url: `${origin}/`,
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

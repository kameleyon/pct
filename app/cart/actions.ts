'use server';

import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** A cart line as the UI knows it (product snapshot + quantity). */
export type CartLine = {
  productId: string;
  partNumber: string;
  name: string;
  image: string;
  qty: number;
  price?: number | null; // effective online price (sale_price ?? price); null = quote-only
};

/** Resolve (or lazily create) the signed-in user's cart id. Returns null for guests. */
async function getCartId(sb: Awaited<ReturnType<typeof createSupabaseServer>>): Promise<string | null> {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: existing } = await sb.from('carts').select('id').eq('profile_id', user.id).maybeSingle();
  if (existing) return existing.id as string;
  const { data: created } = await sb.from('carts').insert({ profile_id: user.id }).select('id').single();
  return (created?.id as string) ?? null;
}

/** Server truth for the cart: the product rows joined to their quantities. Empty for guests. */
export async function getCartAction(): Promise<CartLine[]> {
  const sb = await createSupabaseServer();
  const cartId = await getCartId(sb);
  if (!cartId) return [];
  const { data } = await sb
    .from('cart_items')
    .select('quantity, product:products(id,part_number,name,primary_image_url,price,sale_price)')
    .eq('cart_id', cartId);
  return (data ?? []).map((row: any) => ({
    productId: row.product.id,
    partNumber: row.product.part_number,
    name: row.product.name,
    image: row.product.primary_image_url ?? '',
    qty: row.quantity,
    price: row.product.sale_price ?? row.product.price ?? null,
  }));
}

/** Upsert a line quantity (absolute, not additive). qty<=0 removes it. */
export async function setCartItemAction(productId: string, qty: number): Promise<{ ok: boolean }> {
  const sb = await createSupabaseServer();
  const cartId = await getCartId(sb);
  if (!cartId) return { ok: false };
  if (qty <= 0) {
    await sb.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
  } else {
    await sb.from('cart_items').upsert(
      { cart_id: cartId, product_id: productId, quantity: qty },
      { onConflict: 'cart_id,product_id' }
    );
  }
  return { ok: true };
}

/** Merge a guest's localStorage cart into the DB on sign-in (adds quantities). */
export async function mergeCartAction(lines: { productId: string; qty: number }[]): Promise<{ ok: boolean }> {
  const sb = await createSupabaseServer();
  const cartId = await getCartId(sb);
  if (!cartId) return { ok: false };
  if (!lines.length) return { ok: true };
  const { data: current } = await sb.from('cart_items').select('product_id,quantity').eq('cart_id', cartId);
  const have = new Map<string, number>((current ?? []).map((r: any) => [r.product_id, r.quantity]));
  const rows = lines.map((l) => ({
    cart_id: cartId,
    product_id: l.productId,
    quantity: (have.get(l.productId) ?? 0) + l.qty,
  }));
  await sb.from('cart_items').upsert(rows, { onConflict: 'cart_id,product_id' });
  return { ok: true };
}

export async function clearCartAction(): Promise<{ ok: boolean }> {
  const sb = await createSupabaseServer();
  const cartId = await getCartId(sb);
  if (!cartId) return { ok: false };
  await sb.from('cart_items').delete().eq('cart_id', cartId);
  return { ok: true };
}

export type QuoteContact = { name: string; email: string; phone: string; company?: string; note?: string };

/**
 * Turn a set of cart lines into a quote_requested order (an RFQ). Guests and
 * members can both request quotes — the client sends only product ids + qty;
 * names/part numbers are looked up authoritatively from the DB. No price is
 * captured here — admin sets real pricing at the Quote step, and the buyer
 * never sees a price until then.
 */
export async function requestQuoteAction(
  lines: { productId: string; qty: number }[],
  contact: QuoteContact
): Promise<{ ok: boolean; error?: string; orderId?: string }> {
  try {
    if (!lines?.length) return { ok: false, error: 'Your cart is empty.' };
    if (!contact.name?.trim() || !contact.email?.trim() || !contact.phone?.trim()) {
      return { ok: false, error: 'Please fill in your name, email, and phone.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) return { ok: false, error: 'Enter a valid email address.' };

    const sb = await createSupabaseServer();
    const { data: { user } } = await sb.auth.getUser(); // guest RFQs allowed

    const admin = getSupabaseAdmin();
    const ids = lines.map((l) => l.productId);
    const { data: products } = await admin.from('products').select('id,part_number,name').in('id', ids);
    const byId = new Map((products ?? []).map((p: any) => [p.id, p]));
    const items = lines
      .map((l) => {
        const p = byId.get(l.productId);
        return p ? { p, qty: Math.max(1, Math.floor(l.qty)) } : null;
      })
      .filter((x): x is { p: any; qty: number } => x !== null);
    if (!items.length) return { ok: false, error: 'Could not find those items.' };

    // Affiliate attribution: same last-click cookie used by checkout, so
    // quote-originated sales still credit the referring affiliate.
    let affiliateId: string | null = null;
    let referralCode: string | null = null;
    const refCode = (await cookies()).get('pct_ref')?.value;
    if (refCode) {
      const { data: aff } = await admin.from('affiliate_profiles').select('id,profile_id').eq('referral_code', refCode).eq('status', 'approved').maybeSingle();
      if (aff && aff.profile_id !== user?.id) { affiliateId = aff.id; referralCode = refCode; }
    }

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        profile_id: user?.id ?? null,
        status: 'quote_requested',
        subtotal: 0, tax: 0, shipping: 0, total: 0,
        contact: {
          name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim(),
          company: contact.company?.trim() || null, note: contact.note?.trim() || null,
        },
        referral_code: referralCode,
        affiliate_id: affiliateId,
      })
      .select('id')
      .single();
    if (orderErr || !order) return { ok: false, error: orderErr?.message ?? 'Could not submit your quote request.' };

    const orderItems = items.map((i) => ({
      order_id: order.id, product_id: i.p.id, part_number: i.p.part_number, name: i.p.name, unit_price: null, quantity: i.qty,
    }));
    const { error: itemErr } = await admin.from('order_items').insert(orderItems);
    if (itemErr) return { ok: false, error: itemErr.message };

    await admin.from('order_events').insert({ order_id: order.id, event_type: 'rfq_submitted', actor_id: user?.id ?? null });

    if (user) await clearCartAction();
    return { ok: true, orderId: order.id as string };
  } catch (e) {
    console.error('quote request error:', e);
    return { ok: false, error: 'Could not submit your quote request. Please try again.' };
  }
}

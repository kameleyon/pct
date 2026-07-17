'use server';

import { createSupabaseServer } from '@/lib/supabase-server';

/** A cart line as the UI knows it (product snapshot + quantity). */
export type CartLine = {
  productId: string;
  partNumber: string;
  name: string;
  image: string;
  qty: number;
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
    .select('quantity, product:products(id,part_number,name,primary_image_url)')
    .eq('cart_id', cartId);
  return (data ?? []).map((row: any) => ({
    productId: row.product.id,
    partNumber: row.product.part_number,
    name: row.product.name,
    image: row.product.primary_image_url ?? '',
    qty: row.quantity,
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

/** Turn the current cart into a quote_requested order and empty the cart. Members only. */
export async function requestQuoteAction(
  contact: { name?: string; email?: string; phone?: string; note?: string }
): Promise<{ ok: boolean; error?: string; orderId?: string }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in to request a quote.' };

  const lines = await getCartAction();
  if (!lines.length) return { ok: false, error: 'Your cart is empty.' };

  const { data: order, error: orderErr } = await sb
    .from('orders')
    .insert({
      profile_id: user.id,
      status: 'quote_requested',
      subtotal: 0, tax: 0, shipping: 0, total: 0,
      contact: { ...contact, email: contact.email ?? user.email },
    })
    .select('id')
    .single();
  if (orderErr) return { ok: false, error: orderErr.message };

  const items = lines.map((l) => ({
    order_id: order.id,
    product_id: l.productId,
    part_number: l.partNumber,
    name: l.name,
    unit_price: 0,
    quantity: l.qty,
  }));
  const { error: itemErr } = await sb.from('order_items').insert(items);
  if (itemErr) return { ok: false, error: itemErr.message };

  await clearCartAction();
  return { ok: true, orderId: order.id as string };
}

import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAffiliateConfig, resolveAffiliateAmount, splitRemainder, type RateRow } from '@/lib/affiliate';
import { sendEmail, getOrderNotificationRecipients, orderPlacedEmail, affiliateSaleEmail } from '@/lib/email';
import { formatAddress, formatDeliveryWindowFromDates, type ShippingAddress } from '@/lib/shipping';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe → us. Signature-verified, so it's trusted to mark orders paid via the
// service-role client (owners can't change order status under RLS).
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response('Missing signature', { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${(e as Error).message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { orderId?: string } };
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const admin = getSupabaseAdmin();
      // Contact/shipping/delivery-estimate were already captured on our own
      // /checkout page and stored at order-creation time — Stripe only
      // handled payment, so there's nothing to pull from the session here.
      await admin.from('orders').update({ status: 'paid' }).eq('id', orderId);
      const { data: order } = await admin
        .from('orders')
        .select('profile_id, subtotal, total, affiliate_id, contact, shipping_address, estimated_delivery_earliest, estimated_delivery_latest')
        .eq('id', orderId)
        .single();
      // empty the buyer's cart now that the order is paid (members; guests clear locally on success)
      if (order?.profile_id) {
        const { data: cart } = await admin.from('carts').select('id').eq('profile_id', order.profile_id).maybeSingle();
        if (cart) await admin.from('cart_items').delete().eq('cart_id', cart.id);
      }

      const recipients = await getOrderNotificationRecipients();
      if (recipients.length) {
        const { count } = await admin.from('order_items').select('id', { count: 'exact', head: true }).eq('order_id', orderId);
        await sendEmail(
          recipients,
          `New order placed — ${orderId.slice(0, 8)}`,
          orderPlacedEmail({
            orderId,
            total: Number(order?.total ?? 0),
            email: (order?.contact as { email?: string } | null)?.email ?? null,
            itemCount: count ?? 0,
            shippingAddress: formatAddress(order?.shipping_address as ShippingAddress | null),
            deliveryWindow: order?.estimated_delivery_earliest && order?.estimated_delivery_latest
              ? formatDeliveryWindowFromDates(order.estimated_delivery_earliest, order.estimated_delivery_latest)
              : null,
          })
        );
      }

      if (order?.affiliate_id) {
        await recordAffiliateCommission(admin, orderId, order.affiliate_id, Number(order.subtotal ?? order.total ?? 0));
      }
    }
  }

  return new Response('ok', { status: 200 });
}

/** Split a referred order's sale amount per line item (product $ > product % >
 *  category % > default %), then split the remainder between MasterCut and the
 *  website by the configured flat split. Idempotent against webhook retries via
 *  the existing-check + affiliate_commissions.order_id unique constraint. */
async function recordAffiliateCommission(
  admin: ReturnType<typeof getSupabaseAdmin>,
  orderId: string,
  affiliateId: string,
  saleAmount: number
) {
  const { data: existing } = await admin.from('affiliate_commissions').select('id').eq('order_id', orderId).maybeSingle();
  if (existing) return;

  const [{ data: items }, { data: rates }, cfg] = await Promise.all([
    admin.from('order_items').select('product_id, unit_price, quantity').eq('order_id', orderId),
    admin.from('affiliate_commission_rates').select('category_id,product_id,percent,fixed_amount'),
    getAffiliateConfig(),
  ]);

  const productIds = (items ?? []).map((i) => i.product_id).filter((id): id is string => !!id);
  const { data: products } = productIds.length
    ? await admin.from('products').select('id,category_id').in('id', productIds)
    : { data: [] as { id: string; category_id: string }[] };
  const categoryByProduct = new Map((products ?? []).map((p) => [p.id, p.category_id]));

  let affiliateAmount = 0;
  for (const item of items ?? []) {
    const lineTotal = Number(item.unit_price ?? 0) * item.quantity;
    const categoryId = item.product_id ? categoryByProduct.get(item.product_id) ?? null : null;
    affiliateAmount += resolveAffiliateAmount(lineTotal, item.product_id, categoryId, (rates ?? []) as RateRow[]);
  }
  affiliateAmount = Math.round(affiliateAmount * 100) / 100;

  const remainder = Math.round((saleAmount - affiliateAmount) * 100) / 100;
  const { manufacturerAmount, websiteAmount } = splitRemainder(remainder, cfg);

  const maturesAt = new Date(Date.now() + cfg.maturityDays * 86400000);
  const expiresAt = new Date(maturesAt.getTime() + cfg.expiryDays * 86400000);

  const { data: commission, error } = await admin
    .from('affiliate_commissions')
    .insert({
      affiliate_id: affiliateId,
      order_id: orderId,
      sale_amount: saleAmount,
      affiliate_amount: affiliateAmount,
      matures_at: maturesAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();
  if (error || !commission) return; // unique-constraint race on retry — safe to drop

  await admin.from('affiliate_commission_costs').insert({
    commission_id: commission.id,
    manufacturer_amount: manufacturerAmount,
    website_amount: websiteAmount,
  });

  const { data: ap } = await admin.from('affiliate_profiles').select('profile_id').eq('id', affiliateId).maybeSingle();
  if (ap?.profile_id) {
    const { data: userData } = await admin.auth.admin.getUserById(ap.profile_id);
    if (userData?.user?.email) {
      await sendEmail(
        userData.user.email,
        'You just earned a commission',
        affiliateSaleEmail({ saleAmount, affiliateAmount, maturesAt })
      );
    }
  }
}

import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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
      await admin.from('orders').update({ status: 'paid' }).eq('id', orderId);
      // empty the buyer's cart now that the order is paid
      const { data: order } = await admin.from('orders').select('profile_id').eq('id', orderId).single();
      if (order?.profile_id) {
        const { data: cart } = await admin.from('carts').select('id').eq('profile_id', order.profile_id).maybeSingle();
        if (cart) await admin.from('cart_items').delete().eq('cart_id', cart.id);
      }
    }
  }

  return new Response('ok', { status: 200 });
}

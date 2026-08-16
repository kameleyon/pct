/** Close an order once its terminal condition is met: escrow released, or
 *  paid + delivered for the direct-payment path. Safe to call after any
 *  status-affecting update — no-ops if the order isn't eligible yet.
 *  Accepts either the session-scoped or service-role Supabase client. */
export async function maybeCloseOrder(sb: any, orderId: string): Promise<void> {
  const { data: order } = await sb
    .from('orders')
    .select('status,payment_method_type,escrow_status,payment_status,delivery_status')
    .eq('id', orderId)
    .maybeSingle();
  if (!order || order.status === 'closed' || order.status === 'cancelled') return;

  const eligible =
    order.payment_method_type === 'escrow'
      ? order.escrow_status === 'released'
      : order.payment_method_type === 'direct'
        ? order.payment_status === 'paid' && order.delivery_status === 'delivered'
        : false;
  if (!eligible) return;

  await sb.from('orders').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', orderId);
  await sb.from('order_events').insert({ order_id: orderId, event_type: 'closed' });
}

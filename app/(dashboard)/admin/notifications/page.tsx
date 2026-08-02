import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { OrderNotificationSettings } from '@/components/admin/OrderNotificationSettings';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const { data: notificationRecipients } = await sb.from('order_notification_recipients').select('id,email').order('created_at', { ascending: true });

  return (
    <main className="wrap" style={{ padding: '24px 24px 64px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Order notifications</h1>
      <OrderNotificationSettings recipients={notificationRecipients ?? []} />
    </main>
  );
}

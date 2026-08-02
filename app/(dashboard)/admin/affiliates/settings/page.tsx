import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { AffiliateConfigForm } from '@/components/admin/AffiliateProgramAdmin';
import { AffiliatesSubNav } from '@/components/admin/AffiliatesSubNav';

export const dynamic = 'force-dynamic';

export default async function AdminAffiliateSettingsPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const { data: config } = await sb.from('affiliate_config').select('*').eq('id', 1).single();

  return (
    <main className="wrap" style={{ padding: '24px 24px 64px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Affiliate program</h1>
      <AffiliatesSubNav />
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Program settings</h2>
      {config && <AffiliateConfigForm config={config} />}
    </main>
  );
}

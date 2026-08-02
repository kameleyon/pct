import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { AffiliateApplications } from '@/components/admin/AffiliateProgramAdmin';
import { AffiliatesSubNav } from '@/components/admin/AffiliatesSubNav';

export const dynamic = 'force-dynamic';

export default async function AdminAffiliateApplicationsPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const { data: applicants } = await sb.from('affiliate_profiles').select('id,status,referral_code,applied_at,profile_id').order('applied_at', { ascending: false });

  // affiliate_profiles.profile_id references auth.users, not public.profiles, so
  // PostgREST can't embed the join above — resolve names with a second query instead.
  const applicantIds = (applicants ?? []).map((a: any) => a.profile_id);
  const { data: applicantProfiles } = applicantIds.length
    ? await sb.from('profiles').select('id,full_name').in('id', applicantIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameByProfileId = new Map((applicantProfiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <main className="wrap" style={{ padding: '24px 24px 64px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Affiliate program</h1>
      <AffiliatesSubNav />
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Applications ({applicants?.length ?? 0})</h2>
      <AffiliateApplications applicants={(applicants ?? []).map((a: any) => ({ ...a, full_name: nameByProfileId.get(a.profile_id) ?? null }))} />
    </main>
  );
}

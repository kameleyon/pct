import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { ProfileForm } from '@/components/account/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getSession();
  if (session.role === 'guest') redirect('/');

  const sb = await createSupabaseServer();
  const { data: profile } = await sb.from('profiles').select('*').eq('id', session.userId as string).single();

  const initial = {
    fullName: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    company: profile?.company ?? '',
    jobTitle: profile?.job_title ?? '',
    addressLine1: profile?.address_line1 ?? '',
    addressLine2: profile?.address_line2 ?? '',
    city: profile?.city ?? '',
    stateRegion: profile?.state_region ?? '',
    postalCode: profile?.postal_code ?? '',
    country: profile?.country ?? '',
    marketingOptIn: profile?.marketing_opt_in ?? false,
  };

  return (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <div style={{ fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 600, marginBottom: 16 }}>
        <Link href="/account">My Account</Link>{' '}<span style={{ color: '#c9c4ba' }}>/</span>{' '}<span style={{ color: 'var(--text)' }}>Profile</span>
      </div>
      <h1 style={{ fontSize: 32, margin: '0 0 24px' }}>Profile</h1>
      <ProfileForm initial={initial} />
    </main>
  );
}

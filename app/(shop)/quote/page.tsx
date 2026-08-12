import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { QuoteForm } from '@/components/quote/QuoteForm';
import type { QuoteContact } from '@/app/cart/actions';

export const dynamic = 'force-dynamic';

export default async function QuotePage() {
  const session = await getSession();

  let initial: QuoteContact = { name: '', email: session.email ?? '', phone: '', company: '', note: '' };

  if (session.role !== 'guest') {
    const sb = await createSupabaseServer();
    const { data: profile } = await sb.from('profiles').select('*').eq('id', session.userId as string).single();
    if (profile) {
      initial = {
        name: profile.full_name ?? session.fullName ?? '',
        email: session.email ?? '',
        phone: profile.phone ?? '',
        company: '',
        note: '',
      };
    }
  }

  return (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>Request a Quote</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 24px' }}>Tell us who you are and we’ll price this list and follow up by email.</p>
      <QuoteForm initial={initial} />
    </main>
  );
}

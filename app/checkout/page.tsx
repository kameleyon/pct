import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import type { CheckoutContact } from '@/app/checkout/actions';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await getSession();

  let initial: CheckoutContact = {
    fullName: '', email: session.email ?? '', phone: '',
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'US',
  };

  if (session.role !== 'guest') {
    const sb = await createSupabaseServer();
    const { data: profile } = await sb.from('profiles').select('*').eq('id', session.userId as string).single();
    if (profile) {
      initial = {
        fullName: profile.full_name ?? session.fullName ?? '',
        email: session.email ?? '',
        phone: profile.phone ?? '',
        addressLine1: profile.address_line1 ?? '',
        addressLine2: profile.address_line2 ?? '',
        city: profile.city ?? '',
        state: profile.state_region ?? '',
        postalCode: profile.postal_code ?? '',
        country: 'US',
      };
    }
  }

  return (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <h1 style={{ fontSize: 28, margin: '0 0 24px' }}>Checkout</h1>
      <CheckoutForm initial={initial} />
    </main>
  );
}

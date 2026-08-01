import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, roleLabel } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const card: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)' };
const statNum: React.CSSProperties = { fontSize: 30, fontWeight: 600, color: 'var(--color-accent)', lineHeight: 1 };
const statLabel: React.CSSProperties = { fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 };

export default async function AccountPage() {
  const session = await getSession();
  if (session.role === 'guest') redirect('/');

  const sb = await createSupabaseServer();
  const [{ data: profile }, { count: orderCount }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', session.userId as string).single(),
    sb.from('orders').select('*', { count: 'exact', head: true }).eq('profile_id', session.userId as string),
  ]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <main className="wrap" style={{ paddingTop: 28, paddingBottom: 72 }}>
      <h1 style={{ fontSize: 32, margin: '0 0 4px' }}>My Account</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>Welcome back{session.fullName ? `, ${session.fullName.split(' ')[0]}` : ''}.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        <div style={card}>
          <div style={statNum}>{orderCount ?? 0}</div>
          <div style={statLabel}>Orders placed</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>{roleLabel(session.role)}</div>
          <div style={statLabel}>Account type</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)' }}>{memberSince ?? '—'}</div>
          <div style={statLabel}>Member since</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <AccountLinkCard href="/account/profile" title="Profile" desc="Contact info, company, shipping address, and email preferences." />
        <AccountLinkCard href="/account/orders" title="Order history" desc="Track quote requests, past orders, and order status." />
        <AccountLinkCard href="/account/favorites" title="Saved tools" desc="Products you've favorited while browsing the catalog." />
        <AccountLinkCard href="/account/affiliate" title={session.role === 'affiliate' ? 'Affiliate portal' : 'Affiliate program'} desc="Get a referral link, track referred sales, and request payouts." />
      </div>
    </main>
  );
}

function AccountLinkCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} style={{ ...card, display: 'block', color: 'inherit', textDecoration: 'none' }} className="h-cat">
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</div>
    </Link>
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sha256Hex, SITE_GATE_COOKIE } from '@/lib/site-gate';
import { GateForm } from '@/components/GateForm';

export const dynamic = 'force-dynamic';

export default async function GatePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const dest = next && next.startsWith('/') ? next : '/';

  const password = process.env.SITE_GATE_PASSWORD;
  if (password) {
    const cookieValue = (await cookies()).get(SITE_GATE_COOKIE)?.value;
    if (cookieValue === (await sha256Hex(password))) redirect(dest);
  } else {
    redirect(dest); // gate disabled
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#f4f1ea' }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 18px 40px rgba(12,44,25,.1)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/pct-logo.png" alt="Precision CNC Tools" style={{ height: 48, width: 48, objectFit: 'contain', display: 'block', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 20, textAlign: 'center', margin: '0 0 6px', color: 'var(--color-accent)' }}>This site is under construction</h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', margin: '0 0 24px' }}>Provide the password to access the sandbox.</p>
        <GateForm dest={dest} />
      </div>
    </main>
  );
}

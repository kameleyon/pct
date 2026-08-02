import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { HeaderAccount } from './auth/HeaderAccount';

// Lightweight header for internal dashboards (admin, affiliate portal, and
// future role dashboards like distributor/sales) — no category nav, search,
// favorites, or cart. Those are storefront concerns this shell never needs.
export async function DashboardHeader() {
  const session = await getSession();
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid rgba(43,42,38,.08)' }}>
      <div className="wrap" style={{ height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 13, flex: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pct-logo.png" alt="Precision CNC Tools" style={{ height: 44, width: 44, objectFit: 'contain', display: 'block', flex: 'none' }} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: '.01em', color: 'var(--color-accent)' }}>Precision CNC Tools</span>
            <span style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--color-gold-700)', marginTop: 5, fontWeight: 600 }}>Dashboard</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
          <Link href="/" style={{ color: 'inherit' }}>Back to store</Link>
          <HeaderAccount session={session} />
        </div>
      </div>
    </div>
  );
}

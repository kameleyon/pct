'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS: [string, string][] = [
  ['Applications', '/admin/affiliates'],
  ['Commission rates', '/admin/affiliates/rates'],
  ['Program settings', '/admin/affiliates/settings'],
];

export function AffiliatesSubNav() {
  const pathname = usePathname();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {TABS.map(([label, href]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: 12.5, fontWeight: 700, padding: '7px 14px', borderRadius: 999, textDecoration: 'none',
              background: active ? 'var(--color-accent)' : 'var(--color-surface)', color: active ? '#fff' : 'var(--text)',
              border: active ? 'none' : '1px solid rgba(43,42,38,.14)',
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

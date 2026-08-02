'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS: [string, string][] = [
  ['Overview', '/admin'],
  ['Members', '/admin/members'],
  ['Orders', '/admin/orders'],
  ['Affiliates', '/admin/affiliates'],
  ['Notifications', '/admin/notifications'],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid rgba(43,42,38,.1)' }}>
      {TABS.map(([label, href]) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: 13, fontWeight: 600, padding: '12px 16px', textDecoration: 'none',
              color: active ? 'var(--color-accent)' : 'var(--muted)',
              borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

'use client';
import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthModal } from './AuthProvider';
import { signOutAction } from '@/app/auth/actions';
import type { Session } from '@/lib/roles';
import { roleLabel } from '@/lib/roles';

export function HeaderAccount({ session }: { session: Session }) {
  const auth = useAuthModal();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpenMenu(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const signOut = () => start(async () => { await signOutAction(); setOpenMenu(false); router.refresh(); });

  const gold: React.CSSProperties = { color: 'var(--color-gold-700)', cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center', fontWeight: 600 };

  if (session.role === 'guest') {
    return (
      <>
        <span style={gold} onClick={() => auth.open('signup')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 15 9l7 .6-5.3 4.6L18.5 21 12 17.3 5.5 21l1.8-6.8L2 9.6 9 9z" /></svg>VIP Program
        </span>
        <span style={{ cursor: 'pointer' }} onClick={() => auth.open('signin')}>Sign In / Register</span>
      </>
    );
  }

  const badgeColor = session.role === 'admin' ? 'var(--color-gold-700)' : session.role === 'vip' ? 'var(--color-gold-700)' : 'var(--color-accent)';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <span onClick={() => setOpenMenu((v) => !v)} style={{ cursor: 'pointer', display: 'inline-flex', gap: 7, alignItems: 'center', fontWeight: 600 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        {session.fullName?.split(' ')[0] || 'Account'}
        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: badgeColor, borderRadius: 999, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '.03em' }}>{roleLabel(session.role)}</span>
      </span>

      {openMenu && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 220, background: 'var(--color-surface)', borderRadius: 14, boxShadow: '0 18px 40px rgba(12,44,25,.18)', padding: 8, zIndex: 60 }}>
          <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(43,42,38,.08)' }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{session.fullName || 'Member'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted-2)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.email}</div>
          </div>
          {session.role === 'admin' && <MenuLink href="/admin" label="Admin dashboard" onClick={() => setOpenMenu(false)} />}
          <MenuButton label="Change password" onClick={() => { setOpenMenu(false); auth.open('changepw'); }} />
          <MenuButton label="Log out" danger onClick={signOut} />
        </div>
      )}
    </div>
  );
}

const itemStyle: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, cursor: 'pointer', padding: '9px 10px', borderRadius: 9, fontSize: 13, fontWeight: 600, color: 'var(--color-text)' };

function MenuButton({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return <button style={{ ...itemStyle, color: danger ? '#b23b2e' : itemStyle.color }} onClick={onClick}>{label}</button>;
}
function MenuLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return <Link href={href} onClick={onClick} style={itemStyle as React.CSSProperties}>{label}</Link>;
}

'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unlockSiteAction } from '@/app/gate/actions';

const input: React.CSSProperties = { width: '100%', height: 48, background: '#fff', border: '1px solid rgba(43,42,38,.16)', borderRadius: 12, padding: '0 14px', fontSize: 14.5, outline: 'none', marginBottom: 14 };
const btn: React.CSSProperties = { width: '100%', height: 48, borderRadius: 13, background: 'var(--color-accent)', color: '#fff', border: 0, fontWeight: 600, fontSize: 15, cursor: 'pointer' };

export function GateForm({ dest }: { dest: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await unlockSiteAction(password);
      if (r.ok) { router.push(dest); router.refresh(); }
      else setErr(r.error ?? 'Incorrect password.');
    });
  };

  return (
    <form onSubmit={submit}>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, marginBottom: 14 }}>{err}</div>}
      <input
        style={input}
        type="password"
        placeholder="Password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button disabled={pending || !password} style={{ ...btn, opacity: pending || !password ? 0.7 : 1 }}>
        {pending ? 'Checking…' : 'Access sandbox'}
      </button>
    </form>
  );
}

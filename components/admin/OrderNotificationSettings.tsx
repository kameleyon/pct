'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addOrderNotificationEmailAction, removeOrderNotificationEmailAction } from '@/app/admin/actions';

const box: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 16, border: '1px solid rgba(43,42,38,.08)', padding: 20 };
const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)' };
const btn: React.CSSProperties = { height: 34, padding: '0 14px', borderRadius: 9, border: 0, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' };
const input: React.CSSProperties = { height: 36, borderRadius: 9, border: '1px solid rgba(43,42,38,.16)', padding: '0 12px', fontSize: 13, width: 260 };

type Recipient = { id: string; email: string };

export function OrderNotificationSettings({ recipients }: { recipients: Recipient[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const add = () => {
    setErr(null);
    start(async () => {
      const r = await addOrderNotificationEmailAction(email);
      if (r.error) setErr(r.error); else { setEmail(''); router.refresh(); }
    });
  };

  const remove = (id: string) => {
    setErr(null);
    start(async () => { const r = await removeOrderNotificationEmailAction(id); if (r.error) setErr(r.error); else router.refresh(); });
  };

  return (
    <div style={box}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Order notification recipients</div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 14px' }}>Everyone on this list gets emailed whenever an order is placed.</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <input placeholder="name@company.com" type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button disabled={pending || !email} onClick={add} style={{ ...btn, background: 'var(--color-accent)', color: '#fff' }}>Add</button>
      </div>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 12.5, fontWeight: 600, padding: '8px 10px', borderRadius: 9, marginBottom: 14 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>Email</th><th style={th}></th></tr></thead>
        <tbody>
          {recipients.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.email}</td>
              <td style={td}><button disabled={pending} onClick={() => remove(r.id)} style={{ ...btn, background: '#fbecea', color: '#b23b2e' }}>Remove</button></td>
            </tr>
          ))}
          {recipients.length === 0 && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={2}>No recipients yet — order-placed emails won&rsquo;t send until you add one.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

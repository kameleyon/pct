'use client';
import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setUserRoleAction, setOrderStatusAction } from '@/app/admin/actions';

const sel: React.CSSProperties = { height: 36, borderRadius: 9, border: '1px solid rgba(43,42,38,.16)', padding: '0 10px', fontSize: 13, fontWeight: 600, background: '#fff', cursor: 'pointer' };

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(role);
  return (
    <select value={value} disabled={pending} style={{ ...sel, opacity: pending ? 0.6 : 1 }}
      onChange={(e) => { const v = e.target.value; setValue(v); start(async () => { await setUserRoleAction(userId, v as any); router.refresh(); }); }}>
      <option value="member">Member</option>
      <option value="vip">VIP Member</option>
      <option value="admin">Admin</option>
    </select>
  );
}

export function OrderStatus({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(status);
  return (
    <select value={value} disabled={pending} style={{ ...sel, opacity: pending ? 0.6 : 1 }}
      onChange={(e) => { const v = e.target.value; setValue(v); start(async () => { await setOrderStatusAction(orderId, v); router.refresh(); }); }}>
      {['quote_requested', 'pending', 'paid', 'shipped', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
    </select>
  );
}

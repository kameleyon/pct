'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setAffiliateStatusAction } from '@/app/admin/actions';

const btn: React.CSSProperties = { height: 38, padding: '0 18px', borderRadius: 10, border: 0, fontWeight: 600, fontSize: 13, cursor: 'pointer' };

export function AffiliateStatusActions({ affiliateId }: { affiliateId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (status: 'approved' | 'rejected') => {
    start(async () => { await setAffiliateStatusAction(affiliateId, status); router.refresh(); });
  };

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button disabled={pending} onClick={() => act('approved')} style={{ ...btn, background: 'var(--color-accent)', color: '#fff' }}>Approve</button>
      <button disabled={pending} onClick={() => act('rejected')} style={{ ...btn, background: '#fbecea', color: '#b23b2e' }}>Reject</button>
    </div>
  );
}

'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { applyForAffiliateAction } from '@/app/account/affiliate/actions';

export function AffiliateApply() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const apply = () => {
    setErr(null);
    start(async () => {
      const r = await applyForAffiliateAction();
      if (r.error) setErr(r.error); else { setDone(true); router.refresh(); }
    });
  };

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 32, border: '1px solid rgba(43,42,38,.08)', maxWidth: 640 }}>
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Join our affiliate program to earn a commission on every sale you refer. Once approved, you&rsquo;ll get
        a unique referral link and a portal to track every referred sale and payout. You&rsquo;ll connect a payout
        account through Stripe after approval — no bank details needed here.
      </p>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>{err}</div>}
      <button disabled={pending || done} onClick={apply} style={{ height: 48, padding: '0 28px', borderRadius: 14, background: 'var(--color-accent)', border: 0, cursor: 'pointer', fontWeight: 600, fontSize: 15, color: '#fff' }}>
        {done ? 'Application submitted' : pending ? 'Submitting…' : 'Apply to become an affiliate'}
      </button>
    </div>
  );
}

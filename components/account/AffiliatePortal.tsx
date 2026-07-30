'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAffiliateStripeLinkAction, requestAffiliatePayoutAction } from '@/app/account/affiliate/actions';

type Commission = {
  id: string;
  order_id: string;
  sale_amount: number;
  affiliate_amount: number;
  status: 'pending' | 'available' | 'requested' | 'paid' | 'expired' | 'reversed';
  matures_at: string;
  expires_at: string;
  created_at: string;
};

const STATUS_LABEL: Record<Commission['status'], string> = {
  pending: 'Maturing', available: 'Available', requested: 'Payout requested', paid: 'Paid', expired: 'Expired', reversed: 'Reversed',
};
const STATUS_COLOR: Record<Commission['status'], string> = {
  pending: 'var(--muted)', available: 'var(--color-accent)', requested: 'var(--color-gold-700)', paid: 'var(--color-accent)', expired: '#b23b2e', reversed: '#b23b2e',
};

export function AffiliatePortal({ referralLink, payoutsEnabled, hasStripeAccount, payoutThreshold, maturityDays, expiryDays, commissions }: {
  referralLink: string;
  payoutsEnabled: boolean;
  hasStripeAccount: boolean;
  payoutThreshold: number;
  maturityDays: number;
  expiryDays: number;
  commissions: Commission[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [connectPending, startConnect] = useTransition();
  const [payoutPending, startPayout] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connect = () => {
    setErr(null);
    startConnect(async () => {
      const r = await createAffiliateStripeLinkAction();
      if (r.error) setErr(r.error); else if (r.url) window.location.href = r.url;
    });
  };

  const requestPayout = () => {
    setErr(null); setMsg(null);
    startPayout(async () => {
      const r = await requestAffiliatePayoutAction();
      if (r.error) setErr(r.error); else { setMsg('Payout requested.'); router.refresh(); }
    });
  };

  const availableTotal = commissions.filter((c) => c.status === 'available').reduce((s, c) => s + Number(c.affiliate_amount), 0);
  const maturingTotal = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.affiliate_amount), 0);
  const paidTotal = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.affiliate_amount), 0);
  const canRequest = payoutsEnabled && availableTotal >= payoutThreshold;

  const card: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)' };
  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
  const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted-2)', marginBottom: 10 }}>Your referral link</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <code style={{ background: '#f4f1ea', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, flex: '1 1 320px', overflow: 'auto' }}>{referralLink}</code>
          <button onClick={copy} style={{ height: 40, padding: '0 18px', borderRadius: 10, background: 'var(--color-accent)', border: 0, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <div style={card}>
          <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--color-accent)' }}>${availableTotal.toFixed(2)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>Available now</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 26, fontWeight: 600 }}>${maturingTotal.toFixed(2)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>Maturing ({maturityDays}-day hold)</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 26, fontWeight: 600 }}>${paidTotal.toFixed(2)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>Paid out</div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Payout account</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {payoutsEnabled ? 'Connected — you can request payouts.' : hasStripeAccount ? 'Onboarding started — a few steps left.' : 'Connect a payout account to receive your commissions.'}
            </div>
          </div>
          {!payoutsEnabled && (
            <button disabled={connectPending} onClick={connect} style={{ height: 42, padding: '0 20px', borderRadius: 12, background: 'var(--color-gold-700)', border: 0, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              {connectPending ? 'Redirecting…' : hasStripeAccount ? 'Finish setup' : 'Connect payout account'}
            </button>
          )}
          {payoutsEnabled && (
            <button disabled={payoutPending || !canRequest} onClick={requestPayout} style={{ height: 42, padding: '0 20px', borderRadius: 12, background: canRequest ? 'var(--color-accent)' : '#e4e0d6', border: 0, color: canRequest ? '#fff' : 'var(--muted-2)', fontWeight: 600, cursor: canRequest ? 'pointer' : 'not-allowed' }}>
              {payoutPending ? 'Requesting…' : `Request payout (min $${payoutThreshold.toFixed(0)})`}
            </button>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted-2)' }}>
          Matured commissions must be requested within {expiryDays} days or they&rsquo;re forfeited.
        </div>
        {err && <div style={{ marginTop: 12, background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10 }}>{err}</div>}
        {msg && <div style={{ marginTop: 12, background: 'var(--color-accent-100)', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10 }}>{msg}</div>}
      </div>

      <div>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Referred sales ({commissions.length})</h2>
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><th style={th}>Date</th><th style={th}>Sale</th><th style={th}>Your cut</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id}>
                  <td style={td}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td style={td}>${Number(c.sale_amount).toFixed(2)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>${Number(c.affiliate_amount).toFixed(2)}</td>
                  <td style={td}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: STATUS_COLOR[c.status], borderRadius: 999, padding: '5px 12px' }}>{STATUS_LABEL[c.status]}</span></td>
                </tr>
              ))}
              {commissions.length === 0 && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={4}>No referred sales yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

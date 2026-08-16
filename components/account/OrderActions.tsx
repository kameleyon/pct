'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptQuoteAction, createInvoicePaymentSession } from '@/app/account/orders/actions';

const input: React.CSSProperties = { height: 46, background: '#fff', border: '1px solid rgba(43,42,38,.14)', borderRadius: 12, padding: '0 14px', fontSize: 14, outline: 'none', flex: 1 };
const btn: React.CSSProperties = { height: 46, padding: '0 22px', borderRadius: 13, background: 'var(--color-accent)', color: '#fff', border: 0, fontWeight: 600, fontSize: 14.5, cursor: 'pointer' };

export function AcceptQuoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [poNumber, setPoNumber] = useState('');
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    start(async () => {
      const r = await acceptQuoteAction(orderId, poNumber);
      if (r.ok) router.refresh(); else setErr(r.error ?? 'Could not accept this quote.');
    });
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>Accepting issues your PO and moves this order into fulfillment.</p>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 12.5, fontWeight: 600, padding: '8px 10px', borderRadius: 9, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input style={input} placeholder="Your PO number (optional)" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
        <button style={btn} disabled={pending} onClick={submit}>{pending ? 'Accepting…' : 'Accept Quote & Issue PO'}</button>
      </div>
    </div>
  );
}

export function PayInvoiceButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    setPending(true);
    createInvoicePaymentSession(orderId)
      .then((r) => { if (r.url) window.location.href = r.url; else { setErr(r.error ?? 'Could not start payment.'); setPending(false); } })
      .catch(() => { setErr('Could not start payment. Please try again.'); setPending(false); });
  };

  return (
    <div>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 12.5, fontWeight: 600, padding: '8px 10px', borderRadius: 9, marginBottom: 10 }}>{err}</div>}
      <button style={btn} disabled={pending} onClick={submit}>{pending ? 'Redirecting to payment…' : 'Pay Invoice'}</button>
    </div>
  );
}

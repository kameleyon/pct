'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  sendQuoteAction, decideEscrowAction, setEscrowStatusAction,
  decideCreditAction, sendInvoiceAction, setDeliveryStatusAction,
} from '@/app/admin/actions';

const sel: React.CSSProperties = { height: 36, borderRadius: 9, border: '1px solid rgba(43,42,38,.16)', padding: '0 10px', fontSize: 13, fontWeight: 600, background: '#fff', cursor: 'pointer' };
const btn: React.CSSProperties = { height: 40, padding: '0 18px', borderRadius: 11, background: 'var(--color-accent)', color: '#fff', border: 0, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' };
const inputSm: React.CSSProperties = { width: 110, height: 34, border: '1px solid rgba(43,42,38,.16)', borderRadius: 8, padding: '0 10px', fontSize: 13, textAlign: 'right' };

/** Admin prices an RFQ's line items and sends the quote — the buyer's first
 *  look at any price. */
export function QuotePricingForm({ orderId, items }: { orderId: string; items: { id: string; name: string; part_number: string; quantity: number; unit_price: number | null }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(items.map((it) => [it.id, it.unit_price != null ? String(it.unit_price) : '']))
  );
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    const parsed = items.map((it) => ({ id: it.id, unitPrice: parseFloat(prices[it.id] || '') }));
    if (parsed.some((p) => Number.isNaN(p.unitPrice))) { setErr('Enter a price for every line.'); return; }
    start(async () => {
      const r = await sendQuoteAction(orderId, parsed);
      if (r.ok) router.refresh(); else setErr(r.error ?? 'Could not send quote.');
    });
  };

  return (
    <div>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 12.5, fontWeight: 600, padding: '8px 10px', borderRadius: 9, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 13.5, minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
              <div style={{ color: 'var(--muted-2)', fontSize: 11.5, fontFamily: 'monospace' }}>{it.part_number} · Qty {it.quantity}</div>
            </div>
            <span style={{ color: 'var(--muted-2)', fontSize: 13 }}>$</span>
            <input style={inputSm} disabled={pending} value={prices[it.id] ?? ''} onChange={(e) => setPrices((p) => ({ ...p, [it.id]: e.target.value }))} placeholder="0.00" />
          </div>
        ))}
      </div>
      <button style={{ ...btn, marginTop: 16 }} disabled={pending} onClick={submit}>{pending ? 'Sending…' : 'Send Quote to Buyer'}</button>
    </div>
  );
}

/** The branch point of the whole workflow: is this order escrowed or direct? Audited. */
export function EscrowDecision({ orderId, escrowRequired, escrowReason }: { orderId: string; escrowRequired: boolean | null; escrowReason: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [required, setRequired] = useState(escrowRequired ?? false);
  const [reason, setReason] = useState(escrowReason ?? '');

  const submit = () => start(async () => { await decideEscrowAction(orderId, required, reason); router.refresh(); });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button onClick={() => setRequired(true)} style={{ ...sel, background: required ? 'var(--color-accent)' : '#fff', color: required ? '#fff' : 'var(--text)' }}>Escrow required</button>
        <button onClick={() => setRequired(false)} style={{ ...sel, background: !required ? 'var(--color-accent)' : '#fff', color: !required ? '#fff' : 'var(--text)' }}>No escrow</button>
      </div>
      <textarea
        value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (e.g. transaction value, new/unverified buyer, international, buyer requested)…"
        style={{ width: '100%', height: 64, border: '1px solid rgba(43,42,38,.14)', borderRadius: 10, padding: 10, fontSize: 13, resize: 'vertical' as const, marginBottom: 10 }}
      />
      <button style={btn} disabled={pending} onClick={submit}>{pending ? 'Saving…' : escrowRequired == null ? 'Save decision' : 'Update decision'}</button>
    </div>
  );
}

function StatusSelect({ value, options, onChange, pending }: { value: string; options: string[]; onChange: (v: string) => void; pending: boolean }) {
  return (
    <select value={value} disabled={pending} style={{ ...sel, opacity: pending ? 0.6 : 1 }} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  );
}

export function EscrowStatusControl({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(status);
  return (
    <StatusSelect
      value={value} pending={pending}
      options={['pending', 'funded', 'held', 'released', 'disputed']}
      onChange={(v) => { setValue(v); start(async () => { await setEscrowStatusAction(orderId, v); router.refresh(); }); }}
    />
  );
}

export function CreditDecision({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(status);
  return (
    <StatusSelect
      value={value} pending={pending}
      options={['not_applicable', 'pending_vetting', 'approved', 'denied']}
      onChange={(v) => { setValue(v); start(async () => { await decideCreditAction(orderId, v); router.refresh(); }); }}
    />
  );
}

export function DeliveryStatusControl({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(status);
  return (
    <StatusSelect
      value={value} pending={pending}
      options={['not_shipped', 'shipped', 'delivered']}
      onChange={(v) => { setValue(v); start(async () => { await setDeliveryStatusAction(orderId, v); router.refresh(); }); }}
    />
  );
}

export function SendInvoiceButton({ orderId, invoiceStatus }: { orderId: string; invoiceStatus: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const submit = () => start(async () => { await sendInvoiceAction(orderId); router.refresh(); });
  return (
    <button style={btn} disabled={pending} onClick={submit}>
      {pending ? 'Sending…' : invoiceStatus === 'sent' ? 'Resend Invoice' : 'Send Invoice'}
    </button>
  );
}

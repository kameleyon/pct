'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { requestQuoteAction, type QuoteContact } from '@/app/cart/actions';

const input: React.CSSProperties = { width: '100%', height: 46, background: '#fff', border: '1px solid rgba(43,42,38,.14)', borderRadius: 12, padding: '0 14px', fontSize: 14, outline: 'none' };
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a473f', marginBottom: 6 };
const textarea: React.CSSProperties = { ...input, height: 96, padding: '12px 14px', resize: 'vertical' as const };

export function QuoteForm({ initial }: { initial: QuoteContact }) {
  const { lines } = useCart();
  const router = useRouter();
  const [values, setValues] = useState<QuoteContact>(initial);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof QuoteContact>(key: K, v: QuoteContact[K]) => setValues((prev) => ({ ...prev, [key]: v }));

  if (lines.length === 0) {
    return (
      <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
        Your cart is empty. <Link href="/" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Start browsing the catalog</Link>.
      </div>
    );
  }

  const submit = () => {
    setErr(null);
    setPending(true);
    requestQuoteAction(lines.map((l) => ({ productId: l.productId, qty: l.qty })), values)
      .then((r) => {
        if (r.ok) router.push(`/quote/success?order=${r.orderId}`);
        else { setErr(r.error ?? 'Could not submit your quote request.'); setPending(false); }
      })
      .catch(() => { setErr('Could not submit your quote request. Please try again.'); setPending(false); });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'start' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 28, border: '1px solid rgba(43,42,38,.08)' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 18px' }}>Contact</h2>

        {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>{err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div><label style={label}>Full name *</label><input style={input} value={values.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label style={label}>Phone *</label><input style={input} type="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div><label style={label}>Email *</label><input style={input} type="email" value={values.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label style={label}>Company <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><input style={input} value={values.company ?? ''} onChange={(e) => set('company', e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={label}>Anything else we should know? <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
          <textarea style={textarea} value={values.note ?? ''} onChange={(e) => set('note', e.target.value)} placeholder="Target quantities, delivery timeline, etc." />
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted-2)', margin: '0 0 18px' }}>
          Our team will review this list and email you firm pricing. Once you accept the quote, you’ll issue a PO to move forward.
        </p>

        <button disabled={pending} onClick={submit} style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--color-accent)', color: '#fff', border: 0, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          {pending ? 'Submitting…' : 'Submit Quote Request'}
        </button>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)' }}>
        <h2 style={{ fontSize: 16, margin: '0 0 16px' }}>Items requested</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lines.map((l) => (
            <div key={l.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
              <span style={{ color: 'var(--muted)' }}>{l.name}</span>
              <span style={{ fontWeight: 600, flex: 'none' }}>× {l.qty}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { createCheckoutSession, type CheckoutContact } from '@/app/checkout/actions';

const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'],
  ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'],
  ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const input: React.CSSProperties = { width: '100%', height: 46, background: '#fff', border: '1px solid rgba(43,42,38,.14)', borderRadius: 12, padding: '0 14px', fontSize: 14, outline: 'none' };
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a473f', marginBottom: 6 };
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CheckoutForm({ initial }: { initial: CheckoutContact }) {
  const { lines } = useCart();
  const [values, setValues] = useState<CheckoutContact>(initial);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof CheckoutContact>(key: K, v: CheckoutContact[K]) => setValues((prev) => ({ ...prev, [key]: v }));

  const subtotal = lines.reduce((s, l) => s + (l.price && l.price > 0 ? l.price * l.qty : 0), 0);

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
    createCheckoutSession(lines.map((l) => ({ productId: l.productId, qty: l.qty })), values)
      .then((r) => {
        if (r.url) window.location.href = r.url;
        else { setErr(r.error ?? 'Checkout failed.'); setPending(false); }
      })
      .catch(() => { setErr('Checkout could not start. Please try again.'); setPending(false); });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'start' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 28, border: '1px solid rgba(43,42,38,.08)' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 18px' }}>Contact &amp; shipping</h2>

        {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>{err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div><label style={label}>Full name *</label><input style={input} value={values.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
          <div><label style={label}>Phone *</label><input style={input} type="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Email *</label>
          <input style={input} type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
        </div>

        <div style={{ margin: '20px 0 16px', fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Shipping address</div>
        <div style={{ marginBottom: 16 }}><label style={label}>Address line 1 *</label><input style={input} value={values.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} /></div>
        <div style={{ marginBottom: 16 }}><label style={label}>Address line 2 <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><input style={input} value={values.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div><label style={label}>City *</label><input style={input} value={values.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div>
            <label style={label}>State *</label>
            <select style={input} value={values.state} onChange={(e) => set('state', e.target.value)}>
              <option value="">Select…</option>
              {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
          <div><label style={label}>ZIP code *</label><input style={input} value={values.postalCode} onChange={(e) => set('postalCode', e.target.value)} /></div>
          <div><label style={label}>Country</label><input style={{ ...input, background: '#f4f1ea', color: 'var(--muted)' }} value="United States" disabled /></div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted-2)', margin: '0 0 18px' }}>
          On the next step, Stripe will ask for your card and billing zip code to process payment securely — we never see or store your card details.
        </p>

        <button disabled={pending} onClick={submit} style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--color-accent)', color: '#fff', border: 0, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          {pending ? 'Redirecting to payment…' : 'Continue to payment'}
        </button>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 24, border: '1px solid rgba(43,42,38,.08)' }}>
        <h2 style={{ fontSize: 16, margin: '0 0 16px' }}>Order summary</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {lines.map((l) => (
            <div key={l.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}>
              <span style={{ color: 'var(--muted)' }}>{l.name} × {l.qty}</span>
              <span style={{ fontWeight: 600, flex: 'none' }}>{l.price ? money(l.price * l.qty) : 'Quote'}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(43,42,38,.08)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Subtotal</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{money(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}

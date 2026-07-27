'use client';
import { useState, useTransition } from 'react';
import { updateProfileAction, type ProfileUpdate } from '@/app/account/actions';

const input: React.CSSProperties = { width: '100%', height: 46, background: '#fff', border: '1px solid rgba(43,42,38,.14)', borderRadius: 12, padding: '0 14px', fontSize: 14, outline: 'none' };
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a473f', marginBottom: 6 };
const field = (children: React.ReactNode) => <div>{children}</div>;

export function ProfileForm({ initial }: { initial: ProfileUpdate }) {
  const [values, setValues] = useState<ProfileUpdate>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof ProfileUpdate>(key: K, v: ProfileUpdate[K]) => setValues((prev) => ({ ...prev, [key]: v }));

  const save = () => {
    setMsg(null); setErr(null);
    start(async () => {
      const r = await updateProfileAction(values);
      if (r.error) setErr(r.error); else setMsg('Profile updated.');
    });
  };

  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: 20, padding: 28, border: '1px solid rgba(43,42,38,.08)', maxWidth: 640 }}>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>{err}</div>}
      {msg && <div style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {field(<><label style={label}>Full name</label><input style={input} value={values.fullName} onChange={(e) => set('fullName', e.target.value)} /></>)}
        {field(<><label style={label}>Phone</label><input style={input} type="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} /></>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {field(<><label style={label}>Company</label><input style={input} value={values.company} onChange={(e) => set('company', e.target.value)} /></>)}
        {field(<><label style={label}>Job title</label><input style={input} value={values.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} /></>)}
      </div>

      <div style={{ margin: '20px 0 16px', fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Shipping / billing address</div>
      <div style={{ marginBottom: 16 }}>{field(<><label style={label}>Address line 1</label><input style={input} value={values.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} /></>)}</div>
      <div style={{ marginBottom: 16 }}>{field(<><label style={label}>Address line 2 <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><input style={input} value={values.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} /></>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {field(<><label style={label}>City</label><input style={input} value={values.city} onChange={(e) => set('city', e.target.value)} /></>)}
        {field(<><label style={label}>State / Region</label><input style={input} value={values.stateRegion} onChange={(e) => set('stateRegion', e.target.value)} /></>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {field(<><label style={label}>Postal code</label><input style={input} value={values.postalCode} onChange={(e) => set('postalCode', e.target.value)} /></>)}
        {field(<><label style={label}>Country</label><input style={input} value={values.country} onChange={(e) => set('country', e.target.value)} /></>)}
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, fontWeight: 600, color: '#4a473f', cursor: 'pointer', marginBottom: 20 }}>
        <input type="checkbox" checked={values.marketingOptIn} onChange={(e) => set('marketingOptIn', e.target.checked)} style={{ marginTop: 2 }} />
        Email me about deals, new products, and restocks.
      </label>

      <button disabled={pending} onClick={save} style={{ height: 48, padding: '0 28px', borderRadius: 14, background: 'var(--color-accent)', border: 0, cursor: 'pointer', fontWeight: 600, fontSize: 15, color: '#fff' }}>
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

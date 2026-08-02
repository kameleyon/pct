'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  setAffiliateStatusAction,
  setDefaultAffiliateRateAction,
  setCategoryAffiliateRateAction,
  removeCategoryAffiliateRateAction,
  setProductAffiliateRateAction,
  removeProductAffiliateRateAction,
  updateAffiliateConfigAction,
} from '@/app/admin/actions';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700 };
const thSticky: React.CSSProperties = { ...th, position: 'sticky', top: 0, background: 'var(--color-surface)' };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)', verticalAlign: 'middle' };
const btn: React.CSSProperties = { height: 34, padding: '0 14px', borderRadius: 9, border: 0, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' };
const num: React.CSSProperties = { width: 90, height: 34, borderRadius: 9, border: '1px solid rgba(43,42,38,.16)', padding: '0 10px', fontSize: 13 };
const box: React.CSSProperties = { background: 'var(--color-surface)', borderRadius: 16, border: '1px solid rgba(43,42,38,.08)', padding: 20 };

type Applicant = { id: string; status: string; referral_code: string; applied_at: string; full_name: string | null };
type Category = { id: string; name: string };
type CategoryRate = { id: string; category_id: string; percent: number };
type ProductRate = { id: string; product_id: string; percent: number | null; fixed_amount: number | null; part_number: string; name: string };
type Config = { manufacturer_pct: number; website_pct: number; maturity_days: number; expiry_days: number; payout_threshold: number };

export function AffiliateApplications({ applicants }: { applicants: Applicant[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    start(async () => { await setAffiliateStatusAction(id, status); router.refresh(); setBusyId(null); });
  };

  return (
    <div style={{ ...box, padding: 0, overflow: 'auto', maxHeight: 420 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead><tr><th style={thSticky}>Name</th><th style={thSticky}>Code</th><th style={thSticky}>Applied</th><th style={thSticky}>Status</th><th style={thSticky}></th></tr></thead>
        <tbody>
          {applicants.map((a) => (
            <tr key={a.id}>
              <td style={td}><Link href={`/admin/affiliates/${a.id}`} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{a.full_name || 'Unnamed'}</Link></td>
              <td style={{ ...td, fontFamily: 'monospace' }}>{a.referral_code}</td>
              <td style={td}>{new Date(a.applied_at).toLocaleDateString()}</td>
              <td style={{ ...td, textTransform: 'capitalize' }}>{a.status}</td>
              <td style={td}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/admin/affiliates/${a.id}`} style={{ ...btn, display: 'inline-flex', alignItems: 'center', background: '#f4f1ea', color: 'var(--color-text)', textDecoration: 'none' }}>View</Link>
                  {a.status === 'pending' && (
                    <>
                      <button disabled={pending && busyId === a.id} onClick={() => act(a.id, 'approved')} style={{ ...btn, background: 'var(--color-accent)', color: '#fff' }}>Approve</button>
                      <button disabled={pending && busyId === a.id} onClick={() => act(a.id, 'rejected')} style={{ ...btn, background: '#fbecea', color: '#b23b2e' }}>Reject</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {applicants.length === 0 && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={5}>No affiliate applications yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function AffiliateRateSettings({ defaultPercent, categories, categoryRates, productRates }: {
  defaultPercent: number; categories: Category[]; categoryRates: CategoryRate[]; productRates: ProductRate[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [defPct, setDefPct] = useState(defaultPercent);
  const [catId, setCatId] = useState(categories[0]?.id ?? '');
  const [catPct, setCatPct] = useState(10);
  const [partNumber, setPartNumber] = useState('');
  const [prodPct, setProdPct] = useState<string>('');
  const [prodFixed, setProdFixed] = useState<string>('');

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setErr(null);
    start(async () => { const r = await fn(); if (r.error) setErr(r.error); else router.refresh(); });
  };

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {err && <div style={{ background: '#fbecea', color: '#b23b2e', fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 10 }}>{err}</div>}

      <div style={box}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Default rate (site-wide fallback)</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="number" step="0.1" style={num} value={defPct} onChange={(e) => setDefPct(Number(e.target.value))} />
          <span style={{ fontSize: 13 }}>%</span>
          <button disabled={pending} onClick={() => run(() => setDefaultAffiliateRateAction(defPct))} style={{ ...btn, background: 'var(--color-accent)', color: '#fff' }}>Save</button>
        </div>
      </div>

      <div style={box}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Category overrides</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <select value={catId} onChange={(e) => setCatId(e.target.value)} style={{ ...num, width: 200 }}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" step="0.1" style={num} value={catPct} onChange={(e) => setCatPct(Number(e.target.value))} />
          <span style={{ fontSize: 13 }}>%</span>
          <button disabled={pending || !catId} onClick={() => run(() => setCategoryAffiliateRateAction(catId, catPct))} style={{ ...btn, background: 'var(--color-accent)', color: '#fff' }}>Add / update</button>
        </div>
        <div style={{ overflow: 'auto', maxHeight: 320, border: '1px solid rgba(43,42,38,.07)', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thSticky}>Category</th><th style={thSticky}>Percent</th><th style={thSticky}></th></tr></thead>
            <tbody>
              {categoryRates.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{categoryName(r.category_id)}</td>
                  <td style={td}>{r.percent}%</td>
                  <td style={td}><button disabled={pending} onClick={() => run(() => removeCategoryAffiliateRateAction(r.id))} style={{ ...btn, background: '#fbecea', color: '#b23b2e' }}>Remove</button></td>
                </tr>
              ))}
              {categoryRates.length === 0 && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={3}>No category overrides.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={box}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Product overrides (percent and/or fixed $ — fixed wins if both set)</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <input placeholder="Part number" style={{ ...num, width: 160 }} value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
          <input placeholder="Percent" type="number" step="0.1" style={num} value={prodPct} onChange={(e) => setProdPct(e.target.value)} />
          <input placeholder="Fixed $" type="number" step="0.01" style={num} value={prodFixed} onChange={(e) => setProdFixed(e.target.value)} />
          <button
            disabled={pending || !partNumber}
            onClick={() => run(() => setProductAffiliateRateAction(partNumber, prodPct === '' ? null : Number(prodPct), prodFixed === '' ? null : Number(prodFixed)))}
            style={{ ...btn, background: 'var(--color-accent)', color: '#fff' }}
          >
            Add / update
          </button>
        </div>
        <div style={{ overflow: 'auto', maxHeight: 420, border: '1px solid rgba(43,42,38,.07)', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thSticky}>Product</th><th style={thSticky}>Percent</th><th style={thSticky}>Fixed $</th><th style={thSticky}></th></tr></thead>
            <tbody>
              {productRates.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.part_number} — {r.name}</td>
                  <td style={td}>{r.percent != null ? `${r.percent}%` : '—'}</td>
                  <td style={td}>{r.fixed_amount != null ? `$${Number(r.fixed_amount).toFixed(2)}` : '—'}</td>
                  <td style={td}><button disabled={pending} onClick={() => run(() => removeProductAffiliateRateAction(r.id))} style={{ ...btn, background: '#fbecea', color: '#b23b2e' }}>Remove</button></td>
                </tr>
              ))}
              {productRates.length === 0 && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={4}>No product overrides.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AffiliateConfigForm({ config }: { config: Config }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [values, setValues] = useState({
    manufacturerPct: Number(config.manufacturer_pct),
    websitePct: Number(config.website_pct),
    maturityDays: Number(config.maturity_days),
    expiryDays: Number(config.expiry_days),
    payoutThreshold: Number(config.payout_threshold),
  });
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const save = () => {
    setErr(null); setMsg(null);
    start(async () => {
      const r = await updateAffiliateConfigAction(values);
      if (r.error) setErr(r.error); else { setMsg('Saved.'); router.refresh(); }
    });
  };

  return (
    <div style={box}>
      <div style={{ fontWeight: 600, marginBottom: 14 }}>Split, maturity &amp; payout settings</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>MasterCut % of remainder<br /><input type="number" step="0.1" style={num} value={values.manufacturerPct} onChange={(e) => setValues((v) => ({ ...v, manufacturerPct: Number(e.target.value) }))} /></label>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Website % of remainder<br /><input type="number" step="0.1" style={num} value={values.websitePct} onChange={(e) => setValues((v) => ({ ...v, websitePct: Number(e.target.value) }))} /></label>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Maturity (days)<br /><input type="number" style={num} value={values.maturityDays} onChange={(e) => setValues((v) => ({ ...v, maturityDays: Number(e.target.value) }))} /></label>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Expiry (days)<br /><input type="number" style={num} value={values.expiryDays} onChange={(e) => setValues((v) => ({ ...v, expiryDays: Number(e.target.value) }))} /></label>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Payout threshold ($)<br /><input type="number" style={{ ...num, width: 110 }} value={values.payoutThreshold} onChange={(e) => setValues((v) => ({ ...v, payoutThreshold: Number(e.target.value) }))} /></label>
        <button disabled={pending} onClick={save} style={{ ...btn, height: 36, background: 'var(--color-accent)', color: '#fff' }}>{pending ? 'Saving…' : 'Save'}</button>
      </div>
      {err && <div style={{ marginTop: 12, color: '#b23b2e', fontSize: 12.5, fontWeight: 600 }}>{err}</div>}
      {msg && <div style={{ marginTop: 12, color: 'var(--color-accent)', fontSize: 12.5, fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}

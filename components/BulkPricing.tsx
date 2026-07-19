'use client';
import { useState } from 'react';

// Quantity-break discount tiers. When a product carries a list price these render
// as discounted prices; otherwise they show the % off applied to the quote.
const TIERS = [
  { label: '100 – 499', off: 5 },
  { label: '500 – 999', off: 10 },
  { label: '1,000 – 4,999', off: 15 },
  { label: '5,000 +', off: 20 },
];

const seg = (active: boolean): React.CSSProperties => ({
  flex: 1, height: 38, borderRadius: 10, border: 0, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
  background: active ? 'var(--green)' : 'transparent', color: active ? '#fff' : 'var(--muted)',
});

export function BulkPricing({ price }: { price?: number | null }) {
  const [mode, setMode] = useState<'regular' | 'bulk'>('regular');
  const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 22, marginBottom: 20 }}>
      {/* Regular vs Bulk chooser */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 12, padding: 4, marginBottom: 18 }}>
        <button onClick={() => setMode('regular')} style={seg(mode === 'regular')}>Regular</button>
        <button onClick={() => setMode('bulk')} style={seg(mode === 'bulk')}>Bulk pricing</button>
      </div>

      {mode === 'regular' ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 32, fontWeight: 600, lineHeight: 1 }}>{price ? money(price) : 'Request a Quote'}</span>
          <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>volume &amp; contract pricing</span>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>Save more at higher quantities:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TIERS.map((t) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: 12, padding: '11px 16px' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{t.label} <span style={{ color: 'var(--muted-2)', fontWeight: 600 }}>pcs</span></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {price ? <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{money(price * (1 - t.off / 100))}</span> : null}
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--color-gold)', padding: '4px 10px', borderRadius: 999 }}>{t.off}% OFF</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 12 }}>Bulk discounts applied to your quote. Request a bulk quote for a firm price.</div>
        </div>
      )}
    </div>
  );
}

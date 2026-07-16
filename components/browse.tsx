'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const chip = (active: boolean) => ({
  fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
  background: active ? 'var(--green)' : 'var(--surface-2)', color: active ? '#fff' : '#4a473f',
});

function useToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (key: string, value: string) => {
    const cur = new Set((params.get(key) ?? '').split(',').filter(Boolean));
    cur.has(value) ? cur.delete(value) : cur.add(value);
    const next = new URLSearchParams(params.toString());
    cur.size ? next.set(key, [...cur].join(',')) : next.delete(key);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  };
}

const has = (params: URLSearchParams, key: string, value: string) =>
  (params.get(key) ?? '').split(',').includes(value);

export function FilterRail({ facets }: { facets: { flutes: number[]; coatings: string[]; systems: string[] } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toggle = useToggle();
  const label = { fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: 'var(--muted-2)', marginBottom: 12 };
  const anyFilter = ['flutes', 'coating', 'system'].some((k) => params.get(k));

  return (
    <aside style={{ background: 'var(--surface)', borderRadius: 22, padding: 22, position: 'sticky', top: 70 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Filters</span>
        {anyFilter && <span onClick={() => router.push(pathname)} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--muted-2)' }}>Clear all</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', borderRadius: 16, padding: 14, marginTop: 14 }}>
        <span style={{ width: 38, height: 22, borderRadius: 999, background: 'var(--green)', position: 'relative', flex: 'none' }}><span style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} /></span>
        <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 13, fontWeight: 600 }}>Factory-direct only</span><span style={{ fontSize: 11, color: 'var(--muted-2)' }}>Made to spec, made in USA</span></span>
      </div>

      {facets.flutes.length > 0 && (
        <div style={{ padding: '20px 0 4px' }}>
          <div style={label}>Flutes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {facets.flutes.map((f) => <span key={f} onClick={() => toggle('flutes', String(f))} style={chip(has(params, 'flutes', String(f)))}>{f}</span>)}
          </div>
        </div>
      )}

      {facets.coatings.length > 0 && (
        <div style={{ padding: '16px 0 4px', borderTop: '1px solid rgba(43,42,38,.07)' }}>
          <div style={label}>Coating</div>
          {facets.coatings.map((c) => {
            const on = has(params, 'coating', c);
            return (
              <label key={c} onClick={() => toggle('coating', c)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${on ? 'var(--green)' : 'rgba(43,42,38,.22)'}`, background: on ? 'var(--green)' : 'transparent', flex: 'none', display: 'grid', placeItems: 'center' }}>
                  {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                </span>{c}
              </label>
            );
          })}
        </div>
      )}

      {facets.systems.length > 1 && (
        <div style={{ padding: '16px 0 4px', borderTop: '1px solid rgba(43,42,38,.07)' }}>
          <div style={label}>Measurement</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {facets.systems.map((s) => <span key={s} onClick={() => toggle('system', s)} style={chip(has(params, 'system', s))}>{s}</span>)}
          </div>
        </div>
      )}
    </aside>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid var(--line)', borderRadius: 12, height: 44, overflow: 'hidden' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '0 12px' }}>Sort</span>
      <select
        defaultValue={params.get('sort') ?? 'best'}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set('sort', e.target.value);
          next.delete('page');
          router.push(`${pathname}?${next.toString()}`);
        }}
        style={{ border: 0, height: '100%', fontWeight: 600, fontSize: 13, background: 'transparent', width: 180 }}
      >
        <option value="best">Best match</option>
        <option value="dia-asc">Diameter: small to large</option>
        <option value="dia-desc">Diameter: large to small</option>
      </select>
    </div>
  );
}

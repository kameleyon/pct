'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { type Facets } from '@/lib/catalog';

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

const label = { fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: 'var(--muted-2)', marginBottom: 12 };

export function FilterRail({ facets }: { facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toggle = useToggle();
  const FILTER_KEYS = ['flutes', 'geometry', 'coating', 'cut', 'flat', 'app', 'system'];
  const anyFilter = FILTER_KEYS.some((k) => params.get(k));

  const Chips = ({ title, param, values }: { title: string; param: string; values: string[] }) =>
    values.length > 1 ? (
      <div style={{ padding: '16px 0 4px', borderTop: '1px solid rgba(43,42,38,.07)' }}>
        <div style={label}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {values.map((v) => <span key={v} onClick={() => toggle(param, v)} style={chip(has(params, param, v))}>{v}</span>)}
        </div>
      </div>
    ) : null;

  const Checks = ({ title, param, values }: { title: string; param: string; values: string[] }) =>
    values.length > 1 ? (
      <div style={{ padding: '16px 0 4px', borderTop: '1px solid rgba(43,42,38,.07)' }}>
        <div style={label}>{title}</div>
        {values.map((v) => {
          const on = has(params, param, v);
          return (
            <label key={v} onClick={() => toggle(param, v)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer', fontSize: 13 }}>
              <span style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${on ? 'var(--green)' : 'rgba(43,42,38,.22)'}`, background: on ? 'var(--green)' : 'transparent', flex: 'none', display: 'grid', placeItems: 'center' }}>
                {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
              </span>{v}
            </label>
          );
        })}
      </div>
    ) : null;

  return (
    <aside className="filter-rail" style={{ background: 'var(--surface)', borderRadius: 22, padding: '10px 22px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 6px' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Filters</span>
        {anyFilter && <span onClick={() => router.push(pathname)} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--muted-2)' }}>Clear all</span>}
      </div>
      <Chips title="Flutes" param="flutes" values={facets.flutes.map(String)} />
      <Chips title="Geometry" param="geometry" values={facets.geometries} />
      <Checks title="Cut" param="cut" values={facets.cuts} />
      <Checks title="Coating" param="coating" values={facets.coatings} />
      <Chips title="Shank" param="flat" values={facets.flats} />
      <Checks title="Application" param="app" values={facets.applications} />
      <Chips title="Measurement" param="system" values={facets.systems} />
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

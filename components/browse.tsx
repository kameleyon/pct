'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { type Facets } from '@/lib/catalog';

type Cat = { slug: string; name: string; depth: number };

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
const sectionStyle: React.CSSProperties = { padding: '16px 0 4px', borderTop: '1px solid rgba(43,42,38,.07)' };
const checkBox = (on: boolean) => ({ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${on ? 'var(--green)' : 'rgba(43,42,38,.22)'}`, background: on ? 'var(--green)' : 'transparent', flex: 'none' as const, display: 'grid' as const, placeItems: 'center' as const });
const Tick = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;

export function FilterRail({ facets, categoryTree = [], currentSlug }: { facets: Facets; categoryTree?: Cat[]; currentSlug?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toggle = useToggle();
  const [term, setTerm] = useState('');
  const FILTER_KEYS = ['flutes', 'geometry', 'coating', 'cut', 'flat', 'app', 'system', 'dia', 'shk', 'len', 'pt'];
  const anyFilter = FILTER_KEYS.some((k) => params.get(k));

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = term.trim();
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  // horizontal chips (short value sets)
  const Chips = ({ title, param, values }: { title: string; param: string; values: string[] }) =>
    values.length > 1 ? (
      <div style={sectionStyle}>
        <div style={label}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {values.map((v) => <span key={v} onClick={() => toggle(param, v)} style={chip(has(params, param, v))}>{v}</span>)}
        </div>
      </div>
    ) : null;

  // vertical checkbox list, scrolls when long (used for dimensions & multi-value facets)
  const List = ({ title, param, values }: { title: string; param: string; values: string[] }) =>
    values.length > 1 ? (
      <div style={sectionStyle}>
        <div style={label}>{title}</div>
        <div className="thin-scroll" style={{ display: 'flex', flexDirection: 'column', maxHeight: values.length > 8 ? 210 : undefined, overflowY: values.length > 8 ? 'auto' : undefined, paddingRight: values.length > 8 ? 6 : 0 }}>
          {values.map((v) => {
            const on = has(params, param, v);
            return (
              <label key={v} onClick={() => toggle(param, v)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer', fontSize: 13, fontWeight: on ? 600 : 400 }}>
                <span style={checkBox(on)}>{on && <Tick />}</span>{v}
              </label>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <aside className="filter-rail" style={{ background: 'var(--surface)', borderRadius: 22, padding: '10px 22px 22px' }}>
      {/* catalog-wide search */}
      <form onSubmit={submitSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 12, height: 42, padding: '0 6px 0 12px', margin: '12px 0 4px' }}>
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search all tools…" style={{ border: 0, background: 'transparent', height: '100%', flex: 1, fontSize: 13, minWidth: 0, outline: 'none' }} />
        <button type="submit" aria-label="Search" style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--green)', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff', flex: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 6px' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Filters</span>
        {anyFilter && <span onClick={() => router.push(pathname)} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--muted-2)' }}>Clear all</span>}
      </div>

      {/* site-wide category browser — current is highlighted, any is one click away */}
      {categoryTree.length > 0 && (
        <div style={sectionStyle}>
          <div style={label}>Category</div>
          <div className="thin-scroll" style={{ display: 'flex', flexDirection: 'column', maxHeight: 260, overflowY: 'auto', paddingRight: 6 }}>
            {categoryTree.map((c) => {
              const active = c.slug === currentSlug;
              return (
                <Link key={c.slug} href={`/category/${c.slug}`} style={{ display: 'block', padding: '5px 8px', paddingLeft: 8 + c.depth * 14, borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'var(--color-text)', background: active ? 'var(--green)' : 'transparent', textDecoration: 'none' }}>
                  {c.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Chips title="Measurement" param="system" values={facets.systems} />
      <List title="Cutting Diameter" param="dia" values={facets.diameters} />
      <List title="Shank Diameter" param="shk" values={facets.shanks} />
      <List title="Overall Length" param="len" values={facets.lengths} />
      <Chips title="Flutes" param="flutes" values={facets.flutes.map(String)} />
      <Chips title="Geometry" param="geometry" values={facets.geometries} />
      <List title="Cut" param="cut" values={facets.cuts} />
      <List title="Coating" param="coating" values={facets.coatings} />
      <Chips title="Point Angle" param="pt" values={facets.pointAngles} />
      <List title="Application" param="app" values={facets.applications} />
      <Chips title="Shank Flat" param="flat" values={facets.flats} />
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

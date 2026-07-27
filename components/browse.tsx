'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type Facets } from '@/lib/catalog';

const FILTER_STORAGE_KEY = 'pct-filters';

type Sub = { slug: string; name: string };
type Top = { slug: string; name: string; children: Sub[] };
type CatNav = { tops: Top[]; currentTop: string; activeSlugs: string[] };

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
// single-select indicator (Category / Subcategory pick one, unlike the true multi-select facet checkboxes)
const radio = (on: boolean): React.CSSProperties => ({ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${on ? 'var(--green)' : 'rgba(43,42,38,.22)'}`, background: 'transparent', flex: 'none', display: 'grid', placeItems: 'center' });
const RadioDot = () => <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)' }} />;
const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease', flex: 'none' }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
// dropdown-style header: current pick shown collapsed, click to expand the full list.
// Label+chevron on one row, value on its own line below (truncated if long) —
// keeps a long category name from colliding with the label at sidebar width.
const DropHead = ({ title, value, open, onClick }: { title: string; value?: string; open: boolean; onClick: () => void }) => (
  <div onClick={onClick} style={{ cursor: 'pointer', marginBottom: open ? 12 : 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ ...label, marginBottom: 0 }}>{title}</div>
      <Chevron open={open} />
    </div>
    {!open && value && (
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    )}
  </div>
);
const CountBadge = ({ n }: { n: number }) => (
  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', background: 'var(--green)', borderRadius: 999, padding: '1px 6px', lineHeight: 1.5 }}>{n}</span>
);
// collapsible header for the multi-select facet sections (Chips/List) — shows
// a count badge of currently-active values instead of a single picked value,
// since these are genuine multi-select filters rather than a single choice.
const FacetHead = ({ title, count, open, onClick }: { title: string; count: number; open: boolean; onClick: () => void }) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
    <div style={{ ...label, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 7 }}>{title}{count > 0 && <CountBadge n={count} />}</div>
    <Chevron open={open} />
  </div>
);

export function FilterRail({ facets, catNav }: { facets: Facets; catNav?: CatNav }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toggle = useToggle();
  const [term, setTerm] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  // Always derive from the current page's props (not local state) so switching
  // categories via any navigation path — sidebar, top nav, back button — keeps
  // the subcategory list in sync instead of going stale.
  const activeTop = catNav?.currentTop;
  const activeTopName = catNav?.tops.find((t) => t.slug === activeTop)?.name;
  const subs = catNav?.tops.find((t) => t.slug === activeTop)?.children ?? [];
  // "All" is active when the page itself is the hub (no specific subcategory picked)
  const onHub = !!catNav && catNav.activeSlugs[catNav.activeSlugs.length - 1] === activeTop;
  const activeSubName = onHub ? `All ${activeTopName ?? ''}`.trim() : subs.find((c) => catNav?.activeSlugs.includes(c.slug))?.name;
  const FILTER_KEYS = ['flutes', 'geometry', 'coating', 'cut', 'flat', 'app', 'system', 'dia', 'shk', 'len', 'pt'];
  const anyFilter = FILTER_KEYS.some((k) => params.get(k));
  // What values are actually valid on THIS category, for checking remembered filters below.
  const FACET_VALUES: Record<string, string[]> = {
    system: facets.systems, dia: facets.diameters, shk: facets.shanks, len: facets.lengths,
    flutes: facets.flutes.map(String), geometry: facets.geometries, cut: facets.cuts,
    coating: facets.coatings, pt: facets.pointAngles, app: facets.applications, flat: facets.flats,
  };

  // Remember the user's facet choices for this session (sessionStorage, so it
  // clears when the browser/tab session ends) so they carry over when
  // browsing to a different category — but only re-apply values that are
  // actually valid on the new category, and never override an explicit,
  // already-filtered URL (e.g. a shared link).
  useEffect(() => {
    const state: Record<string, string> = {};
    FILTER_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) state[k] = v;
    });
    if (Object.keys(state).length > 0) sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  useEffect(() => {
    if (anyFilter) return;
    let saved: Record<string, string> | null = null;
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null;
    }
    if (!saved) return;

    const next = new URLSearchParams(params.toString());
    let changed = false;
    for (const [key, value] of Object.entries(saved)) {
      const kept = value.split(',').filter((v) => (FACET_VALUES[key] ?? []).includes(v));
      if (kept.length > 0) {
        next.set(key, kept.join(','));
        changed = true;
      }
    }
    if (changed) router.replace(`${pathname}?${next.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Facet sections collapse too, defaulting open only where a filter is
  // already applied — so a shared/bookmarked filtered link doesn't hide the
  // very selection it's showing.
  const FACET_PARAMS: Record<string, string> = {
    Measurement: 'system', 'Cutting Diameter': 'dia', 'Shank Diameter': 'shk', 'Overall Length': 'len',
    Flutes: 'flutes', Geometry: 'geometry', Cut: 'cut', Coating: 'coating', 'Point Angle': 'pt', Application: 'app', 'Shank Flat': 'flat',
  };
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(Object.entries(FACET_PARAMS).filter(([, p]) => params.get(p)).map(([title]) => title))
  );
  const toggleSection = (title: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = term.trim();
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  // horizontal chips (short value sets)
  const Chips = ({ title, param, values }: { title: string; param: string; values: string[] }) => {
    if (values.length <= 1) return null;
    const open = openSections.has(title);
    const count = values.filter((v) => has(params, param, v)).length;
    return (
      <div style={sectionStyle}>
        <FacetHead title={title} count={count} open={open} onClick={() => toggleSection(title)} />
        {open && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {values.map((v) => <span key={v} onClick={() => toggle(param, v)} style={chip(has(params, param, v))}>{v}</span>)}
          </div>
        )}
      </div>
    );
  };

  // vertical checkbox list, scrolls when long (used for dimensions & multi-value facets)
  const List = ({ title, param, values }: { title: string; param: string; values: string[] }) => {
    if (values.length <= 1) return null;
    const open = openSections.has(title);
    const count = values.filter((v) => has(params, param, v)).length;
    return (
      <div style={sectionStyle}>
        <FacetHead title={title} count={count} open={open} onClick={() => toggleSection(title)} />
        {open && (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
          {values.map((v) => {
            const on = has(params, param, v);
            return (
              <label key={v} onClick={() => toggle(param, v)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', cursor: 'pointer', fontSize: 13, fontWeight: on ? 600 : 400 }}>
                <span style={checkBox(on)}>{on && <Tick />}</span>{v}
              </label>
            );
          })}
        </div>
        )}
      </div>
    );
  };

  const clearAll = () => {
    sessionStorage.removeItem(FILTER_STORAGE_KEY);
    router.push(pathname);
  };

  return (
    <aside className="filter-rail thin-scroll" style={{ background: 'var(--surface)', borderRadius: 22, padding: '10px 22px 22px' }}>
      {/* catalog-wide search */}
      <form onSubmit={submitSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 12, height: 42, padding: '0 6px 0 12px', margin: '12px 0 4px' }}>
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search all tools…" style={{ border: 0, background: 'transparent', height: '100%', flex: 1, fontSize: 13, minWidth: 0, outline: 'none' }} />
        <button type="submit" aria-label="Search" style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--green)', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff', flex: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 6px' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Filters</span>
        <span
          onClick={anyFilter ? clearAll : undefined}
          style={{
            cursor: anyFilter ? 'pointer' : 'default', fontSize: 12, fontWeight: 600,
            color: anyFilter ? 'var(--muted-2)' : 'rgba(43,42,38,.28)',
          }}
        >
          Clear all
        </span>
      </div>

      {/* site-wide category nav — single-select, so these navigate directly
          (like Subcategory below) rather than behaving like filter checkboxes.
          Collapsed by default to a dropdown-style header showing just the
          current pick, since the full list can run long and isn't useful
          once a choice is already made. */}
      {catNav && catNav.tops.length > 0 && (
        <>
          <div style={sectionStyle}>
            <DropHead title="Category" value={activeTopName} open={catOpen} onClick={() => setCatOpen((v) => !v)} />
            {catOpen && catNav.tops.map((t) => {
              const on = t.slug === activeTop;
              return (
                <Link key={t.slug} href={`/category/${t.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', fontSize: 13, fontWeight: on ? 600 : 400, color: on ? 'var(--green)' : 'var(--color-text)', textDecoration: 'none' }}>
                  <span style={radio(on)}>{on && <RadioDot />}</span>{t.name}
                </Link>
              );
            })}
          </div>
          {subs.length > 0 && (
            <div style={sectionStyle}>
              <DropHead title="Subcategory" value={activeSubName} open={subOpen} onClick={() => setSubOpen((v) => !v)} />
              {subOpen && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Link href={`/category/${activeTop}`} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 4px', borderRadius: 8, fontSize: 13, fontWeight: onHub ? 600 : 400, color: onHub ? 'var(--green)' : 'var(--color-text)', textDecoration: 'none' }}>
                  <span style={radio(onHub)}>{onHub && <RadioDot />}</span>All {activeTopName}
                </Link>
                {subs.map((c) => {
                  const active = catNav.activeSlugs.includes(c.slug);
                  return (
                    <Link key={c.slug} href={`/category/${c.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 4px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--green)' : 'var(--color-text)', textDecoration: 'none' }}>
                      <span style={radio(active)}>{active && <RadioDot />}</span>{c.name}
                    </Link>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </>
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

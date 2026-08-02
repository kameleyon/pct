'use client';
import { useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const SORTS: [string, string][] = [
  ['date_desc', 'Newest first'],
  ['date_asc', 'Oldest first'],
  ['total_desc', 'Total: high to low'],
  ['total_asc', 'Total: low to high'],
];

const input: React.CSSProperties = { height: 40, minWidth: 280, flex: 1, background: '#fff', border: '1px solid rgba(43,42,38,.16)', borderRadius: 10, padding: '0 14px', fontSize: 13.5, outline: 'none' };
const select: React.CSSProperties = { height: 40, borderRadius: 10, border: '1px solid rgba(43,42,38,.16)', padding: '0 12px', fontSize: 13.5, background: '#fff', cursor: 'pointer' };

export function OrdersFilterBar({ q: initialQ, sort }: { q: string; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) { if (!v) params.delete(k); else params.set(k, v); }
    params.delete('page');
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  const onQChange = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push({ q: v || undefined }), 400);
  };

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
      <input
        style={input}
        placeholder="Search by order ID, name, email, or phone…"
        value={q}
        onChange={(e) => onQChange(e.target.value)}
      />
      <select style={select} value={sort} onChange={(e) => push({ sort: e.target.value === 'date_desc' ? undefined : e.target.value })}>
        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

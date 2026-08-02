import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { RoleSelect } from '@/components/admin/RoleSelect';

export const dynamic = 'force-dynamic';

const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted-2)', padding: '10px 12px', fontWeight: 700, position: 'sticky', top: 0, background: 'var(--color-surface)' };
const td: React.CSSProperties = { padding: '12px', fontSize: 13.5, borderTop: '1px solid rgba(43,42,38,.07)', verticalAlign: 'middle' };

export default async function AdminMembersPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const { data: users } = await sb.from('profiles').select('id,full_name,role,created_at').order('created_at', { ascending: false }).limit(200);

  return (
    <main className="wrap" style={{ padding: '24px 24px 64px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Members ({users?.length ?? 0})</h1>
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, overflow: 'auto', border: '1px solid rgba(43,42,38,.08)', maxHeight: 640 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead><tr><th style={th}>Name</th><th style={th}>User ID</th><th style={th}>Role</th></tr></thead>
          <tbody>
            {(users ?? []).map((u: any) => (
              <tr key={u.id}>
                <td style={td}>{u.full_name || <span style={{ color: 'var(--muted-2)' }}>—</span>}</td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 11.5, color: 'var(--muted-2)' }}>{u.id.slice(0, 8)}…</td>
                <td style={td}><RoleSelect userId={u.id} role={u.role} /></td>
              </tr>
            ))}
            {(!users || users.length === 0) && <tr><td style={{ ...td, color: 'var(--muted-2)' }} colSpan={3}>No members yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}

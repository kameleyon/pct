import { createSupabaseServer } from './supabase-server';
import type { Role, Session } from './roles';

export type { Role, Session } from './roles';
export { roleLabel } from './roles';

/** Current auth session with role (guest when not signed in). */
export async function getSession(): Promise<Session> {
  try {
    const sb = await createSupabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { userId: null, email: null, fullName: null, role: 'guest' };
    const { data: profile } = await sb
      .from('profiles')
      .select('full_name,role')
      .eq('id', user.id)
      .single();
    return {
      userId: user.id,
      email: user.email ?? null,
      fullName: (profile?.full_name as string) || (user.user_metadata?.full_name as string) || null,
      role: ((profile?.role as Role) ?? 'member'),
    };
  } catch {
    return { userId: null, email: null, fullName: null, role: 'guest' };
  }
}

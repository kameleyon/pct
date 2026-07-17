'use server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { Role } from '@/lib/roles';

const ROLES = new Set<Role>(['member', 'vip', 'admin']);
const ORDER_STATUSES = new Set(['quote_requested', 'pending', 'paid', 'shipped', 'cancelled']);

/** Admin-only: change a member's role. Enforced here AND by RLS + the role-guard trigger. */
export async function setUserRoleAction(userId: string, role: Exclude<Role, 'guest'>): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!ROLES.has(role)) return { ok: false, error: 'Invalid role.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('profiles').update({ role }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: advance an order's status. Enforced here AND by RLS (owners are SELECT/INSERT-only). */
export async function setOrderStatusAction(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session.role !== 'admin') return { ok: false, error: 'Forbidden.' };
  if (!ORDER_STATUSES.has(status)) return { ok: false, error: 'Invalid status.' };

  const sb = await createSupabaseServer();
  const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

'use server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Role } from '@/lib/auth';

/** Admin-only: change a member's role. RLS enforces the caller is admin. */
export async function setUserRoleAction(userId: string, role: Exclude<Role, 'guest'>): Promise<{ ok: boolean; error?: string }> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };
  const { error } = await sb.from('profiles').update({ role }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

/** Admin-only: advance an order's status. */
export async function setOrderStatusAction(orderId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const sb = await createSupabaseServer();
  const { error } = await sb.from('orders').update({ status }).eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

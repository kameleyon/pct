'use server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export type ActionResult = { ok?: boolean; error?: string; needsVerify?: boolean; email?: string };

export async function signUpAction(email: string, password: string, fullName: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };
  // If email confirmation is on, there is no session yet → verify with the emailed code.
  if (!data.session) return { ok: true, needsVerify: true, email };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function verifyOtpAction(email: string, token: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { error } = await sb.auth.verifyOtp({ email, token, type: 'signup' });
  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resendSignupOtp(email: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { error } = await sb.auth.resend({ type: 'signup', email });
  return error ? { error: error.message } : { ok: true };
}

export async function signInAction(email: string, password: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    // surface the "please verify" case so the UI can jump to the code step
    if (/confirm|verify/i.test(error.message)) return { error: error.message, needsVerify: true, email };
    return { error: error.message };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function signOutAction(): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  await sb.auth.signOut();
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function requestResetAction(email: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { error } = await sb.auth.resetPasswordForEmail(email);
  return error ? { error: error.message } : { ok: true, email };
}

export async function verifyRecoveryAction(email: string, token: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { error } = await sb.auth.verifyOtp({ email, token, type: 'recovery' });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updatePasswordAction(newPassword: string): Promise<ActionResult> {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

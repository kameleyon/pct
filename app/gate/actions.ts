'use server';

import { cookies } from 'next/headers';
import { sha256Hex, SITE_GATE_COOKIE } from '@/lib/site-gate';

export async function unlockSiteAction(password: string): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.SITE_GATE_PASSWORD;
  if (!expected) return { ok: true }; // gate disabled — nothing to unlock

  if (password !== expected) return { ok: false, error: 'Incorrect password.' };

  (await cookies()).set(SITE_GATE_COOKIE, await sha256Hex(expected), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return { ok: true };
}

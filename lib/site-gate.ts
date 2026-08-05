// Web Crypto (not node:crypto) so this works in both the Edge middleware
// runtime and the Node runtime server actions run in.
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const SITE_GATE_COOKIE = 'pct_gate';

// Paths that must stay reachable even when the site is gated: the gate page
// itself (and its server action, which posts back to the same path), and all
// API routes (Stripe's webhook calls in from Stripe's servers, not a
// cookie-carrying browser, and must never be blocked).
export function isGateExemptPath(pathname: string): boolean {
  return pathname === '/gate' || pathname.startsWith('/api/');
}

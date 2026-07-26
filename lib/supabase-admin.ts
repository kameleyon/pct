import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. Use ONLY in trusted server contexts
// (e.g. the Stripe webhook, verified by signature). Never expose to the client.
let _admin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase service-role env vars are not set');
    _admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _admin;
}

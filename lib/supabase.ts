import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazily create the public (anon, RLS-enforced) client so a missing env var
// surfaces as a clear error WHEN USED — not a cryptic throw at module import
// (which would take down unrelated pages like /_not-found during the build).
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        '(in .env.local locally, and in the Vercel project settings for deploys).'
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

import { createClient } from '@supabase/supabase-js';

// Public, RLS-enforced client (anon key). Catalog reads only — safe on server & client.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

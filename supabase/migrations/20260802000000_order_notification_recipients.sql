-- ============================================================
--  Admin-managed order notification recipients (replaces the
--  ORDER_NOTIFICATION_EMAILS env var — admin can now add/remove
--  recipients from the dashboard without touching Vercel).
-- ============================================================

create table if not exists public.order_notification_recipients (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table public.order_notification_recipients enable row level security;
drop policy if exists "admin order notification recipients" on public.order_notification_recipients;
create policy "admin order notification recipients" on public.order_notification_recipients
  for all using (public.is_admin()) with check (public.is_admin());
-- Deliberately no select policy for anyone else — RLS defaults to deny;
-- the webhook reads this via the service-role client, which bypasses RLS.

-- ============================================================
--  RFQ -> Quote -> PO -> (Escrow | Credit) -> Invoice -> Payment ->
--  Delivery -> Closed workflow.
--
--  Site currently runs quote-only (no retail checkout), but the retail
--  columns/statuses ('pending','paid','shipped') and the Stripe cart-checkout
--  code path are left fully intact so retail can be switched back on later
--  without a schema migration. This migration only *extends* orders, it
--  never removes or renames existing columns/values.
-- ============================================================

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in (
  'quote_requested', 'quoted', 'po_issued', 'closed',
  'pending', 'paid', 'shipped', 'cancelled'
));

alter table public.orders add column if not exists quoted_at timestamptz;

alter table public.orders add column if not exists po_number text;
alter table public.orders add column if not exists po_issued_at timestamptz;

alter table public.orders add column if not exists payment_method_type text
  check (payment_method_type in ('escrow', 'direct'));

alter table public.orders add column if not exists escrow_required boolean;
alter table public.orders add column if not exists escrow_reason text;
alter table public.orders add column if not exists escrow_decided_by uuid references auth.users(id);
alter table public.orders add column if not exists escrow_decided_at timestamptz;
alter table public.orders add column if not exists escrow_status text not null default 'not_applicable'
  check (escrow_status in ('not_applicable', 'pending', 'funded', 'held', 'released', 'disputed'));

alter table public.orders add column if not exists credit_status text not null default 'not_applicable'
  check (credit_status in ('not_applicable', 'pending_vetting', 'approved', 'denied'));
alter table public.orders add column if not exists credit_decided_by uuid references auth.users(id);
alter table public.orders add column if not exists credit_decided_at timestamptz;

alter table public.orders add column if not exists invoice_status text not null default 'not_sent'
  check (invoice_status in ('not_sent', 'sent'));
alter table public.orders add column if not exists invoiced_at timestamptz;

alter table public.orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'paid'));
alter table public.orders add column if not exists paid_at timestamptz;

alter table public.orders add column if not exists delivery_status text not null default 'not_shipped'
  check (delivery_status in ('not_shipped', 'shipped', 'delivered'));
alter table public.orders add column if not exists delivered_at timestamptz;

alter table public.orders add column if not exists closed_at timestamptz;

-- ---- order_events: audit trail for every branching decision (who/when) ----
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  detail     jsonb,
  actor_id   uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_order_events_order on public.order_events(order_id, created_at);

alter table public.order_events enable row level security;
drop policy if exists "own order events read" on public.order_events;
create policy "own order events read" on public.order_events for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or public.is_admin()))
);
drop policy if exists "admin order events" on public.order_events;
create policy "admin order events" on public.order_events for all using (public.is_admin()) with check (public.is_admin());
-- No insert policy for regular users — events are only ever written by
-- verified server actions / the Stripe webhook via the service-role client,
-- same pattern as affiliate_commissions.

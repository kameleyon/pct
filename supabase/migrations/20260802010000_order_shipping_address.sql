-- ============================================================
--  Capture the shipping address Stripe collects at checkout, plus a
--  snapshotted delivery-window estimate (computed once, at payment time,
--  from a static FL-origin zone table -- see lib/shipping.ts).
-- ============================================================

alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists estimated_delivery_earliest date;
alter table public.orders add column if not exists estimated_delivery_latest date;

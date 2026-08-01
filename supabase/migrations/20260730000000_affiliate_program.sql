-- ============================================================
--  Affiliate program.
--
--  Mechanics (confirmed with the site owner before this was written):
--   - Affiliates apply, get reviewed, and (once approved) get a unique
--     referral link. Payouts go through Stripe Connect — no bank details
--     are ever stored in our own database.
--   - A referred sale is logged to the affiliate's portal immediately as
--     'pending', but isn't claimable until a configurable maturity period
--     passes (default 30 days) — protects against refunds/chargebacks.
--   - Once matured ('available'), the affiliate must manually request the
--     payout within a configurable expiry window (default 90 days) or it
--     is forfeited back to the website. This is tracked per commission,
--     not per account.
--   - The affiliate's cut is resolved per order line item through a
--     4-level override ladder (most specific wins):
--       1. default percent (site-wide fallback)
--       2. category percent
--       3. product percent
--       4. product fixed dollar amount
--     These rates are private — communicated to each affiliate by email,
--     never surfaced anywhere in the UI.
--   - Whatever remains after the affiliate's cut is split between
--     MasterCut (the manufacturer) and the website by a flat configurable
--     percentage. MasterCut's cost/share is never visible to anyone but
--     admin — it lives in a separate table with no non-admin RLS policy
--     at all, so it can never leak through a row the affiliate can select.
--
--  Admin visibility into ALL affiliates'/customers' sales in one place is
--  a later phase — this migration only adds the minimal approve/reject +
--  rate/config management surface needed to run the program.
-- ============================================================

-- ---- affiliate_profiles: one row per applicant ----
create table if not exists public.affiliate_profiles (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null unique references auth.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  referral_code text not null unique,
  stripe_connect_account_id text,
  applied_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_affiliate_profiles_code on public.affiliate_profiles(referral_code);
drop trigger if exists trg_affiliate_profiles_updated on public.affiliate_profiles;
create trigger trg_affiliate_profiles_updated before update on public.affiliate_profiles
  for each row execute function public.set_updated_at();

-- Only admins may change an application's status (mirrors the profiles role guard).
create or replace function public.enforce_affiliate_status_admin_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.is_admin() then
    raise exception 'Only admins can change an affiliate application status' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_affiliate_status_guard on public.affiliate_profiles;
create trigger trg_affiliate_status_guard
  before update on public.affiliate_profiles
  for each row execute function public.enforce_affiliate_status_admin_only();

alter table public.affiliate_profiles enable row level security;
drop policy if exists "own affiliate profile read" on public.affiliate_profiles;
create policy "own affiliate profile read" on public.affiliate_profiles
  for select using (profile_id = auth.uid());
drop policy if exists "own affiliate profile insert" on public.affiliate_profiles;
create policy "own affiliate profile insert" on public.affiliate_profiles
  for insert with check (profile_id = auth.uid() and status = 'pending');
drop policy if exists "own affiliate profile update" on public.affiliate_profiles;
create policy "own affiliate profile update" on public.affiliate_profiles
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "admin affiliate profiles" on public.affiliate_profiles;
create policy "admin affiliate profiles" on public.affiliate_profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- affiliate_commission_rates: the 4-level override ladder for the
--      AFFILIATE's cut only. Admin-only — never exposed to any other role,
--      not even the affiliate it applies to (communicated by email instead).
create table if not exists public.affiliate_commission_rates (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  product_id  uuid references public.products(id) on delete cascade,
  percent     numeric(5,2),
  fixed_amount numeric(10,2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint chk_affiliate_rate_shape check (
    (product_id is not null and category_id is null and (percent is not null or fixed_amount is not null))
    or (product_id is null and category_id is not null and percent is not null and fixed_amount is null)
    or (product_id is null and category_id is null and percent is not null and fixed_amount is null)
  )
);
-- one row per product, one row per category, and exactly one default (both null) row
create unique index if not exists uq_affiliate_rate_product on public.affiliate_commission_rates(product_id) where product_id is not null;
create unique index if not exists uq_affiliate_rate_category on public.affiliate_commission_rates(category_id) where product_id is null and category_id is not null;
create unique index if not exists uq_affiliate_rate_default on public.affiliate_commission_rates((true)) where product_id is null and category_id is null;

insert into public.affiliate_commission_rates (percent)
select 10
where not exists (select 1 from public.affiliate_commission_rates where product_id is null and category_id is null);

drop trigger if exists trg_affiliate_rates_updated on public.affiliate_commission_rates;
create trigger trg_affiliate_rates_updated before update on public.affiliate_commission_rates
  for each row execute function public.set_updated_at();

alter table public.affiliate_commission_rates enable row level security;
drop policy if exists "admin affiliate rates" on public.affiliate_commission_rates;
create policy "admin affiliate rates" on public.affiliate_commission_rates
  for all using (public.is_admin()) with check (public.is_admin());
-- Deliberately no select policy for anyone else — RLS defaults to deny.

-- ---- affiliate_config: singleton settings row ----
-- manufacturer_pct/website_pct split whatever remains AFTER the affiliate's
-- cut (resolved per line item via affiliate_commission_rates above), not
-- the whole sale. Defaults are placeholders for the admin to tune.
create table if not exists public.affiliate_config (
  id                smallint primary key default 1 check (id = 1),
  manufacturer_pct  numeric(5,2) not null default 50,
  website_pct       numeric(5,2) not null default 50,
  maturity_days     integer not null default 30,
  expiry_days       integer not null default 90,
  payout_threshold  numeric(10,2) not null default 100,
  mastercut_stripe_account_id text,
  website_reserve_stripe_account_id text,
  updated_at        timestamptz not null default now(),
  constraint chk_affiliate_config_split_100 check (manufacturer_pct + website_pct = 100)
);
insert into public.affiliate_config (id) values (1) on conflict (id) do nothing;
drop trigger if exists trg_affiliate_config_updated on public.affiliate_config;
create trigger trg_affiliate_config_updated before update on public.affiliate_config
  for each row execute function public.set_updated_at();

alter table public.affiliate_config enable row level security;
drop policy if exists "admin affiliate config" on public.affiliate_config;
create policy "admin affiliate config" on public.affiliate_config
  for all using (public.is_admin()) with check (public.is_admin());
-- No select policy for anyone else: manufacturer_pct and the MasterCut
-- Stripe account id must never be visible outside admin. The portal gets
-- only payout_threshold/maturity_days/expiry_days via a server action
-- using the service-role client, never a direct table read.

-- ---- orders: attribute an order to the affiliate whose link brought the buyer ----
alter table public.orders add column if not exists referral_code text;
alter table public.orders add column if not exists affiliate_id uuid references public.affiliate_profiles(id) on delete set null;

-- ---- affiliate_payouts: a batch of matured commissions an affiliate requested ----
create table if not exists public.affiliate_payouts (
  id                uuid primary key default gen_random_uuid(),
  affiliate_id      uuid not null references public.affiliate_profiles(id) on delete cascade,
  amount            numeric(10,2) not null,
  status            text not null default 'requested' check (status in ('requested', 'paid', 'failed')),
  requested_at      timestamptz not null default now(),
  paid_at           timestamptz,
  stripe_transfer_id text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_affiliate_payouts_affiliate on public.affiliate_payouts(affiliate_id);

alter table public.affiliate_payouts enable row level security;
drop policy if exists "own payouts read" on public.affiliate_payouts;
create policy "own payouts read" on public.affiliate_payouts
  for select using (
    exists (select 1 from public.affiliate_profiles ap where ap.id = affiliate_id and ap.profile_id = auth.uid())
  );
drop policy if exists "admin payouts" on public.affiliate_payouts;
create policy "admin payouts" on public.affiliate_payouts
  for all using (public.is_admin()) with check (public.is_admin());
-- No client insert/update: requesting a payout is a verified server action
-- (ownership + maturity + threshold checked in app code) run with the
-- service-role client, same pattern as order status transitions.

-- ---- affiliate_commissions: one row per paid, referred order (affiliate-visible) ----
create table if not exists public.affiliate_commissions (
  id               uuid primary key default gen_random_uuid(),
  affiliate_id     uuid not null references public.affiliate_profiles(id) on delete cascade,
  order_id         uuid not null unique references public.orders(id) on delete cascade,
  sale_amount      numeric(10,2) not null,
  affiliate_amount numeric(10,2) not null,
  status           text not null default 'pending' check (status in ('pending', 'available', 'requested', 'paid', 'expired', 'reversed')),
  matures_at       timestamptz not null,
  expires_at       timestamptz not null,
  payout_id        uuid references public.affiliate_payouts(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists idx_affiliate_commissions_affiliate on public.affiliate_commissions(affiliate_id, status);

alter table public.affiliate_commissions enable row level security;
drop policy if exists "own commissions read" on public.affiliate_commissions;
create policy "own commissions read" on public.affiliate_commissions
  for select using (
    exists (select 1 from public.affiliate_profiles ap where ap.id = affiliate_id and ap.profile_id = auth.uid())
  );
drop policy if exists "admin commissions" on public.affiliate_commissions;
create policy "admin commissions" on public.affiliate_commissions
  for all using (public.is_admin()) with check (public.is_admin());
-- No insert/update policy for regular users: commissions are only ever
-- written by the Stripe webhook / verified server actions via the
-- service-role client.

-- ---- affiliate_commission_costs: the MasterCut/website split (admin-only,
--      lives in its own table so it can never leak through a row an
--      affiliate is allowed to select) ----
create table if not exists public.affiliate_commission_costs (
  id                  uuid primary key default gen_random_uuid(),
  commission_id       uuid not null unique references public.affiliate_commissions(id) on delete cascade,
  manufacturer_amount numeric(10,2) not null,
  website_amount      numeric(10,2) not null,
  created_at          timestamptz not null default now()
);

alter table public.affiliate_commission_costs enable row level security;
drop policy if exists "admin commission costs" on public.affiliate_commission_costs;
create policy "admin commission costs" on public.affiliate_commission_costs
  for all using (public.is_admin()) with check (public.is_admin());
-- Deliberately no select policy for anyone else — RLS defaults to deny.

-- ---- lazily flip pending → available / expired (no cron infra needed —
--      called opportunistically from the portal/admin server actions) ----
create or replace function public.refresh_affiliate_commission_statuses()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.affiliate_commissions
    set status = 'available'
    where status = 'pending' and matures_at <= now();
  update public.affiliate_commissions
    set status = 'expired'
    where status in ('pending', 'available') and expires_at <= now();
end $$;

-- ---- claw back a commission if its order is cancelled/refunded before the
--      affiliate has requested or been paid ----
create or replace function public.reverse_commission_on_order_cancel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.affiliate_commissions
      set status = 'reversed'
      where order_id = new.id and status in ('pending', 'available');
  end if;
  return new;
end $$;
drop trigger if exists trg_orders_reverse_commission on public.orders;
create trigger trg_orders_reverse_commission
  after update on public.orders
  for each row execute function public.reverse_commission_on_order_cancel();

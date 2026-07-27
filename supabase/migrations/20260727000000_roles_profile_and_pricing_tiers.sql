-- ============================================================
--  Roles + richer customer profile + tier-aware pricing foundation.
--
--  Extends roles to make room for the affiliate and distributor
--  programs (their own application/approval/referral and wholesale-
--  pricing workflows come in later phases — this just reserves the
--  role values and the pricing-tier table so those builds are
--  additive, not a schema rework).
-- ============================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('member', 'vip', 'admin', 'affiliate', 'distributor'));

-- Richer profile fields, captured at signup, for a fuller customer record.
alter table public.profiles add column if not exists address_line1 text;
alter table public.profiles add column if not exists address_line2 text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state_region text;
alter table public.profiles add column if not exists postal_code text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists how_heard text;
alter table public.profiles add column if not exists marketing_opt_in boolean not null default false;

-- Pricing tier a profile buys at — 'retail' today; 'distributor' (and any
-- future tier) plugs into price_overrides below without touching checkout,
-- product page, or cart logic later.
alter table public.profiles add column if not exists price_tier text not null default 'retail'
  check (price_tier in ('retail', 'distributor'));

-- Per-tier price overrides. Empty/unused until the distributor program
-- ships; getProductPrice() (or equivalent) can look here first and fall
-- back to products.price/sale_price when no override exists.
create table if not exists public.price_overrides (
  id          uuid primary key default gen_random_uuid(),
  tier        text not null check (tier in ('distributor')),
  product_id  uuid not null references public.products(id) on delete cascade,
  price       numeric(10,2),
  sale_price  numeric(10,2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tier, product_id)
);
drop trigger if exists trg_price_overrides_updated on public.price_overrides;
create trigger trg_price_overrides_updated before update on public.price_overrides
  for each row execute function public.set_updated_at();

alter table public.price_overrides enable row level security;
drop policy if exists "admin price overrides" on public.price_overrides;
create policy "admin price overrides" on public.price_overrides for all
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "read price overrides" on public.price_overrides;
create policy "read price overrides" on public.price_overrides for select using (true);

-- Capture the extra signup fields (passed through auth signUp's user_metadata)
-- into the new profile columns in the same insert the trigger already does.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, full_name, role, phone, company, address_line1, address_line2,
    city, state_region, postal_code, country, job_title, how_heard, marketing_opt_in
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when lower(new.email) = 'josinsidevoice@gmail.com' then 'admin' else 'member' end,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'company', ''),
    nullif(new.raw_user_meta_data->>'address_line1', ''),
    nullif(new.raw_user_meta_data->>'address_line2', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'state_region', ''),
    nullif(new.raw_user_meta_data->>'postal_code', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    nullif(new.raw_user_meta_data->>'job_title', ''),
    nullif(new.raw_user_meta_data->>'how_heard', ''),
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;

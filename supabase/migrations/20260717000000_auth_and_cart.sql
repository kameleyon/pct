-- ============================================================
--  Auth roles (member / vip / admin) + cart & order tables.
-- ============================================================

-- ---- roles: customer → member; allow member/vip/admin ----
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'member' where role = 'customer';
alter table public.profiles alter column role set default 'member';
alter table public.profiles add constraint profiles_role_check check (role in ('member', 'vip', 'admin'));

-- auto-provision profile on signup; bootstrap the admin account by email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when lower(new.email) = 'josinsidevoice@gmail.com' then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ---- carts ----
create table if not exists public.carts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null unique references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_carts_updated on public.carts;
create trigger trg_carts_updated before update on public.carts for each row execute function public.set_updated_at();

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  added_at    timestamptz not null default now(),
  unique (cart_id, product_id)
);
create index if not exists idx_cart_items_cart on public.cart_items(cart_id);

-- ---- orders ----
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'quote_requested' check (status in ('quote_requested','pending','paid','shipped','cancelled')),
  subtotal     numeric(10,2), tax numeric(10,2), shipping numeric(10,2), total numeric(10,2),
  contact      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_orders_profile on public.orders(profile_id);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  part_number  text not null,
  name         text not null,
  unit_price   numeric(10,2),
  quantity     integer not null default 1
);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ---- RLS: owner-scoped, admin-all ----
alter table public.carts       enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "own cart" on public.carts;
create policy "own cart" on public.carts for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "admin carts" on public.carts;
create policy "admin carts" on public.carts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own cart items" on public.cart_items;
create policy "own cart items" on public.cart_items for all
  using (exists (select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid()));

drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "admin orders" on public.orders;
create policy "admin orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own order items" on public.order_items;
create policy "own order items" on public.order_items for all
  using (exists (select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid()));

-- ============================================================
--  Auth hardening: close privilege-escalation & order-status
--  business-logic bypass holes in RLS.
-- ============================================================

-- ---- 1. profiles: pin the `role` column so only admins can change it ----
-- The "self update profile" policy lets a user edit their own row (name, etc.),
-- but WITH CHECK cannot see the OLD row, so it can't stop a self-escalation to
-- role='admin'. Enforce it with a BEFORE UPDATE trigger instead.
create or replace function public.enforce_role_change_admin_only()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a role' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_role_guard on public.profiles;
create trigger trg_profiles_role_guard
  before update on public.profiles
  for each row execute function public.enforce_role_change_admin_only();

-- ---- 2. orders: owners may create quote requests & read their orders, but
--         NOT change status/totals or delete. Admin keeps full control. ----
drop policy if exists "own orders" on public.orders;

drop policy if exists "own orders read" on public.orders;
create policy "own orders read" on public.orders
  for select using (profile_id = auth.uid());

drop policy if exists "own orders insert" on public.orders;
create policy "own orders insert" on public.orders
  for insert with check (profile_id = auth.uid() and status = 'quote_requested');

-- ---- 3. order_items: owners may read & add lines to their own orders only;
--         no owner UPDATE/DELETE. Admin keeps full control via "admin orders". ----
drop policy if exists "own order items" on public.order_items;

drop policy if exists "own order items read" on public.order_items;
create policy "own order items read" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.profile_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "own order items insert" on public.order_items;
create policy "own order items insert" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.profile_id = auth.uid())
  );

drop policy if exists "admin order items" on public.order_items;
create policy "admin order items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

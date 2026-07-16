-- ============================================================
--  Row-Level Security — default deny; explicit grants.
--  Catalog is public-read; writes are admin-only.
--  Bulk import runs as service_role/postgres and bypasses RLS.
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.manufacturers       enable row level security;
alter table public.categories          enable row level security;
alter table public.category_attributes enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;

-- ---------- public read (catalog) ----------
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (is_active = true);

drop policy if exists "public read category_attributes" on public.category_attributes;
create policy "public read category_attributes" on public.category_attributes
  for select using (true);

drop policy if exists "public read manufacturers" on public.manufacturers;
create policy "public read manufacturers" on public.manufacturers
  for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products
  for select using (is_active = true);

drop policy if exists "public read product_images" on public.product_images;
create policy "public read product_images" on public.product_images
  for select using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active)
  );

-- ---------- admin full write ----------
drop policy if exists "admin all categories" on public.categories;
create policy "admin all categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all category_attributes" on public.category_attributes;
create policy "admin all category_attributes" on public.category_attributes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all manufacturers" on public.manufacturers;
create policy "admin all manufacturers" on public.manufacturers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all products" on public.products;
create policy "admin all products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all product_images" on public.product_images;
create policy "admin all product_images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- profiles: self-scoped + admin ----------
drop policy if exists "self read profile" on public.profiles;
create policy "self read profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "self update profile" on public.profiles;
create policy "self update profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "admin manage profiles" on public.profiles;
create policy "admin manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

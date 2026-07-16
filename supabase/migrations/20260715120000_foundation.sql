-- ============================================================
--  PCT catalog foundation — extensions, helpers, catalog schema
--  Idempotent-ish: safe to run on a blank public schema.
-- ============================================================
set check_function_bodies = off;

create extension if not exists pgcrypto;   -- gen_random_uuid (also built-in on PG15)

-- ---------- helper: updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'customer' check (role in ('customer','admin')),
  company     text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- helper: is_admin (SECURITY DEFINER reads profiles under RLS) ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- auto-create a profile when an auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;
do $$
begin
  execute 'create trigger on_auth_user_created after insert on auth.users
           for each row execute function public.handle_new_user()';
exception when others then
  raise notice 'auth.users trigger not installed (insufficient privilege): %', sqlerrm;
end $$;

-- ---------- manufacturers ----------
create table if not exists public.manufacturers (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  logo_url   text,
  created_at timestamptz not null default now()
);

-- ---------- categories (self-referencing hierarchy) ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  parent_id   uuid references public.categories(id) on delete set null,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_categories_parent on public.categories(parent_id);
drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------- category_attributes (spec metadata: drives import + filter UI) ----------
create table if not exists public.category_attributes (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories(id) on delete cascade,
  key           text not null,
  label         text not null,
  data_type     text not null check (data_type in ('numeric','integer','text','boolean','enum')),
  unit          text,
  enum_values   jsonb,
  is_filterable boolean not null default true,
  is_required   boolean not null default false,
  sort_order    int not null default 0,
  unique (category_id, key)
);
create index if not exists idx_category_attributes_category on public.category_attributes(category_id);

-- ---------- products ----------
create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  part_number         text not null unique,
  slug                text not null unique,
  category_id         uuid not null references public.categories(id),
  manufacturer_id     uuid references public.manufacturers(id),
  name                text not null,
  description         text,
  measurement_system  text not null check (measurement_system in ('Imperial','Metric')),
  flutes              smallint,
  coating             text not null default 'Uncoated',
  material            text not null default 'Carbide',
  specs               jsonb not null default '{}'::jsonb,
  price               numeric(10,2),
  sale_price          numeric(10,2),
  discount_percentage numeric generated always as (
    case when price is not null and price > 0 and sale_price is not null
         then round((price - sale_price) / price * 100, 0)
         else null end
  ) stored,
  stock_quantity      integer not null default 0,
  primary_image_url   text,
  is_active           boolean not null default true,
  vendor_id           uuid,                    -- future: vendor ownership (RLS-ready)
  search_vector       tsvector,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_sale_le_price check (sale_price is null or price is null or sale_price <= price)
);
create index if not exists idx_products_category     on public.products(category_id);
create index if not exists idx_products_manufacturer  on public.products(manufacturer_id);
create index if not exists idx_products_active        on public.products(is_active);
create index if not exists idx_products_flutes        on public.products(flutes);
create index if not exists idx_products_coating       on public.products(coating);
create index if not exists idx_products_measurement   on public.products(measurement_system);
create index if not exists idx_products_specs_gin     on public.products using gin (specs);
create index if not exists idx_products_search        on public.products using gin (search_vector);
create index if not exists idx_products_od_in         on public.products (((specs->>'od_in')::numeric));
create index if not exists idx_products_oal_in        on public.products (((specs->>'oal_in')::numeric));

-- ---------- search_vector maintenance ----------
create or replace function public.products_search_vector()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
      setweight(to_tsvector('simple',  coalesce(new.part_number,'')), 'A')
    || setweight(to_tsvector('english', coalesce(new.name,'')), 'B')
    || setweight(to_tsvector('english', coalesce(new.description,'')), 'C')
    || setweight(to_tsvector('simple',  coalesce(new.coating,'') || ' ' || coalesce(new.material,'')), 'C');
  return new;
end $$;
drop trigger if exists trg_products_search on public.products;
create trigger trg_products_search before insert or update
  of part_number, name, description, coating, material
  on public.products for each row execute function public.products_search_vector();
drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- product_images ----------
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_product_images_product on public.product_images(product_id);

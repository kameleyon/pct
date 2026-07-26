-- ============================================================
--  1. Price the 6-Flute Square End Mills (size-based, retail-styled).
--  2. Allow guest checkout — orders no longer require a profile.
-- ============================================================

-- Size-based price: floor($20 + diameter*130) + .99  (e.g. 1/8" ≈ $35.99, 1" ≈ $147.99)
update public.products
set price = floor((specs->>'od_in')::numeric * 130 + 20) + 0.99
where category_id = (select id from public.categories where slug = '6-flute-square-end-mills')
  and specs ? 'od_in';

-- Guest orders: profile_id may be null (checkout runs via the service-role client).
alter table public.orders alter column profile_id drop not null;

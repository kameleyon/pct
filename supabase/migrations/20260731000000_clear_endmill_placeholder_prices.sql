-- ============================================================
--  Clear the placeholder End Mill prices pushed for testing
--  (20260730010000_placeholder_retail_pricing.sql). Both End Mill
--  families — "High Performance End Mills" and the plain "End Mills"
--  hub (including 6-flute-square-end-mills, priced separately by an
--  earlier migration) — go back to null (Request a Quote) until real
--  MasterCut pricing exists.
-- ============================================================

update public.products
set price = null, sale_price = null
where category_id in (
  select id from public.categories
  where slug in ('end-mills', 'high-performance-end-mills')
     or parent_id in (select id from public.categories where slug in ('end-mills', 'high-performance-end-mills'))
);

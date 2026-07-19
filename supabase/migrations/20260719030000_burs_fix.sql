-- ============================================================
--  Corrections to the Burs taxonomy to match the vendor page:
--   - "Bur Shapes" is actually "Carbide Burs" (real bur photo, not a set box)
--   - Bur Routers & Special Application = fiberglass + tire ONLY
--   - Diemills / Piloted Diemills are their own lines under the hub
-- ============================================================

-- 1. Rename the shapes section and give it a real bur cover (was a set photo).
update public.categories
set name = 'Carbide Burs', image_url = '/slots/SD-DC-Bur2.jpg'
where slug = 'bur-shapes';

-- 2. Match the page's exact section name.
update public.categories
set name = 'Bur Routers & Special Application Burs'
where slug = 'bur-routers-special';

-- 3. Diemills & Piloted Diemills leave the routers section and sit directly under the hub.
update public.categories
set parent_id = (select id from public.categories where slug='burs'),
    sort_order = case slug when 'b-diemills' then 4 when 'b-piloted-diemills' then 5 else sort_order end
where slug in ('b-diemills','b-piloted-diemills');

-- 4. De-duplicate the Bur Sets covers (Power Pouch still needs its own photo).
update public.categories set image_url = '/slots/Wood-Box-Bur-Set.jpg'    where slug = 'bs-wood-box';
update public.categories set image_url = '/slots/Plastic-Box-Bur-Set.jpg' where slug = 'bs-plastic-box';
update public.categories set image_url = '/slots/24-piece-Bur-set.jpg'     where slug = 'bs-countertop';
update public.categories set image_url = '/slots/Plastic-Box-Bur-Set.jpg' where slug = 'bs-power-pouch';

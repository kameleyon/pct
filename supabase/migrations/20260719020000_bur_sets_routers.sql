-- ============================================================
--  Add Bur Sets + Bur Routers & Special Application groupings,
--  matching the vendor's three-section layout.
-- ============================================================

-- 1. Bur Sets sub-category
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
values ('bur-sets', 'Bur Sets', (select id from public.categories where slug='burs'), 2,
        'Carbide bur kits — power pouch, plastic box, wood box, and countertop display sets.',
        '/slots/24-piece-Bur-set.jpg')
on conflict (slug) do update set parent_id = excluded.parent_id, sort_order = excluded.sort_order, image_url = excluded.image_url;

insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='bur-sets'), v.so, v.descr, v.img
from (values
 ('bs-power-pouch','Power Pouch Sets',1,'Nylon pouch bur sets and pouches.','/slots/Plastic-Box-Bur-Set.jpg'),
 ('bs-plastic-box','Plastic Box Sets',2,'Plastic-box carbide bur sets.','/slots/Plastic-Box-Bur-Set.jpg'),
 ('bs-wood-box','Wood Box Sets',3,'Wood-box carbide bur sets.','/slots/Wood-Box-Bur-Set.jpg'),
 ('bs-countertop','Countertop Displays',4,'Countertop bur displays and 24-piece sets.','/slots/24-piece-Bur-set.jpg')
) as v(slug,name,so,descr,img)
on conflict (slug) do update set image_url = excluded.image_url, name = excluded.name;

-- 2. Bur Routers & Special Application sub-category; re-parent the special lines under it
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
values ('bur-routers-special', 'Bur Routers & Special Application', (select id from public.categories where slug='burs'), 3,
        'Fiberglass routers, tire burs, and diemills for specialized applications.',
        '/slots/Fiberglass-Router-MillEnd.jpg')
on conflict (slug) do update set parent_id = excluded.parent_id, sort_order = excluded.sort_order, image_url = excluded.image_url;

update public.categories
set parent_id = (select id from public.categories where slug='bur-routers-special'), sort_order = case slug
      when 'b-fiberglass-routers' then 1 when 'b-tire-burs' then 2 when 'b-diemills' then 3 when 'b-piloted-diemills' then 4 else sort_order end
where slug in ('b-fiberglass-routers','b-tire-burs','b-diemills','b-piloted-diemills');

-- ============================================================
--  Seed Burs taxonomy — "Burs & Fiberglass Routing" hub:
--    Bur Shapes (SA–SN) sub-category + Tire Burs, Diemills,
--    Piloted Diemills, Fiberglass Routers lines.
--  (Bur SETS are non-dimensional kits — loaded separately later.)
-- ============================================================

-- 1. Hub
insert into public.categories (slug, name, sort_order, description, image_url)
values ('burs', 'Burs & Fiberglass Routing', 35,
        'Solid carbide burs in ANSI shapes SA–SN, tire burs, diemills, and fiberglass routers — single, double, aluma, and diamond cut.',
        '/slots/burs-cover.png')
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, description = excluded.description, image_url = excluded.image_url;

-- 2. Bur Shapes sub-category
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
values ('bur-shapes', 'Bur Shapes', (select id from public.categories where slug='burs'), 1,
        'Solid carbide burs by ANSI shape — cylinder, ball, oval, tree, flame, cone, and inverted cone.',
        '/slots/24-piece-Bur-set.jpg')
on conflict (slug) do update set parent_id = excluded.parent_id, sort_order = excluded.sort_order, image_url = excluded.image_url;

-- 3. Shape lines (SA–SN) under Bur Shapes
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='bur-shapes'), v.so, v.descr, v.img
from (values
 ('b-sa','SA · Cylinder',1,'Cylinder (no end cut) carbide burs.','/slots/SA-DC-Bur.jpg'),
 ('b-sb','SB · Cylinder End-Cut',2,'Cylinder with end-cut carbide burs.','/slots/SB-DC-Bur.jpg'),
 ('b-sc','SC · Cylinder Ball-Nose',3,'Cylinder ball-nose (radius end) carbide burs.','/slots/SC-DC-Bur.jpg'),
 ('b-sd','SD · Ball',4,'Ball (spherical) carbide burs.','/slots/SD-DC-Bur2.jpg'),
 ('b-se','SE · Oval',5,'Oval (egg) carbide burs.','/slots/SE-DC-Bur.jpg'),
 ('b-sf','SF · Tree Radius',6,'Tree with radius-end carbide burs.','/slots/SF-DC-Bur.jpg'),
 ('b-sg','SG · Tree Pointed',7,'Tree with pointed-end carbide burs.','/slots/SG-DC-Bur.jpg'),
 ('b-sh','SH · Flame',8,'Flame carbide burs.','/slots/SH-DC-Bur.jpg'),
 ('b-sj','SJ · 60° Cone',9,'60° cone carbide burs.','/slots/SJ-SC-Bur.jpg'),
 ('b-sk','SK · 90° Cone',10,'90° cone carbide burs.','/slots/SK-DC-Bur.jpg'),
 ('b-sl','SL · Taper Radius',11,'Taper with radius-end carbide burs.','/slots/SL-DC-Bur.jpg'),
 ('b-sm','SM · Cone Pointed',12,'Cone pointed-end carbide burs.','/slots/SM-DC-Bur.jpg'),
 ('b-sn','SN · Inverted Cone',13,'Inverted cone carbide burs.','/slots/SN-DC-Bur.jpg')
) as v(slug,name,so,descr,img)
on conflict (slug) do update set image_url = excluded.image_url, name = excluded.name;

-- 4. Tire Burs / Diemills / Piloted Diemills / Fiberglass Routers lines under the hub
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='burs'), v.so, v.descr, v.img
from (values
 ('b-tire-burs','Tire Burs',2,'Solid carbide tire burs — round and tri-shank.','/slots/TireBur-TriShank.jpg'),
 ('b-diemills','Diemills',3,'Solid carbide diemills — double and coarse double cut.','/slots/SB-DC-Bur.jpg'),
 ('b-piloted-diemills','Piloted Diemills',4,'Piloted solid carbide diemills.','/slots/SC-DC-Bur.jpg'),
 ('b-fiberglass-routers','Fiberglass Routers',5,'Single-flute carbide fiberglass routers — plain, bur, mill, and drill ends.','/slots/Fiberglass-Router-MillEnd.jpg')
) as v(slug,name,so,descr,img)
on conflict (slug) do update set parent_id = excluded.parent_id, sort_order = excluded.sort_order, image_url = excluded.image_url;

-- 5. Filter attributes on the Burs hub (inherited by lines)
insert into public.category_attributes (category_id, key, label, data_type, unit, is_filterable, is_required, sort_order, enum_values)
select (select id from public.categories where slug='burs'), a.key, a.label, a.data_type, a.unit, a.filt, a.req, a.so, a.enums
from (values
 ('od','Head Diameter','numeric','in',true,true,1,null::jsonb),
 ('loc','Head Length','numeric','in',true,true,2,null),
 ('shk','Shank Diameter','numeric','in',true,true,3,null),
 ('oal','Overall Length','numeric','in',true,false,4,null),
 ('cut','Cut','enum',null,true,false,5,'["Single Cut","Double Cut","Coarse Double Cut","Aluma Cut","Diamond Cut","Chipbreaker","Round Shank","Tri-Shank","Plain End","Bur End","Mill End","Drill End"]'::jsonb),
 ('measurement_system','Measurement System','enum',null,true,true,6,'["Imperial","Metric"]'::jsonb)
) as a(key,label,data_type,unit,filt,req,so,enums)
on conflict (category_id, key) do nothing;

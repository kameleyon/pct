-- ============================================================
--  Promote "drills" to a top-level hub with two sub-categories:
--    Drills → Standard Carbide Drills (7 lines) + Hurricane Drills (3 lines)
--  The category page renders any node with children as a tile grid, so a
--  3-level hierarchy (hub → sub-category → line → products) works natively.
-- ============================================================

-- 1. Rename the existing 'drills' node into the "Drills" hub.
update public.categories
set name = 'Drills',
    description = 'Solid carbide drills — standard jobber/stub/spotting/spade lines plus high-performance Hurricane coolant-through drills.',
    image_url = '/slots/drills-bits.png'
where slug = 'drills';

-- 2. Standard Carbide Drills sub-category under the hub.
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
values ('standard-carbide-drills', 'Standard Carbide Drills',
        (select id from public.categories where slug='drills'), 1,
        'Solid carbide jobber, stub, spotting, spade, straight-flute, and combined drills.',
        '/slots/JobberDrills.jpg')
on conflict (slug) do update set parent_id = excluded.parent_id, sort_order = excluded.sort_order, image_url = excluded.image_url;

-- 3. Re-parent the 7 existing standard drill lines onto the new sub-category.
update public.categories
set parent_id = (select id from public.categories where slug='standard-carbide-drills')
where slug in ('dr-jobber-drills','dr-stub-drills','dr-straight-flute-drills','dr-spade-drills',
               'dr-nc-spotting-drills','dr-drill-countersink','dr-medium-length-drills');

-- 4. Hurricane Drills sub-category under the hub.
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
values ('hurricane-drills', 'Hurricane Drills',
        (select id from public.categories where slug='drills'), 2,
        'High-performance solid carbide Hurricane drills — 140° point, 30° helix, coolant-through, in 3xD, 5xD, and 8xD depths.',
        '/slots/Hurricane5xd.jpg')
on conflict (slug) do update set parent_id = excluded.parent_id, sort_order = excluded.sort_order, image_url = excluded.image_url;

-- 5. Hurricane lines under the Hurricane sub-category.
insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='hurricane-drills'), v.so, v.descr, v.img
from (values
 ('dr-hurricane-3xd','Hurricane 3xD Drills',1,'3× diameter depth Hurricane drills, uncoated or PowerA.','/slots/Hurricane3xd.jpg'),
 ('dr-hurricane-5xd','Hurricane 5xD Drills',2,'5× diameter depth Hurricane drills, uncoated or PowerA.','/slots/Hurricane5xd.jpg'),
 ('dr-hurricane-8xd','Hurricane 8xD Drills',3,'8× diameter depth coolant-through Hurricane drills.','/slots/Hurricane8xd.jpg')
) as v(slug,name,so,descr,img)
on conflict (slug) do update set image_url = excluded.image_url, name = excluded.name;

-- 6. Filter attributes on the Hurricane sub-category.
insert into public.category_attributes (category_id, key, label, data_type, unit, is_filterable, is_required, sort_order, enum_values)
select (select id from public.categories where slug='hurricane-drills'), a.key, a.label, a.data_type, a.unit, a.filt, a.req, a.so, a.enums
from (values
 ('od','Drill Diameter','numeric','in',true,true,1,null::jsonb),
 ('loc','Length of Cut','numeric','in',true,true,2,null),
 ('shk','Shank Diameter','numeric','in',true,true,3,null),
 ('oal','Overall Length','numeric','in',true,false,4,null),
 ('point_angle','Point Angle','numeric','deg',true,false,5,null),
 ('coolant','Coolant','enum',null,true,false,6,'["Coolant Through","Non-Coolant Through"]'::jsonb),
 ('coating','Coating','enum',null,true,true,7,'["Uncoated","PowerA"]'::jsonb),
 ('measurement_system','Measurement System','enum',null,true,true,8,'["Imperial","Metric"]'::jsonb)
) as a(key,label,data_type,unit,filt,req,so,enums)
on conflict (category_id, key) do nothing;

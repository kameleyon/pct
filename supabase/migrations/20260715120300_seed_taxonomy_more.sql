-- ============================================================
--  Seed additional endmill families + their specialty attributes.
--  Common attributes are inherited from the parent "end-mills".
-- ============================================================

insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='end-mills'),
       v.sort_order, v.description, '/images/categories/'||v.slug||'.jpg'
from (values
 ('square-straight-flute-end-mills','Square Straight-Flute End Mills',7,'Solid carbide square end mills with straight (0° helix) flutes.'),
 ('ball-straight-flute-end-mills','Ball Straight-Flute End Mills',8,'Solid carbide ball nose end mills with straight (0° helix) flutes.'),
 ('double-end-ball-end-mills','Double-End Ball End Mills',9,'Double-ended ball nose end mills — two cutting ends per tool.'),
 ('double-end-square-with-flat','Double-End Square End Mills (with Flat)',10,'Double-end square end mills with a flatted shank.'),
 ('double-end-ball-with-flat','Double-End Ball End Mills (with Flat)',11,'Double-end ball end mills with a flatted shank.'),
 ('square-mini-mills','Square Mini End Mills',12,'Miniature square end mills for micro-machining.'),
 ('ball-mini-mills','Ball Mini End Mills',13,'Miniature ball nose end mills for micro-machining.'),
 ('drill-mills','Drill Mills',14,'Combination drill/mill tools for spotting, chamfering, and milling.'),
 ('square-taper-mills','Square Taper End Mills',15,'Tapered-wall square end mills for draft-angle and mold work.'),
 ('ball-taper-mills','Ball Taper End Mills',16,'Tapered-wall ball nose end mills for draft-angle and mold work.'),
 ('short-flute-square-end-mills','Short-Flute Square End Mills',17,'High-helix short-flute square end mills, including necked reach variants.'),
 ('short-flute-ball-end-mills','Short-Flute Ball End Mills',18,'High-helix short-flute ball end mills, including necked and reduced-shank variants.'),
 ('short-flute-corner-radius-end-mills','Short-Flute Corner Radius End Mills',19,'High-helix short-flute necked corner radius end mills.')
) as v(slug,name,sort_order,description)
on conflict (slug) do nothing;

-- taper attributes
insert into public.category_attributes (category_id,key,label,data_type,unit,is_filterable,sort_order)
select id,'taper_angle','Taper Angle','numeric','deg',true,10 from public.categories
where slug in ('square-taper-mills','ball-taper-mills')
on conflict (category_id,key) do nothing;
insert into public.category_attributes (category_id,key,label,data_type,unit,is_filterable,sort_order)
select id,'small_od','Tip Diameter (Small OD)','numeric','in',true,11 from public.categories
where slug in ('square-taper-mills','ball-taper-mills')
on conflict (category_id,key) do nothing;

-- drill-mill point angle
insert into public.category_attributes (category_id,key,label,data_type,unit,is_filterable,sort_order)
select id,'point_angle','Point Angle','numeric','deg',true,10 from public.categories
where slug='drill-mills'
on conflict (category_id,key) do nothing;

-- short-flute / necked: reach, neck, helix; radius for the corner-radius variant
insert into public.category_attributes (category_id,key,label,data_type,unit,is_filterable,sort_order)
select id,'reach','Reach','numeric','in',true,10 from public.categories
where slug in ('short-flute-square-end-mills','short-flute-ball-end-mills','short-flute-corner-radius-end-mills')
on conflict (category_id,key) do nothing;
insert into public.category_attributes (category_id,key,label,data_type,unit,is_filterable,sort_order)
select id,'neck','Neck Length','numeric','in',true,11 from public.categories
where slug in ('short-flute-square-end-mills','short-flute-ball-end-mills','short-flute-corner-radius-end-mills')
on conflict (category_id,key) do nothing;
insert into public.category_attributes (category_id,key,label,data_type,unit,is_filterable,sort_order)
select id,'helix_angle','Helix Angle','numeric','deg',true,12 from public.categories
where slug in ('short-flute-square-end-mills','short-flute-ball-end-mills','short-flute-corner-radius-end-mills')
on conflict (category_id,key) do nothing;
insert into public.category_attributes (category_id,key,label,data_type,unit,is_filterable,sort_order)
select id,'corner_radius','Corner Radius','numeric','in',true,13 from public.categories
where slug='short-flute-corner-radius-end-mills'
on conflict (category_id,key) do nothing;

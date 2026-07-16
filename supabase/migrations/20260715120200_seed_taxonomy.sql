-- ============================================================
--  Seed taxonomy: manufacturer, category hierarchy, attributes.
--  Common attributes live on the parent "end-mills" and are
--  inherited by children in the app layer; radius/helix are
--  attached to the categories that use them.
-- ============================================================

-- manufacturer
insert into public.manufacturers (slug, name)
values ('mastercut-tool', 'Mastercut Tool')
on conflict (slug) do nothing;

-- parent category
insert into public.categories (slug, name, sort_order, description)
values ('end-mills', 'End Mills', 0,
        'Solid carbide end mills — square, ball, corner radius, double-end, and high-performance geometries.')
on conflict (slug) do nothing;

-- child categories
insert into public.categories (slug, name, parent_id, sort_order, description, image_url) values
 ('square-end-mills','Square End Mills',
   (select id from public.categories where slug='end-mills'),1,
   'Solid carbide square end mills for slotting, profiling, and general-purpose milling.',
   '/images/categories/square-end-mills.jpg'),
 ('ball-end-mills','Ball End Mills',
   (select id from public.categories where slug='end-mills'),2,
   'Solid carbide ball nose end mills for 3D contouring and finishing.',
   '/images/categories/ball-end-mills.jpg'),
 ('corner-radius-end-mills','Corner Radius End Mills',
   (select id from public.categories where slug='end-mills'),3,
   'Solid carbide corner radius end mills for edge strength and longer tool life.',
   '/images/categories/corner-radius-end-mills.jpg'),
 ('double-end-square-end-mills','Double-End Square End Mills',
   (select id from public.categories where slug='end-mills'),4,
   'Double-ended square end mills — two cutting ends per tool.',
   '/images/categories/double-end-square-end-mills.jpg'),
 ('6-flute-square-end-mills','6-Flute Square End Mills',
   (select id from public.categories where slug='end-mills'),5,
   'High-performance 6-flute square end mills for higher feed rates.',
   '/images/categories/6-flute-square-end-mills.jpg'),
 ('50-helix-corner-radius-end-mills','50° Helix Corner Radius End Mills',
   (select id from public.categories where slug='end-mills'),6,
   '50-degree high-helix corner radius end mills for superior surface finishes.',
   '/images/categories/50-helix-corner-radius-end-mills.jpg')
on conflict (slug) do nothing;

-- common attributes on the parent (inherited by children)
insert into public.category_attributes
  (category_id, key, label, data_type, unit, is_filterable, is_required, sort_order, enum_values) values
 ((select id from public.categories where slug='end-mills'),'od','Cutting Diameter','numeric','in',true,true,1,null),
 ((select id from public.categories where slug='end-mills'),'loc','Length of Cut','numeric','in',true,true,2,null),
 ((select id from public.categories where slug='end-mills'),'shk','Shank Diameter','numeric','in',true,true,3,null),
 ((select id from public.categories where slug='end-mills'),'oal','Overall Length','numeric','in',true,true,4,null),
 ((select id from public.categories where slug='end-mills'),'flutes','Flutes','integer',null,true,true,5,'[2,3,4,6,8]'::jsonb),
 ((select id from public.categories where slug='end-mills'),'coating','Coating','enum',null,true,true,6,'["Uncoated","PowerA (AlTiN)"]'::jsonb),
 ((select id from public.categories where slug='end-mills'),'measurement_system','Measurement System','enum',null,true,true,7,'["Imperial","Metric"]'::jsonb)
on conflict (category_id, key) do nothing;

-- corner radius attribute (canonical stored in inches; display carries native unit)
insert into public.category_attributes
  (category_id, key, label, data_type, unit, is_filterable, sort_order)
select id, 'corner_radius', 'Corner Radius', 'numeric', 'in', true, 8
from public.categories
where slug in ('corner-radius-end-mills','50-helix-corner-radius-end-mills')
on conflict (category_id, key) do nothing;

-- helix angle attribute (50° line)
insert into public.category_attributes
  (category_id, key, label, data_type, unit, is_filterable, sort_order)
select id, 'helix_angle', 'Helix Angle', 'numeric', 'deg', false, 9
from public.categories
where slug = '50-helix-corner-radius-end-mills'
on conflict (category_id, key) do nothing;

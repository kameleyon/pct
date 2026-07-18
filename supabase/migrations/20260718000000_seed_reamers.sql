-- ============================================================
--  Seed Reamers taxonomy + attributes.
--  Parent "reamers" with the 45° Reamer line (4-flute, uncoated).
-- ============================================================

insert into public.categories (slug, name, sort_order, description, image_url)
values ('reamers', 'Reamers', 30,
        'Solid carbide reamers for precise, high-tolerance hole finishing.',
        '/slots/Reamer-4FL.jpg')
on conflict (slug) do update set image_url = excluded.image_url, sort_order = excluded.sort_order;

insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='reamers'),
       v.so, v.descr, v.img
from (values
 ('rm-45-reamers','45° Reamers',1,'Four-flute 45° solid carbide reamers for accurate hole sizing.','/slots/Reamer-4FL.jpg')
) as v(slug,name,so,descr,img)
on conflict (slug) do update set image_url = excluded.image_url;

-- attributes on the reamers parent (inherited by children)
insert into public.category_attributes
  (category_id, key, label, data_type, unit, is_filterable, is_required, sort_order, enum_values)
select (select id from public.categories where slug='reamers'),
       a.key, a.label, a.data_type, a.unit, a.filt, a.req, a.so, a.enums
from (values
 ('od','Reamer Diameter','numeric','in',true,true,1,null::jsonb),
 ('loc','Length of Cut','numeric','in',true,true,2,null),
 ('shk','Shank Diameter','numeric','in',true,true,3,null),
 ('oal','Overall Length','numeric','in',true,false,4,null),
 ('flutes','Flutes','integer',null,false,true,5,'[4]'::jsonb),
 ('coating','Coating','enum',null,false,true,6,'["Uncoated"]'::jsonb),
 ('measurement_system','Measurement System','enum',null,true,true,7,'["Imperial","Metric"]'::jsonb)
) as a(key,label,data_type,unit,filt,req,so,enums)
on conflict (category_id, key) do nothing;

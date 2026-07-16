-- ============================================================
--  Seed High Performance Routers taxonomy + attributes.
--  Parent "high-performance-routers" with 14 one-flute lines.
-- ============================================================

insert into public.categories (slug, name, sort_order, description)
values ('high-performance-routers', 'High Performance Routers', 20,
        'Solid carbide 1-flute router bits for wood, plastics, solid surface, and aluminum.')
on conflict (slug) do nothing;

insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='high-performance-routers'),
       v.so, v.descr, '/images/categories/'||v.slug||'.jpg'
from (values
 ('r-upcut-spiral','Upcut Spiral Routers',1,'Single-flute upcut spiral routers for wood, plastics, and aluminum.'),
 ('r-downcut-spiral','Downcut Spiral Routers',2,'Single-flute downcut spiral routers for clean top surfaces.'),
 ('r-o-flute-upcut-spiral','O-Flute Upcut Spirals',3,'O-flute upcut spirals for soft/hard plastic, solid surface, and wood.'),
 ('r-o-flute-downcut-spiral','O-Flute Downcut Spirals',4,'O-flute downcut spirals for soft/hard plastic, solid surface, and wood.'),
 ('r-o-flute-straight','O-Flute Straight',5,'O-flute straight-cut crescent-end routers.'),
 ('r-v-flute-straight','V-Flute Straight',6,'V-flute straight-cut crescent-end routers.'),
 ('r-o-flute-straight-edge-rounding','O-Flute Straight Edge Rounding',7,'O-flute straight-cut edge-rounding bits.'),
 ('r-o-flute-spiral-edge-rounding','O-Flute Spiral Edge Rounding',8,'O-flute spiral-cut edge-rounding bits.'),
 ('r-compression','Compression Routers',9,'Single-flute compression spirals — clean top and bottom edges.'),
 ('r-ball-compression','Ball Compression Routers',10,'Single-flute ball compression spirals.'),
 ('r-mortise-compression','Mortise Compression Routers',11,'Single-flute mortise compression spirals.'),
 ('r-ofx-upcut','OFX Upcut Routers',12,'OFX single-flute upcut spirals — soft plastic/wood and hard plastic/aluminum.'),
 ('r-ofx-downcut','OFX Downcut Routers',13,'OFX single-flute downcut spirals — soft plastic/wood and hard plastic/aluminum.'),
 ('r-veining-bits','Veining Bits',14,'Single-flute veining bits.')
) as v(slug,name,so,descr)
on conflict (slug) do nothing;

-- attributes on the routers parent (inherited by children)
insert into public.category_attributes
  (category_id, key, label, data_type, unit, is_filterable, is_required, sort_order, enum_values)
select (select id from public.categories where slug='high-performance-routers'),
       a.key, a.label, a.data_type, a.unit, a.filt, a.req, a.so, a.enums
from (values
 ('od','Cutting Diameter','numeric','in',true,true,1,null::jsonb),
 ('loc','Length of Cut','numeric','in',true,true,2,null),
 ('shk','Shank Diameter','numeric','in',true,true,3,null),
 ('oal','Overall Length','numeric','in',true,false,4,null),
 ('flutes','Flutes','integer',null,false,true,5,'[1]'::jsonb),
 ('coating','Coating','enum',null,false,true,6,'["Uncoated"]'::jsonb),
 ('application','Application','text',null,true,false,7,null),
 ('rotation','Rotation','enum',null,true,false,8,'["Right Hand","Left Hand"]'::jsonb),
 ('measurement_system','Measurement System','enum',null,true,true,9,'["Imperial","Metric"]'::jsonb),
 ('corner_radius','Radius','numeric','in',true,false,10,null),
 ('opening','Opening','numeric','in',false,false,11,null),
 ('small_od','Small Diameter','numeric','in',false,false,12,null),
 ('tip_to_radius','Tip to Radius','numeric','in',false,false,13,null),
 ('upcut_length','Upcut Length','numeric','in',false,false,14,null),
 ('mortise_length','Mortise Length','numeric','in',false,false,15,null)
) as a(key,label,data_type,unit,filt,req,so,enums)
on conflict (category_id, key) do nothing;

-- ============================================================
--  Seed Drills taxonomy + attributes — "Standard Carbide Drills"
--  sub-category (Jobber, Stub, Straight Flute, Spade, NC Spotting,
--  Drill & Countersink, Medium Length). Uncoated / PowerA (AlTiN).
-- ============================================================

insert into public.categories (slug, name, sort_order, description, image_url)
values ('drills', 'Standard Carbide Drills', 25,
        'Solid carbide jobber, stub, spotting, spade, and combined drills — fractional & metric, uncoated or PowerA (AlTiN).',
        '/slots/JobberDrills.jpg')
on conflict (slug) do update set image_url = excluded.image_url, sort_order = excluded.sort_order, name = excluded.name, description = excluded.description;

insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='drills'),
       v.so, v.descr, v.img
from (values
 ('dr-jobber-drills','Jobber Drills',1,'2- and 3-flute solid carbide jobber-length drills.','/slots/JobberDrills.jpg'),
 ('dr-stub-drills','Stub Drills',2,'2-flute stub-length drills, 118°/135° four-facet points.','/slots/StubDrill.jpg'),
 ('dr-straight-flute-drills','Straight Flute Drills',3,'2-flute straight-flute drills for brass, bronze, and thin materials.','/slots/JobberDrills.jpg'),
 ('dr-spade-drills','Spade Drills',4,'118° solid carbide spade drills.','/slots/Spade-Drill.jpg'),
 ('dr-nc-spotting-drills','NC Spotting Drills',5,'90°, 120°, and 142° NC spotting drills, uncoated or PowerA.','/slots/NC-Spotting-Drill.jpg'),
 ('dr-drill-countersink','Drill & Countersinks',6,'Combined drill & countersinks — 60°, 82°, and 90° included angles.','/slots/CenterDrill.jpg'),
 ('dr-medium-length-drills','Medium Length Drills',7,'2-flute medium-length solid carbide drills.','/slots/JobberDrills.jpg')
) as v(slug,name,so,descr,img)
on conflict (slug) do update set image_url = excluded.image_url, name = excluded.name, description = excluded.description;

-- attributes on the drills parent (inherited by children)
insert into public.category_attributes
  (category_id, key, label, data_type, unit, is_filterable, is_required, sort_order, enum_values)
select (select id from public.categories where slug='drills'),
       a.key, a.label, a.data_type, a.unit, a.filt, a.req, a.so, a.enums
from (values
 ('od','Drill Diameter','numeric','in',true,true,1,null::jsonb),
 ('loc','Length of Cut','numeric','in',true,true,2,null),
 ('shk','Shank Diameter','numeric','in',true,true,3,null),
 ('oal','Overall Length','numeric','in',true,false,4,null),
 ('point_angle','Point Angle','numeric','deg',true,false,5,null),
 ('wire_size','Wire / Letter Size','text',null,false,false,6,null),
 ('flutes','Flutes','integer',null,true,false,7,'[2,3]'::jsonb),
 ('coating','Coating','enum',null,true,true,8,'["Uncoated","PowerA"]'::jsonb),
 ('measurement_system','Measurement System','enum',null,true,true,9,'["Imperial","Metric"]'::jsonb)
) as a(key,label,data_type,unit,filt,req,so,enums)
on conflict (category_id, key) do nothing;

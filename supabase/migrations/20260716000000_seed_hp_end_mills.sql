-- ============================================================
--  Seed High Performance End Mills taxonomy + attributes.
--  Parent "high-performance-end-mills" with 10 product lines;
--  common attributes inherited from the parent.
-- ============================================================

insert into public.categories (slug, name, sort_order, description)
values ('high-performance-end-mills', 'High Performance End Mills', 10,
        'High-performance solid carbide end mills — V4, V5, HY5, F45, AxMill, roughers, mold mills, and more.')
on conflict (slug) do nothing;

insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='high-performance-end-mills'),
       v.so, v.descr, '/images/categories/'||v.slug||'.jpg'
from (values
 ('hp-v4-end-mills','V4 End Mills',1,'Variable-helix high-performance end mills — square, ball, corner radius.'),
 ('hp-v5-end-mills','V5 End Mills',2,'V5 variable-helix high-performance end mills.'),
 ('hp-hy5-end-mills','HY5 End Mills',3,'HY5 high-performance end mills.'),
 ('hp-f45-end-mills','F45 End Mills',4,'F45 six-flute 45-degree helix finishers.'),
 ('hp-axmill-end-mills','AxMill End Mills',5,'AxMill high-shear end mills for aluminum — square, ball, corner radius, necked, chipbreaker.'),
 ('hp-roughers','Roughers',6,'Coarse, medium, and fine pitch roughing end mills.'),
 ('hp-mold-mills','Mold Mills',7,'Necked mold-making end mills — square, ball, corner radius.'),
 ('hp-twister-mills','Twistermills',8,'Twistermill high-performance end mills.'),
 ('hp-hyper-mills','Hypermills',9,'Hypermill high-performance end mills.'),
 ('hp-alumazips','Alumazips',10,'Alumazip aluminum-cutting end mills.')
) as v(slug,name,so,descr)
on conflict (slug) do nothing;

-- common + specialty attributes on the HP parent (inherited by children)
insert into public.category_attributes
  (category_id, key, label, data_type, unit, is_filterable, is_required, sort_order, enum_values)
select (select id from public.categories where slug='high-performance-end-mills'),
       a.key, a.label, a.data_type, a.unit, a.filt, a.req, a.so, a.enums
from (values
 ('od','Cutting Diameter','numeric','in',true,true,1,null::jsonb),
 ('loc','Length of Cut','numeric','in',true,true,2,null),
 ('shk','Shank Diameter','numeric','in',true,true,3,null),
 ('oal','Overall Length','numeric','in',true,false,4,null),
 ('flutes','Flutes','integer',null,true,false,5,'[2,3,4,5,6]'::jsonb),
 ('coating','Coating','enum',null,true,true,6,'["Uncoated","PowerA","PowerZ","PowerN","PowerC","PowerNR"]'::jsonb),
 ('geometry','Geometry','enum',null,true,false,7,'["Square","Ball","Corner Radius"]'::jsonb),
 ('flat','Shank Flat','enum',null,true,false,8,'["No Flat","With Flat"]'::jsonb),
 ('measurement_system','Measurement System','enum',null,true,true,9,'["Imperial","Metric"]'::jsonb),
 ('corner_radius','Corner Radius','numeric','in',true,false,10,null),
 ('neck_od','Neck Diameter','numeric','in',true,false,11,null),
 ('neck_length','Neck Length','numeric','in',true,false,12,null)
) as a(key,label,data_type,unit,filt,req,so,enums)
on conflict (category_id, key) do nothing;

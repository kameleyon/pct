-- ============================================================
--  Seed 2-Flute router lines under High Performance Routers.
--  Also prefixes the existing 1-flute lines for clarity and
--  widens the flutes facet to [1,2].
-- ============================================================

-- clarify the existing one-flute line names (idempotent)
update public.categories
set name = '1-Flute ' || name
where parent_id = (select id from public.categories where slug='high-performance-routers')
  and slug like 'r-%' and name not like '1-Flute %' and name not like '2-Flute %';

update public.categories
set description = 'Solid carbide 1-flute and 2-flute router bits for wood, plastics, solid surface, and aluminum.'
where slug = 'high-performance-routers';

update public.category_attributes
set enum_values = '[1,2]'::jsonb, is_filterable = true
where key = 'flutes'
  and category_id = (select id from public.categories where slug='high-performance-routers');

insert into public.categories (slug, name, parent_id, sort_order, description, image_url)
select v.slug, v.name, (select id from public.categories where slug='high-performance-routers'),
       v.so, v.descr, '/images/categories/'||v.slug||'.jpg'
from (values
 ('r2-upcut-spiral','2-Flute Upcut Spiral',20,'Two-flute upcut spiral routers.'),
 ('r2-downcut-spiral','2-Flute Downcut Spiral',21,'Two-flute downcut spiral routers.'),
 ('r2-upcut-slow','2-Flute Upcut Slow Spiral',22,'Two-flute upcut slow-helix spirals.'),
 ('r2-downcut-slow','2-Flute Downcut Slow Spiral',23,'Two-flute downcut slow-helix spirals.'),
 ('r2-o-upcut-slow','2-Flute O-Flute Upcut Slow Spiral',24,'Two-flute O-flute upcut slow spirals.'),
 ('r2-o-downcut-slow','2-Flute O-Flute Downcut Slow Spiral',25,'Two-flute O-flute downcut slow spirals.'),
 ('r2-upcut-chipbreaker','2-Flute Upcut Spiral Chipbreaker',26,'Two-flute upcut spiral chipbreaker finishers.'),
 ('r2-downcut-chipbreaker','2-Flute Downcut Spiral Chipbreaker',27,'Two-flute downcut spiral chipbreaker finishers.'),
 ('r2-upcut-high-impact','2-Flute Upcut High Impact',28,'Two-flute upcut high-impact routers.'),
 ('r2-downcut-high-impact','2-Flute Downcut High Impact',29,'Two-flute downcut high-impact routers.'),
 ('r2-upcut-chipbreaker-hi','2-Flute Upcut Chipbreaker High Impact',30,'Two-flute upcut chipbreaker high-impact routers.'),
 ('r2-downcut-chipbreaker-hi','2-Flute Downcut Chipbreaker High Impact',31,'Two-flute downcut chipbreaker high-impact routers.'),
 ('r2-compression','2-Flute Compression',32,'Two-flute compression spirals.'),
 ('r2-mortise-compression','2-Flute Mortise Compression',33,'Two-flute mortise compression spirals.'),
 ('r2-chipbreaker-compression','2-Flute Chipbreaker Compression',34,'Two-flute chipbreaker compression spirals.'),
 ('r2-up-plunge','2-Flute Upcut Plunge',35,'Two-flute upcut spiral plunge (fishtail) routers.'),
 ('r2-downcut-fishtail','2-Flute Downcut Fishtail',36,'Two-flute downcut spiral fishtail routers.'),
 ('r2-straight-plunge','2-Flute Straight Cut Plunge',37,'Two-flute straight-cut plunge routers.'),
 ('r2-shear-v-bottom','2-Flute Shear V-Bottom',38,'Two-flute shear V-bottom routers.'),
 ('r2-v-edge-rounding','2-Flute V-Flute Edge Rounding',39,'Two-flute V-flute edge-rounding bits.'),
 ('r2-o-edge-rounding','2-Flute O-Flute Edge Rounding',40,'Two-flute O-flute straight-cut edge-rounding bits.'),
 ('r2-rout-chamfer','2-Flute Straight Rout & Chamfer',41,'Two-flute straight rout-and-chamfer bits.'),
 ('r2-upcut-bottom-surface','2-Flute Upcut Bottom Surface',42,'Two-flute upcut bottom-surfacing routers.')
) as v(slug,name,so,descr)
on conflict (slug) do nothing;

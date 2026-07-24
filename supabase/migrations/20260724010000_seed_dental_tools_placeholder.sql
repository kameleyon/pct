-- ============================================================
--  Add Dental Tools as a placeholder top-level category.
--  No dental-specific products exist in the catalog yet, so this
--  will show "0 items" and its category page will be empty until
--  real dental products are added. Requested explicitly to surface
--  the tile/photo on the homepage ahead of that.
-- ============================================================

insert into public.categories (slug, name, sort_order, description, image_url)
values ('dental-tools', 'Dental Tools', 50,
        'Precision CAD/CAM, hand piece & ISO bur solutions for dental laboratory applications.',
        '/slots/dental-burs-cover.png')
on conflict (slug) do update set image_url = excluded.image_url, sort_order = excluded.sort_order, name = excluded.name, description = excluded.description;

-- ============================================================
--  Promote Mini Mills to a top-level category hub.
--  Square/Ball Mini End Mills already exist as real product
--  lines under "End Mills" — move them under their own hub so
--  they surface in the homepage "Shop by category" grid.
-- ============================================================

insert into public.categories (slug, name, sort_order, description, image_url)
values ('mini-mills', 'Mini Mills', 40,
        'Miniature square and ball nose end mills for micro-machining, intricate details, and high-accuracy work.',
        '/slots/mini-mills-cover.png')
on conflict (slug) do update set image_url = excluded.image_url, sort_order = excluded.sort_order, name = excluded.name, description = excluded.description;

update public.categories
set parent_id = (select id from public.categories where slug = 'mini-mills')
where slug in ('square-mini-mills', 'ball-mini-mills');

-- ============================================================
--  Real per-product photos for the High Performance End Mills family,
--  chosen by line + geometry (+ necked / coating where it matters).
-- ============================================================

-- V4 (Square / Ball / Corner Radius)
update public.products set primary_image_url = case specs->>'geometry'
  when 'Ball' then '/slots/V4-Ball-PowerA.jpg'
  when 'Corner Radius' then '/slots/V4-CornerRadius-PowerA.jpg'
  else '/slots/V4-Square-PowerA.jpg' end
where category_id = (select id from public.categories where slug='hp-v4-end-mills');

-- V5
update public.products set primary_image_url = case specs->>'geometry'
  when 'Ball' then '/slots/V5-Ball-PowerA.jpg'
  when 'Corner Radius' then '/slots/V5-CornerRadius-PowerA.jpg'
  else '/slots/V5-Square-PowerA.jpg' end
where category_id = (select id from public.categories where slug='hp-v5-end-mills');

-- HY5 (Square / Corner Radius only)
update public.products set primary_image_url = case specs->>'geometry'
  when 'Corner Radius' then '/slots/HY5-CornerRadius-PowerA.jpg'
  else '/slots/HY5-Square-PowerA.jpg' end
where category_id = (select id from public.categories where slug='hp-hy5-end-mills');

-- F45 (Square / Corner Radius)
update public.products set primary_image_url = case specs->>'geometry'
  when 'Corner Radius' then '/slots/F45-Corner-Radius-PowerA.jpg'
  else '/slots/F45-Square-PowerA.jpg' end
where category_id = (select id from public.categories where slug='hp-f45-end-mills');

-- AxMill (geometry + necked)
update public.products set primary_image_url = case
  when specs->>'geometry'='Ball' and specs ? 'neck_length_display' then '/slots/Axmill-Ball-Necked.jpg'
  when specs->>'geometry'='Ball' then '/slots/Axmill-Ball.jpg'
  when specs->>'geometry'='Corner Radius' and specs ? 'neck_length_display' then '/slots/Axmill-CornerRadius-Necked.jpg'
  when specs->>'geometry'='Corner Radius' then '/slots/Axmill-CornerRadius.jpg'
  when specs->>'geometry'='Square' and specs ? 'neck_length_display' then '/slots/Axmill-Square-Necked.jpg'
  else '/slots/Axmill-Square.jpg' end
where category_id = (select id from public.categories where slug='hp-axmill-end-mills');

-- Mold Mills (all necked; Square photo is the necked one)
update public.products set primary_image_url = case specs->>'geometry'
  when 'Ball' then '/slots/MoldMills-Ball.jpg'
  when 'Corner Radius' then '/slots/MoldMills-CornerRadius.jpg'
  else '/slots/MoldMills-SquareNecked.jpg' end
where category_id = (select id from public.categories where slug='hp-mold-mills');

-- Twistermills (by coating)
update public.products set primary_image_url = case when coating='PowerZ' then '/slots/Twistermill-PowerZ.jpg' else '/slots/Twistermill-PowerA.jpg' end
where category_id = (select id from public.categories where slug='hp-twister-mills');

-- Roughers / Hypermills / Alumazips (single representative each)
update public.products set primary_image_url = '/slots/Rougher-MediumPitch.jpg' where category_id = (select id from public.categories where slug='hp-roughers');
update public.products set primary_image_url = '/slots/Hypermill-PowerZ.jpg'     where category_id = (select id from public.categories where slug='hp-hyper-mills');
update public.products set primary_image_url = '/slots/Alumazip.jpg'             where category_id = (select id from public.categories where slug='hp-alumazips');

-- Line tile covers on the HP End Mills page
update public.categories set image_url = '/slots/V4-Square-PowerA.jpg'   where slug='hp-v4-end-mills';
update public.categories set image_url = '/slots/V5-Square-PowerA.jpg'   where slug='hp-v5-end-mills';
update public.categories set image_url = '/slots/HY5-Square-PowerA.jpg'  where slug='hp-hy5-end-mills';
update public.categories set image_url = '/slots/F45-Square-PowerA.jpg'  where slug='hp-f45-end-mills';
update public.categories set image_url = '/slots/Axmill-Square.jpg'      where slug='hp-axmill-end-mills';
update public.categories set image_url = '/slots/Rougher-MediumPitch.jpg' where slug='hp-roughers';
update public.categories set image_url = '/slots/MoldMills-CornerRadius.jpg' where slug='hp-mold-mills';
update public.categories set image_url = '/slots/Twistermill-PowerA.jpg' where slug='hp-twister-mills';
update public.categories set image_url = '/slots/Hypermill-PowerZ.jpg'   where slug='hp-hyper-mills';
update public.categories set image_url = '/slots/Alumazip.jpg'           where slug='hp-alumazips';

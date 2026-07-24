-- ============================================================
--  Swap in the fresh category cover photos supplied for Dental
--  Tools and Mini Mills, replacing the earlier manually-cropped
--  versions with clean product shots on the site's own card color.
-- ============================================================

update public.categories set image_url = '/img/dentals/dental-mix-cover.png' where slug = 'dental-tools';
update public.categories set image_url = '/img/mini_mills/mini-mills-cover.png' where slug = 'mini-mills';

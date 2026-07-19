-- Update Reamers & Drills parent-category tile covers to the dedicated cover art.
update public.categories set image_url = '/slots/reamers.png'     where slug = 'reamers';
update public.categories set image_url = '/slots/drills-bits.png' where slug = 'drills';

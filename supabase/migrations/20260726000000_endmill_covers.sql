-- Real per-line photos for the standard End Mills lines (tile covers).
update public.categories c set image_url = v.img
from (values
 ('square-end-mills','/slots/Standard-Square-Endmill.jpg'),
 ('ball-end-mills','/slots/Standard-Ball-Endmill.jpg'),
 ('corner-radius-end-mills','/slots/Standard-Corner-Radius.jpg'),
 ('double-end-square-end-mills','/slots/DoubleEnd-Square2flute.jpg'),
 ('6-flute-square-end-mills','/slots/6-flute-square.jpg'),
 ('50-helix-corner-radius-end-mills','/slots/Standard-Corner-Radius.jpg'),
 ('square-straight-flute-end-mills','/slots/StraightFluteEndmill-SQ.jpg'),
 ('ball-straight-flute-end-mills','/slots/Ball-Straight-Flute-Endmill.jpg'),
 ('double-end-ball-end-mills','/slots/DoubleEnd-Ball.jpg'),
 ('double-end-square-with-flat','/slots/DoubleEnd-Square-With-Flat.jpg'),
 ('double-end-ball-with-flat','/slots/Ball-Double-Flat.jpg'),
 ('drill-mills','/slots/DrillMill.jpg'),
 ('square-taper-mills','/slots/Tapermill-Square.jpg'),
 ('ball-taper-mills','/slots/Tapermill-Ball.jpg'),
 ('short-flute-square-end-mills','/slots/Short-Flute-Square.jpg'),
 ('short-flute-ball-end-mills','/slots/ShortFluteBallNecked.jpg'),
 ('short-flute-corner-radius-end-mills','/slots/ShortFluteCRNecked.jpg')
) as v(slug, img)
where c.slug = v.slug;

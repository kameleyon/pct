-- ============================================================
--  Placeholder retail pricing.
--
--  No real MasterCut price list exists yet, but checkout/affiliate testing
--  needs *something* realistic to work against. This derives a price per
--  product from a researched category baseline (grounded in real-world
--  solid-carbide end mill / router bit / bur / drill pricing) times
--  multipliers for diameter (material + machining time), flute count
--  (grinding complexity), coating, and geometry/reach (necked or tapered
--  tools take more setup). All products are 'Carbide' today so material
--  itself isn't a variable within this catalog — diameter and length are
--  the proxy for "amount of material used."
--
--  Only fills rows where price IS NULL, so it's safe to re-run and will
--  never overwrite a real price once one is entered.
-- ============================================================

with base_prices(slug, base) as (
  values
    -- High Performance end mills (metal-cutting; 4-6 flute; base @ 1/4" dia)
    ('hp-v4-end-mills', 28), ('hp-v5-end-mills', 32), ('hp-hy5-end-mills', 34),
    ('hp-f45-end-mills', 36), ('hp-axmill-end-mills', 30), ('hp-roughers', 29),
    ('hp-mold-mills', 40), ('hp-twister-mills', 31), ('hp-hyper-mills', 27),
    ('hp-alumazips', 27),

    -- Router bits (wood/plastic; 1-2 flute; base @ 1/4" dia)
    ('r-v-flute-straight', 20), ('r-o-flute-straight', 19),
    ('r-o-flute-straight-edge-rounding', 24), ('r-o-flute-spiral-edge-rounding', 26),
    ('r-o-flute-upcut-spiral', 22), ('r-o-flute-downcut-spiral', 22),
    ('r-upcut-spiral', 21), ('r-downcut-spiral', 21), ('r-veining-bits', 18),
    ('r-compression', 30), ('r-ball-compression', 32), ('r-mortise-compression', 33),
    ('r-ofx-upcut', 23), ('r-ofx-downcut', 23),
    ('r2-upcut-spiral', 22), ('r2-downcut-spiral', 22),
    ('r2-upcut-slow', 24), ('r2-downcut-slow', 24),
    ('r2-o-upcut-slow', 25), ('r2-o-downcut-slow', 25),
    ('r2-upcut-chipbreaker', 27), ('r2-downcut-chipbreaker', 27),
    ('r2-upcut-high-impact', 29), ('r2-downcut-high-impact', 29),
    ('r2-upcut-chipbreaker-hi', 31), ('r2-downcut-chipbreaker-hi', 31),
    ('r2-compression', 31), ('r2-mortise-compression', 34), ('r2-chipbreaker-compression', 35),
    ('r2-up-plunge', 26), ('r2-downcut-fishtail', 27), ('r2-straight-plunge', 24),
    ('r2-shear-v-bottom', 28), ('r2-v-edge-rounding', 25), ('r2-o-edge-rounding', 25),
    ('r2-rout-chamfer', 26), ('r2-upcut-bottom-surface', 27),

    -- Reamers
    ('rm-45-reamers', 36),

    -- Standard carbide drills (base @ 1/4" dia)
    ('dr-jobber-drills', 22), ('dr-stub-drills', 20), ('dr-straight-flute-drills', 24),
    ('dr-spade-drills', 18), ('dr-nc-spotting-drills', 15), ('dr-drill-countersink', 26),
    ('dr-medium-length-drills', 24),

    -- Hurricane (HP coolant-through) drills
    ('dr-hurricane-3xd', 30), ('dr-hurricane-5xd', 34), ('dr-hurricane-8xd', 38),

    -- Carbide burs, ANSI shapes SA-SN (base @ small reference cutter dia)
    ('b-sa', 14), ('b-sb', 15), ('b-sc', 16), ('b-sd', 15), ('b-se', 16),
    ('b-sf', 17), ('b-sg', 17), ('b-sh', 16), ('b-sj', 15), ('b-sk', 15),
    ('b-sl', 17), ('b-sm', 16), ('b-sn', 16),
    ('b-tire-burs', 20), ('b-diemills', 22), ('b-piloted-diemills', 26), ('b-fiberglass-routers', 24),

    -- Bur sets/kits — flat price (piece count varies too much for diameter scaling)
    ('bs-power-pouch', 75), ('bs-plastic-box', 110), ('bs-wood-box', 135), ('bs-countertop', 165)
),
calc as (
  select
    p.id,
    bp.base,
    coalesce((p.specs->>'od_in')::numeric, (p.specs->>'small_od_in')::numeric, (p.specs->>'shk_in')::numeric, 0.25) as dia,
    coalesce(p.flutes, 2) as flutes,
    p.coating,
    p.specs->>'geometry' as geometry,
    ((p.specs ? 'reach_display') or (p.specs ? 'neck_length_display') or (p.specs ? 'taper_angle')) as is_extended
  from public.products p
  join public.categories c on c.id = p.category_id
  join base_prices bp on bp.slug = c.slug
  where p.price is null
)
update public.products pr
set price = (
  round(
    greatest(9.99, least(350,
      calc.base
      * power(calc.dia / 0.25, 0.85)
      * (1 + (calc.flutes - 2) * 0.04)
      * (case when calc.coating is distinct from 'Uncoated' then 1.25 else 1 end)
      * (case calc.geometry when 'Ball' then 1.08 when 'Corner Radius' then 1.05 else 1 end)
      * (case when calc.is_extended then 1.10 else 1 end)
    ))
    * 2
  ) / 2
)
from calc
where pr.id = calc.id;

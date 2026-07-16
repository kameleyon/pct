# Precise Cut Tools (PCT)

Industrial cutting-tool e-commerce catalog — a spec-driven storefront for solid-carbide end mills,
built on **Next.js** (App Router) + **Supabase** (Postgres, RLS).

## What's here

- **Storefront** (`app/`, `components/`, `lib/`) — homepage, category browse with spec filters
  (flutes / coating / measurement system), and product detail pages, rendered from the live catalog.
- **Database foundation** (`supabase/migrations/`) — hybrid schema: typed facet columns +
  `JSONB` specs, RLS on every table (public-read / admin-write), taxonomy of 19 end-mill families.
- **Import pipeline** (`scripts/import/`) — descriptor-driven importer that unpivots the vendor's
  matrix CSVs (imperial + metric, tolerant headers, fraction parsing, date-corruption recovery)
  into ~3,300 products.
- **Design spec** (`docs/superpowers/specs/`).

## Develop

```bash
npm install
# set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
npm run dev
```

## Data import

```bash
node scripts/import/import.mjs        # builds upsert SQL from scripts/data/*.csv
```

Migrations live in `supabase/migrations/` and are applied via the Supabase CLI.

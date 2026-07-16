# Cutting Tool Catalog — Foundation Design

**Date:** 2026-07-15
**Status:** Approved (design)
**Scope:** Backend foundation, security, data structure, and CSV import pipeline for an industrial cutting-tool e-commerce catalog. UI/UX is built separately.

---

## 1. Context & Goal

Build the data foundation for a spec-driven industrial cutting-tool catalog in the style of
suncoasttools.com and mastercuttool.com. Each part is a row with many structured spec columns
(e.g. for square endmills: cutting diameter, shank diameter, length of cut, overall length,
number of flutes, corner radius, coating, material, helix angle). **The database is the product.**

The build is greenfield in `C:\Users\Administrator\pct`, now its own git repository.

### Decisions locked during brainstorming

| Decision | Choice |
|---|---|
| Site scope | **Full e-commerce** catalog (browse/filter/search + cart + checkout + orders + inventory) |
| Import data | **Mixed / not yet finalized** — schema and pipeline must be flexible |
| Data ownership | **Admin-managed now, vendor-ready schema** (add vendor ownership later without rewrite) |
| Stack | **Next.js (App Router) + Supabase** (Postgres + Auth + RLS + Storage + Edge Functions) |
| Spec modeling | **Hybrid: typed core columns + `JSONB` specs + `category_attributes` metadata table** |
| Payments | **Stripe**, with server-side webhook as the only source of paid-status truth |

---

## 2. Data Model

Universal fields are typed columns; category-variable fields live in `JSONB`.

### Catalog tables

- **`categories`** — `id, slug, name, parent_id (self-ref), description, image_url, sort_order`.
  Self-reference gives the hierarchy (Endmills → Square Endmills).
- **`category_attributes`** — `id, category_id, key, label, data_type (numeric|text|boolean|enum),
  unit, enum_values (jsonb), is_filterable, is_required, sort_order`.
  Single source of truth for which spec keys are valid per category. Drives (1) import validation,
  (2) the frontend's dynamic filter UI, (3) future vendor-facing forms. Adding a category is a
  data insert, not a migration.
- **`manufacturers`** — `id, name, slug, logo_url`.
- **`products`** — typed columns: `id, part_number (UNIQUE), slug, category_id, manufacturer_id,
  name, description, material, coating, price, sale_price, cost, stock_quantity, weight,
  is_active, vendor_id (nullable — future), created_at, updated_at`.
  Plus `specs JSONB` (**GIN-indexed**) for category-specific fields, and `search_vector tsvector`
  (**GIN-indexed**, trigger-maintained) for full-text search over part number + name + specs.
- **`product_images`** — `id, product_id, url, alt, sort_order` (a table, not a JSONB blob —
  images are reordered and queried independently).

### Commerce tables

- **`profiles`** — extends `auth.users`: `id (FK to auth.users), full_name, role (customer|admin),
  company, phone`.
- **`addresses`** — `id, profile_id, type, line1, line2, city, state, zip, country, is_default`.
- **`carts`** / **`cart_items`** — server-persisted cart keyed to user (survives device switches);
  `cart_items` holds `cart_id, product_id, quantity`.
- **`orders`** — `id, profile_id, status, subtotal, tax, shipping, total,
  stripe_payment_intent_id, shipping_address (jsonb snapshot), created_at`.
- **`order_items`** — `order_id, product_id, part_number, name, unit_price, quantity`.
  Values are **snapshotted** at purchase time so historical orders never mutate when the catalog
  changes.

### Modeling rationale

- **JSONB + GIN** filters (`specs->>'flutes' = '4' AND (specs->>'diameter')::numeric BETWEEN …`)
  perform at scale on hundreds of thousands of rows — avoiding both per-category table sprawl and
  the EAV anti-pattern.
- **`category_attributes` as data** turns "what columns does this category have?" into a row set,
  not code. One source of truth shared by importer and frontend.
- **Snapshotted order lines** prevent the classic accounting bug of joining old orders to live
  prices.
- **Stored `search_vector`** keeps keyword/part-number search a single indexed query instead of
  `ILIKE '%...%'` scans.

---

## 3. Security Model (RLS)

**RLS is enabled on every table. Default-deny; access granted explicitly.**

### Three clients, three trust levels

| Client | Location | Trust |
|---|---|---|
| **anon** | browser | RLS-enforced, public read only |
| **server (SSR)** | Next.js server, acts as the signed-in user | RLS-enforced as that user |
| **service-role** | server-only scripts / imports | bypasses RLS — never shipped to the browser, never `NEXT_PUBLIC_`-prefixed |

### Policies

- **Public read**: `products (is_active = true)`, `categories`, `category_attributes`,
  `manufacturers`, `product_images`. Anonymous browsing needs no auth.
- **Owner-scoped**: a user reads/writes only their own `profiles`, `addresses`, `carts`,
  `cart_items`, `orders`, `order_items` — enforced via `profile_id = auth.uid()`.
- **Admin write**: catalog mutations gated by a `SECURITY DEFINER` helper `public.is_admin()`
  that checks `profiles.role = 'admin'`.
- **Vendor-ready**: `products.vendor_id` exists now (nullable). Enabling "vendors manage their
  own rows" later is a single added policy — no schema change.
- **Payments**: order `status`/`total` are never trusted from the client. A signature-verified
  **Stripe webhook** (Edge Function, service-role) is the only writer of paid status. The browser
  may create a pending order + PaymentIntent; it cannot declare itself paid.

---

## 4. CSV Import Pipeline

A typed TypeScript script (`scripts/import.ts`) run with the service-role key — repeatable and
idempotent, not dashboard click-upload.

1. **Read** — stream the CSV (handles large files without loading into RAM).
2. **Load contract** — read `category_attributes` for the target category.
3. **Map & coerce** — CSV headers → known keys; cast per `data_type` (`"1/4\""` → `0.25`,
   `"4"` → integer flutes). Unknown/garbage columns are reported, not silently dropped.
4. **Stage** — `COPY` valid rows into `products_staging` (tens of thousands of rows/sec).
5. **Merge** — `INSERT … ON CONFLICT (part_number) DO UPDATE` from staging → idempotent;
   re-running a file updates price/stock instead of duplicating.
6. **Report** — rows inserted / updated / rejected, with reasons.

Rationale: `COPY` never validates, so validation happens in the app layer; clean data lands in
staging; one transaction merges to live. A bad row can never corrupt the live table, and imports
are safely re-runnable.

---

## 5. Project Structure

```
pct/
├─ app/                      # Next.js App Router (UI drops in here)
├─ lib/supabase/
│  ├─ client.ts              # anon (browser)
│  ├─ server.ts              # SSR, user session
│  └─ admin.ts               # service-role, server-only (guarded)
├─ lib/db/                   # typed queries + generated Supabase types
├─ supabase/
│  ├─ migrations/            # all schema as versioned SQL
│  └─ functions/stripe-webhook/
├─ scripts/import.ts         # CSV pipeline
└─ .env.local                # keys — service-role NEVER NEXT_PUBLIC_-prefixed
```

Schema lives entirely in **versioned migrations**, not hand-clicked in the dashboard, so the
database is reproducible and reviewable.

---

## 6. Out of Scope (YAGNI — deferrable without touching the foundation)

Multi-currency, wishlists, product reviews, discount/coupon codes, vendor-onboarding UI. Any of
these can be added later without a foundation change.

---

## 7. Success Criteria

- All catalog and commerce tables exist as versioned migrations with RLS enabled and tested
  policies (public read, owner-scoped, admin-write).
- A new tool category can be added via `categories` + `category_attributes` inserts with no code
  change, and immediately supports filtered browsing.
- `scripts/import.ts` loads a sample CSV into `products` idempotently, validating against
  `category_attributes` and reporting inserted/updated/rejected counts.
- Stripe payment status is writable only by the signature-verified webhook.
- Service-role key is never exposed to the browser bundle.

---

## 8. Concrete Data Model & Import Mapping (from real CSVs — 2026-07-15)

Reviewed three real source files (Square, Ball, Corner Radius endmills). These findings refine
the assumptions in §2 and §4; where they differ, this section is authoritative.

### 8.1 Source files are a matrix — the importer must UNPIVOT

Each source row is one **geometry**; the flute-count columns hold **part numbers**, not counts.

- **Square & Ball** columns: `OD, LOC, SHK, OAL, 2-Flute, 3-Flute, 4-Flute, 2-Flute PowerA,
  3-Flute PowerA, 4-Flute PowerA`.
- **Corner Radius** columns: `OD, LOC, SHK, OAL, Radius, 2-Flute, 4-Flute, 2-Flute PowerA,
  4-Flute PowerA`.

Every **non-empty** part-number cell becomes exactly one `products` row:
`part_number` = the cell; `flutes` = parsed from the column header (2/3/4);
`coating` = `PowerA (AlTiN)` if a PowerA column else `Uncoated`. Empty cell = that
configuration does not exist for the geometry and is skipped. (~1,400 products across the three
files.)

### 8.2 Domain facts (confirmed via mastercuttool.com)

- **Material:** solid micro-grain **Carbide** for all parts in these files (`material = 'Carbide'`).
- **PowerA** is Mastercut's proprietary name for their **AlTiN coating** — a coating variant, not a
  separate product line. `coating ∈ {'Uncoated', 'PowerA (AlTiN)'}`.
- **PowerA part numbers carry a `-1` suffix** (e.g. `206-252` → `206-252-1`). Used as an import
  cross-check.
- Flute options: 2, 3, 4. Metric (mm) diameters exist on the live site but are not in these CSVs;
  the schema must accommodate them later without change.

### 8.3 Category hierarchy

`Endmills` (parent) → `Square Endmills`, `Ball Endmills`, `Corner Radius Endmills`.
Corner Radius adds one attribute (`corner_radius`) — a single extra `category_attributes` row.

### 8.4 `category_attributes` seed

| key | label | data_type | unit | filterable | notes |
|---|---|---|---|---|---|
| od | Cutting Diameter | numeric | in | yes | dual-stored (see §8.5) |
| loc | Length of Cut | numeric | in | yes | dual-stored |
| shk | Shank Diameter | numeric | in | yes | dual-stored |
| oal | Overall Length | numeric | in | yes | dual-stored |
| flutes | Flutes | enum(2,3,4) | — | yes | from column header |
| coating | Coating | enum(Uncoated, PowerA (AlTiN)) | — | yes | from column group |
| corner_radius | Corner Radius | numeric | in | yes | Corner Radius subcategory only |

### 8.5 Dimensions are dual-stored

Fractional inch strings (`1/32`, `1-1/2`) are human-readable but unusable for range filtering.
Each dimension is stored **twice**: a parsed `NUMERIC` value (e.g. `od_in = 0.03125`) for
filtering/sorting, plus the original display string (`"1/32"`) for rendering. A fraction parser
handles `1-1/2`→1.5, `1/32`→0.03125, `.015`→0.015, and future `8mm`→0.315.

### 8.6 `products` column refinements

Add to §2's `products`: `material TEXT DEFAULT 'Carbide'`, `coating TEXT`, `flutes SMALLINT`,
`price NUMERIC(10,2)`, `sale_price NUMERIC(10,2)`,
`discount_percentage NUMERIC GENERATED ALWAYS AS
(CASE WHEN price > 0 AND sale_price IS NOT NULL THEN round((price - sale_price) / price * 100, 0)
 ELSE NULL END) STORED`, and `primary_image_url TEXT`.
Price/stock are nullable now, filled later (browse-/quote-only until priced).

### 8.7 Images

Each category has at least one representative image (`categories.image_url`). Products default to
their category image via `primary_image_url` until per-part imagery exists; the `product_images`
table (from §2) holds per-part images later.

### 8.8 Import validation rules

- **Detect corrupted cells**: an ISO timestamp where a fraction is expected (observed: Corner
  Radius rows where `LOC` = `2020-01-02T08:00:00.000Z`, a Sheets fraction→date corruption of
  `1/2`). Recover (`Jan 2` → `1/2`) but **flag** in the report — never silently load.
- **Reject** rows whose required dimension fails fraction parsing.
- **Cross-check** the `-1` PowerA suffix against the column group.
- **Idempotent** upsert on `part_number`; dedupe re-exported source files.
- **Report** counts: inserted / updated / rejected (with reason) / recovered (flagged).

### 8.9 Full file set spans two layouts and two unit systems

The complete endmill catalog (solid-carbide-end-mills tree) arrives as ~15 CSVs covering these
categories, each in Fractional (imperial) and/or MET (metric) form:

`Square`, `Ball`, `Corner Radius`, `Double-End Square`, `6-Flute Square`,
`Extra-Long Square`, `Extra-Long Ball`, `50° Helix Corner Radius`.

**Two source layouts** — the importer supports both, declared per file:
- **matrix** (most files): dimension columns + flute-count part-number columns. Requires unpivot
  (§8.1). `flutes` and `coating` derive from the column header.
- **row** (e.g. `MET 50° Helix Corner`): one row = one product; `Flutes`, `Radius` are explicit
  data columns and the part number sits in a single column. `flutes` varies by row (6 or 8).

### 8.10 Unit system is a property of the file, not the value

`OD="1"` means **1 inch** in a Fractional file but **1 mm** in a MET file. Each source file
declares its `measurement_system` (`Imperial` | `Metric`), and every product stores it. Canonical
numeric dimensions are stored in a single unit (inches; mm ÷ 25.4) for cross-catalog range
filtering, while the display string preserves the native unit (`"1/4""`, `"6 mm"`). MET dimensions
are plain decimals (`1.5`, `38`); Fractional are fraction strings (`1-1/2`).

### 8.11 Tolerant header parsing

Matrix headers are inconsistently spelled across files and must be parsed with tolerance, not
exact match. Observed variants for the same concept:
`2-Flute`, `2Flute`, `2 Flute - Uncoated`, `2-Flute PowerA`, `2Flute - PowerA`,
`2 Flute- Power A`, `4-Flute power A`. The parser extracts (a) flute count via `\d+`, and
(b) coating = PowerA if the header matches `/power\s*-?\s*a/i` else Uncoated.

### 8.12 Attribute & category additions

- `measurement_system` — enum(Imperial, Metric) — filterable — on every product.
- `helix_angle` — numeric — degrees — Corner Radius / 50° Helix subcategory (50 for that file).
- `flutes` domain widens to {2, 3, 4, 6, 8}.
- `corner_radius` present on Corner Radius and 50° Helix categories (mm or inch per file).

### 8.13 Per-file import descriptor

Each CSV maps to a small declaration consumed by one generic importer:

```
{ file, category, measurement_system: 'Imperial'|'Metric',
  layout: 'matrix'|'row',
  dimension_columns: ['OD','LOC','SHK','OAL', ...],
  // matrix: part_columns → {flutes, coating} derived from header
  // row:    part_column + explicit flutes_column / radius_column
}
```

Fifteen messy CSVs become fifteen small descriptors feeding one validated, idempotent importer —
not fifteen bespoke scripts.

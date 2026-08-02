# Precise Cut Tools — Technical Specification

**Date:** 2026-07-30
**Status:** Reflects the state of branch `claude/github-pct-connection-sv8m9r` at handoff.
**Scope:** Full-stack architecture, data model, and business logic as built so far —
catalog, cart/checkout, roles & accounts, the affiliate program, and placeholder pricing.
Superseded/extended by `docs/superpowers/specs/2026-07-15-cutting-tool-catalog-foundation-design.md`
for the original catalog foundation design; this document covers everything built on top
of it since.

---

## 1. Stack & architecture

- **Next.js (App Router)**, TypeScript. Server Components + Server Actions
  (`'use server'`) for all data mutations; no separate REST/GraphQL API layer.
- **Supabase**: Postgres + Auth + Row Level Security. Two client entry points:
  - `lib/supabase-server.ts` / `lib/supabase.ts` — anon/publishable key, respects RLS,
    used for anything acting **as the current user**.
  - `lib/supabase-admin.ts` — service-role key, **bypasses RLS**. Restricted to trusted
    server-only contexts: the Stripe webhook and a handful of verified server actions
    (e.g. affiliate payout requests) that need to write rows a normal user's RLS
    policies wouldn't allow.
- **Stripe**: hosted Checkout Sessions for payment, a signature-verified webhook
  (`app/api/stripe/webhook/route.ts`) as the *only* source of truth for "this order is
  paid," and Stripe Connect (Express accounts) for affiliate payouts.
- **middleware.ts**: refreshes the Supabase auth cookie on every request, and captures
  `?ref=<code>` into a 30-day `pct_ref` cookie for affiliate attribution.

---

## 2. Roles & auth

`lib/roles.ts` defines the single source of truth:

```ts
type Role = 'guest' | 'member' | 'vip' | 'admin' | 'affiliate' | 'distributor';
```

- `lib/auth.ts#getSession()` reads `auth.getUser()` + the `profiles` row and returns a
  `Session { userId, email, fullName, role }`, defaulting to `role: 'guest'` when signed
  out. Every gated page calls this and redirects guests.
- `profiles.role` is protected by a `BEFORE UPDATE` trigger
  (`enforce_role_change_admin_only`) that blocks a user from escalating their own role
  even though a "self update profile" RLS policy otherwise lets them edit their own row.
  Only `is_admin()` (a `SECURITY DEFINER` helper) can change it.
- `affiliate_profiles.status` has the identical guard pattern
  (`enforce_affiliate_status_admin_only`) so only an admin can approve/reject.

`role` is a flat tag today — it does not gate feature access beyond guest-vs-signed-in;
"affiliate" and "distributor" mainly drive which UI surfaces are shown (portal links,
badges) and (for affiliate) which row exists in `affiliate_profiles`.

---

## 3. Data model

### Catalog (pre-existing foundation — see the 2026-07-15 design doc)
`categories` (self-referencing hierarchy) → `category_attributes` (per-category spec
metadata) → `products` (typed columns + `specs jsonb`, GIN-indexed) → `product_images`.

### Commerce
- **`carts` / `cart_items`** — server-persisted, owner-scoped via RLS.
- **`orders`** — `profile_id` nullable (guest checkout), `status` (`quote_requested` →
  `pending` → `paid` → `shipped` → `cancelled`), `subtotal/tax/shipping/total`, `contact`
  jsonb, plus `referral_code` / `affiliate_id` (added for the affiliate program).
  RLS: owners can `SELECT`/`INSERT` (insert only as `status = 'quote_requested'`); only
  admin/service-role can `UPDATE` status or totals — this is what makes the Stripe
  webhook (service-role) the only path that can mark an order `paid`.
- **`order_items`** — snapshotted at purchase time (`part_number, name, unit_price,
  quantity`) so historical orders never mutate when catalog prices change later.

### Profiles (extended for a fuller customer record)
`profiles` carries, beyond `role`: `phone, company, job_title, address_line1/2, city,
state_region, postal_code, country, how_heard, marketing_opt_in`, all captured at signup
via `auth.signUp`'s `user_metadata` and copied in by the `handle_new_user()` trigger.

### Tier-aware pricing foundation (reserved, not yet consumed)
- `profiles.price_tier` (`retail` default | `distributor`).
- `price_overrides(tier, product_id, price, sale_price)` — empty, admin-write/public-read
  RLS already in place. **No code currently reads this table** — it exists purely so the
  eventual distributor pricing UI is additive, not a schema rework. Whoever builds that
  phase should have checkout/product-price lookups fall back to `products.price` /
  `sale_price` when no override row exists.

### Affiliate program

| Table | Purpose | Who can read it |
|---|---|---|
| `affiliate_profiles` | One row per applicant: `status`, `referral_code` (unique), `stripe_connect_account_id`, review metadata | Self (own row) + admin |
| `affiliate_commission_rates` | The 4-level rate ladder — see §5 | **Admin only** (never the affiliate it applies to) |
| `affiliate_config` | Singleton: `manufacturer_pct`, `website_pct`, `maturity_days`, `expiry_days`, `payout_threshold`, Stripe account IDs for MasterCut/website reserve | **Admin only** |
| `affiliate_commissions` | One row per referred, paid order: `sale_amount`, `affiliate_amount`, `status`, `matures_at`, `expires_at`, `payout_id` | Self (via join on `affiliate_id`) + admin |
| `affiliate_commission_costs` | `manufacturer_amount` / `website_amount` for a commission | **Admin only** — deliberately a *separate table* so these figures can never leak through a row an affiliate is allowed to `SELECT` (Supabase RLS is row-level, not column-level) |
| `affiliate_payouts` | A batch of commissions an affiliate requested payout on | Self + admin |

All business-critical writes (commission creation, payout batching) go through the
service-role client from the webhook or a verified server action — there is no RLS
`INSERT`/`UPDATE` policy for regular users on `affiliate_commissions`,
`affiliate_commission_costs`, or `affiliate_payouts`.

---

## 4. Checkout & payment flow

1. **Cart drawer → `/checkout`** (`app/checkout/page.tsx` + `components/checkout/CheckoutForm.tsx`):
   our own page collects full name, email, phone, and shipping address (prefilled from
   `profiles` for signed-in users). This is deliberately **not** Stripe's job — Stripe's
   hosted Checkout page only handles card entry + the card's own billing address (for AVS
   fraud checks), never shipping/contact info.
2. **Submit → `createCheckoutSession`** (`app/checkout/actions.ts`): looks up authoritative
   prices server-side (never trusts the browser), reads the `pct_ref` cookie and resolves
   it to an *approved* affiliate profile (rejecting self-referrals), computes the delivery
   estimate (`lib/shipping.ts` — a static FL-origin ground-shipping zone table + a fixed
   24h processing buffer, no live carrier API), and creates the `orders` + `order_items`
   rows — `contact`, `shipping_address`, and `estimated_delivery_earliest/latest` are all
   set **at this point**, not waiting on Stripe. Then creates a Stripe Checkout Session
   with `metadata.orderId` and `customer_email` pre-filled.
3. **Stripe → webhook** (`app/api/stripe/webhook/route.ts`), on
   `checkout.session.completed`:
   - Marks the order `paid`, clears the buyer's server-side cart. Contact/shipping/estimate
     are read back from the order row (already set in step 2), not re-derived from the
     Stripe session — the webhook no longer parses `customer_details`/`shipping_details`.
     Shown on the checkout success page, `/account/orders`, and included in the admin
     order-placed email (for fulfillment).
   - If the order carries an `affiliate_id`, computes and records the commission (§5) —
     idempotent against webhook retries via an existing-row check plus a unique
     constraint on `affiliate_commissions.order_id`.
3. **Cancellation** — an `AFTER UPDATE` trigger on `orders`
   (`reverse_commission_on_order_cancel`) flips any `pending`/`available` commission on
   that order to `reversed` the moment an admin (or a future refund path) sets
   `status = 'cancelled'`.

---

## 5. Affiliate commission engine

### Attribution
`middleware.ts` writes `?ref=<code>` into a `pct_ref` cookie, 30-day expiry, **last-click
wins** (each new `?ref=` overwrites the cookie). Checkout resolves it to an affiliate only
if the code maps to an `approved` profile and the buyer isn't that same profile.

### The rate ladder (`lib/affiliate.ts#resolveAffiliateAmount`)
Computed **per order line item**, most specific wins:
1. Product **fixed dollar amount** (if set on that product — always wins over #2).
2. Product **percent**.
3. Category **percent**.
4. Site-wide **default percent**.

The affiliate's total cut on an order is the sum of each line item's resolved amount.
Whatever remains (`sale_amount - affiliate_amount`) is split between MasterCut and the
website by the flat, admin-configurable `manufacturer_pct` / `website_pct` in
`affiliate_config` (must sum to 100) — computed in `lib/affiliate.ts#splitRemainder` and
stored only in `affiliate_commission_costs`.

`sale_amount` is the order's **subtotal** (pre-tax/shipping), matching the "sales" framing
the commission is meant to reward.

### Lifecycle
```
pending --(matures_at reached)--> available --(affiliate requests)--> requested --(ops pays out)--> paid
   \                                    \
    \--(order cancelled)--> reversed     \--(expires_at reached, unrequested)--> expired
```
- `matures_at` / `expires_at` are computed **once, at commission-creation time**, from
  `affiliate_config.maturity_days` / `expiry_days` at that moment — later config changes
  never retroactively move an existing commission's dates.
- `public.refresh_affiliate_commission_statuses()` is a Postgres function that flips
  `pending → available` and `pending/available → expired` based on `now()`. There is no
  cron/scheduled job — it's called opportunistically (via the service-role client) from
  the affiliate portal page load and from the payout-request action.
- **Requesting a payout** (`requestAffiliatePayoutAction`): refreshes statuses, sums every
  `available` commission, rejects if the total is below `payout_threshold`, opens an
  `affiliate_payouts` row, and flips those commissions to `requested`. **It does not move
  money** — the actual Stripe transfer to the affiliate's connected account is a follow-up
  ops step, not automated in this build.

### Payouts (Stripe Connect)
Each affiliate gets their own Stripe **Express** connected account
(`createAffiliateStripeLinkAction`), created lazily on first "Connect payout account"
click and onboarded via a Stripe-hosted Account Link. No bank/identity data is ever
stored in this app's database. The site's own operating funds and the affiliate-payable
reserve are intended to sit in **two separate accounts** (`affiliate_config`'s
`website_reserve_stripe_account_id` / `mastercut_stripe_account_id` fields exist for
this), though the actual fund-segregation/transfer logic between them is not yet wired
up — those columns are storage only right now.

---

## 6. Pricing

### Live pricing model
`products.price` / `sale_price` are plain columns; `ProductCard` and `BulkPricing` show
"Request a Quote" whenever `price` is null, a real price otherwise. No code currently
branches on `price_tier` (see §3).

### Placeholder retail pricing (`supabase/migrations/20260730010000_placeholder_retail_pricing.sql`)
No real MasterCut cost sheet exists yet, so every product's `price` is populated by a
formula:

```
price = clamp($14.99, $450,
          round_to_nearest_$0.50(
            base(category)
            × (diameter / 0.25")^0.85
            × (1 + (flutes - 2) × 0.04)
            × coating_multiplier(coating)   -- see table below
            × (geometry: Ball 1.08 | Corner Radius 1.05 | else 1)
            × (necked/reach/tapered ? 1.10 : 1)
            × 1.10   -- margin buffer, see below
          ))
```

| Coating | Multiplier | Real-world basis |
|---|---|---|
| `Uncoated` | 1.00 | baseline |
| `PowerZ` (ZrN) | 1.22 | aluminum-specific coating, AxMill line |
| `PowerA` (AlTiN) | 1.25 | general-purpose coating; validated against a real AlTiN listing |
| `PowerC` | 1.25 | grouped with the standard tier — MasterCut's own coating page 403'd every fetch attempt, so no independently verified premium exists for it |
| `PowerN` (nACo) | 1.45 | nanocomposite, MasterCut's "Pro+ Performance" tier |
| `PowerNR` (nACRo) | 1.55 | nanocomposite, MasterCut's "Ultra Performance" / exotic-material tier |

**⚠️ This migration OVERRIDES every matched product's price on every run — there is no
`price IS NULL` guard.** That's intentional (every current price is a placeholder and
meant to be replaceable on demand), but it means **this migration must not be re-run
after real MasterCut prices have been entered**, or it will silently overwrite them. A
category not present in the base-price table is left alone entirely (shows "Request a
Quote") rather than defaulting to something wrong — that part *is* safe indefinitely.

- `base(category)` is a per-category-slug dollar figure, researched and tuned against
  ~10 real market anchors (see the migration file's comments for the specific
  comparables — a 3/8" AlTiN corner-radius end mill, letter/number-size carbide jobber
  drills, NC spotting drills, a 6-flute HP end mill, a downcut router bit). The rest of
  the ~95 category slugs were extrapolated from those anchors by relative positioning
  (finisher vs. rougher, HP vs. standard line, etc.), **not individually verified**.
- **Material/metal type is not a pricing variable** — verified across the whole catalog
  (not just End Mills) that `products.material` is hardcoded to `'Carbide'` by the
  import pipeline for every product, no exceptions. Coating is the only real
  metallurgical variable, hence the per-coating-type table above (previously this was a
  flat +25% coated-vs-uncoated bump).
- The **1.10× margin buffer** is deliberate, not a fudge factor — requested explicitly so
  that if this placeholder is still live when a real sale happens, the site isn't
  underpricing against whatever MasterCut actually charges. At this buffer level, most
  anchors land at or above the real comparable; a few (large jobber drills, large NC
  spotting drills, some router bits) land a few percent under a *specific* competitor
  listing — still almost certainly above true wholesale cost, since those anchors are
  themselves marked-up retail prices, not cost.
- Two separate End Mill category families exist with **different slug schemes** — the
  "High Performance End Mills" line (`hp-v4-end-mills`, etc.) and the plain "End Mills"
  hub (`square-end-mills`, `corner-radius-end-mills`, etc., 19 sub-categories, including
  `6-flute-square-end-mills` — folded into this unified formula; it previously had its
  own separate one-off formula in `20260726010000_sixflute_price_guest_checkout.sql`).
  Both families are covered in the base-price table.

**This is a placeholder.** Replace `products.price`/`sale_price` with real MasterCut cost
data as soon as it exists; nothing else in the checkout/affiliate flow needs to change
when that happens.

---

## 7. Admin capabilities

`/admin` (admin role required), `app/admin/actions.ts` + `app/admin/page.tsx`:
- Change any user's role (`setUserRoleAction`).
- Advance any order's status (`setOrderStatusAction`).
- Approve/reject affiliate applications (`setAffiliateStatusAction`) — approving also
  sets `profiles.role = 'affiliate'`.
- Manage the commission rate ladder: default rate, category overrides, product overrides
  (`setDefaultAffiliateRateAction`, `set/removeCategoryAffiliateRateAction`,
  `set/removeProductAffiliateRateAction`).
- Manage `affiliate_config` (`updateAffiliateConfigAction`).

**Deliberately not built** (per explicit scope decision, "for later"): a dashboard
showing all affiliates' sales/commissions in one place, per-affiliate or per-customer
drill-down, or any admin-side payout execution UI beyond what's listed above.

---

## 8. Known limitations / open items

- **Not manually verified end-to-end in a browser.** This sandbox has no network access
  to the deployed site or to Supabase directly — all schema/logic was verified via a
  local scratch Postgres instance and static type-checking (`tsc --noEmit`), not by
  clicking through the live app. A manual pass (apply as an affiliate → admin-approve →
  grab referral link → test purchase → confirm commission appears) is still recommended.
- **Stripe Connect must be enabled** on the platform's Stripe account (Dashboard →
  Settings → Connect) before "Connect payout account" will work — a one-time manual step.
- **Payout execution is manual.** "Request payout" only records intent; no code moves
  real money yet.
- **Pricing baselines are broad-strokes**, not individually verified per category (see
  §6). Treat as directionally realistic, not authoritative.
- **Distributor pricing is unbuilt** beyond the reserved schema (§3).

---

## 9. Key files

| Area | Files |
|---|---|
| Roles/auth | `lib/roles.ts`, `lib/auth.ts` |
| Account area | `app/account/**`, `components/account/**` |
| Affiliate program | `lib/affiliate.ts`, `app/account/affiliate/**`, `components/account/Affiliate*.tsx`, `components/admin/AffiliateProgramAdmin.tsx` |
| Checkout/payments | `app/checkout/actions.ts`, `app/api/stripe/webhook/route.ts`, `lib/stripe.ts` |
| Admin | `app/admin/**`, `components/admin/**` |
| Schema | `supabase/migrations/*.sql` (chronological; see filenames for what each adds) |

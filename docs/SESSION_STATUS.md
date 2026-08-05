# Session status — where we left off

**Last updated:** 2026-08-05, end of session. All branch work merged to `main` unless noted.

## What's live on main

- **Site-wide password gate for pre-launch** — set `SITE_GATE_PASSWORD` in Vercel and every page (including `/admin`) redirects to `/gate` ("This site is under construction — provide the password to access the sandbox") until the correct password is entered; unset it to fully reopen the site with no code changes. Implemented in `middleware.ts` + `lib/site-gate.ts`; `/api/*` routes stay exempt so Stripe's webhook keeps working while gated.
- **Vercel Web Analytics** — `@vercel/analytics` mounted in the root layout so page views/visitors show up in the Vercel dashboard's Analytics tab.
- **Admin dashboard is now a real multi-page app** — `/admin` (overview), `/admin/members`, `/admin/orders` (searchable/filterable/paginated), `/admin/affiliates` (+ `/rates`, `/settings`), `/admin/notifications`, all sharing an `AdminNav` tab bar via `app/(dashboard)/admin/layout.tsx`. `/admin` and `/account/affiliate` live under the `(dashboard)` route group with a lightweight `DashboardHeader` (no storefront category nav/search/cart/footer); everything else is under `(shop)` with the normal storefront chrome. Same pattern to reuse for the sales/distributor dashboards planned next.
- **Checkout collects contact/shipping directly** (not via Stripe) — `/checkout` captures name/email/phone/address before handoff; Stripe only handles payment + card billing-address AVS. Orders store `shipping_address`/`estimated_delivery_earliest`/`estimated_delivery_latest` (static FL-origin estimate, see `lib/shipping.ts`) at creation time.
- **Order emails** — customer receipt, admin order-placed notification (recipients managed at `/admin/notifications`, not an env var), and affiliate sale notification, all via Resend from the Stripe webhook. Sender domain `notifications.precisioncnctools.com` is verified in Resend; `EMAIL_FROM` and `RESEND_API_KEY` are set in Vercel.
- **Roles & customer account area** — member/vip/admin/affiliate/distributor roles, `/account` (profile, order history, saved tools).
- **Affiliate program (full)** — apply → admin approve/reject → referral link → 30-day last-click attribution → 4-level commission rate ladder (default/category/product %/product $, admin-only, never shown to the affiliate) → maturity/expiry lifecycle → Stripe Connect payouts → admin panel (applications, rate ladder, config) → **per-affiliate admin detail view** at `/admin/affiliates/[id]` (referral link, Stripe status, sales history).
- **Placeholder retail pricing** — category-baseline formula (diameter/flutes/coating-type/geometry), coating priced per MasterCut's real lineup (PowerA/PowerZ/PowerC standard, PowerN/PowerNR premium), 10% margin buffer, fully overridable (no longer guarded by `price IS NULL` — re-running the migration recomputes everything). Covers both End Mill families + routers/drills/burs/reamers.
- **Email notifications** — affiliate sale notification + admin order-placed notification via Resend, fired from the Stripe webhook. Order-notification recipients are managed from `/admin` (a real table, not an env var). Root cause of the earlier "nothing sends" issue: `EMAIL_FROM` was never set, so it defaulted to Resend's shared `onboarding@resend.dev` sandbox sender, which doesn't reliably deliver to arbitrary recipients. Fixed by verifying a dedicated subdomain (`notifications.precisioncnctools.com`) in Resend and setting `EMAIL_FROM=Precision CNC Tools <orders@notifications.precisioncnctools.com>` in Vercel. `RESEND_API_KEY` (full-access permission) is also confirmed set.
- **Docs** — `docs/USER_GUIDE.md` (role-based usage) and `docs/SPECIFICATION.md` (full technical spec) — keep these updated as things change.
- **Hero section** — reworked copy ("American-Made. Built for Precision."), chiseled/gilded styling, single-brand (Mastercut) messaging, Florida/multi-brand references removed.
- **Two bootstrap admin emails** — `josinsidevoice@gmail.com` and `jedaiknight2024@gmail.com` both auto-promote to admin at signup.

## Bugs found & fixed today

1. Admin dashboard wasn't showing affiliate applications — broken PostgREST embed (no real FK between `affiliate_profiles` and `profiles`); fixed with a two-query lookup.
2. Cart not clearing after guest checkout — localStorage hydration race; fixed with a synchronous inline `<script>` on the success page (bulletproof against React effect-ordering).
3. **CRITICAL — cross-user session/cart data leak.** The root layout (`app/layout.tsx`) read per-user session/cart data without disabling Next.js's server data cache, so one user's cached response could be served to a different user's request. Fixed with `dynamic = 'force-dynamic'` + `fetchCache = 'force-no-store'` on the root layout. A cleanup migration emptied all `cart_items` afterward. **Open question, unresolved:** whether this ever leaked something more sensitive than cart contents (e.g. another user's name/session showing in the header) before the fix — worth watching for/asking about if anything looks off.
4. Product detail page's "Add to Cart" button was completely non-functional (static markup, no click handler, on a Server Component) — every product page was affected regardless of price. Fixed by wiring in the same `AddToCart` component used on category-grid product cards.

## Known follow-ups / not yet done

- **`npm audit` flagged high-severity Next.js CVEs**, including cache-confusion issues in the same family as bug #3 above — worth a dedicated look (likely a Next.js version bump) rather than squeezing in casually.
- **Distributor wholesale pricing UI** — schema reserved (`price_tier`/`price_overrides`), nothing built yet. Explicitly deferred to "build last" per the original plan.
- **Admin visibility into all affiliates' sales in one dashboard** (cross-affiliate, cross-customer) — deliberately deferred; today admin only sees one affiliate at a time via the detail view.
- **Real MasterCut pricing** — every price on the site is still the researched placeholder formula, not actual cost data.
- **Payout execution isn't automated** — "Request payout" records the request; actually transferring funds via Stripe Connect is a manual/ops step.
- **Sales dashboard (with charts) and distributor quote-process dashboard** — planned next; should live under `(dashboard)` alongside `/admin`, following the same route/nav pattern.

## Immediate next step when we resume

Confirm `SITE_GATE_PASSWORD` is set and active in Vercel (redeploy required after setting it), then run a fresh end-to-end order test: gate password → browse → `/checkout` → Stripe test payment → confirm receipt/admin/affiliate emails all arrive and the order shows correctly in `/admin/orders/[id]`.

# Session status — where we left off

**Last updated:** 2026-08-01, end of session. All branch work merged to `main` unless noted.

## What's live on main

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
- User was mid-testing the affiliate end-to-end flow (apply → approve → referral purchase → commission → portal) when the session ended — pick back up there.

## Immediate next step when we resume

Confirm the email setup (Resend key + env vars) and finish the affiliate end-to-end test pass, since the last several fixes (cart bug, caching bug, Add to Cart bug) all touched that same flow.

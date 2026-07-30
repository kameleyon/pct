# Precise Cut Tools — User Guide

**Audience:** anyone operating or testing the site — owner, staff, and early affiliates.
**Covers:** the site as it exists on this branch today. Distributor pricing and the full
admin affiliate-sales dashboard are **not built yet** — see "Not built yet" at the end.

---

## 1. Roles at a glance

| Role | What they can do |
|---|---|
| **Guest** | Browse, filter/search the catalog, add to cart, check out (no account required) |
| **Member** | Everything a guest can, plus a saved profile, order history, saved tools, and can apply to the affiliate program |
| **Affiliate** | Everything a member can, plus a referral link and an affiliate portal |
| **Admin** | Everything above, plus the admin dashboard (roles, orders, affiliate applications, commission rate/config) |
| **Distributor** | Reserved role for wholesale pricing — **not built yet** (see below) |

A user's role is shown as a badge next to their name in the header once signed in.

---

## 2. Customers

### Browsing & buying
- The homepage links into category pages; every category page keeps its spec filters
  (diameter, flutes, coating, measurement system, etc.) visible regardless of how deep
  you've drilled into the category tree.
- Product cards and product pages show a price when one is set, or **"Request a Quote"**
  when it isn't (some categories may still be unpriced — see the pricing section in the
  spec doc).
- Checkout works for guests and signed-in users alike. Guests are asked for an email at
  Stripe Checkout; signed-in users have it pre-filled.
- An order is only marked **paid** once Stripe's webhook confirms the payment — nothing
  in the app marks an order paid on its own.

### Account area (`/account`, signed-in only)
- **Profile** (`/account/profile`) — contact info, company, shipping/billing address,
  marketing email opt-in.
- **Order history** (`/account/orders`) — every order placed while signed in, with status
  (quote requested / pending / paid / shipped / cancelled).
- **Saved tools** (`/account/favorites`) — products favorited via the heart icon; saved
  locally in the browser so it also works for guests, resolved to full product info on
  this page.

---

## 3. Affiliates

### Applying
Any signed-in user can apply from the header menu ("Affiliate Program") or
`/account/affiliate`. Applying just creates a pending application — no bank details are
collected at this step.

### After you apply
- **Pending** — under review, nothing else to do.
- **Rejected** — a message is shown; contact the site owner with questions.
- **Approved** — the full affiliate portal unlocks at `/account/affiliate`, and the
  header/account menu label switches to "Affiliate portal."

### Your referral link
Once approved, your portal shows a unique link
(`https://<site>/?ref=<your code>`). Anyone who visits through that link gets a 30-day
cookie; if they check out within that window (and aren't buying via their *own* link),
the sale is attributed to you.

### How you get paid
- **No bank details are stored on this site.** Connecting a payout account happens
  through **Stripe Connect** — click "Connect payout account" in your portal and follow
  Stripe's onboarding. Stripe collects and secures your bank/identity info directly.
- Your **commission rate** is set individually by the site admin and communicated to you
  by email — it is intentionally not shown anywhere on the site.
- Every referred sale appears in your portal right away as **Maturing**. After a holding
  period (30 days by default, admin-configurable), it flips to **Available**.
- **You have to request your payout yourself** — matured commissions don't pay out
  automatically. Once your available balance crosses the payout threshold ($100 by
  default), a "Request payout" button appears in your portal.
- Available commissions expire if not requested within a window (90 days by default) —
  after that they're forfeited. Request on time.
- If a referred order is cancelled/refunded before you've requested (or been paid), the
  commission is reversed automatically.

---

## 4. Admins

The admin dashboard lives at `/admin` (admin role required).

### Members & orders
- Change any user's role from a dropdown (member / VIP / affiliate / distributor /
  admin).
- Advance any order's status (quote requested → pending → paid → shipped → cancelled).

### Affiliate applications
- A table of every application with **Approve** / **Reject** buttons. Approving also
  tags the user's role as `affiliate` and unlocks their portal.

### Affiliate commission rates
The affiliate's cut on a sale is resolved through a 4-level ladder — most specific wins:
1. **Default** rate (site-wide fallback) — editable directly.
2. **Category** override — pick a category, set a percent.
3. **Product** override — enter a part number, set a percent and/or a fixed dollar
   amount (a fixed amount always wins over a percent if both are set on the same
   product).

### Program settings
One form controls:
- The **MasterCut / website split** of whatever's left after the affiliate's cut
  (percentages, must add to 100 — MasterCut's number is never shown anywhere but here).
- **Maturity days** (holding period before a commission is claimable).
- **Expiry days** (window to request payout before forfeiture).
- **Payout threshold** (minimum available balance to request a payout).

---

## 5. Not built yet (by design — later phases)

- **Admin visibility into all affiliate sales** (per-affiliate, per-customer drill-down)
  — deliberately deferred; today admins only see applications and program config, not a
  live feed of every commission.
- **Automated Stripe payout transfers** — "Request payout" records the request and opens
  a payout batch; actually moving the money to the affiliate's Stripe account is a
  manual/ops follow-up step, not automatic yet.
- **Distributor wholesale pricing UI** — the `price_tier` / `price_overrides` schema
  exists and is reserved, but nothing reads from it yet and there's no distributor
  login/pricing experience.
- **Real MasterCut pricing** — every product price on the site right now is a researched
  *placeholder* (see the specification doc's Pricing section), padded with a margin
  buffer, meant to be replaced once a real MasterCut cost sheet exists.

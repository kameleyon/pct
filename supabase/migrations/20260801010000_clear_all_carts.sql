-- ============================================================
--  Emergency cleanup after a cross-user cart-caching bug (fixed in
--  app/layout.tsx: missing dynamic='force-dynamic'/fetchCache='force-no-store'
--  let Next.js serve one user's cached cart data to other users' requests).
--
--  This only empties cart_items (in-progress shopping carts) — orders,
--  order_items, and everything else are untouched. Every user's cart will
--  simply appear empty next time they load the site, which is expected and
--  safe: nothing here was ever a completed purchase.
-- ============================================================

delete from public.cart_items;

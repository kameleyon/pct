/** Site currently runs quote/PO only — no retail checkout. Every price display
 *  and the Stripe cart-checkout path stay in the codebase untouched; this flag
 *  just decides whether they're reachable. Flip RETAIL_MODE=on to bring retail
 *  back with no code changes. */
export function isQuoteOnlyMode(): boolean {
  return process.env.RETAIL_MODE !== 'on';
}

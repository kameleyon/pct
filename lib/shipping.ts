// Simple ground-shipping estimate from the Florida warehouse — no live carrier
// API, just a distance-based zone table (modeled on typical UPS/FedEx ground
// transit days from a Central Florida origin) plus a fixed processing buffer.

const PROCESSING_HOURS = 24; // time to process the order and hand it to the carrier

// US state/territory code -> estimated ground transit days from FL.
const ZONE_DAYS: Record<string, number> = {
  FL: 1,
  GA: 2, AL: 2, SC: 2,
  NC: 3, TN: 3, MS: 3, LA: 3, VA: 3,
  KY: 4, WV: 4, AR: 4, OH: 4, IN: 4, TX: 4, OK: 4, MD: 4, DE: 4, DC: 4, PA: 4, NJ: 4,
  IL: 5, MI: 5, WI: 5, MO: 5, IA: 5, NY: 5, CT: 5, RI: 5, MA: 5, VT: 5, NH: 5, KS: 5, NE: 5, MN: 5, SD: 5, ND: 5, NM: 5, CO: 5,
  AZ: 6, UT: 6, WY: 6, MT: 6, ID: 6,
  NV: 7, CA: 7, OR: 7, WA: 7,
  AK: 8, HI: 8,
};
const DEFAULT_ZONE_DAYS = 6; // unknown/international-ish fallback

export type DeliveryEstimate = { earliest: Date; latest: Date; transitDays: number };

/** Estimated delivery window for an order placed at `placedAt`, shipping to `state`
 *  (two-letter US state/territory code). Adds a fixed 24h processing buffer before
 *  the carrier's estimated transit time, then a 2-day window to avoid false precision. */
export function estimateDelivery(state: string | null | undefined, placedAt: Date = new Date()): DeliveryEstimate {
  const transitDays = state ? (ZONE_DAYS[state.trim().toUpperCase()] ?? DEFAULT_ZONE_DAYS) : DEFAULT_ZONE_DAYS;
  const readyAt = new Date(placedAt.getTime() + PROCESSING_HOURS * 3600_000);
  const earliest = new Date(readyAt.getTime() + transitDays * 86_400_000);
  const latest = new Date(earliest.getTime() + 2 * 86_400_000);
  return { earliest, latest, transitDays };
}

export function formatDeliveryWindow(estimate: DeliveryEstimate): string {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return `${estimate.earliest.toLocaleDateString('en-US', opts)} – ${estimate.latest.toLocaleDateString('en-US', opts)}`;
}

export type ShippingAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export function formatAddress(a: ShippingAddress | null | undefined): string | null {
  if (!a || (!a.line1 && !a.city)) return null;
  const lines = [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(', '),
    a.country && a.country !== 'US' ? a.country : null,
  ].filter(Boolean);
  return lines.join('\n');
}

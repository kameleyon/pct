import { getSupabaseAdmin } from './supabase-admin';

export type AffiliateConfig = {
  manufacturerPct: number;
  websitePct: number;
  maturityDays: number;
  expiryDays: number;
  payoutThreshold: number;
};

const DEFAULT_CONFIG: AffiliateConfig = { manufacturerPct: 50, websitePct: 50, maturityDays: 30, expiryDays: 90, payoutThreshold: 100 };

/** The website/manufacturer split of whatever remains after the affiliate's
 *  cut, plus the maturity/expiry/threshold windows. Admin-editable singleton;
 *  never read from the client — server-only (uses the service-role client). */
export async function getAffiliateConfig(): Promise<AffiliateConfig> {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('affiliate_config').select('*').eq('id', 1).maybeSingle();
  if (!data) return DEFAULT_CONFIG;
  return {
    manufacturerPct: Number(data.manufacturer_pct),
    websitePct: Number(data.website_pct),
    maturityDays: Number(data.maturity_days),
    expiryDays: Number(data.expiry_days),
    payoutThreshold: Number(data.payout_threshold),
  };
}

export type RateRow = { category_id: string | null; product_id: string | null; percent: number | null; fixed_amount: number | null };

/** Resolve one line item's affiliate cut through the 4-level override ladder:
 *  product fixed $ > product % > category % > site-wide default %. */
export function resolveAffiliateAmount(
  lineTotal: number,
  productId: string,
  categoryId: string,
  rates: RateRow[]
): number {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const product = rates.find((r) => r.product_id === productId);
  if (product?.fixed_amount != null) return round2(Number(product.fixed_amount));
  if (product?.percent != null) return round2((lineTotal * Number(product.percent)) / 100);
  const category = rates.find((r) => r.category_id === categoryId && r.product_id === null);
  if (category?.percent != null) return round2((lineTotal * Number(category.percent)) / 100);
  const fallback = rates.find((r) => r.category_id === null && r.product_id === null);
  return round2((lineTotal * Number(fallback?.percent ?? 10)) / 100);
}

export function splitRemainder(remainder: number, cfg: AffiliateConfig) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const manufacturerAmount = round2((remainder * cfg.manufacturerPct) / 100);
  const websiteAmount = round2(remainder - manufacturerAmount);
  return { manufacturerAmount, websiteAmount };
}

export function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

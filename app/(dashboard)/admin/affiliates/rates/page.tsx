import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getAllCategories } from '@/lib/catalog';
import { AffiliateRateSettings } from '@/components/admin/AffiliateProgramAdmin';
import { AffiliatesSubNav } from '@/components/admin/AffiliatesSubNav';

export const dynamic = 'force-dynamic';

export default async function AdminAffiliateRatesPage() {
  const session = await getSession();
  if (session.role !== 'admin') redirect('/');

  const sb = await createSupabaseServer();
  const [{ data: rates }, categories] = await Promise.all([
    sb.from('affiliate_commission_rates').select('id,category_id,product_id,percent,fixed_amount, product:products(part_number,name)'),
    getAllCategories(),
  ]);

  const defaultRate = (rates ?? []).find((r: any) => r.category_id === null && r.product_id === null);
  const categoryRates = (rates ?? []).filter((r: any) => r.category_id !== null);
  const productRates = (rates ?? []).filter((r: any) => r.product_id !== null).map((r: any) => ({
    id: r.id, product_id: r.product_id, percent: r.percent, fixed_amount: r.fixed_amount,
    part_number: r.product?.part_number ?? '—', name: r.product?.name ?? '—',
  }));

  return (
    <main className="wrap" style={{ padding: '24px 24px 64px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Affiliate program</h1>
      <AffiliatesSubNav />
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Commission rates</h2>
      <AffiliateRateSettings
        defaultPercent={Number(defaultRate?.percent ?? 10)}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        categoryRates={categoryRates as any}
        productRates={productRates}
      />
    </main>
  );
}

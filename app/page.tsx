import { getTopCategories, getFeatured, getCategorySlugMap } from '@/lib/catalog';
import { Hero, CategoryGrid, FeaturedProducts, DealsBanner, BrandsStrip, VipBand } from '@/components/home';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured, slugById] = await Promise.all([getTopCategories(), getFeatured(4), getCategorySlugMap()]);

  return (
    <main className="wrap" style={{ paddingTop: 8 }}>
      <Hero />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featured} slugById={slugById} />
      <DealsBanner />
      <BrandsStrip />
      <VipBand />
    </main>
  );
}

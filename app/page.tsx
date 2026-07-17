import { getTopCategories, getFeatured, getCategorySlugMap } from '@/lib/catalog';
import { Hero, CategoryGrid, FeaturedProducts, BrandsStrip, VipBand } from '@/components/home';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured, slugById] = await Promise.all([getTopCategories(), getFeatured(4), getCategorySlugMap()]);

  return (
    <main className="wrap" style={{ paddingTop: 8 }}>
      <Hero />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featured} slugById={slugById} />
      <BrandsStrip />
      <VipBand />
    </main>
  );
}

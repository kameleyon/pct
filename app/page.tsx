import { getTopCategories, getFeatured, getCategorySlugMap, getProductCountLabel } from '@/lib/catalog';
import { Hero, CategoryGrid, FeaturedProducts, BrandsStrip, VipBand } from '@/components/home';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured, slugById, count] = await Promise.all([getTopCategories(), getFeatured(4), getCategorySlugMap(), getProductCountLabel()]);

  return (
    <main className="wrap" style={{ paddingTop: 8 }}>
      <Hero count={count} />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featured} slugById={slugById} />
      <BrandsStrip />
      <VipBand />
    </main>
  );
}

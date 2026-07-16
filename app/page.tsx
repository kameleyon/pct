import { getCategories, getFeatured } from '@/lib/catalog';
import { Hero, CategoryGrid, FeaturedProducts, DealsBanner, BrandsStrip, VipBand } from '@/components/home';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeatured(4)]);
  const slugById = Object.fromEntries(categories.map((c) => [c.id, c.slug]));

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

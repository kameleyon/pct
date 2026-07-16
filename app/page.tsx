import { getCategories, getFeatured } from '@/lib/catalog';
import { Hero, CategoryGrid, FeaturedProducts, DealsBanner, CapabilityStrip } from '@/components/home';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeatured(8)]);
  const slugById = Object.fromEntries(categories.map((c) => [c.id, c.slug]));

  return (
    <main className="wrap" style={{ padding: '16px 32px 0' }}>
      <Hero />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featured} slugById={slugById} />
      <DealsBanner />
      <CapabilityStrip />
    </main>
  );
}

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { getSession } from '@/lib/auth';
import { getCartAction } from '@/app/cart/actions';

// Reads per-user data (session, cart) on every request — force-dynamic +
// no-store here prevents the cross-account caching leak this app was
// previously bitten by (see app/layout.tsx).
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAuthed = session.role !== 'guest';
  const serverLines = isAuthed ? await getCartAction() : [];

  return (
    <CartProvider isAuthed={isAuthed} serverLines={serverLines}>
      <Header />
      {children}
      <Footer />
      <CartDrawer isAuthed={isAuthed} />
    </CartProvider>
  );
}

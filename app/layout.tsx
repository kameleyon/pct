import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { getSession } from '@/lib/auth';
import { getCartAction } from '@/app/cart/actions';

export const metadata: Metadata = {
  title: 'Precision CNC Tools — Precision Cutting Tools',
  description:
    'Thousands of precision cutting tools stocked in Zephyrhills, Florida — factory-direct access to 120+ trusted brands.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAuthed = session.role !== 'guest';
  const serverLines = isAuthed ? await getCartAction() : [];

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider isAuthed={isAuthed} serverLines={serverLines}>
            <Header />
            {children}
            <Footer />
            <CartDrawer isAuthed={isAuthed} />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

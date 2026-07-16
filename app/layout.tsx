import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-archivo' });

export const metadata: Metadata = {
  title: 'Precise Cut Tools — Precision Cutting Tools',
  description:
    'Solid carbide end mills and precision cutting tools. Factory-direct, made in the USA. Same-day pickup in Largo, Florida.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

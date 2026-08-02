import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'Precision CNC Tools — Precision Cutting Tools',
  description:
    'Thousands of precision cutting tools stocked in Zephyrhills, Florida — factory-direct access to 120+ trusted brands.',
};

// Kept dynamic here too, even though the (shop) and (dashboard) route-group
// layouts each set this themselves for the per-user data they read (session,
// cart) — this is the belt-and-suspenders backstop for the cross-account
// caching leak that config was originally added to fix.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

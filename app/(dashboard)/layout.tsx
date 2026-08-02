import { DashboardHeader } from '@/components/DashboardHeader';

// Reads per-user session data — same caching-leak concern as (shop)/layout.tsx.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  );
}

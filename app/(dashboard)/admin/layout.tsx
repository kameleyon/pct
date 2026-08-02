import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="wrap" style={{ paddingTop: 20 }}>
        <AdminNav />
      </div>
      {children}
    </>
  );
}

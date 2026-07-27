// Client-safe role types & helpers — no server-only imports here, so this
// module can be pulled into client bundles freely.
// 'affiliate' and 'distributor' are reserved now for their own upcoming
// programs (referral tracking + commissions, and wholesale pricing) so the
// role column and its call sites don't need another migration later.
export type Role = 'guest' | 'member' | 'vip' | 'admin' | 'affiliate' | 'distributor';

export type Session = {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  role: Role;
};

export const roleLabel = (r: Role) =>
  r === 'admin' ? 'Admin'
    : r === 'vip' ? 'VIP Member'
    : r === 'affiliate' ? 'Affiliate'
    : r === 'distributor' ? 'Distributor'
    : r === 'member' ? 'Member'
    : 'Guest';

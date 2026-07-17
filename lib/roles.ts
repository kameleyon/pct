// Client-safe role types & helpers — no server-only imports here, so this
// module can be pulled into client bundles freely.
export type Role = 'guest' | 'member' | 'vip' | 'admin';

export type Session = {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  role: Role;
};

export const roleLabel = (r: Role) =>
  r === 'admin' ? 'Admin' : r === 'vip' ? 'VIP Member' : r === 'member' ? 'Member' : 'Guest';

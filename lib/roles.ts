export type Role = 'customer' | 'user' | 'teacher' | 'admin';

export const ALL_ROLES: Role[] = ['customer', 'user', 'teacher', 'admin'];

export const ACCESS_MAP: Record<Role, string[]> = {
  customer: ['/portal/customer'],
  user: ['/portal/user'],
  teacher: ['/portal/teacher'],
  admin: ['/portal/admin', '/portal/teacher', '/portal/user', '/portal/customer'],
};

export function canAccess(role: Role, pathname: string) {
  const prefixes = ACCESS_MAP[role] ?? [];
  return prefixes.some((p) => pathname.startsWith(p));
}

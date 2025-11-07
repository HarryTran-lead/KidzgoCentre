// lib/roles.ts
export type Role =
  | "ADMIN"
  | "STAFF_ACCOUNTING"
  | "STAFF_MANAGER"
  | "TEACHER"
  | "STUDENT";

export const ROLES: Record<Role, string> = {
  ADMIN: "/portal/admin",
  STAFF_ACCOUNTING: "/portal/staff-accountant",
  STAFF_MANAGER: "/portal/staff-management",
  TEACHER: "/portal/teacher",
  STUDENT: "/portal/student",
};

export const ALL_ROLES = Object.keys(ROLES) as Role[];

export const ACCESS_MAP: Record<Role, string[]> = {
  ADMIN: [ROLES.ADMIN],
  STAFF_ACCOUNTING: [ROLES.STAFF_ACCOUNTING],
  STAFF_MANAGER: [ROLES.STAFF_MANAGER],
  TEACHER: [ROLES.TEACHER],
  STUDENT: [ROLES.STUDENT],
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  STAFF_ACCOUNTING: "Kế toán",
  STAFF_MANAGER: "Quản lý",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
};

export function normalizeRole(input?: string): Role {
  const v = (input || "").toUpperCase().trim();
  if (["ADMIN"].includes(v)) return "ADMIN";
  if (["STAFF_ACCOUNTING", "ACCOUNTANT", "ACCOUNTING"].includes(v))
    return "STAFF_ACCOUNTING";
  if (["STAFF_MANAGER", "MANAGER", "MANAGEMENT", "STAFF"].includes(v))
    return "STAFF_MANAGER";
  if (["TEACHER"].includes(v)) return "TEACHER";
  if (["STUDENT", "USER", "CUSTOMER"].includes(v)) return "STUDENT";
  return "STUDENT";
}

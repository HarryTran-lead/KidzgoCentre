// @/lib/role
import { EndPoint } from "@/lib/routes";

export type Role =
  | "ADMIN"
  | "STAFF_ACCOUNTANT"
  | "STAFF_MANAGER"
  | "TEACHER"
  | "STUDENT";

/** Map role -> base portal path */
export const ROLES: Record<Role, string> = {
  ADMIN: EndPoint.ADMIN,
  STAFF_ACCOUNTANT: EndPoint.STAFF_ACCOUNTANT,
  STAFF_MANAGER: EndPoint.STAFF_MANAGER,
  TEACHER: EndPoint.TEACHER,
  STUDENT: EndPoint.STUDENT,
};

export const ALL_ROLES = Object.keys(ROLES) as Role[];

/** Các prefix path được phép cho từng role */
export const ACCESS_MAP: Record<Role, string[]> = {
  ADMIN: [EndPoint.ADMIN],
  STAFF_ACCOUNTANT: [EndPoint.STAFF_ACCOUNTANT],
  STAFF_MANAGER: [EndPoint.STAFF_MANAGER],
  TEACHER: [EndPoint.TEACHER],
  STUDENT: [EndPoint.STUDENT],
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  STAFF_ACCOUNTANT: "Kế toán",
  STAFF_MANAGER: "Quản lý",
  TEACHER: "Giáo viên",
  STUDENT: "Học viên",
};

/** Chuẩn hoá chuỗi role từ nhiều biến thể sang union Role */
export function normalizeRole(input?: string): Role {
  const v = (input || "").toUpperCase().trim();
  if (["ADMIN"].includes(v)) return "ADMIN";
  if (["STAFF_ACCOUNTANT", "ACCOUNTANT", "ACCOUNTING"].includes(v))
    return "STAFF_ACCOUNTANT";
  if (["STAFF_MANAGER", "MANAGER", "MANAGEMENT", "STAFF"].includes(v))
    return "STAFF_MANAGER";
  if (["TEACHER"].includes(v)) return "TEACHER";
  if (["STUDENT", "USER", "CUSTOMER"].includes(v)) return "STUDENT";
  return "STUDENT";
}

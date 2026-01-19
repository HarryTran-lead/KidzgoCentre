// @/lib/role
import { EndPoint } from "@/lib/routes";

export type Role =
  | "Admin"
  | "Staff_Accountant"
  | "Staff_Manager"
  | "Teacher"
  | "Student"
  | "Parent";


/** Map role -> base portal path */
export const ROLES: Record<Role, string> = {
  Admin: EndPoint.ADMIN,
  Staff_Accountant: EndPoint.STAFF_ACCOUNTANT,
  Staff_Manager: EndPoint.STAFF_MANAGER,
  Teacher: EndPoint.TEACHER,
  Student: EndPoint.STUDENT,
  Parent: EndPoint.PARENT,
};

export const ALL_ROLES = Object.keys(ROLES) as Role[];

/** Các prefix path được phép cho từng role */
export const ACCESS_MAP: Record<Role, string[]> = {
  Admin: [EndPoint.ADMIN],
  Staff_Accountant: [EndPoint.STAFF_ACCOUNTANT],
  Staff_Manager: [EndPoint.STAFF_MANAGER],
  Teacher: [EndPoint.TEACHER],
  Student: [EndPoint.STUDENT],
  Parent: [EndPoint.PARENT],

};

export const ROLE_LABEL: Record<Role, string> = {
  Admin: "Quản trị viên",
  Staff_Accountant: "Kế toán",
  Staff_Manager: "Quản lý",
  Teacher: "Giáo viên",
  Student: "Học viên",
  Parent: "Phụ huynh",
};

/** Chuẩn hoá chuỗi role từ nhiều biến thể sang union Role */
export function normalizeRole(input?: string): Role {
  const v = (input || "").toUpperCase().trim();
  if (["ADMIN"].includes(v)) return "Admin";
  if (["STAFF_ACCOUNTANT", "ACCOUNTANT", "ACCOUNTING"].includes(v))
    return "Staff_Accountant";
  if (["STAFF_MANAGER", "MANAGER", "MANAGEMENT", "STAFF"].includes(v))
    return "Staff_Manager";
  if (["TEACHER"].includes(v)) return "Teacher";
  if (["STUDENT", "USER", "CUSTOMER"].includes(v)) return "Student";
  if (["PARENT", "GUARDIAN"].includes(v)) return "Parent";
  return "Student";
}

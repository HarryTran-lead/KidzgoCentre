// components/portal/menu/index.ts
import type { Role } from "@/lib/role"; 
import { ROLES, normalizeRole } from "@/lib/role";
import type { MenuItem } from "./types";
import { adminMenu } from "./admin";
import { staffAccountingMenu } from "./staffAccounting";
import { staffManagerMenu } from "./staffManager";
import { teacherMenu } from "./teacher";
import { studentMenu } from "./student";

export type { MenuItem } from "./types";

export function buildMenu(roleInput: Role | string): MenuItem[] {
  // phòng trường hợp truyền nhầm string lạ
  const role = normalizeRole(roleInput as string);
  const root = ROLES[role];

  switch (role) {
    case "ADMIN":
      return adminMenu(root);
    case "STAFF_ACCOUNTANT":
      return staffAccountingMenu(root);
    case "STAFF_MANAGER":
      return staffManagerMenu(root);
    case "TEACHER":
      return teacherMenu(root);
    case "STUDENT":
      return studentMenu(root);
    default:
      // fallback an toàn (ít gặp)
      return studentMenu(root);
  }
}

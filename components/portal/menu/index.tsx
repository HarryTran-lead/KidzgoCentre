// components/portal/menu/index.ts
import type { Role } from "@/lib/role";
import { ROLES, normalizeRole } from "@/lib/role";
import type { MenuItem } from "./types";
import { adminMenu } from "./admin";
import { staffAccountingMenu } from "./staffAccounting";
import { staffManagerMenu } from "./staffManager";
import { teacherMenu } from "./teacher";
import { studentMenu } from "./student";
import { parentMenu } from "./parent";
import { DEFAULT_LOCALE, pickLocaleFromPath, type Locale } from "@/lib/i18n";

export type { MenuItem } from "./types";

export function buildMenu(
  roleInput: Role | string,
  locale: Locale = DEFAULT_LOCALE
): MenuItem[] {
  const role = normalizeRole(roleInput as string);
  let root = ROLES[role];

  const needsPrefix =
    !root.startsWith(`/${locale}/`) && !root.startsWith(`/${locale}`);
  if (needsPrefix) {
    const cleaned = root.startsWith("/") ? root.slice(1) : root;
    root = `/${locale}/${cleaned}`.replace(/\/+$/, "");
  }

  switch (role) {
    case "Admin":
      return adminMenu(root, locale);
    case "Staff_Accountant":
      return staffAccountingMenu(root, locale);
    case "Staff_Manager":
      return staffManagerMenu(root, locale);
    case "Teacher":
      return teacherMenu(root, locale);
    case "Student":
      return studentMenu(root, locale);
    case "Parent":
      return parentMenu(root, locale);
    default:
      return studentMenu(root, locale);
  }
}

export function buildMenuFromPath(
  roleInput: Role | string,
  pathname?: string
): MenuItem[] {
  const loc = pathname
    ? pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE
    : DEFAULT_LOCALE;
  return buildMenu(roleInput, loc);
}

// lib/auth.ts
import "server-only";
import { cookies } from "next/headers";
import { localizePath, type Locale } from "@/lib/i18n";
import { ROLES, type Role } from "@/lib/role";

export type DemoAccount = {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  role: Role | null;          // 👈 FAMILY sẽ là null
  redirectPath?: string;      // route “gốc” sau login
};

// 1 tài khoản dùng chung cho Học sinh + Phụ huynh
const FAMILY_EMAIL = "family@kidzgo.vn";
const FAMILY_PASSWORD = "family123";

// Nếu bạn muốn cho phép gõ alias khác (vd: student@..., parent@...) vẫn dùng chung:
const FAMILY_ALIASES = [
  "student@kidzgo.vn",
  "parent@kidzgo.vn",
];

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "ACC-ADMIN",
    email: "admin@kidzgo.vn",
    password: "admin123",
    name: "Nguyễn Minh Quân",
    avatar: "",
    role: "ADMIN",
    redirectPath: ROLES.ADMIN,
  },
  {
    id: "ACC-MANAGER",
    email: "manager@kidzgo.vn",
    password: "manager123",
    name: "Trần Bảo Anh",
    avatar: "",
    role: "STAFF_MANAGER",
    redirectPath: ROLES.STAFF_MANAGER,
  },
  {
    id: "ACC-ACCOUNTANT",
    email: "accountant@kidzgo.vn",
    password: "accountant123",
    name: "Phạm Thu Hà",
    avatar: "",
    role: "STAFF_ACCOUNTANT",
    redirectPath: ROLES.STAFF_ACCOUNTANT,
  },
  {
    id: "ACC-TEACHER",
    email: "teacher@kidzgo.vn",
    password: "teacher123",
    name: "Lê Quốc Huy",
    avatar: "",
    role: "TEACHER",
    redirectPath: ROLES.TEACHER,
  },
  // 👇 FAMILY: dùng chung cho phụ huynh + học sinh → role = null, redirect /portal
  {
    id: "ACC-FAMILY",
    email: FAMILY_EMAIL,
    password: FAMILY_PASSWORD,
    name: "Gia đình KidzGo",
    avatar: "",
    role: null,
    redirectPath: "/portal",
  },
];

export function authenticateDemoAccount(
  email: string,
  password: string,
  locale: Locale
): (DemoAccount & { targetPath: string }) | null {
  const input = email.trim().toLowerCase();

  // Nếu user gõ student@... hoặc parent@..., map về FAMILY_EMAIL
  const normalizedEmail = FAMILY_ALIASES.includes(input)
    ? FAMILY_EMAIL.toLowerCase()
    : input;

  const found = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail
  );

  if (!found || found.password !== password) {
    return null;
  }

  // Nếu redirectPath không có, mặc định /portal
  const base = found.redirectPath || "/portal";
  const localized = localizePath(base, locale);

  return { ...found, targetPath: localized };
}

// ==== SESSION ====

export type Session = {
  role?: string;
  user?: { id: string; name?: string; avatar?: string };
} | null;

export async function getSession(): Promise<Session> {
  const jar = await cookies(); // Next 15: cần await

  // 1) ƯU TIÊN COOKIE DO PROXY/MIDDLEWARE SET
  const cookieRole =
    jar.get("role")?.value ??
    jar.get("session-role")?.value ??
    jar.get("x-role")?.value;

  if (cookieRole) {
    return {
      role: cookieRole,
      user: {
        id: "dev",
        name: jar.get("user-name")?.value ?? "KidzGo User",
        avatar: jar.get("user-avatar")?.value,
      },
    };
  }

  // 2) DEV-BYPASS (chỉ khi chưa có cookie)
  if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "1") {
    const devRole = process.env.NEXT_PUBLIC_DEV_ROLE || "ADMIN";
    return { role: devRole, user: { id: "dev", name: "Dev User" } };
  }

  // 3) Không có gì -> chưa đăng nhập
  return null;
}

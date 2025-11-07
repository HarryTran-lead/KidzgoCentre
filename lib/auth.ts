// lib/auth.ts
import "server-only";
import { cookies } from "next/headers";

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

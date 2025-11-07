// app/[locale]/portal/layout.tsx
import type { ReactNode } from "react";
import Sidebar from "@/components/portal/sidebar";
import HeaderPortal from "@/components/portal/header";
import { normalizeRole, type Role } from "@/lib/role";
import { localizePath, type Locale } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";

/* Đoán role từ path khi dev-bypass */
function roleFromPath(pathname: string): Role | null {
  if (!pathname) return null;
  const p = pathname.toLowerCase();
  if (p.includes("/portal/admin")) return "ADMIN";
  if (p.includes("/portal/staff-accountant")) return "STAFF_ACCOUNTING";
  if (p.includes("/portal/staff-management")) return "STAFF_MANAGER";
  if (p.includes("/portal/teacher") || p.startsWith("/teacher"))
    return "TEACHER";
  if (p.includes("/portal/student") || p.startsWith("/student"))
    return "STUDENT";
  return null;
}

type Props = {
  children: ReactNode;
  // Next 15: params là Promise và locale = string (KHÔNG thu hẹp "vi" | "en")
  params: Promise<{ locale: string }>;
};

export default async function PortalLayout({ children, params }: Props) {
  const { locale } = await params; // string từ Next
  const loc = locale as Locale; // cast sang union riêng của app khi cần

  const session = await getSession();
  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "1";

  let role: Role | null = session?.role ? normalizeRole(session.role) : null;

  if (!role && devBypass) {
    const h = await headers(); // môi trường bạn: async
    const raw =
      h.get("x-invoke-path") ||
      h.get("x-matched-path") ||
      h.get("next-url") ||
      h.get("referer") ||
      "";

    const pathname = raw?.startsWith("http")
      ? (() => {
          try {
            return new URL(raw).pathname;
          } catch {
            return raw;
          }
        })()
      : raw || "";

    role =
      roleFromPath(pathname) ||
      normalizeRole(process.env.NEXT_PUBLIC_DEV_ROLE || "ADMIN");
  }

  // Prod + chưa login → về login
  if (!role) {
    redirect(localizePath(`/auth/login?returnTo=/portal`, loc));
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[280px_1fr] bg-slate-50">
      <Sidebar role={role} />
      <div className="flex min-h-screen flex-col">
        <HeaderPortal role={role} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

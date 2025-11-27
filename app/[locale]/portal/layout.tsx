import type { ReactNode } from "react";
import Sidebar from "@/components/portal/sidebar";
import PortalHeader from "@/components/portal/header";
import { normalizeRole, type Role } from "@/lib/role";
import { localizePath, type Locale } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";

// Suy ra role từ URL (hỗ trợ cả /portal/staff/management|accounting và dạng gạch nối)
function roleFromPath(pathname: string): Role | void {
  const path = pathname.split("#")[0].split("?")[0];
  const parts = path.split("/").filter(Boolean);
  const idx = parts[0] === "vi" || parts[0] === "en" ? 1 : 0;
  if (parts[idx] !== "portal") return;

  const seg1 = parts[idx + 1] || "";
  const seg2 = parts[idx + 2] || "";

  if (seg1 === "admin") return "ADMIN";
  if (seg1 === "teacher") return "TEACHER";
  if (seg1 === "student") return "STUDENT";
if (seg1 === "parent") return "PARENT";
  // /portal/staff/management | /portal/staff/accounting
  if (seg1 === "staff") {
    if (seg2 === "management") return "STAFF_MANAGER";
    if (seg2 === "accounting") return "STAFF_ACCOUNTANT";
  }

  // dự phòng dạng gạch nối cũ: /portal/staff-management | /portal/staff-accountant
  if (seg1 === "staff-management") return "STAFF_MANAGER";
  if (seg1 === "staff-accountant") return "STAFF_ACCOUNTANT";
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export default async function PortalLayout({ children, params }: Props) {
  //  await params trước khi dùng
  const { locale } = await params;
  const loc = locale as Locale;

  const session = await getSession();
const h = await headers();
  const rawPath =
    h.get("x-invoke-path") ||
    h.get("x-matched-path") ||
    h.get("next-url") ||
    h.get("referer") ||
    "";

  const pathname = rawPath?.startsWith("http")
    ? (() => {
        try {
          return new URL(rawPath).pathname;
        } catch {
          return rawPath;
        }
      })()
    : rawPath || "";

  const parts = pathname.split("#")[0].split("?")[0].split("/").filter(Boolean);
  const localeIdx = parts[0] === "vi" || parts[0] === "en" ? 1 : 0;
  const isPortalEntry = parts[localeIdx] === "portal" && parts.length === localeIdx + 1;

  // Cho phép bypass ở local hoặc vercel preview
  const devBypass =
    (process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "1") ||
    (process.env.VERCEL_ENV === "preview" &&
      process.env.AUTO_LOGIN_PREVIEW === "1");

  let role: Role | null = session?.role ? normalizeRole(session.role) : null;

  if (!role && devBypass) {
   

    role =
      roleFromPath(pathname) ||
      normalizeRole(
        process.env.AUTO_LOGIN_ROLE ||
          process.env.NEXT_PUBLIC_DEV_ROLE ||
          "ADMIN"
      );
  }

if (!role && !isPortalEntry) {
    redirect(localizePath(`/auth/login?returnTo=/portal`, loc));
  }

  if (!role) {
    return <div className="min-h-dvh bg-slate-50">{children}</div>;
  }
  return (
    <div className="h-dvh w-full">
      {/* dùng dvh để ổn định trên mobile */}
      <div className="flex h-full">
        {/* Sidebar: desktop chiếm chỗ thật, mobile overlay ở trong chính component */}
        <Sidebar role={role!} />

        {/* Cột nội dung: CHÍNH CỘT NÀY là container cuộn */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header sticky trong cùng container => không cuộn cùng main */}
          <PortalHeader />

          {/* Nội dung cuộn bên dưới header */}
          <div className="grow px-4 sm:px-6 py-6 bg-slate-50 min-w-0 overflow-y-auto">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

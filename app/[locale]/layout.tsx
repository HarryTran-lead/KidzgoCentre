// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import Navbar from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SURFACE_SOFT } from "@/lib/theme/theme";
import type { Locale } from "@/lib/i18n";
import { headers } from "next/headers";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const loc = locale as Locale;

  const h = await headers();
  const rawPath =
    h.get("x-invoke-path") ||
    h.get("x-matched-path") ||
    h.get("x-pathname") ||
    h.get("next-url") ||
    h.get("referer") ||
    "";

  let pathname =
    rawPath && rawPath.startsWith("http")
      ? (() => {
          try {
            return new URL(rawPath).pathname;
          } catch {
            return rawPath;
          }
        })()
      : rawPath || "";

  // fallback nếu header không có path
  if (!pathname) {
    pathname = `/${loc}`;
  }

  // 👉 Portal routes: /vi/portal/... hoặc /portal/...
  const isPortal =
    pathname.startsWith(`/${loc}/portal`) || pathname.startsWith("/portal");

  // 🔹 Nếu là portal → KHÔNG render Navbar/Footer,
  // để app/[locale]/portal/layout.tsx tự điều khiển sidebar + header portal
  if (isPortal) {
    return (
      <div className={`min-h-screen ${SURFACE_SOFT} text-slate-900`}>
        {children}
      </div>
    );
  }

  // 🔹 Các route thường (home, contact, faqs, ...) vẫn dùng Navbar/Footer
  return (
    <div className={`min-h-screen ${SURFACE_SOFT} text-slate-900`}>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

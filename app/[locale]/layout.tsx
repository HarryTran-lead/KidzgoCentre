// app/[locale]/layout.tsx
import type { ReactNode } from "react";
import Navbar from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { SURFACE_SOFT } from "@/lib/theme/theme";
import type { Locale } from "@/lib/i18n";

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const loc = params.locale as Locale; // để dùng sau nếu cần

  return (
    <div className={`min-h-screen ${SURFACE_SOFT} text-slate-900`}>
      <Navbar />
      {/* mỗi page tự quyết định có pt-24 hay không */}
      {children}
      <Footer />
    </div>
  );
}

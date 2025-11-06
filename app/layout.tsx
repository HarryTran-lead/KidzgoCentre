// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KidzGo",
  description: "Learning Through Play",
  // tuỳ chọn: để status bar Android đẹp hơn
  themeColor: "#f0f72a",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Với phiên bản hiện tại cookies() là Promise -> cần await
  const cookieStore = await cookies();
  const cookieLocale =
    (cookieStore.get("locale")?.value as Locale | undefined) ?? DEFAULT_LOCALE;

  return (
    <html lang={cookieLocale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        // tránh warning nếu có khác biệt nhỏ client/SSR do các animation
        suppressHydrationWarning
      >
        {children}

        <ToastContainer autoClose={3000} />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

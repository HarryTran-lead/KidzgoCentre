import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster } from "@/components/lightswind/toaster";
import ReduxProvider from "@/components/providers/ReduxProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KidzGo",
  description: "Learning Through Play",
  };

export const viewport = {
  themeColor: "#f0f72a",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const cookieLocale =
    (jar.get("locale")?.value as Locale | undefined) ?? DEFAULT_LOCALE;

  return (
    <html lang={cookieLocale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
        data-locale={cookieLocale}
      >
                        <ReduxProvider>{children}</ReduxProvider>


        <ToastContainer autoClose={3000} />
        <HotToaster position="bottom-right" />
        <Toaster />
      </body>
    </html>
  );
}

// app/[locale]/contact/page.tsx
import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Header";
import Contact from "@/components/home/Main/Contact";
import BannerContact from "@/components/home/Main/Contact/Banner";
import type { Locale } from "@/lib/i18n";

export default function ContactPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const loc = locale as Locale;

  return (
    <main className="">
      <Navbar />
      <BannerContact />
      <Contact />
      <Footer />
    </main>
  );
}

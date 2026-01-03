import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Header";
import FAQs from "@/components/home/Main/FAQs";
import BannerFAQ from "@/components/home/Main/FAQs/Banner";
import type { Locale } from "@/lib/i18n";

export default function FAQsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const loc = locale as Locale;

  return (
    <main className="">
      <Navbar />
      <BannerFAQ />
      <FAQs />
      <Footer />
    </main>
  );
}

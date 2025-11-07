import Navbar from "@/components/homepage/Navbar";
import Hero from "@/components/homepage/Hero";
import Roadmap from "@/components/homepage/Roadmap";
import WhyUs from "@/components/homepage/WhyUs";
import Courses from "@/components/homepage/Courses";
import Programs from "@/components/homepage/Programs";
import Testimonials from "@/components/homepage/Testimonials";
import Gallery from "@/components/homepage/Gallery";
import Blog from "@/components/homepage/Blog";
import CtaStrip from "@/components/homepage/CtaStrip";
import FAQs from "@/components/homepage/FAQs";
import Contact from "@/components/homepage/Contact";
import Footer from "@/components/homepage/Footer";
import { SURFACE_SOFT } from "@/lib/theme/theme";
import type { Locale } from "@/lib/i18n";

export async function generateStaticParams(): Promise<{ locale: string }[]> {
  return ["en", "vi"].map((locale) => ({ locale }));
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>; // ✅ props rộng = string
}) {
  const { locale } = await params;
  const loc = locale as Locale; // ✅ cast khi dùng nếu cần

  return (
    <div className={`min-h-screen ${SURFACE_SOFT} text-slate-900`}>
      <Navbar />
      <Hero />
      <Roadmap />
      <WhyUs />
      <Courses />
      <Testimonials />
      <Gallery />
      <Programs />
      <Blog />
      <FAQs />
      <Contact />
      <CtaStrip />
      <Footer />
    </div>
  );
}

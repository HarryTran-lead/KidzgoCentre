// app/page.tsx  (SERVER COMPONENT)
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
import Contact from "@/components/homepage/Contact";
import Footer from "@/components/homepage/Footer";
import { SURFACE_SOFT } from "@/lib/theme/theme";

export default function Page() {
  return (
    <div className={`min-h-screen ${SURFACE_SOFT} text-slate-900`}>
      <Navbar />
      <Hero />
      <Roadmap />
      <WhyUs />
      <Courses />
      <Programs />
      <Testimonials />
      <Gallery />
      <Blog />
      <CtaStrip />
      <Contact />
      <Footer />
    </div>
  );
}

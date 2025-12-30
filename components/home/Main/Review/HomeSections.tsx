// components/home/HomeSections.tsx
import Hero from "@/components/home/Main/Review/Hero";
import Roadmap from "@/components/home/Main/Review/Roadmap";
import WhyUs from "@/components/home/Main/Review/WhyUs";
import Courses from "@/components/home/Main/Review/Courses";
import Programs from "@/components/home/Main/Review/Programs";
import Testimonials from "@/components/home/Main/Review/Testimonials";
import Gallery from "@/components/home/Main/Review/Gallery";
import Teacher from "@/components/home/Main/Review/Teacher";
import Blog from "@/components/home/Main/Review/Blog";
import CtaStrip from "@/components/home/Main/Review/CtaStrip";

export default function HomeSections() {
  return (
    <>
      <Hero />
      <div className="h-screen" />
      <Roadmap />
      <WhyUs />
      <Courses />
      <Testimonials />
      <Gallery />
      <Teacher />
      <Programs />
      <Blog />
      {/* <CtaStrip /> */}
    </>
  );
}

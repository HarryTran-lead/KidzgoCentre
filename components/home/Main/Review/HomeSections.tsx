// components/home/HomeSections.tsx
import Hero from "@/components/home/Main/Review/Hero";
import AboutSection from "@/components/home/Main/Review/AboutSection";
import CenterStorySection from "@/components/home/Main/Review/CenterStorySection";
import WhyUs from "@/components/home/Main/Review/WhyUs";
import Courses from "@/components/home/Main/Review/Courses";
import Teacher from "@/components/home/Main/Review/Teacher";
import FeedbackSection from "@/components/home/Main/Review/FeedbackSection";
import Blog from "@/components/home/Main/Review/Blog";

export default function HomeSections() {
  return (
    <>
      <Hero />
      <div className="h-screen" />
      <AboutSection />
      <CenterStorySection />
      <Courses />
      <WhyUs />
      <Teacher />
      <FeedbackSection />
      <Blog />
    </>
  );
}

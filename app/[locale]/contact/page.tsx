// app/[locale]/contact/page.tsx
import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Header";
import Contact from "@/components/home/Main/Contact";
import BannerContact from "@/components/home/Main/Contact/Banner";

export default function ContactPage() {
  return (
    <main className="">
      <Navbar />
      <BannerContact />
      <Contact />
      <Footer />
    </main>
  );
}

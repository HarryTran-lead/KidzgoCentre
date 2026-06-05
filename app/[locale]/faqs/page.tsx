import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Header";
import FAQs from "@/components/home/Main/FAQs";
import BannerFAQ from "@/components/home/Main/FAQs/Banner";

export default function FAQsPage() {
  return (
    <main className="">
      <Navbar />
      <BannerFAQ />
      <FAQs />
      <Footer />
    </main>
  );
}

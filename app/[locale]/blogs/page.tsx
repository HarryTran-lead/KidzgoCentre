// app/[locale]/blogs/page.tsx
import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Header";
import Blogs from "@/components/home/Main/Blogs";
import BannerBlog from "@/components/home/Main/Blogs/Banner";

export default function BlogsPage() {
  return (
    <main className="">
      <Navbar />
      <BannerBlog />
      <Blogs />
      <Footer />
    </main>
  );
}


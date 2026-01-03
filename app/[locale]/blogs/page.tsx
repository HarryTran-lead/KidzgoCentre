// app/[locale]/blogs/page.tsx
import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Header";
import Blogs from "@/components/home/Main/Blogs";
import BannerBlog from "@/components/home/Main/Blogs/Banner";
import type { Locale } from "@/lib/i18n";

export default function BlogsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const loc = locale as Locale;

  return (
    <main className="">
      <Navbar />
      <BannerBlog />
      <Blogs />
      <Footer />
    </main>
  );
}


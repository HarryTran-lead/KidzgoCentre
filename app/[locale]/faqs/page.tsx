import FAQs from "@/components/home/Main/FAQs";
import type { Locale } from "@/lib/i18n";

export default function FAQsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const loc = locale as Locale;

  return (
    <main className="pt-14 md:pt-14 lg:pt-15 xl:pt-16">
      <FAQs />
    </main>
  );
}

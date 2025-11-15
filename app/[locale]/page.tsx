// app/[locale]/page.tsx
import HomeSections from "@/components/home/Main/Review/HomeSections";
import type { Locale } from "@/lib/i18n";

export async function generateStaticParams(): Promise<{ locale: string }[]> {
  return ["en", "vi"].map((locale) => ({ locale }));
}

export default function LocalizedHomePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const loc = locale as Locale;

  // Layout đã bọc Navbar + Footer + SURFACE_SOFT
  return (
    <main>
      <HomeSections />
    </main>
  );
}

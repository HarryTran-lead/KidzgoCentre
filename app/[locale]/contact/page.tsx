// app/[locale]/contact/page.tsx
import Contact from "@/components/home/Main/Contact";
import type { Locale } from "@/lib/i18n";

export default function ContactPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const loc = locale as Locale;

  return (
    <main className="">
      <Contact />
    </main>
  );
}

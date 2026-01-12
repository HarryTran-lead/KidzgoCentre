// app/[locale]/auth/login/parent/page.tsx
import LoginCard from "@/components/auth/LoginCard";
import { type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Next 15: params & searchParams là Promise nên phải await
export default async function ParentLoginPage(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;

  return (
    <div className="w-full">
      <LoginCard locale={locale} />
    </div>
  );
}

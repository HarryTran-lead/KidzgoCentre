// app/[locale]/auth/login/page.tsx
import LoginCard from "@/components/auth/LoginCard";
import { type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";


export default async function LoginPage(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;

  return (
    <div className="w-full">
      <LoginCard locale={locale} />
    </div>
  );
}

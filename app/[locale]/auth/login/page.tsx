// app/[locale]/auth/login/page.tsx
import LoginCard from "@/components/auth/LoginCard";
import { type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";


export default async function LoginPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await props.params;
  const { redirect } = await props.searchParams;

  return (
    <div className="w-full">
      <LoginCard locale={locale} returnTo={redirect ?? ""} />
    </div>
  );
}

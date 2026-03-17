import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";
import { type Locale } from "@/lib/i18n";

export default async function ForgotPasswordPage(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;

  return (
    <div className="w-full">
      <ForgotPasswordCard locale={locale} />
    </div>
  );
}



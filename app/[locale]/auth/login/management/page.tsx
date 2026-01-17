// app/[locale]/auth/login/management/page.tsx
import StaffLoginCard from "@/components/auth/StaffLoginCard";
import { type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Next 15: params & searchParams là Promise nên phải await
export default async function ManagementLoginPage(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;

  return (
    <div className="w-full">
      <StaffLoginCard locale={locale} />
    </div>
  );
}

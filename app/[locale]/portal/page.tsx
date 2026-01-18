import type { Locale } from "@/lib/i18n";
import AccountChooser from "@/app/[locale]/portal/student/AccountChooser";

export default async function PortalIndex(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;

  return <AccountChooser locale={locale} />;

}

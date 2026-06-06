import { redirect } from "next/navigation";

export default async function AdminTeachersRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/portal/admin/accounts`);
}

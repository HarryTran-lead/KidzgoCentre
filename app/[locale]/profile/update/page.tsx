import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ profileId?: string; id?: string }>;
};

export default async function LegacyProfileUpdatePage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const profileId = (query?.profileId || query?.id || "").trim();

  if (!profileId) {
    redirect(`/${locale}/activate-profile`);
  }

  redirect(`/${locale}/activate-profile?id=${encodeURIComponent(profileId)}`);
}

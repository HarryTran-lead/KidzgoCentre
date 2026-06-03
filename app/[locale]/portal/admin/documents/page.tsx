import { redirect } from "next/navigation";

export default async function AdminDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const tabValue = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab;
  const targetSegment = tabValue === "plans" ? "plans" : "templates";
  const forwardedQuery = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(resolvedSearchParams)) {
    if (key === "tab") continue;
    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        if (value) forwardedQuery.append(key, value);
      }
      continue;
    }
    if (rawValue) forwardedQuery.set(key, rawValue);
  }

  const queryString = forwardedQuery.toString();
  redirect(
    `/${locale}/portal/admin/documents/${targetSegment}${queryString ? `?${queryString}` : ""}`,
  );
}

import { redirect } from "next/navigation";

export default function CenterOverviewPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/portal/admin`);
}

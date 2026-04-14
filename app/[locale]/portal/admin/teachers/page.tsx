import { redirect } from "next/navigation";

export default function AdminTeachersRedirectPage({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/portal/admin/accounts`);
}

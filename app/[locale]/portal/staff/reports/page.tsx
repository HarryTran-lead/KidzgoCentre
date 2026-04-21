import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function StaffReportsPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/portal/staff-management/feedback`);
}

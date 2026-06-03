import Link from "next/link";
import LessonPlanWorkspace from "@/components/lesson-plans/lesson-plan-workspace";

export default async function AdminLessonPlanTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <div className="flex items-center gap-2 bg-white border-b border-gray-100 px-4 py-2.5 text-sm">
        <Link
          href={`/${locale}/portal/admin/courses`}
          className="font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          Chương trình
        </Link>
        <span className="text-gray-400">/</span>
        <Link
          href={`/${locale}/portal/admin/syllabuses`}
          className="font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          Giáo trình
        </Link>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-700">Mẫu giáo án chuẩn</span>
      </div>
      <LessonPlanWorkspace scope="admin" forcedTab="templates" />
    </div>
  );
}
import Link from "next/link";

import LessonPlanWorkspace from "@/components/lesson-plans/lesson-plan-workspace";

export default async function TeacherSyllabusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-2.5 text-sm">
        <Link
          href={`/${locale}/portal/teacher/schedule`}
          className="font-medium text-gray-500 transition-colors hover:text-red-600"
        >
          Lịch giảng dạy
        </Link>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-700">Syllabus buổi học</span>
      </div>
      <LessonPlanWorkspace scope="teacher" presentation="session-page" />
    </div>
  );
}
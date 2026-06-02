import LessonPlanWorkspace from "@/components/lesson-plans/lesson-plan-workspace";

export default function AdminClassLessonPlansPage() {
  return (
    <div>
      <div className="flex items-center gap-2 bg-white border-b border-gray-100 px-4 py-2.5 text-sm">
        <span className="font-medium text-gray-500">Vận hành</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-700">Giáo án lớp</span>
      </div>
      <LessonPlanWorkspace scope="admin" forcedTab="plans" />
    </div>
  );
}
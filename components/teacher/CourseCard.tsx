
import { BookOpen } from "lucide-react";
import Pill from "./Pill";

export default function CourseCard({
  title,
  level,
  duration,
  sessions,
}: {
  title: string;
  level: string;
  duration: string;
  sessions: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 grid place-items-center">
            <BookOpen size={18} className="text-slate-600" />
          </div>
          <div>
            <div className="text-gray-900 font-semibold">{title}</div>
            <div className="mt-1"><Pill color="blue">{level}</Pill></div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="text-slate-500">Thời lượng</div>
        <div className="text-gray-900 text-right">{duration}</div>
        <div className="text-slate-500">Số buổi</div>
        <div className="text-gray-900 text-right">{sessions}</div>
      </div>

      <div className="mt-4">
        <button className="w-full rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Xem chương trình học
        </button>
      </div>
    </div>
  );
}

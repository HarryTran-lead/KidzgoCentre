import { TrendingUp, BookOpen, CheckCircle } from "lucide-react";

export default function ParentProgressPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
          <TrendingUp size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tiến độ học tập</h1>
          <p className="text-sm text-slate-600">Xem lộ trình kỹ năng, điểm từng bài và phản hồi mới nhất từ giáo viên.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
            <CheckCircle size={18} /> Hoàn thành 82%
          </div>
          <p className="text-sm text-indigo-800 mt-1">Speaking +12%, Reading +8% so với tuần trước.</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen size={18} /> Bài tập & tài liệu
          </div>
          <p className="text-sm text-slate-600 mt-1">Xem chi tiết từng bài nộp, điểm số và tài liệu giáo viên gửi.</p>
        </div>
      </div>
    </div>
  );
}
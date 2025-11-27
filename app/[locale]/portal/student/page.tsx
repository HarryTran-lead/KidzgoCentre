// app/[locale]/portal/student/page.tsx
import type { ReactNode } from "react";
import {
  Calendar,
  Clock,
  UserRound,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Trophy,
  CheckSquare,
  Laptop,
  FileText,
  Sparkles,
} from "lucide-react";

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="w-10 h-10 rounded-xl bg-slate-50 grid place-items-center text-indigo-600">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:-translate-y-0.5 hover:shadow-md transition grid gap-2">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
        {icon}
      </div>
      <div className="font-semibold text-slate-900">{title}</div>
      <p className="text-sm text-slate-600">{desc}</p>
      <button className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
        Mở nhanh <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function Page() {
  const todayClass = {
    name: "Lớp Tiếng Anh A1",
    time: "19:00 - 21:00",
    room: "Phòng 201",
    teacher: "Cô Phương",
  };

  const notices = [
    {
      type: "info",
      title: "Cập nhật tài liệu",
      date: "19/12/2024",
      content: "Tải slide và bài nghe buổi 8 trong mục Tài liệu.",
    },
    {
      type: "warning",
      title: "Nộp bài tập",
      date: "18/12/2024",
      content: "Bài viết chủ đề Giáng Sinh hạn nộp trước 22/12.",
    },
  ];

  const tasks = [
    { title: "Ôn từ vựng Unit 5", due: "Hôm nay", tag: "Tự học" },
    { title: "Hoàn thành worksheet buổi 7", due: "Trước 22/12", tag: "Bài tập" },
    { title: "Luyện nói 10 phút", due: "Mỗi ngày", tag: "Kỹ năng" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting + stats */}
      <div className="grid md:grid-cols-2 gap-4 items-stretch">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(79,70,229,0.08)] relative overflow-hidden">
          <div className="absolute right-6 top-6 text-indigo-100">
            <Sparkles size={42} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center text-xl font-bold">
              A
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">
                Xin chào, Nguyễn Văn An
              </div>
              <div className="text-slate-500 text-sm">
                Hôm nay bạn có 1 buổi học và 2 nhiệm vụ cần hoàn thành.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Calendar size={20} />}
            label="Buổi học hôm nay"
            value={1}
          />
          <StatCard
            icon={<CheckSquare size={20} />}
            label="Bài tập còn lại"
            value={2}
          />
          <StatCard
            icon={<Trophy size={20} />}
            label="Chuỗi ngày chăm chỉ"
            value="6 ngày"
          />
        </div>
      </div>

      {/* Today schedule + notices */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Lịch học hôm nay</h3>
            <button className="text-sm text-indigo-600 inline-flex items-center gap-1 font-semibold">
              Xem tất cả <ArrowRight size={16} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="rounded-xl bg-slate-50 p-4 flex flex-wrap gap-4 items-center">
              <div className="font-medium text-slate-900">
                {todayClass.name}
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <Clock size={16} /> {todayClass.time}
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <BookOpen size={16} /> {todayClass.room}
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <UserRound size={16} /> {todayClass.teacher}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-indigo-800">
                <div className="font-semibold">Chuẩn bị trước khi đến lớp</div>
                <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                  <li>Ôn lại từ vựng buổi trước</li>
                  <li>Mang workbook đã hoàn thành</li>
                  <li>Đọc trước đoạn hội thoại trang 32</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-semibold text-slate-900">
                  Ghi chú từ giáo viên
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Hãy luyện phát âm các từ có âm /θ/ và /ð/ trước khi tới lớp để
                  thuyết trình nhóm tốt hơn.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Thông báo học vụ</h3>
            <div className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              {notices.length}
            </div>
          </div>
          <div className="p-5 space-y-3">
            {notices.map((n, i) => (
              <div
                key={i}
                className="rounded-xl border p-3 bg-white flex items-start gap-3"
              >
                <div
                  className={
                    "mt-0.5 " +
                    (n.type === "warning" ? "text-amber-500" : "text-sky-500")
                  }
                >
                  <AlertCircle size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{n.title}</div>
                  <div className="text-sm text-slate-600 line-clamp-2">
                    {n.content}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{n.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Nhiệm vụ hôm nay</h3>
          <button className="text-sm text-indigo-600 font-semibold inline-flex items-center gap-1">
            Đánh dấu hoàn thành <ArrowRight size={16} />
          </button>
        </div>
        <div className="p-5 grid md:grid-cols-3 gap-3">
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 p-4 bg-slate-50/60"
            >
              <div className="text-xs text-indigo-600 font-semibold">
                {task.tag}
              </div>
              <div className="font-semibold text-slate-900 mt-1">
                {task.title}
              </div>
              <div className="text-sm text-slate-500">Hạn: {task.due}</div>
              <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                Cập nhật <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="p-5 border-b">
          <h3 className="font-semibold text-slate-900">Công cụ học tập</h3>
        </div>
        <div className="p-5 grid md:grid-cols-4 gap-4">
          <QuickAction
            icon={<BookOpen size={18} />}
            title="Tài liệu"
            desc="Slide, audio và từ vựng của từng buổi học."
          />
          <QuickAction
            icon={<FileText size={18} />}
            title="Bài tập"
            desc="Nộp file, xem phản hồi và điểm số."
          />
          <QuickAction
            icon={<Laptop size={18} />}
            title="Lớp trực tuyến"
            desc="Tham gia Zoom và kiểm tra thiết bị."
          />
          <QuickAction
            icon={<CheckSquare size={18} />}
            title="Điểm danh"
            desc="Check-in nhanh trước giờ học."
          />
        </div>
      </div>
    </div>
  );
}

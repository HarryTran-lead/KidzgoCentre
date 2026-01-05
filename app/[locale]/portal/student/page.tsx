// app/[locale]/portal/student/page.tsx
import type { ReactNode } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock4,
  GraduationCap,
  Sparkles,
} from "lucide-react";

type Notice = {
  title: string;
  content: string;
  date: string;
  type?: "warning" | "info";
};

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/20 bg-white/12 backdrop-blur-xl",
        "shadow-[0_18px_55px_rgba(0,0,0,0.22)]",
        "transition-all duration-300 hover:shadow-[0_20px_65px_rgba(0,0,0,0.28)] hover:border-white/30",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function NoticeItem({ notice }: { notice: Notice }) {
  const isWarning = notice.type === "warning";
  return (
    <div className="group rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur transition-all duration-300 hover:bg-white/16 hover:border-white/30 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div
          className={[
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-300",
            isWarning ? "bg-amber-400/20 text-amber-200 group-hover:bg-amber-400/30" : "bg-sky-400/20 text-sky-200 group-hover:bg-sky-400/30",
          ].join(" ")}
        >
          <BellRing size={16} className="transition-transform group-hover:scale-110" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-white text-[15px]">{notice.title}</div>
          <div className="mt-0.5 text-sm text-white/80 leading-snug">{notice.content}</div>
          <div className="mt-1.5 text-xs font-semibold text-white/60">{notice.date}</div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const notices: Notice[] = [
    {
      title: "Cập nhật tài liệu",
      content: "Tải slide và bài nghe buổi 8 trong mục Tài liệu.",
      date: "19/12/2024",
      type: "info",
    },
    {
      title: "Nộp bài tập",
      content: "Bài viết chủ đề Giáng Sinh hạn nộp trước 22/12.",
      date: "18/12/2024",
      type: "warning",
    },
  ];

  return (
    // Layout chỉ cho trang tất cả - chừa không gian bên phải để thấy background
    <div className="relative pb-6 min-h-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Container với max-width để chừa ra bên phải */}
        <div className="max-w-xl lg:max-w-2xl">
          <div className="space-y-5">
            {/* Hero */}
            <GlassCard className="p-5 max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold text-white/90">
                <Sparkles size={14} />
                Home Student
              </div>

              <h1 className="mt-3 text-[28px] leading-tight font-black text-white drop-shadow-sm">
                Xin chào, Nguyễn Văn An!
              </h1>

              <p className="mt-1.5 text-sm text-white/85">
                Hôm nay bạn có <b>1 buổi học</b> và <b>2 nhiệm vụ</b> cần hoàn thành.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-sky-400 to-indigo-500 px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_45px_rgba(59,130,246,0.40)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(59,130,246,0.55)] active:scale-95">
                  TIẾP TỤC HỌC
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </button>

                <button className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur transition-all duration-300 hover:bg-white/18 hover:border-white/40 hover:-translate-y-0.5 active:scale-95">
                  Xem lịch học
                  <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </GlassCard>

            {/* Today class */}
            <GlassCard className="p-4 max-w-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-white/70">
                    Buổi học hôm nay
                  </div>
                  <div className="mt-1 text-xl font-black text-white">Main Quest</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white/90">
                      <CalendarClock size={13} />
                      19:00 - 21:00
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white/90">
                      <Clock4 size={13} />
                      Cô Phương
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white/90">
                      Sitt 21
                    </span>
                  </div>
                </div>

                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-fuchsia-400/80 to-indigo-500/80 text-white shadow-lg">
                  <GraduationCap size={20} />
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <div className="text-sm font-black text-white/90">
                  Chuẩn bị trước khi đến lớp
                </div>
                <ul className="mt-2 space-y-1.5 text-sm text-white/85">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 text-emerald-300" />
                    Rèo: chờ tổng bật ngày cuối lớp
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 text-emerald-300" />
                    Mang workbook đã hoàn thành
                  </li>
                </ul>
              </div>
            </GlassCard>

            {/* Teacher Notes */}
            <GlassCard className="p-4 max-w-lg">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-blue-400/80 to-cyan-500/80 text-white shadow-lg">
                  <Sparkles size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-black uppercase tracking-wider text-white/70">
                    Ghi chú từ giáo viên
                  </div>
                  <p className="mt-1 text-sm text-white/90 leading-relaxed">
                    Hãy luyện phát âm các từ có âm /ð/ và /θ/ trước khi tới lớp để thuyết trình nhóm tốt hơn
                  </p>
                  <div className="mt-1.5 text-xs font-semibold text-white/60">19/12/2024</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO HỌC VỤ - Fixed ở góc dưới bên phải, nhỏ gọn */}
      <div className="fixed bottom-6 right-6 z-50 w-[320px] max-w-[calc(100vw-48px)]">
        <GlassCard className="p-3 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-400/20 text-blue-200">
              <BellRing size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wider text-white/70">
                Thông báo học vụ
              </div>
              <div className="text-sm font-black text-white truncate">
                Cập nhật tài liệu
              </div>
            </div>
            <span className="rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-black text-white">
              2
            </span>
          </div>

          <div className="mt-2 rounded-xl border border-white/15 bg-white/10 p-2 backdrop-blur">
            <p className="text-xs text-white/90 leading-snug line-clamp-2">
              Tải slide và bài nghe bước 8 🎧 trong mục Tài liệu.
            </p>
            <div className="mt-1 text-[10px] font-semibold text-white/60">19/12/2024</div>
          </div>

          <button className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition-all hover:bg-white/15 hover:border-white/30">
            Xem tất cả
            <ChevronRight size={13} />
          </button>
        </GlassCard>
      </div>
    </div>
  );
}

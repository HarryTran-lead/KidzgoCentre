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
        "rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl",
        "shadow-[0_18px_55px_rgba(0,0,0,0.20)]",
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
    <div className="rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur">
      <div className="flex items-start gap-3">
        <div
          className={[
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            isWarning ? "bg-amber-400/20 text-amber-200" : "bg-sky-400/20 text-sky-200",
          ].join(" ")}
        >
          <BellRing size={16} />
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
    // ✅ NO min-h-screen here (prevents extra scroll/blank)
    <div className="relative">
      <div className="mx-auto max-w-6xl px-2 sm:px-4 py-3 lg:py-4">
        <div className="grid gap-4 lg:grid-cols-[420px_1fr] items-start">
          {/* LEFT */}
          <div className="space-y-4">
            {/* Hero */}
            <GlassCard className="p-5">
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

              <div className="mt-4 flex items-center gap-3">
                <button className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_45px_rgba(59,130,246,0.40)] transition hover:-translate-y-0.5">
                  TIẾP TỤC HỌC
                  <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                </button>

                <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/15">
                  Xem lịch học
                  <ChevronRight size={15} />
                </button>
              </div>
            </GlassCard>

            {/* Today class */}
            <GlassCard className="p-4">
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

                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400/80 to-indigo-500/80 text-white shadow-lg">
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
          </div>

          {/* RIGHT */}
          <div className="lg:pt-16">
            <div className="max-w-xl lg:ml-auto">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-white/70">
                      Thông báo học vụ
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      Cập nhật mới nhất cho bạn
                    </div>
                  </div>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-black text-white/90">
                    {notices.length}
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  {notices.map((n) => (
                    <NoticeItem key={n.title} notice={n} />
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/85">
                  <div className="flex items-center gap-2">
                    <BellRing size={15} />
                    Nhớ bật thông báo để không bỏ lỡ bài tập!
                  </div>
                  <ChevronRight size={15} />
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// app/[locale]/portal/student/page.tsx
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock4,
  Coins,
  Flame,
  Gem,
  GraduationCap,
  NotebookPen,
  Sparkles,
  Stars,
} from "lucide-react";

type HeroStat = {
  label: string;
  value: string;
  icon: JSX.Element;
  accent: string;
};

type Notice = {
  title: string;
  content: string;
  date: string;
  type?: "warning" | "info";
};

type QuickLink = {
  title: string;
  icon: JSX.Element;
  tag?: string;
};

function FrostedPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(99,102,241,0.45)] backdrop-blur">
      {children}
    </span>
  );
}

function HeroStatPill({ stat }: { stat: HeroStat }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur shadow-[0_10px_40px_rgba(59,130,246,0.25)]">
      <span
        className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${stat.accent} text-white shadow-lg`}
      >
        {stat.icon}
      </span>
      <div className="leading-tight">
        <div className="text-[13px] opacity-80">{stat.label}</div>
        <div className="text-base">{stat.value}</div>
      </div>
    </div>
  );
}

function NoticeCard({ notice }: { notice: Notice }) {
  const isWarning = notice.type === "warning";
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/50 bg-white/70 px-4 py-3 shadow-[0_20px_40px_rgba(59,130,246,0.08)] backdrop-blur">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          isWarning
            ? "bg-amber-100 text-amber-600"
            : "bg-indigo-100 text-indigo-600"
        }`}
      >
        <AlertCircle size={18} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{notice.title}</div>
        <div className="text-sm text-slate-600">{notice.content}</div>
        <div className="mt-1 text-xs font-semibold text-slate-400">
          {notice.date}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const heroStats: HeroStat[] = [
    {
      label: "KidzGo Coins",
      value: "1,357",
      icon: <Coins size={18} />,
      accent: "from-amber-400/60 to-orange-500/70",
    },
    {
      label: "Kim cương",
      value: "6",
      icon: <Gem size={18} />,
      accent: "from-sky-400/70 to-indigo-500/80",
    },
    {
      label: "Chuỗi ngày chăm chỉ",
      value: "6 ngày",
      icon: <Flame size={18} />,
      accent: "from-rose-400/70 to-amber-500/70",
    },
  ];

  const notices: Notice[] = [
    {
      title: "Cập nhật tài liệu",
      date: "19/12/2024",
      content: "Tải slide và bài nghe buổi 8 trong mục Tài liệu.",
      type: "info",
    },
    {
      title: "Nộp bài tập",
      date: "18/12/2024",
      content: "Bài viết chủ đề Giáng Sinh hạn nộp trước 22/12.",
      type: "warning",
    },
  ];

  const miniTasks = [
    { title: "Ôn từ vựng Unit 5", due: "Hôm nay" },
    { title: "Hoàn thành worksheet buổi 7", due: "Trước 22/12" },
    { title: "Luyện nói 10 phút", due: "Mỗi ngày" },
  ];

  const shortcuts: QuickLink[] = [
    { title: "Lịch học", icon: <CalendarDays size={18} />, tag: "BETA" },
    { title: "Điểm danh", icon: <CheckCircle2 size={18} /> },
    { title: "Hồ sơ", icon: <NotebookPen size={18} /> },
    { title: "Bài tập", icon: <BookOpenCheck size={18} /> },
  ];

  return (
    <div className="relative -mx-2 space-y-6 sm:-mx-4">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f63] via-[#23104f] to-[#0b0a36]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,0.25),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.25),transparent_40%),radial-gradient(circle_at_60%_80%,rgba(168,85,247,0.2),transparent_45%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23c4d4ff%22 opacity=%220.35%22/%3E%3C/svg%3E')]" />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-white shadow-[0_20px_80px_rgba(67,56,202,0.35)] backdrop-blur">
        <div className="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute -right-10 -bottom-16 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(129,140,248,0.25),transparent_35%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-4">
            <FrostedPill>
              <Stars size={16} />
              Bảng điều khiển học viên
            </FrostedPill>

            <div className="space-y-2">
              <h1 className="text-3xl font-black drop-shadow-sm sm:text-4xl">
                Xin chào, Nguyễn Văn An! ✨
              </h1>
              <p className="max-w-2xl text-base text-indigo-50/90 sm:text-lg">
                Hôm nay bạn có <strong>1 buổi học</strong> và{" "}
                <strong>2 nhiệm vụ</strong> cần hoàn thành. Tiếp tục hành trình
                để giữ chuỗi ngày chăm chỉ của bạn nhé!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_15px_50px_rgba(56,189,248,0.45)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_60px_rgba(99,102,241,0.55)]">
                TIẾP TỤC HỌC
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-0.5"
                />
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:border-white/50 hover:bg-white/10">
                Lịch học hôm nay
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {heroStats.map((stat) => (
                <HeroStatPill key={stat.label} stat={stat} />
              ))}

              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-indigo-50 backdrop-blur">
                <Sparkles size={16} />
                Tài khoản của bạn: Nguyễn Văn An
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-md">
            <div className="absolute inset-x-10 bottom-4 h-28 rounded-full bg-indigo-900/50 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-200/40 via-white/40 to-sky-100/50 px-6 py-5 text-slate-900 shadow-[0_30px_80px_rgba(59,130,246,0.35)]">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase text-indigo-700">
                    Buổi học hôm nay
                  </div>
                  <div className="text-lg font-black text-indigo-950">
                    Lớp Tiếng Anh A1
                  </div>
                  <div className="flex items-center gap-2 text-sm text-indigo-800">
                    <Clock4 size={16} />
                    19:00 - 21:00 · Cô Phương
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-indigo-500 text-white shadow-lg">
                  <GraduationCap size={22} />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-100/60 bg-white/80 p-4 shadow-inner backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                  <Sparkles size={16} className="text-amber-500" />
                  Chuẩn bị trước khi đến lớp
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 text-emerald-500"
                      size={16}
                    />
                    Rèo: chờ tổng bật ngày cuối lớp
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 text-emerald-500"
                      size={16}
                    />
                    Mang workbook đã hoàn thành
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/60 bg-gradient-to-r from-sky-50/80 to-indigo-50/90 px-4 py-3 text-sm text-indigo-900">
                <div className="space-y-0.5">
                  <div className="font-semibold">Ghi chú giáo viên</div>
                  <p className="text-slate-600">
                    Luyện phát âm /θ/ và /ð/ trước khi thuyết trình.
                  </p>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  6 ngày
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-[0_25px_60px_rgba(59,130,246,0.15)] backdrop-blur">
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-indigo-200/60 blur-3xl" />
            <div className="absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-fuchsia-100 blur-[90px]" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-lg">
                    🍀
                  </span>
                  <div>
                    <div className="text-xs font-semibold uppercase text-indigo-600">
                      Buổi học hôm nay
                    </div>
                    <div className="text-xl font-black text-slate-900">
                      Main Quest
                    </div>
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
                  Xem lịch chi tiết
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-5 shadow-[0_10px_40px_rgba(79,70,229,0.08)]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    <CalendarClock size={14} />
                    19:00 - 21:00
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    👩‍🏫 Cô Phương
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Sitt 21
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="lg:col-span-2 rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
                      <BookOpenCheck size={16} />
                      Chuẩn bị trước khi đến lớp
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 text-emerald-500"
                          size={16}
                        />
                        Ôn lại từ vựng buổi trước
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 text-emerald-500"
                          size={16}
                        />
                        Mang workbook đã hoàn thành
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 text-emerald-500"
                          size={16}
                        />
                        Đọc trước đoạn hội thoại trang 32
                      </li>
                    </ul>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
                    <div className="absolute -right-6 -top-4 h-16 w-16 rounded-full bg-amber-200/60 blur-2xl" />
                    <div className="relative flex items-start gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/80 text-amber-500 shadow-inner">
                        <NotebookPen size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-amber-700">
                          Ghi chú từ giáo viên
                        </div>
                        <p className="text-sm text-amber-800">
                          Hãy luyện phát âm các từ có âm /θ/ và /ð/ trước khi tới
                          lớp để thuyết trình nhóm tốt hơn.
                        </p>
                        <div className="text-xs font-semibold text-amber-600">
                          Hạn: 19/12/2024
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/70 p-5 shadow-[0_20px_60px_rgba(14,116,144,0.15)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-200 to-indigo-200 text-indigo-700 shadow-inner">
                  🎯
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase text-indigo-600">
                    Nhiệm vụ hôm nay
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    Hoàn thành để nhận xu
                  </div>
                </div>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">
                Đánh dấu hoàn thành <ArrowRight size={14} />
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {miniTasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    <Sparkles size={14} />
                    Tự học
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {task.title}
                  </div>
                  <div className="text-xs text-indigo-600">Hạn: {task.due}</div>
                  <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                    Cập nhật <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/80 p-5 shadow-[0_20px_60px_rgba(99,102,241,0.15)] backdrop-blur">
            <div className="absolute -right-14 -top-16 h-32 w-32 rounded-full bg-indigo-200/60 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase text-indigo-600">
                  Thông báo học vụ
                </div>
                <div className="text-xl font-black text-slate-900">
                  Cập nhật mới nhất
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {notices.length} thông báo
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {notices.map((notice) => (
                <NoticeCard key={notice.title} notice={notice} />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm text-indigo-800">
              <div className="flex items-center gap-2">
                <BellRing size={16} />
                Nhớ bật thông báo để không bỏ lỡ bài tập!
              </div>
              <ChevronRight size={16} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/90 to-sky-400/90 p-5 text-white shadow-[0_25px_70px_rgba(59,130,246,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">
                  Học lực mỗi ngày
                </div>
                <div className="text-2xl font-black">Giữ phong độ của bạn!</div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white">
                <CalendarDays size={20} />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-indigo-50">
              <div className="flex items-center justify-between">
                <span>Thời gian đã học</span>
                <span className="font-semibold">6 ngày liên tục</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bài tập hoàn thành</span>
                <span className="font-semibold">2/3 nhiệm vụ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/15 bg-white/80 p-5 shadow-[0_20px_60px_rgba(79,70,229,0.1)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-700 shadow-inner">
              🧭
            </span>
            <div>
              <div className="text-xs font-semibold uppercase text-indigo-600">
                Lối tắt
              </div>
              <div className="text-lg font-black text-slate-900">
                Truy cập nhanh
              </div>
            </div>
          </div>
          <FrostedPill>
            <Sparkles size={15} />
            Mọi thứ bạn cần chỉ một chạm
          </FrostedPill>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {shortcuts.map((link) => (
            <div
              key={link.title}
              className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-sky-50 opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-indigo-700 shadow-inner">
                  {link.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {link.title}
                  </div>
                  <div className="text-xs text-slate-500">Mở nhanh</div>
                </div>
                {link.tag && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                    {link.tag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

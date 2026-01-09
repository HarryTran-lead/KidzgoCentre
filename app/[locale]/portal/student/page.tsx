// app/[locale]/portal/student/page.tsx
"use client";

import {
  BellRing,
  User,
  Sparkles,
  Play,
} from "lucide-react";
import Image from "next/image";

type Notice = {
  title: string;
  content: string;
  date: string;
  type?: "warning" | "info";
};

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
    <div className="relative h-full overflow-y-auto pb-6 animate-fade-in">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Container với max-width để chừa ra bên phải */}
        <div className="max-w-lg lg:max-w-1xl space-y-5">
          {/* Hero Section */}
          <div className="relative rounded-[2rem] border-3 border-cyan-300/70 bg-gradient-to-br from-purple-600/50 via-blue-600/50 to-purple-700/50 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.4),0_0_70px_rgba(168,85,247,0.2)] p-6 pb-12 mb-8 animate-slide-in-top">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2 animate-fade-in-delay-1">
                  Xin chào, Nguyễn Văn An!
                  <Sparkles className="text-yellow-400 animate-pulse" size={28} />
                </h1>
                <p className="mt-2 text-base text-white/90 font-medium animate-fade-in-delay-2">
                  Hôm nay bạn có{" "}
                  <span className="font-black text-cyan-300">1 buổi học</span>{" "}
                  và{" "}
                  <span className="font-black text-cyan-300">2 nhiệm vụ</span>{" "}
                  cần hoàn thành.
                </p>
              </div>
            </div>

            {/* Nút TIẾP TỤC HỌC với double border - nằm ở giữa hero */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-7 inline-block rounded-[1.5rem] p-1 bg-gradient-to-r from-white/10 to-transparent shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-bounce-subtle">
              <button className="relative inline-flex items-center gap-3 rounded-[1.2rem] bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-500 px-8 py-3.5 text-base font-black text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all hover:scale-105 active:scale-95">
                TIẾP TỤC HỌC
                <Play size={20} fill="white" className="animate-pulse" />
              </button>
            </div>
          </div>

          {/* Buổi học hôm nay */}
          <div className="rounded-[2rem] border-3 border-purple-300/60 bg-gradient-to-br from-purple-500/40 via-blue-500/40 to-purple-600/40 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.4),0_0_70px_rgba(168,85,247,0.2)] p-5 animate-slide-in-bottom">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2 text-white/80 text-md font-bold">
                <Image
                  src="/icons/calendar.png"
                  alt="Calendar"
                  width={30}
                  height={30}
                />
                Buổi học hôm nay
              </div>
            </div>

            {/* Main Quest Card */}
            <div className="rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 p-4 mb-3 shadow-[0_4px_20px_rgba(255,255,255,0.1)] animate-scale-in">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <Image
                      src="/icons/quest.png"
                      alt="Quest"
                      width={40}
                      height={40}
                    />
                  </div>
                  <span className="text-white font-black text-lg">
                    Main Quest
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-white mb-2">
                <span className="font-black text-base">Lớp Tiếng Anh A1</span>
                <span className="text-sm text-white/70">19:00 - 21:00</span>
                <span className="text-sm text-white/70 flex items-center gap-1">
                  <User size={14} />
                  Cô Phương
                </span>
              </div>

              <div className="space-y-2 mt-3">
                <div className="flex items-start gap-2 text-sm text-white/80 animate-fade-in-delay-1">
                  <span className="text-purple-400">•</span>
                  <span>Chuẩn bị trước khi đến lớp</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-white/80 animate-fade-in-delay-2">
                  <span className="text-purple-400">•</span>
                  <span>Rèo:chờ tổng bật ngày cuối lớp</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-white/80 animate-fade-in-delay-3">
                  <span className="text-purple-400">•</span>
                  <span>Mang workbook đã hoàn thành</span>
                </div>
              </div>
            </div>

            {/* Teacher Note Card */}
            <div className="rounded-xl bg-gradient-to-br from-purple-500/40 to-blue-500/40 backdrop-blur-sm border-2 border-white/30 p-4 shadow-[0_4px_20px_rgba(168,85,247,0.2)] animate-scale-in-delay">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Image
                    src="/icons/teacher.png"
                    alt="Teacher"
                    width={50}
                    height={50}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-black text-white text-sm mb-1">
                    Ghi chú từ giáo viên
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    Hãy luyện phát âm các từ có âm /ð/ và /θ/ trước khi tới lớp
                    để thuyết trình nhóm tốt hơn: 19/12/2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO HỌC VỤ - Fixed ở góc dưới bên phải */}
      <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] animate-slide-in-right">
        <div className="rounded-[2rem] border-3 border-blue-300/60 bg-gradient-to-br from-blue-500/40 via-cyan-500/40 to-blue-600/40 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.5),0_0_70px_rgba(34,211,238,0.3)] relative before:absolute before:inset-0 before:rounded-[2rem] before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white/80 text-sm font-bold">
              <BellRing size={18} className="animate-wiggle" />
              Thông báo học vụ
            </div>
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-black text-white shadow-lg animate-pulse">
              2
            </span>
          </div>

          <div className="space-y-2">
            {notices.map((notice, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 p-3 hover:bg-white/25 transition-all shadow-[0_2px_15px_rgba(255,255,255,0.1)] animate-scale-in hover:scale-105"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                      notice.type === "warning"
                        ? "bg-orange-400/30 text-orange-300"
                        : "bg-blue-400/30 text-blue-300"
                    }`}
                  >
                    {notice.type === "warning" ? "⚠️" : "ℹ️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-sm mb-1">
                      {notice.title}
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed line-clamp-2">
                      {notice.content}
                    </p>
                    <div className="text-[10px] font-semibold text-white/60 mt-1">
                      {notice.date}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

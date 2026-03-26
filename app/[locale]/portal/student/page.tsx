// app/[locale]/portal/student/page.tsx
"use client";

import {
  BellRing,
  Sparkles,
  Play,
  Calendar,
  BookOpen,
  Clock,
  User,
  ChevronRight,
  MessageSquare,
  Trophy,
  Flame,
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

  const stats = [
    { label: "Buổi học hôm nay", value: "1", icon: Calendar, color: "from-indigo-500 to-purple-500" },
    { label: "Nhiệm vụ cần làm", value: "2", icon: BookOpen, color: "from-purple-500 to-pink-500" },
    { label: "Streak hiện tại", value: "7", icon: Flame, color: "from-orange-500 to-red-500" },
    { label: "Điểm tích lũy", value: "1,250", icon: Trophy, color: "from-yellow-500 to-amber-500" },
  ];

  return (
    <div className="relative h-full overflow-y-auto pb-6">
      <div className="w-full px-6 lg:px-8 py-6">
        {/* Header với greeting */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
            Xin chào, Nguyễn Văn An!
          </h1>
          <p className="text-indigo-200/80 mt-2 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Chào mừng bạn quay trở lại
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="relative group animate-slide-in-bottom"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className={`relative bg-gradient-to-br ${stat.color} p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <stat.icon size={24} className="text-white/80" />
                  <span className="text-2xl font-black text-white">{stat.value}</span>
                </div>
                <p className="text-white/70 text-sm font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content - 2 columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section - Continue Learning */}
            <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-xl border border-white/20 p-6 overflow-hidden group animate-slide-in-top">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Tiếp tục hành trình học tập
                    </h2>
                    <p className="text-white/80">
                      Hôm nay bạn có{" "}
                      <span className="font-bold text-indigo-300">1 buổi học</span>{" "}
                      và{" "}
                      <span className="font-bold text-purple-300">2 nhiệm vụ</span>{" "}
                      cần hoàn thành
                    </p>
                  </div>
                </div>
                
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 group">
                  <Play size={18} fill="white" />
                  TIẾP TỤC HỌC
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Today's Lesson */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-6 animate-slide-in-bottom">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Buổi học hôm nay</h3>
              </div>
              
              <div className="space-y-4">
                {/* Main Lesson Card */}
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">Lớp Tiếng Anh A1</h4>
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          19:00 - 21:00
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          Cô Phương
                        </span>
                      </div>
                    </div>
                    <div className="bg-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold text-white">
                      Main Quest
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <p className="text-white/80 text-sm flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Chuẩn bị trước khi đến lớp</span>
                    </p>
                    <p className="text-white/80 text-sm flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Rèo: chờ tổng bật ngày cuối lớp</span>
                    </p>
                    <p className="text-white/80 text-sm flex items-start gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>Mang workbook đã hoàn thành</span>
                    </p>
                  </div>
                </div>
                
                {/* Teacher Note */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-white/10">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                      <MessageSquare size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-white text-sm mb-1">Ghi chú từ giáo viên</h5>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Hãy luyện phát âm các từ có âm /ð/ và /θ/ trước khi tới lớp để thuyết trình nhóm tốt hơn.
                      </p>
                      <p className="text-white/50 text-xs mt-2">19/12/2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Notifications */}
          <div className="space-y-6">
            {/* Notifications Panel */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 p-5 animate-slide-in-right">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BellRing size={20} className="text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Thông báo</h3>
                </div>
                <span className="bg-red-500 px-2.5 py-1 rounded-full text-xs font-bold text-white">
                  {notices.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {notices.map((notice, idx) => (
                  <div
                    key={idx}
                    className="group bg-white/10 hover:bg-white/15 rounded-xl p-4 transition-all duration-300 cursor-pointer animate-scale-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        notice.type === "warning" 
                          ? "bg-orange-500/20 text-orange-400" 
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {notice.type === "warning" ? "⚠️" : "ℹ️"}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm mb-1">{notice.title}</h4>
                        <p className="text-white/70 text-xs leading-relaxed">{notice.content}</p>
                        <p className="text-white/40 text-xs mt-2">{notice.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 p-5">
              <h3 className="text-lg font-bold text-white mb-3">Thống kê nhanh</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Tổng số buổi học</span>
                  <span className="text-white font-bold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Đã tham gia</span>
                  <span className="text-white font-bold">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Tỷ lệ hoàn thành</span>
                  <span className="text-green-400 font-bold">75%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: "75%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        @keyframes slide-in-top {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-bottom {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-in-top {
          animation: slide-in-top 0.6s ease-out;
        }
        
        .animate-slide-in-bottom {
          animation: slide-in-bottom 0.6s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
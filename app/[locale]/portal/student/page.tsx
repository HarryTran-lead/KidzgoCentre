// app/[locale]/portal/student/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
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
  Star,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  PartyPopper,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import { resolveActiveStudentProfile } from "@/components/gamification/shared";
import { getStudentDashboard } from "@/lib/api/studentPortalService";
import { getMyStarBalance, getMyAttendanceStreak, getMyLevel } from "@/lib/api/gamificationService";

type Notice = {
  title: string;
  content: string;
  date: string;
  type?: "warning" | "info";
};

export default function Page() {
  const { user } = useCurrentUser();
  const { selectedProfile } = useSelectedStudentProfile();
  const pathname = usePathname();
  const locale = useMemo(() => {
    const parts = (pathname || "").split("/");
    return parts[1] || "vi";
  }, [pathname]);
  const activeStudent = useMemo(
    () => resolveActiveStudentProfile(user?.profiles, selectedProfile, user?.selectedProfile),
    [selectedProfile, user?.profiles, user?.selectedProfile]
  );
  const studentName = activeStudent?.displayName || user?.fullName || "Học sinh";

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starBalance, setStarBalance] = useState<number>(0);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [levelInfo, setLevelInfo] = useState<{ level: number; xp: number; xpRequiredForNextLevel: number } | null>(null);
  const [showNoticesPopup, setShowNoticesPopup] = useState(false);

  useEffect(() => {
    let alive = true;
    const studentProfileId = selectedProfile?.studentId ?? selectedProfile?.id;
    getStudentDashboard(studentProfileId ? { studentProfileId } : undefined)
      .then((res: any) => {
        if (!alive) return;
        const raw = res?.data?.data ?? res?.data ?? {};
        setDashboard(raw);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    // Load real gamification data
    getMyStarBalance().then((res) => { if (alive) setStarBalance(res.balance); }).catch(() => {});
    getMyAttendanceStreak().then((res) => { if (alive) setStreakDays(res.currentStreak); }).catch(() => {});
    getMyLevel().then((res) => { if (alive) setLevelInfo(res); }).catch(() => {});
    return () => { alive = false; };
  }, [selectedProfile?.id]);

  const notices: Notice[] = Array.isArray(dashboard?.notices) ? dashboard.notices : [];
  const pendingTasksCount = Array.isArray(dashboard?.pendingTasks)
    ? dashboard.pendingTasks.length
    : (typeof dashboard?.pendingTasks === "number" ? dashboard.pendingTasks : (dashboard?.tasksToDo ?? 0));

  const stats = [
    { label: "Buổi học hôm nay", value: String(dashboard?.todaySessions ?? dashboard?.sessionsToday ?? 0), icon: Calendar, color: "from-indigo-500 to-purple-500" },
    { label: "Nhiệm vụ cần làm", value: String(pendingTasksCount), icon: BookOpen, color: "from-purple-500 to-pink-500" },
    { label: "Streak hiện tại", value: `${streakDays}`, icon: Flame, color: "from-orange-500 to-red-500" },
    { label: "Số sao hiện có", value: starBalance.toLocaleString("vi-VN"), icon: Star, color: "from-yellow-500 to-amber-500" },
  ];

  const nextLesson = dashboard?.nextLesson ?? dashboard?.todayLesson ?? null;
  const teacherNote = dashboard?.teacherNote ?? null;

  // Giới hạn hiển thị 5 thông báo trong cột
  const DISPLAY_NOTICE_LIMIT = 4;
  const displayedNotices = notices.slice(0, DISPLAY_NOTICE_LIMIT);
  const hasMoreNotices = notices.length > DISPLAY_NOTICE_LIMIT;

  // Notices Popup Component
  const NoticesPopup = () => {
    if (!showNoticesPopup) return null;

    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowNoticesPopup(false)}>
        <div 
          className="relative w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-blue-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/50 to-indigo-600/50 backdrop-blur-md border-b border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <BellRing size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Tất cả thông báo</h3>
                  <p className="text-white/50 text-sm">Tổng số {notices.length} thông báo</p>
                </div>
              </div>
              <button
                onClick={() => setShowNoticesPopup(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto p-6 space-y-3 max-h-[calc(80vh-100px)] custom-scrollbar">
            {notices.map((notice, idx) => (
              <div
                key={idx}
                className={`group relative rounded-2xl overflow-hidden backdrop-blur-sm border transition-all duration-300 animate-slide-in-bottom ${
                  notice.type === "warning"
                    ? "bg-gradient-to-br from-orange-500/20 via-orange-600/20 to-red-600/20 border-orange-400/30 hover:border-orange-400/60 hover:shadow-orange-500/20"
                    : "bg-gradient-to-br from-blue-500/20 via-cyan-600/20 to-indigo-600/20 border-cyan-400/30 hover:border-cyan-400/60 hover:shadow-cyan-500/20"
                } hover:shadow-xl`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative p-5 flex items-start gap-4">
                  {/* Icon Container */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                    notice.type === "warning"
                      ? "bg-orange-500/30 text-orange-300"
                      : "bg-blue-500/30 text-blue-300"
                  }`}>
                    {notice.type === "warning" ? (
                      <AlertTriangle size={24} />
                    ) : (
                      <AlertCircle size={24} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-base mb-2">{notice.title}</h4>
                    <p className="text-white/70 text-sm leading-relaxed">{notice.content}</p>
                    <div className="flex items-center gap-2 mt-3 text-white/50 text-xs">
                      <Calendar size={14} />
                      <span>{notice.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 backdrop-blur-md border-t border-white/20 p-4 text-center">
            <p className="text-white/40 text-xs">Đã hiển thị {notices.length} thông báo</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full overflow-y-auto pb-6">
      <div className="w-full px-6 lg:px-8 py-6">
        {/* Header với greeting */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
            Xin chào, {studentName}!
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

        {/* Main Content - 2 columns layout với chiều cao bằng nhau */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Main content */}
          <div className="flex flex-col gap-6 h-full">
            {/* Hero Section - Continue Learning */}
            <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-xl border border-white/20 p-6 overflow-hidden group animate-slide-in-top">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

              {/* Mascot - Hello Character */}
              <div className="absolute right-4 bottom-0 w-36 h-36 md:w-44 md:h-44 animate-slide-in-left pointer-events-none select-none z-0">
                <Image
                  src="/image/hello.png"
                  alt="Hello mascot"
                  fill
                  className="object-contain object-bottom"
                  unoptimized
                />
              </div>

              <div className="relative z-10 max-w-[60%]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Tiếp tục hành trình học tập
                    </h2>
                    <p className="text-white/80">
                      Hôm nay bạn có{" "}
                      <span className="font-bold text-indigo-300">{dashboard?.todaySessions ?? 0} buổi học</span>{" "}
                      và{" "}
                      <span className="font-bold text-purple-300">{pendingTasksCount} nhiệm vụ</span>{" "}
                      cần hoàn thành.{" "}
                      {levelInfo ? <span className="text-yellow-300">Cấp {levelInfo.level} • {levelInfo.xp} XP</span> : null}
                    </p>
                  </div>
                </div>
                
                <Link
                  href={`/${locale}/portal/student/gamification`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 group"
                >
                  <Play size={18} fill="white" />
                  TIẾP TỤC HỌC
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Today's Lesson */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-6 animate-slide-in-bottom flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Calendar size={18} className="text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">Buổi học hôm nay</h3>
              </div>
              
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Main Lesson Card - Enhanced */}
                {nextLesson ? (
                  <>
                    <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-600/40 backdrop-blur-xl border border-white/20 p-6 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer flex-1 flex flex-col">
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse" />
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-500" />
                      
                      <div className="relative z-10 flex flex-col h-full">
                        {/* Top section - Title and badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                                <BookOpen size={14} className="text-white" />
                              </div>
                              <h4 className="text-2xl font-bold text-white">{nextLesson?.className || "Buổi học"}</h4>
                            </div>
                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 my-3">
                              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-xs font-semibold text-green-300">Sẵn sàng tham gia</span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg shadow-purple-500/30">
                            Bây giờ
                          </div>
                        </div>
                        
                        {/* Middle section - Time and teacher */}
                        <div className="grid grid-cols-2 gap-3 mb-5 flex-1">
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock size={16} className="text-indigo-300" />
                              <span className="text-xs text-white/60 font-medium">Thời gian</span>
                            </div>
                            <p className="text-sm font-bold text-white">{nextLesson?.time || "—"}</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <User size={16} className="text-purple-300" />
                              <span className="text-xs text-white/60 font-medium">Giáo viên</span>
                            </div>
                            <p className="text-sm font-bold text-white">{nextLesson?.teacher || "—"}</p>
                          </div>
                        </div>
                        
                        {/* Bottom section - Requirements with better styling */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200/80 uppercase tracking-wider">
                            <ClipboardList size={16} className="text-indigo-300" />
                            <span>Chuẩn bị cho buổi học</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm text-white/80 bg-white/5 rounded-lg p-2 pl-3">
                              <CheckCircle2 size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                              <span>Chuẩn bị trước khi đến lớp</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-white/80 bg-white/5 rounded-lg p-2 pl-3">
                              <CheckCircle2 size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                              <span>Rèo: chờ tổng bật ngày cuối lớp</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-white/80 bg-white/5 rounded-lg p-2 pl-3">
                              <CheckCircle2 size={18} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                              <span>Mang workbook đã hoàn thành</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Call to action button */}
                        <Link
                          href={`/${locale}/portal/student/gamification`}
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-green-500/40 transition-all hover:scale-105 active:scale-95 group/btn"
                        >
                          <Play size={16} fill="white" />
                          VÀO LỚP HỌC
                          <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl bg-gradient-to-br from-gray-600/40 to-gray-700/40 border border-white/10 p-8 text-center flex-1 flex items-center justify-center flex-col gap-4">
                    <div className="relative w-36 h-36 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl border border-white/20 shadow-xl shadow-orange-500/10 p-3 flex items-center justify-center animate-slide-in-left pointer-events-none select-none">
                      <Image
                        src="/image/khunglong5.png"
                        alt="No class today"
                        fill
                        className="object-contain object-bottom"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="text-white/60 font-medium">Hôm nay không có buổi học</p>
                      <p className="text-white/40 text-sm mt-2">Hãy quay lại để kiểm tra lịch trình sau</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Teacher Note - Enhanced */}
              {teacherNote && (
                <div className="group rounded-2xl bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-rose-600/30 backdrop-blur-xl border border-white/20 p-6 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20 mt-4 animate-slide-in-bottom">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl" style={{ opacity: 0.5 }} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/30">
                        <MessageSquare size={24} className="text-white" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare size={18} className="text-pink-300 flex-shrink-0" />
                          <h5 className="font-bold text-lg text-white">Lời nhắn từ thầy/cô</h5>
                        </div>
                        <p className="text-white/80 leading-relaxed text-sm">
                          {teacherNote.content}
                        </p>
                        {teacherNote.date && (
                          <div className="flex items-center gap-2 text-white/50 text-xs mt-3">
                            <Calendar size={14} />
                            <span>{teacherNote.date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

          {/* Right Column - Notifications - Chỉ hiển thị 5 thông báo */}
          <div className="flex flex-col h-full">
            {/* Notifications Panel */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600/30 via-cyan-600/30 to-indigo-600/30 backdrop-blur-xl border border-white/20 p-6 animate-slide-in-right flex-1 flex flex-col overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 animate-pulse rounded-2xl" />
              
              {/* Header */}
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <BellRing size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Thông báo</h3>
                    <p className="text-white/50 text-xs">Cập nhật mới nhất</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg shadow-red-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    {notices.length}
                  </span>
                </div>
              </div>
              
              {/* Notifications List - Chỉ hiển thị 5 thông báo */}
              <div className="relative z-10 space-y-3 flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                {displayedNotices.length > 0 ? (
                  displayedNotices.map((notice, idx) => (
                    <div
                      key={idx}
                      className={`group relative rounded-2xl overflow-hidden backdrop-blur-sm border transition-all duration-300 cursor-pointer animate-scale-in ${
                        notice.type === "warning"
                          ? "bg-gradient-to-br from-orange-500/20 via-orange-600/20 to-red-600/20 border-orange-400/30 hover:border-orange-400/60 hover:shadow-orange-500/20 hover:bg-gradient-to-br hover:from-orange-500/30 hover:via-orange-600/30 hover:to-red-600/30"
                          : "bg-gradient-to-br from-blue-500/20 via-cyan-600/20 to-indigo-600/20 border-cyan-400/30 hover:border-cyan-400/60 hover:shadow-cyan-500/20 hover:bg-gradient-to-br hover:from-blue-500/30 hover:via-cyan-600/30 hover:to-indigo-600/30"
                      } hover:shadow-xl`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-500" />
                      
                      <div className="relative p-4 flex items-start gap-3">
                        {/* Icon Container */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
                          notice.type === "warning"
                            ? "bg-orange-500/30 text-orange-300"
                            : "bg-blue-500/30 text-blue-300"
                        }`}>
                          {notice.type === "warning" ? (
                            <AlertTriangle size={20} />
                          ) : (
                            <AlertCircle size={20} />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm mb-1 truncate">{notice.title}</h4>
                          <p className="text-white/70 text-xs leading-relaxed line-clamp-2">{notice.content}</p>
                          <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
                            <Calendar size={12} />
                            <span>{notice.date}</span>
                          </div>
                        </div>
                        
                        {/* Action indicator */}
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : null}
                
                {/* Empty State */}
                {notices.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                        <BellRing size={32} className="text-white/40" />
                      </div>
                      <p className="text-white/60 font-medium text-sm mb-1">Không có thông báo</p>
                      <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
                        <span>Bạn đã bắt kịp tất cả!</span>
                        <PartyPopper size={14} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* View More Button - Chỉ hiển thị khi có nhiều hơn 5 thông báo */}
              {hasMoreNotices && (
                <div className="relative z-10 mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowNoticesPopup(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/40 hover:to-cyan-500/40 border border-blue-400/30 hover:border-blue-400/60 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 group"
                  >
                    <span>Xem thêm {notices.length - DISPLAY_NOTICE_LIMIT} thông báo</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Popup */}
      <NoticesPopup />

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
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        .animate-slide-in-left {
          animation: slide-in-left 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
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

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(67, 235, 233, 0.4) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0.5), rgba(34, 211, 238, 0.5));
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0.8), rgba(34, 211, 238, 0.8));
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
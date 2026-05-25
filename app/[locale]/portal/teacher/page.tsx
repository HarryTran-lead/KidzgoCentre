"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { getTeacherDashboard } from "@/lib/api/teacherPortalService";

type TeacherDashboardStats = {
  totalClasses?: number;
  totalStudents?: number;
  upcomingSessions?: number;
  pendingHomeworks?: number;
  pendingReports?: number;
  openTickets?: number;
};

type TeacherDashboardSession = {
  id: string;
  classId?: string;
  classCode?: string;
  plannedDatetime?: string;
  status?: string;
  attendanceMarked?: boolean;
};

type TeacherDashboardAlert = {
  id: string;
  title?: string;
  status?: string;
  createdAt?: string;
};

type TeacherDashboardRecentActivity = {
  sessionId: string;
  classCode?: string;
  sessionDate?: string;
  presentCount?: number;
  absentCount?: number;
};

type TeacherDashboardPendingTask = {
  id: string;
  studentName?: string;
  classCode?: string;
  status?: string;
  reportMonth?: string;
};

type TeacherDashboardData = {
  stats?: TeacherDashboardStats;
  todayClasses?: TeacherDashboardSession[];
  upcomingClasses?: TeacherDashboardSession[];
  alerts?: TeacherDashboardAlert[];
  recentActivities?: TeacherDashboardRecentActivity[];
  pendingTasks?: TeacherDashboardPendingTask[];
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatDateTime(
  value?: string,
  mode: "date" | "time" | "datetime" = "datetime",
) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const optionsByMode: Record<typeof mode, Intl.DateTimeFormatOptions> = {
    date: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    },
    time: {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    },
    datetime: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    },
  };

  return new Intl.DateTimeFormat("vi-VN", optionsByMode[mode]).format(date);
}

function isTodayInVietnam(value?: string) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return formatter.format(date) === formatter.format(new Date());
}

function formatSessionDayLabel(value?: string) {
  if (!value) return "Chưa có lịch";
  return isTodayInVietnam(value) ? "Hôm nay" : formatDateTime(value, "date");
}

function normalizeDashboardResponse(response: any): TeacherDashboardData {
  const raw = response?.data?.data ?? response?.data ?? {};
  const stats = raw?.stats ?? raw ?? {};
  const todayClasses = toArray<TeacherDashboardSession>(raw?.todayClasses);
  const upcomingClasses = toArray<TeacherDashboardSession>(
    raw?.upcomingClasses,
  );

  const normalizedToday =
    todayClasses.length > 0
      ? todayClasses
      : upcomingClasses.filter((item) =>
          isTodayInVietnam(item?.plannedDatetime),
        );

  const todayIds = new Set(normalizedToday.map((item) => item.id));

  return {
    stats,
    todayClasses: normalizedToday,
    upcomingClasses: upcomingClasses.filter((item) => !todayIds.has(item.id)),
    alerts: toArray<TeacherDashboardAlert>(raw?.alerts),
    recentActivities: toArray<TeacherDashboardRecentActivity>(
      raw?.recentActivities,
    ),
    pendingTasks: toArray<TeacherDashboardPendingTask>(raw?.pendingTasks),
  };
}

function StatCard({
  icon,
  label,
  value,
  note,
  accent = "red",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  accent?: "red" | "gray" | "black";
}) {
  const tones = {
    red: {
      label: "text-red-600",
      panel: "from-red-600 to-rose-500",
      glow: "bg-red-500",
    },
    gray: {
      label: "text-gray-600",
      panel: "from-gray-500 to-slate-700",
      glow: "bg-gray-500",
    },
    black: {
      label: "text-gray-800",
      panel: "from-gray-800 to-black",
      glow: "bg-gray-800",
    },
  }[accent];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${tones.glow}`}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-r ${tones.panel} text-white shadow-sm`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-sm font-semibold `}
          >
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold leading-tight text-gray-900">
            {value}
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  count,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-white to-red-50/30 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="text-red-600">{icon}</div>
          <h2 className="text font-bold text-gray-900">{title}</h2>
          {typeof count === "number" ? (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-sm font-semibold text-white">
              {count}
            </span>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function SessionCard({
  item,
  onOpen,
}: {
  item: TeacherDashboardSession;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => item.id && onOpen(item.id)}
      className="w-full rounded-2xl border border-gray-200 bg-linear-to-br from-white to-red-50/20 p-4 text-left transition-colors hover:border-red-300 hover:bg-linear-to-br hover:from-white hover:to-red-50/40"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              {formatSessionDayLabel(item.plannedDatetime)}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {item.status ?? "Scheduled"}
            </span>
            {item.attendanceMarked ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Đã điểm danh
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Chưa điểm danh
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {item.classCode || "Chưa có mã lớp"}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={16} />
              {formatDateTime(item.plannedDatetime, "time")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar size={16} />
              {formatDateTime(item.plannedDatetime, "datetime")}
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
          Chi tiết
          <ChevronRight size={16} />
        </div>
      </div>
    </button>
  );
}

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
  const [dashboard, setDashboard] = useState<TeacherDashboardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTeacherDashboard();
        if (!active) return;
        setDashboard(normalizeDashboardResponse(response));
        setLastUpdated(new Date());
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu tổng quan giáo viên.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard.stats ?? {};
  const todayClasses = dashboard.todayClasses ?? [];
  const upcomingClasses = dashboard.upcomingClasses ?? [];
  const alerts = dashboard.alerts ?? [];
  const recentActivities = dashboard.recentActivities ?? [];
  const pendingTasks = dashboard.pendingTasks ?? [];
  const visibleClasses = activeTab === "today" ? todayClasses : upcomingClasses;
  const openAlertCount = alerts.filter(
    (item) => (item.status ?? "").toLowerCase() !== "closed",
  ).length;

  const topStats = useMemo(
    () => [
      {
        label: "Lớp đang dạy",
        value: String(stats.totalClasses ?? 0),
        note: "Số lớp được giao phó",
        icon: <BookOpen size={20} />,
        accent: "red" as const,
      },
      {
        label: "Buổi sắp tới",
        value: String(stats.upcomingSessions ?? 0),
        note: "Buổi học trong 7 ngày tới",
        icon: <CalendarClock size={20} />,
        accent: "gray" as const,
      },
      {
        label: "Tổng học viên",
        value: String(stats.totalStudents ?? 0),
        note: "Học viên hiện tại",
        icon: <Users size={20} />,
        accent: "black" as const,
      },
      {
        label: "Báo cáo chờ xử lý",
        value: String(stats.pendingReports ?? pendingTasks.length),
        note: "Báo cáo cần hoàn thành",
        icon: <FileText size={20} />,
        accent: "red" as const,
      },
    ],
    [
      pendingTasks.length,
      stats.pendingReports,
      stats.totalClasses,
      stats.totalStudents,
      stats.upcomingSessions,
    ],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
            <BarChart3 size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-2xl">
              Tổng quan giảng dạy
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              Chỉ hiển thị dữ liệu có trong API teacher dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
              Cập nhật: {formatDateTime(lastUpdated.toISOString(), "datetime")}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Lịch dạy sắp tới"
            icon={<CalendarClock size={20} />}
            count={todayClasses.length + upcomingClasses.length}
            action={
              <button
                type="button"
                onClick={() =>
                  router.push(`/${locale}/portal/teacher/schedule`)
                }
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Xem lịch đầy đủ
                <ChevronRight size={16} />
              </button>
            }
          >
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("today")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "today"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                Hôm nay ({todayClasses.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "upcoming"
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900",
                )}
              >
                Sắp tới ({upcomingClasses.length})
              </button>
            </div>

            {loading ? (
              <EmptyState message="Đang tải lịch dạy..." />
            ) : visibleClasses.length === 0 ? (
              <EmptyState message="Không có dữ liệu lịch dạy trong mục này." />
            ) : (
              <div className="space-y-4">
                {visibleClasses.map((item) => (
                  <SessionCard
                    key={item.id}
                    item={item}
                    onOpen={(id) =>
                      router.push(`/${locale}/portal/teacher/schedule/${id}`)
                    }
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Hoạt động gần đây"
              icon={<CheckCircle2 size={20} />}
              count={recentActivities.length}
            >
              {loading ? (
                <EmptyState message="Đang tải hoạt động gần đây..." />
              ) : recentActivities.length === 0 ? (
                <EmptyState message="Chưa có bản ghi điểm danh gần đây." />
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((item) => (
                    <div
                      key={item.sessionId}
                      className="rounded-2xl border border-gray-200 bg-linear-to-br from-white to-red-50/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.classCode || "Không rõ lớp"}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {formatDateTime(item.sessionDate, "datetime")}
                          </div>
                        </div>
                        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          Có mặt: {item.presentCount ?? 0}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        Vắng: {item.absentCount ?? 0} học viên
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Cần xử lý"
              icon={<FileText size={20} />}
              count={pendingTasks.length}
            >
              {loading ? (
                <EmptyState message="Đang tải danh sách công việc..." />
              ) : pendingTasks.length === 0 ? (
                <EmptyState message="Không có pending task từ backend." />
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-200 bg-linear-to-br from-white to-red-50/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.studentName || "Không rõ học viên"}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            Lớp: {item.classCode || "-"}
                          </div>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                          {item.status || "Pending"}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        Tháng báo cáo:{" "}
                        {formatDateTime(item.reportMonth, "date")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Cảnh báo mở"
            icon={<Bell size={20} />}
            count={openAlertCount}
          >
            {loading ? (
              <EmptyState message="Đang tải cảnh báo..." />
            ) : alerts.length === 0 ? (
              <EmptyState message="Không có cảnh báo nào đang mở." />
            ) : (
              <div className="space-y-3">
                {alerts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-linear-to-br from-white to-red-50/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-red-50 p-2 text-red-600">
                        <AlertCircle size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900">
                          {item.title || "Không có tiêu đề"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span>Trạng thái: {item.status || "Open"}</span>
                          <span className="text-gray-300">|</span>
                          <span>
                            {formatDateTime(item.createdAt, "datetime")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Thống kê bổ sung" icon={<BookOpen size={20} />}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl bg-red-600 p-5 text-white">
                <div className="text-sm opacity-90">Ticket đang mở</div>
                <div className="mt-2 text-3xl font-bold">
                  {stats.openTickets ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="text-sm text-gray-600">Homework chờ xử lý</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.pendingHomeworks ?? 0}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

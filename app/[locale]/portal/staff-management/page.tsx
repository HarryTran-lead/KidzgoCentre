"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CalendarRange,
  NotebookPen,
  MessageSquare,
  Sparkles,
  Calendar,
  BarChart3,
  Target,
  Download,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function StatCard({
  icon,
  label,
  value,
  iconColor = "from-red-600 to-red-700",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
      <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
      <div className="relative flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl bg-linear-to-br ${iconColor} grid place-items-center`}>
          {icon}
        </span>
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}


import { getStaffManagementDashboard } from "@/lib/api/staffManagementService";

type StaffDashboardApiPayload = {
  statistics?: {
    totalLeads?: number;
    totalEnrollments?: number;
    totalClasses?: number;
    upcomingSessions?: number;
    pendingMakeupCredits?: number;
    pendingLeaveRequests?: number;
    pendingReports?: number;
    openTickets?: number;
  };
  recentLeads?: Array<{ createdAt?: string }>;
  upcomingSessions?: Array<Record<string, unknown>>;
  openTickets?: Array<{ priority?: string }>;
};

const VI_WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function monthLabelFromIso(value?: string): string {
  if (!value) return "Khác";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Khác";
  return `T${date.getMonth() + 1}`;
}

function dayLabelFromIso(value?: string): string {
  if (!value) return "Khác";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Khác";
  return VI_WEEKDAY_LABELS[date.getDay()] ?? "Khác";
}

function normalizeTicketPriority(priority?: string): string {
  const raw = (priority || "").trim().toLowerCase();
  if (raw === "homework") return "Tư vấn học";
  if (raw === "schedule") return "Đổi lịch";
  if (raw === "report") return "Báo cáo";
  return "Khác";
}

function getCurrentWeekRange(reference = new Date()) {
  const start = new Date(reference);
  const day = (start.getDay() + 6) % 7; // Monday as week start
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function filterSessionsInCurrentWeek(sessions: StaffDashboardApiPayload["upcomingSessions"]) {
  const { start, end } = getCurrentWeekRange();
  return (sessions ?? []).filter((session) => {
    const dateValue = getSessionDatetime(session);
    if (!dateValue) return false;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;
    return date >= start && date <= end;
  });
}

function buildLeadGrowthData(recentLeads: StaffDashboardApiPayload["recentLeads"]) {
  const buckets = new Map<string, number>();
  (recentLeads ?? []).forEach((lead) => {
    const key = monthLabelFromIso(lead?.createdAt);
    buckets.set(key, safeNumber(buckets.get(key), 0) + 1);
  });

  if (buckets.size === 0) {
    return ["T7", "T8", "T9", "T10", "T11", "T12"].map((month) => ({ month, leads: 0, qualified: 0 }));
  }

  return Array.from(buckets.entries()).map(([month, leads]) => ({
    month,
    leads,
    qualified: 0,
  }));
}

function getSessionDatetime(session: Record<string, unknown> | undefined): string {
  if (!session) return "";
  const keys = [
    "plannedDatetime",
    "plannedDateTime",
    "scheduledAt",
    "sessionDate",
    "startAt",
    "startsAt",
  ];
  for (const key of keys) {
    const value = session[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function buildClassOpsData(sessions: StaffDashboardApiPayload["upcomingSessions"]) {
  const buckets = new Map<string, number>();
  (sessions ?? []).forEach((session) => {
    const key = dayLabelFromIso(getSessionDatetime(session));
    buckets.set(key, safeNumber(buckets.get(key), 0) + 1);
  });

  return ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => ({
    day,
    sessions: safeNumber(buckets.get(day), 0),
    conflicts: 0,
  }));
}

function buildTicketDistribution(openTickets: StaffDashboardApiPayload["openTickets"]) {
  const colorByName: Record<string, string> = {
    "Tư vấn học": "#dc2626",
    "Đổi lịch": "#404040",
    "Báo cáo": "#171717",
    "Khác": "#991b1b",
  };

  const counters: Record<string, number> = {
    "Tư vấn học": 0,
    "Đổi lịch": 0,
    "Báo cáo": 0,
    "Khác": 0,
  };

  (openTickets ?? []).forEach((ticket) => {
    const bucket = normalizeTicketPriority(ticket?.priority);
    counters[bucket] += 1;
  });

  const total = Object.values(counters).reduce((sum, value) => sum + value, 0);

  return Object.entries(counters).map(([name, count]) => ({
    name,
    value: total > 0 ? Math.round((count / total) * 100) : 0,
    color: colorByName[name],
  }));
}

function buildReportProgressData(totalClasses: number, pendingReports: number) {
  const safeTotalClasses = Math.max(safeNumber(totalClasses, 0), 0);
  const safePendingReports = Math.max(safeNumber(pendingReports, 0), 0);
  const currentSubmitted = Math.max(safeTotalClasses - safePendingReports, 0);

  // API overview currently provides a snapshot count, so we render an inferred timeline
  // from the start of month (all pending) to current state for better readability.
  return [
    {
      month: "Đầu tháng",
      submitted: 0,
      pending: safeTotalClasses,
    },
    {
      month: "Hiện tại",
      submitted: currentSubmitted,
      pending: safePendingReports,
    },
  ];
}

function normalizeDashboardPayload(raw: unknown) {
  const payload = (raw && typeof raw === "object" ? raw : {}) as StaffDashboardApiPayload;
  const stats = payload.statistics ?? {};

  const pendingReports = safeNumber(stats.pendingReports, 0);
  const totalClasses = safeNumber(stats.totalClasses, 0);
  const reportRate = totalClasses > 0 ? `${Math.round(((totalClasses - pendingReports) / totalClasses) * 100)}%` : "0%";

  const sessionsInCurrentWeek = filterSessionsInCurrentWeek(payload.upcomingSessions);
  const weekSessions = sessionsInCurrentWeek.length > 0
    ? sessionsInCurrentWeek.length
    : safeNumber(stats.upcomingSessions, 0);

  return {
    totalLeads: safeNumber(stats.totalLeads, 0),
    newLeads: safeNumber(stats.totalLeads, 0),
    qualifiedLeads: safeNumber(stats.totalEnrollments, 0),
    weekSessions,
    reportRate,
    leadsTrend: `+${safeNumber(stats.totalLeads, 0)} lead`,
    qualifiedTrend: `${safeNumber(stats.totalEnrollments, 0)} ghi danh`,
    sessionsTrend: `${weekSessions} ca trong tuần`,
    reportsTrend: `${pendingReports} báo cáo chờ`,
    leadGrowthData: buildLeadGrowthData(payload.recentLeads),
    classOpsData: buildClassOpsData(sessionsInCurrentWeek),
    ticketDistribution: buildTicketDistribution(payload.openTickets),
    reportProgressData: buildReportProgressData(totalClasses, pendingReports),
  };
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Page() {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "schedule" | "reports">("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    let alive = true;
    getStaffManagementDashboard({ month: selectedMonth, year: selectedYear })
      .then((res: any) => {
        if (!alive) return;
        const d = res?.data?.data ?? res?.data ?? {};
        setDashboard(normalizeDashboardPayload(d));
      })
      .catch(() => {})
      .finally(() => { if (alive) {} });
    return () => { alive = false; };
  }, [selectedMonth, selectedYear]);

  const leadGrowthData = dashboard?.leadGrowthData ?? [
    { month: "T7", leads: 0, qualified: 0 },
    { month: "T8", leads: 0, qualified: 0 },
    { month: "T9", leads: 0, qualified: 0 },
    { month: "T10", leads: 0, qualified: 0 },
    { month: "T11", leads: 0, qualified: 0 },
    { month: "T12", leads: 0, qualified: 0 },
  ];

  const classOpsData = dashboard?.classOpsData ?? [
    { day: "T2", sessions: 0, conflicts: 0 },
    { day: "T3", sessions: 0, conflicts: 0 },
    { day: "T4", sessions: 0, conflicts: 0 },
    { day: "T5", sessions: 0, conflicts: 0 },
    { day: "T6", sessions: 0, conflicts: 0 },
    { day: "T7", sessions: 0, conflicts: 0 },
    { day: "CN", sessions: 0, conflicts: 0 },
  ];

  const ticketDistribution = dashboard?.ticketDistribution ?? [
    { name: "Tư vấn học", value: 0, color: "#dc2626" },
    { name: "Đổi lịch", value: 0, color: "#404040" },
    { name: "Báo cáo", value: 0, color: "#171717" },
    { name: "Khác", value: 0, color: "#991b1b" },
  ];

  const reportProgressData = dashboard?.reportProgressData ?? [
    { month: "T7", submitted: 0, pending: 0 },
    { month: "T8", submitted: 0, pending: 0 },
    { month: "T9", submitted: 0, pending: 0 },
    { month: "T10", submitted: 0, pending: 0 },
    { month: "T11", submitted: 0, pending: 0 },
    { month: "T12", submitted: 0, pending: 0 },
  ];

  const newLeads = dashboard?.newLeads ?? "—";
  const qualifiedLeads = dashboard?.qualifiedLeads ?? "—";
  const weekSessions = dashboard?.weekSessions ?? "—";
  const reportRate = dashboard?.reportRate ?? "—";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-2">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <BarChart3 size={25} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
                Vận hành & Học vụ
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                Tổng quan khách tiềm năng, xếp lớp, học bù, báo cáo tháng và ticket hỗ trợ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl">
              <Calendar size={16} className="text-red-600 shrink-0" />
              <span className="text-sm font-medium text-gray-700">Tháng</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="text-sm text-gray-400">/</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button className="px-4 py-2 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center gap-2">
              <Download size={16} />
              Xuất báo cáo
            </button>
            <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users size={20} className="text-white" />}
            label="Khách tiềm năng mới (tháng)"
            value={String(newLeads)}
            iconColor="from-blue-600 to-cyan-600"
          />
          <StatCard
            icon={<Target size={20} className="text-white" />}
            label="Khách tiềm năng đạt chuẩn"
            value={String(qualifiedLeads)}
            iconColor="from-amber-600 to-yellow-600"
          />
          <StatCard
            icon={<CalendarRange size={20} className="text-white" />}
            label="Ca học tuần này"
            value={String(weekSessions)}
            iconColor="from-emerald-600 to-teal-600"
          />
          <StatCard
            icon={<NotebookPen size={20} className="text-white" />}
            label="Báo cáo tháng"
            value={String(reportRate)}
            iconColor="from-red-600 to-pink-600"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className={`flex items-center gap-1 mb-6 p-1 bg-white border border-gray-200 rounded-xl w-fit transition-all duration-700 ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        {(
          [
            { key: "overview", label: "Tổng quan" },
            { key: "leads", label: "Khách tiềm năng" },
            { key: "schedule", label: "Lịch học" },
            { key: "reports", label: "Báo cáo" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {activeTab === "overview" && (
        <>
          <div className={`grid lg:grid-cols-2 gap-6 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {/* Lead Growth Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-linear-to-r from-red-600 to-red-700 rounded-lg">
                      <BarChart3 size={20} className="text-white" />
                    </div>
                    Tăng trưởng khách tiềm năng
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">6 tháng gần nhất</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={leadGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="leads" name="Khách tiềm năng" stroke="#dc2626" fill="url(#leadFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="qualified" name="Đạt chuẩn" stroke="#404040" fill="url(#qualifiedFill)" strokeWidth={2} />
                    <defs>
                      <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="qualifiedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#404040" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#404040" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ticket Distribution Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-linear-to-r from-red-600 to-red-700 rounded-lg">
                      <MessageSquare size={20} className="text-white" />
                    </div>
                    Phân loại ticket
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Theo nhóm yêu cầu</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ticketDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={90} dataKey="value">
                      {ticketDistribution.map((entry: { color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}%`, "Tỷ lệ"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {ticketDistribution.map((item: { color: string; name: string; value: number }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`grid md:grid-cols-2 gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {/* Class Operations Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-linear-to-r from-red-600 to-red-700 rounded-lg">
                    <CalendarRange size={20} className="text-white" />
                  </div>
                  Ca học & xung đột tuần
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classOpsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="sessions" name="Ca học" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conflicts" name="Xung đột" fill="#404040" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Report Progress Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-linear-to-r from-red-600 to-red-700 rounded-lg">
                      <AlertCircle size={20} className="text-white" />
                    </div>
                    Tiến độ báo cáo tháng
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Tỷ lệ nộp & tồn</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="submitted"
                      name="Đã nộp"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#dc2626", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 7 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      name="Còn lại"
                      stroke="#404040"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#404040", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 7 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Leads Tab */}
      {activeTab === "leads" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-linear-to-r from-red-600 to-red-700 rounded-lg">
                  <BarChart3 size={20} className="text-white" />
                </div>
                Khách tiềm năng & đạt chuẩn 6 tháng
              </h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="leads" name="Khách tiềm năng" stroke="#dc2626" fill="url(#leadFill2)" strokeWidth={3} />
                  <Area type="monotone" dataKey="qualified" name="Đạt chuẩn" stroke="#404040" fill="url(#qualifiedFill2)" strokeWidth={3} />
                  <defs>
                    <linearGradient id="leadFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="qualifiedFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#404040" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#404040" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-linear-to-r from-red-600 to-red-700 rounded-lg">
                  <CalendarRange size={20} className="text-white" />
                </div>
                Ca học & xung đột tuần
              </h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classOpsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sessions" name="Ca học" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="conflicts" name="Xung đột" fill="#404040" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                <div className="p-2 bg-linear-to-r from-red-600 to-red-700 rounded-lg">
                  <NotebookPen size={20} className="text-white" />
                </div>
                Tiến độ báo cáo tháng
              </h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    name="Đã nộp"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#dc2626", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    name="Còn lại"
                    stroke="#404040"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#404040", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 7 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-700 delay-300 ${isPageLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span>Cập nhật thời gian thực • Dữ liệu được cập nhật lúc 14:30</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span>Hoạt động tốt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
              <span>Cần chú ý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-900" />
              <span>Cần hành động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
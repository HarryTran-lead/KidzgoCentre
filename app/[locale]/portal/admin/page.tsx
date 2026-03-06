"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Users, BookOpen, TrendingUp, Clock,
  BarChart3, Sparkles, Calendar, AlertCircle,
  MoreVertical, Activity, GraduationCap,
  Loader2, Briefcase, ClipboardCheck,
  UserPlus, FileCheck, Phone, CheckCircle2, XCircle
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { getDashboardOverall } from "@/lib/api/dashboardService";
import type { DashboardOverallResponse, StatusBreakdownItem } from "@/types/dashboard";
import { useBranchFilter } from "@/hooks/useBranchFilter";

// StatCard Component
function StatCard({
  icon,
  label,
  value,
  hint,
  trend = "up",
  color = "red",
  delay = 0
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "stable";
  color?: "red" | "gray" | "black";
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    red: "bg-gradient-to-r from-red-600 to-red-700",
    gray: "bg-gradient-to-r from-gray-600 to-gray-700",
    black: "bg-gradient-to-r from-gray-800 to-gray-900"
  };

  const trendColors = {
    up: "text-red-600",
    down: "text-gray-600",
    stable: "text-gray-800"
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 p-5 transition-all duration-700 transform cursor-pointer hover:border-red-300 hover:shadow-md ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{label}</div>
          <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
          {hint && (
            <div className={`text-xs flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
              {trend === "up" && <TrendingUp size={12} />}
              {trend === "down" && <TrendingUp size={12} className="rotate-180" />}
              {trend === "stable" && <span>→</span>}
              {hint}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Badge Component
function Badge({
  color = "gray",
  children
}: {
  color?: "gray" | "red" | "black";
  children: React.ReactNode;
}) {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    black: "bg-gray-900 text-white border border-gray-800"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

// Status badge color
function getStatusColor(status: string): "red" | "gray" | "black" {
  const s = status?.toLowerCase();
  if (["active", "open", "ongoing", "enrolled"].includes(s)) return "red";
  if (["pending", "upcoming", "scheduled", "draft"].includes(s)) return "gray";
  return "black";
}

// Priority color
function getPriorityColor(priority: string): "red" | "gray" | "black" {
  const p = priority?.toLowerCase();
  if (["high", "critical", "urgent"].includes(p)) return "red";
  if (["medium", "normal"].includes(p)) return "gray";
  return "black";
}

// Loading skeleton
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-7 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="h-64 bg-gray-100 rounded-xl"></div>
    </div>
  );
}

export default function Page() {
  const pathname = usePathname();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overall");
  const [data, setData] = useState<DashboardOverallResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedBranchId } = useBranchFilter();

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    setActiveTab("overall");
  }, [pathname]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardOverall(
        selectedBranchId ? { branchId: selectedBranchId } : undefined
      );
      if (res?.data) {
        setData(res.data);
      } else {
        setError("Không thể tải dữ liệu tổng quan");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err?.message || "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart colors
  const CHART_COLORS = ["#dc2626", "#404040", "#171717", "#991b1b", "#6b7280", "#b91c1c"];

  // Build chart data from statusBreakdown
  const buildPieData = (breakdown: StatusBreakdownItem[] | undefined) =>
    breakdown?.filter(b => b.count > 0).map((b, i) => ({
      name: b.status,
      value: b.count,
      percentage: b.percentage,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })) ?? [];

  const enrollmentPieData = buildPieData(data?.enrollments?.statusBreakdown);
  const leavePieData = buildPieData(data?.leave?.statusBreakdown);
  const homeworkPieData = buildPieData(data?.homework?.statusBreakdown);
  const leadsPieData = buildPieData(data?.leads?.statusBreakdown);
  const placementPieData = buildPieData(data?.placementTests?.statusBreakdown);
  const invoicePieData = buildPieData(data?.finance?.invoiceStatusBreakdown);
  const makeupPieData = buildPieData(data?.makeupCredits?.statusBreakdown);
  const payrollPieData = buildPieData(data?.humanResources?.payrollRunStatusBreakdown);

  // Staff role bar chart
  const staffRoleData = data?.humanResources ? [
    { name: "Giáo viên", count: data.humanResources.teacherCount },
    { name: "QL", count: data.humanResources.managementStaffCount },
    { name: "Kế toán", count: data.humanResources.accountantStaffCount },
    { name: "Admin", count: data.humanResources.adminCount },
  ].filter(d => d.count > 0) : [];

  // Format number
  const fmtNum = (n: number | undefined) => (n ?? 0).toLocaleString("vi-VN");
  const fmtPercent = (n: number | undefined) => `${(n ?? 0).toFixed(1)}%`;
  const fmtMoney = (n: number | undefined) => {
    const v = n ?? 0;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toLocaleString("vi-VN");
  };

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className={`mb-8 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Trung tâm KidzGo Analytics
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                Tổng quan hoạt động và hiệu suất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
              <Calendar size={16} className="text-red-600" />
              <span className="text-sm font-medium text-gray-700">
                {new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
              </span>
            </div>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                <Loader2 size={16} className="text-red-600 animate-spin" />
                <span className="text-sm text-gray-600">Đang tải...</span>
              </div>
            )}
            <button
              onClick={fetchData}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {loading && !data ? (
            <>
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                icon={<Users size={20} />}
                label="Học viên"
                value={fmtNum(data?.students?.totalStudents)}
                hint={`${fmtNum(data?.students?.activeStudents)} đang hoạt động`}
                trend="up"
                color="red"
                delay={100}
              />
              <StatCard
                icon={<GraduationCap size={20} />}
                label="Ghi danh"
                value={fmtNum(data?.enrollments?.totalEnrollments)}
                hint={`${fmtNum(data?.enrollments?.activeEnrollments)} đang hoạt động`}
                trend="up"
                color="gray"
                delay={200}
              />
              <StatCard
                icon={<UserPlus size={20} />}
                label="Leads"
                value={fmtNum(data?.leads?.totalLeads)}
                hint={`${fmtPercent(data?.leads?.conversionRate)} chuyển đổi`}
                trend="up"
                color="black"
                delay={300}
              />
              <StatCard
                icon={<ClipboardCheck size={20} />}
                label="Điểm danh"
                value={fmtPercent(data?.attendance?.attendanceRate)}
                hint={`${fmtNum(data?.attendance?.totalSessions)} buổi học`}
                trend="stable"
                color="red"
                delay={400}
              />
              <StatCard
                icon={<Briefcase size={20} />}
                label="Nhân sự"
                value={fmtNum(data?.humanResources?.totalStaff)}
                hint={`${fmtNum(data?.humanResources?.teacherCount)} giáo viên`}
                trend="stable"
                color="gray"
                delay={500}
              />
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex items-center gap-1 mb-6 p-1 bg-white border border-gray-200 rounded-xl w-fit overflow-x-auto transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        {[
          { key: "overall", label: "Tổng quan" },
          { key: "student", label: "Học viên" },
          { key: "academic", label: "Học vụ" },
          { key: "leads", label: "Tuyển sinh & Xếp lớp" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.key
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-50"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: Tổng quan ===== */}
      {activeTab === "overall" && (
        <>
          {/* Row 1: Key metrics */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {loading && !data ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <StatCard icon={<ClipboardCheck size={20} />} label="Điểm danh" value={fmtPercent(data?.attendance?.attendanceRate)} hint={`${fmtNum(data?.attendance?.totalSessions)} buổi`} color="red" />
                <StatCard icon={<BookOpen size={20} />} label="Bài tập" value={fmtNum(data?.homework?.total)} hint={`${fmtNum(data?.homework?.missingCount)} chưa nộp`} trend={data?.homework?.missingCount ? "down" : "stable"} color="gray" />
                <StatCard icon={<Clock size={20} />} label="Nghỉ phép chờ" value={fmtNum(data?.leave?.pendingRequests)} hint={`${fmtNum(data?.leave?.totalRequests)} tổng`} trend={data?.leave?.pendingRequests ? "down" : "stable"} color="black" />
                <StatCard icon={<FileCheck size={20} />} label="Xếp lớp" value={fmtNum(data?.placementTests?.totalTests)} hint={`${fmtPercent(data?.placementTests?.completionRate)} hoàn thành`} color="red" />
              </>
            )}
          </div>

          {/* Row 2: Charts */}
          <div className={`grid lg:grid-cols-2 gap-6 mb-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Enrollment Status Pie */}
            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap size={20} className="text-red-600" />
                    Trạng thái ghi danh
                  </h3>
                  <Badge color="red">{fmtNum(data?.enrollments?.totalEnrollments)} ghi danh</Badge>
                </div>
                <div className="h-60">
                  {enrollmentPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={enrollmentPieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                          {enrollmentPieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </div>
                <BreakdownLegend data={enrollmentPieData} />
              </div>
            )}

            {/* Leads Status Pie */}
            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus size={20} className="text-red-600" />
                    Trạng thái Leads
                  </h3>
                  <Badge color="red">{fmtNum(data?.leads?.totalLeads)} leads</Badge>
                </div>
                <div className="h-60">
                  {leadsPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={leadsPieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                          {leadsPieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </div>
                <BreakdownLegend data={leadsPieData} />
              </div>
            )}
          </div>

          {/* Row 3: Quick Stats Summary */}
          <div className={`grid lg:grid-cols-3 gap-6 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-red-600" />
                  Học viên & Ghi danh
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickStatBox label="Tổng HV" value={fmtNum(data?.students?.totalStudents)} variant="red" />
                  <QuickStatBox label="HV hoạt động" value={fmtNum(data?.students?.activeStudents)} variant="gray" />
                  <QuickStatBox label="Mới tháng này" value={fmtNum(data?.students?.newStudentsThisMonth)} variant="dark" />
                  <QuickStatBox label="Tỷ lệ HĐ" value={fmtPercent(data?.students?.activeStudentRate)} variant="red" />
                </div>
              </div>
            )}

            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone size={20} className="text-red-600" />
                  Tuyển sinh
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickStatBox label="Tổng Leads" value={fmtNum(data?.leads?.totalLeads)} variant="red" />
                  <QuickStatBox label="Leads mới" value={fmtNum(data?.leads?.newLeads)} variant="gray" />
                  <QuickStatBox label="Tỷ lệ chuyển đổi" value={fmtPercent(data?.leads?.conversionRate)} variant="dark" />
                  <QuickStatBox label="Đã ghi danh" value={fmtNum(data?.leads?.enrolledLeads)} variant="red" />
                </div>
              </div>
            )}

            {loading && !data ? <SkeletonChart /> : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-red-600" />
                  Nhân sự
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickStatBox label="Tổng NV" value={fmtNum(data?.humanResources?.totalStaff)} variant="red" />
                  <QuickStatBox label="Giáo viên" value={fmtNum(data?.humanResources?.teacherCount)} variant="gray" />
                  <QuickStatBox label="QL" value={fmtNum(data?.humanResources?.managementStaffCount)} variant="dark" />
                  <QuickStatBox label="Kế toán" value={fmtNum(data?.humanResources?.accountantStaffCount)} variant="red" />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== TAB: Học viên ===== */}
      {activeTab === "student" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={<Users size={20} />} label="Tổng học viên" value={fmtNum(data?.students?.totalStudents)} color="red" />
            <StatCard icon={<CheckCircle2 size={20} />} label="Đang hoạt động" value={fmtNum(data?.students?.activeStudents)} color="gray" />
            <StatCard icon={<XCircle size={20} />} label="Không HĐ" value={fmtNum(data?.students?.inactiveStudents)} color="black" />
            <StatCard icon={<UserPlus size={20} />} label="Mới tháng này" value={fmtNum(data?.students?.newStudentsThisMonth)} color="red" />
            <StatCard icon={<Activity size={20} />} label="Tỷ lệ hoạt động" value={fmtPercent(data?.students?.activeStudentRate)} color="gray" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enrollment status pie */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-red-600" />
                Phân bố ghi danh
              </h3>
              <div className="h-64">
                {enrollmentPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={enrollmentPieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={90} dataKey="value">
                        {enrollmentPieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
              <BreakdownLegend data={enrollmentPieData} />
            </div>

            {/* Enrollment details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-gray-900" />
                Chi tiết ghi danh
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickStatBox label="Tổng ghi danh" value={fmtNum(data?.enrollments?.totalEnrollments)} variant="red" />
                <QuickStatBox label="Đang hoạt động" value={fmtNum(data?.enrollments?.activeEnrollments)} variant="gray" />
                <QuickStatBox label="Tạm dừng" value={fmtNum(data?.enrollments?.pausedEnrollments)} variant="dark" />
                <QuickStatBox label="Đã rời" value={fmtNum(data?.enrollments?.droppedEnrollments)} variant="red" />
                <QuickStatBox label="Mới tháng này" value={fmtNum(data?.enrollments?.newEnrollmentsThisMonth)} variant="gray" />
                <QuickStatBox label="Tỷ lệ HĐ" value={fmtPercent(data?.enrollments?.activeEnrollmentRate)} variant="dark" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: Học vụ ===== */}
      {activeTab === "academic" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Top stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<ClipboardCheck size={20} />} label="Tỷ lệ điểm danh" value={fmtPercent(data?.attendance?.attendanceRate)} hint={`${fmtNum(data?.attendance?.totalSessions)} buổi`} color="red" />
            <StatCard icon={<BookOpen size={20} />} label="Bài tập chưa nộp" value={fmtNum(data?.homework?.missingCount)} hint={`/${fmtNum(data?.homework?.totalHomeworkSubmissions)} tổng`} color="gray" />
            <StatCard icon={<Clock size={20} />} label="Nghỉ phép chờ" value={fmtNum(data?.leave?.pendingRequests)} hint={`Duyệt: ${fmtPercent(data?.leave?.approvalRate)}`} color="black" />
            <StatCard icon={<Activity size={20} />} label="Bù lớp khả dụng" value={fmtNum(data?.makeupCredits?.availableCreditsCount)} hint={`Sử dụng: ${fmtPercent(data?.makeupCredits?.utilizationRate)}`} color="red" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Attendance breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-red-600" />
                Phân bố điểm danh
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <QuickStatBox label="Có mặt" value={fmtNum(data?.attendance?.presentCount)} variant="red" />
                <QuickStatBox label="Vắng" value={fmtNum(data?.attendance?.absentCount)} variant="gray" />
                <QuickStatBox label="Trễ" value={fmtNum(data?.attendance?.lateCount)} variant="dark" />
                <QuickStatBox label="Tỷ lệ bù" value={fmtPercent(data?.attendance?.makeupRate)} variant="red" />
              </div>
              {data?.attendance?.statusBreakdown && data.attendance.statusBreakdown.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={buildPieData(data.attendance.statusBreakdown)} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {buildPieData(data.attendance.statusBreakdown).map((e, i) => (<Cell key={i} fill={e.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Homework breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-red-600" />
                Phân bố bài tập
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <QuickStatBox label="Đã giao" value={fmtNum(data?.homework?.assignedCount)} variant="red" />
                <QuickStatBox label="Đã nộp" value={fmtNum(data?.homework?.submittedCount)} variant="gray" />
                <QuickStatBox label="Đã chấm" value={fmtNum(data?.homework?.gradedCount)} variant="dark" />
                <QuickStatBox label="Trễ hạn" value={fmtNum(data?.homework?.lateCount)} variant="red" />
              </div>
              {homeworkPieData.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={homeworkPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {homeworkPieData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Leave breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-red-600" />
                Nghỉ phép
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <QuickStatBox label="Tổng" value={fmtNum(data?.leave?.totalRequests)} variant="red" />
                <QuickStatBox label="Chờ duyệt" value={fmtNum(data?.leave?.pendingRequests)} variant="gray" />
                <QuickStatBox label="Đã duyệt" value={fmtNum(data?.leave?.approvedRequests)} variant="dark" />
                <QuickStatBox label="Từ chối" value={fmtNum(data?.leave?.rejectedRequests)} variant="red" />
              </div>
              {leavePieData.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leavePieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {leavePieData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Makeup credits */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-red-600" />
                Tín chỉ bù lớp
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <QuickStatBox label="Tổng phát hành" value={fmtNum(data?.makeupCredits?.totalCreditsIssued)} variant="red" />
                <QuickStatBox label="Khả dụng" value={fmtNum(data?.makeupCredits?.availableCreditsCount)} variant="gray" />
                <QuickStatBox label="Đã dùng" value={fmtNum(data?.makeupCredits?.usedCreditsCount)} variant="dark" />
                <QuickStatBox label="Hết hạn" value={fmtNum(data?.makeupCredits?.expiredCreditsCount)} variant="red" />
              </div>
              {makeupPieData.length > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={makeupPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {makeupPieData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB: Tuyển sinh & Xếp lớp ===== */}
      {activeTab === "leads" && (
        <div className={`space-y-6 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Phone size={20} />} label="Tổng Leads" value={fmtNum(data?.leads?.totalLeads)} color="red" />
            <StatCard icon={<UserPlus size={20} />} label="Leads mới" value={fmtNum(data?.leads?.newLeads)} color="gray" />
            <StatCard icon={<TrendingUp size={20} />} label="Tỷ lệ chuyển đổi" value={fmtPercent(data?.leads?.conversionRate)} color="black" />
            <StatCard icon={<FileCheck size={20} />} label="Tổng xếp lớp" value={fmtNum(data?.placementTests?.totalTests)} color="red" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Lead funnel chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-red-600" />
                Phễu Leads
              </h3>
              <div className="h-64">
                {leadsPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsPieData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="value" name="Số lượng" radius={[0, 4, 4, 0]}>
                        {leadsPieData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
            </div>

            {/* Lead detail stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone size={20} className="text-gray-900" />
                Chi tiết Leads
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickStatBox label="Mới" value={fmtNum(data?.leads?.newLeads)} variant="red" />
                <QuickStatBox label="Đã liên hệ" value={fmtNum(data?.leads?.contactedLeads)} variant="gray" />
                <QuickStatBox label="Đạt chuẩn" value={fmtNum(data?.leads?.qualifiedLeads)} variant="dark" />
                <QuickStatBox label="Đã ghi danh" value={fmtNum(data?.leads?.enrolledLeads)} variant="red" />
                <QuickStatBox label="Mất" value={fmtNum(data?.leads?.lostLeads)} variant="gray" />
                <QuickStatBox label="Tỷ lệ đạt chuẩn" value={fmtPercent(data?.leads?.qualificationRate)} variant="dark" />
              </div>
            </div>

            {/* Placement test chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileCheck size={20} className="text-red-600" />
                Kiểm tra xếp lớp
              </h3>
              <div className="h-64">
                {placementPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={placementPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {placementPieData.map((e, i) => (<Cell key={i} fill={e.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </div>
              <BreakdownLegend data={placementPieData} />
            </div>

            {/* Placement test details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileCheck size={20} className="text-gray-900" />
                Chi tiết xếp lớp
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickStatBox label="Đã lên lịch" value={fmtNum(data?.placementTests?.scheduledTests)} variant="red" />
                <QuickStatBox label="Hoàn thành" value={fmtNum(data?.placementTests?.completedTests)} variant="gray" />
                <QuickStatBox label="Không đến" value={fmtNum(data?.placementTests?.noShowTests)} variant="dark" />
                <QuickStatBox label="Đã hủy" value={fmtNum(data?.placementTests?.cancelledTests)} variant="red" />
                <QuickStatBox label="Tỷ lệ hoàn thành" value={fmtPercent(data?.placementTests?.completionRate)} variant="gray" />
                <QuickStatBox label="Tỷ lệ vắng" value={fmtPercent(data?.placementTests?.noShowRate)} variant="dark" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-700 delay-300 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-600" />
            <span>
              Cập nhật lúc{" "}
              {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              {" "}&#8226; Dữ liệu từ API
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
              <span>Hoạt động tốt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <span>Cần chú ý</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>Cần hành động</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Reusable Components ====================

function QuickStatBox({ label, value, variant }: { label: string; value: string; variant: "red" | "gray" | "dark" }) {
  const styles = {
    red: "bg-red-50 border-red-100 text-red-600",
    gray: "bg-gray-50 border-gray-100 text-gray-900",
    dark: "bg-gray-100 border-gray-200 text-gray-900",
  };
  return (
    <div className={`p-3 rounded-xl border text-center ${styles[variant]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
      Không có dữ liệu
    </div>
  );
}

function BreakdownLegend({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (!data.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span className="text-sm text-gray-700">{item.name}</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
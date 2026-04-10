"use client";

import { useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  UserPlus,
  TrendingUp,
  ClipboardCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  Activity,
  UserCog,
  CircleCheckBig,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { DashboardOverallResponse, StatusBreakdownItem } from "@/types/dashboard";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DashboardBarChart, { type BarChartDatum } from "./BarChart";
import DashboardLineChart, { type LineChartDatum } from "./LineChart";
import FunnelChart from "./FunnelChart";

interface DashboardPageProps {
  data: Partial<DashboardOverallResponse> | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

type DashboardTab = "overview" | "leads" | "academic" | "hr";

// Updated color palette: Red and Gray theme
const CHART_COLORS = ["#dc2626", "#404040", "#171717", "#991b1b", "#4b5563", "#6b7280", "#9ca3af"];

const STATUS_TRANSLATIONS: Record<string, string> = {
  active: "Đang hoạt động",
  inactive: "Không hoạt động",
  paused: "Tạm dừng",
  dropped: "Đã nghỉ",
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Đủ điều kiện",
  enrolled: "Đã ghi danh",
  lost: "Mất",
  noshow: "Vắng mặt",
  no_show: "Vắng mặt",
  scheduled: "Đã lên lịch",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
  present: "Có mặt",
  absent: "Vắng",
  late: "Đi trễ",
  pending: "Chờ xử lý",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  assigned: "Đã giao",
  submitted: "Đã nộp",
  graded: "Đã chấm",
  missing: "Thiếu",
  overdue: "Quá hạn",
  used: "Đã dùng",
  available: "Khả dụng",
  expired: "Hết hạn",
  paid: "Đã thanh toán",
  draft: "Bản nháp",
  admin: "Quản trị",
  teacher: "Giáo viên",
  management: "Quản lý",
  accountant: "Kế toán",
};

function toVietnameseStatus(status: string): string {
  const key = status.trim().toLowerCase().replace(/\s+/g, "_");
  return STATUS_TRANSLATIONS[key] || status;
}

function num(...values: Array<number | undefined>): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function percent(value: number | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, value ?? 0);
}

function mapBreakdownToLine(items?: StatusBreakdownItem[]): LineChartDatum[] {
  return (items ?? []).map((item, index) => ({
    label: toVietnameseStatus(item.status),
    value: num(item.count),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function mapBreakdownToBar(items?: StatusBreakdownItem[]): BarChartDatum[] {
  return (items ?? []).map((item, index) => ({
    label: toVietnameseStatus(item.status),
    value: num(item.count),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function formatNumber(value: number | undefined): string {
  return num(value).toLocaleString("vi-VN");
}

function formatPercent(value: number | undefined): string {
  return `${percent(value).toFixed(1)}%`;
}

function formatMoney(value: number | undefined): string {
  const amount = num(value);
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function EmptyBlock({ text = "Không có dữ liệu" }: { text?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
      {text}
    </div>
  );
}

function Legend({ data }: { data: LineChartDatum[] }) {
  if (!data.length) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{item.value.toLocaleString("vi-VN")}</span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <Sparkles size={12} /> Live view
      </span>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="h-44 animate-pulse rounded-3xl border border-gray-200 bg-white p-4 shadow-sm" />
      ))}
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
        active
          ? "bg-linear-to-r from-red-600 to-red-700 text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );
}

export default function DashboardPage({ data, loading = false, error, onRefresh }: DashboardPageProps) {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const students = data?.students;
  const enrollments = data?.enrollments;
  const leads = data?.leads;
  const attendance = data?.attendance;
  const homework = data?.homework;
  const leave = data?.leave;
  const makeupCredits = data?.makeupCredits;
  const placementTests = data?.placementTests;
  const humanResources = data?.humanResources;

  const studentsTotal = num(students?.total, students?.totalStudents);
  const activeEnrollments = num(enrollments?.active, enrollments?.activeEnrollments);
  const totalLeads = num(leads?.total, leads?.totalLeads);
  const conversionRate = percent(leads?.conversionRate);
  const attendanceRate = percent(attendance?.attendanceRate);
  const totalStaff = num(humanResources?.totalStaff);

  const leadsBreakdown = useMemo(() => mapBreakdownToBar(leads?.statusBreakdown), [leads?.statusBreakdown]);
  const leadsLine = useMemo(() => mapBreakdownToLine(leads?.statusBreakdown), [leads?.statusBreakdown]);
  const placementLine = useMemo(() => mapBreakdownToLine(placementTests?.statusBreakdown), [placementTests?.statusBreakdown]);
  const attendanceLine = useMemo(() => mapBreakdownToLine(attendance?.statusBreakdown), [attendance?.statusBreakdown]);
  const enrollmentLine = useMemo(() => mapBreakdownToLine(enrollments?.statusBreakdown), [enrollments?.statusBreakdown]);
  const makeupLine = useMemo(() => mapBreakdownToLine(makeupCredits?.statusBreakdown), [makeupCredits?.statusBreakdown]);
  const leaveLine = useMemo(() => mapBreakdownToLine(leave?.statusBreakdown), [leave?.statusBreakdown]);
  const payrollLine = useMemo(
    () => mapBreakdownToLine(humanResources?.payrollRunStatusBreakdown),
    [humanResources?.payrollRunStatusBreakdown]
  );

  const homeworkBars = useMemo<BarChartDatum[]>(
    () => [
      { label: "Đã giao", value: num(homework?.assignedCount, homework?.total), color: "#3b82f6" },
      { label: "Đã nộp", value: num(homework?.submittedCount, homework?.submitted), color: "#10b981" },
      { label: "Đã chấm", value: num(homework?.gradedCount, homework?.graded), color: "#f59e0b" },
      { label: "Thiếu", value: num(homework?.missingCount), color: "#ef4444" },
    ],
    [homework]
  );

  const hrRoleBars = useMemo<BarChartDatum[]>(
    () => [
      { label: "Giáo viên", value: num(humanResources?.teacherCount), color: "#10b981" },
      { label: "Quản lý", value: num(humanResources?.managementStaffCount), color: "#3b82f6" },
      { label: "Kế toán", value: num(humanResources?.accountantStaffCount), color: "#f59e0b" },
      { label: "Quản trị", value: num(humanResources?.adminCount), color: "#8b5cf6" },
    ],
    [humanResources]
  );

  const hrTrendLine = useMemo<LineChartDatum[]>(
    () => [
      { label: "Giờ làm", value: num(humanResources?.totalWorkHours), color: "#2563eb" },
      { label: "Giờ TB", value: num(humanResources?.averageWorkHoursPerStaff), color: "#0ea5e9" },
      { label: "Xử lý lương", value: num(humanResources?.payrollProcessed), color: "#10b981" },
      { label: "Chờ xử lý", value: num(humanResources?.payrollPending), color: "#f59e0b" },
    ],
    [humanResources]
  );

  if (loading && !data) {
    return <LoadingGrid />;
  }

  if (!data && error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-700">{error}</p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 cursor-pointer"
          >
            Tải lại
          </button>
        ) : null}
      </div>
    );
  }

  if (!data) {
    return <EmptyBlock />;
  }

  return (
    <div className="space-y-7">
      {/* Updated header with red/gray theme */}
      <div className="rounded-3xl border border-gray-200/80 bg-linear-to-br from-white via-white to-red-50 p-5 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.5)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Bảng điều khiển quản trị</h1>
            <p className="mt-1 text-sm text-gray-500">Tổng hợp dữ liệu vận hành theo thời gian thực, tối ưu cho theo dõi nhanh.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">Học viên: {formatNumber(studentsTotal)}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">Lead: {formatNumber(totalLeads)}</span>
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">Điểm danh: {formatPercent(attendanceRate)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
              <CalendarDays size={16} />
              <span>Khoảng thời gian</span>
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="border-none bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              >
                <option value="7d">7 ngày gần nhất</option>
                <option value="30d">30 ngày gần nhất</option>
                <option value="90d">90 ngày gần nhất</option>
              </select>
            </div>
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-xl bg-linear-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 cursor-pointer"
              >
                Làm mới
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tab buttons with red gradient */}
      <div className="sticky top-2 z-10 flex w-full flex-wrap gap-2 rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-sm backdrop-blur">
        <TabButton active={activeTab === "overview"} label="Overview" onClick={() => setActiveTab("overview")} />
        <TabButton active={activeTab === "leads"} label="Leads" onClick={() => setActiveTab("leads")} />
        <TabButton active={activeTab === "academic"} label="Academic" onClick={() => setActiveTab("academic")} />
        <TabButton active={activeTab === "hr"} label="HR" onClick={() => setActiveTab("hr")} />
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <section>
            <SectionTitle title="Tổng quan KPI" subtitle="Các chỉ số trọng tâm toàn hệ thống" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard title="Tổng học viên" value={formatNumber(studentsTotal)} icon={<Users size={18} />} />
              <KpiCard title="Ghi danh đang hoạt động" value={formatNumber(activeEnrollments)} icon={<GraduationCap size={18} />} />
              <KpiCard title="Tổng lead" value={formatNumber(totalLeads)} icon={<UserPlus size={18} />} />
              <KpiCard title="Tỷ lệ điểm danh" value={formatPercent(attendanceRate)} icon={<CircleCheckBig size={18} />} />
              <KpiCard
                title="Tỷ lệ chuyển đổi"
                value={formatPercent(conversionRate)}
                subValue={conversionRate >= 20 ? "Mức tốt" : "Cần cải thiện"}
                trend={conversionRate >= 20 ? "up" : "down"}
                icon={<TrendingUp size={18} />}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ChartCard title="Lead theo trạng thái" rightContent={`Chuyển đổi: ${formatPercent(leads?.conversionRate)}`}>
              <FunnelChart data={leadsBreakdown} />
            </ChartCard> 
            <ChartCard title="Trạng thái điểm danh  " rightContent={`Tỷ lệ: ${formatPercent(attendance?.attendanceRate)}`}>
              <DashboardLineChart data={attendanceLine} height={220} strokeColor="#dc2626" />
              <Legend data={attendanceLine} />
            </ChartCard>

            <ChartCard title="Trạng thái ghi danh  " rightContent={`Đang hoạt động: ${formatNumber(activeEnrollments)}`}>
              <DashboardLineChart data={enrollmentLine} height={220} strokeColor="#dc2626" />
              <Legend data={enrollmentLine} />
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartCard title="Placement test theo trạng thái  ">
              <DashboardLineChart data={placementLine} height={240} strokeColor="#dc2626" />
              <Legend data={placementLine} />
            </ChartCard>

            <ChartCard title="Leads theo trạng thái  ">
              <DashboardLineChart data={leadsLine} height={240} strokeColor="#dc2626" />
              <Legend data={leadsLine} />
            </ChartCard>
          </section>
        </div>
      ) : null}

      {activeTab === "leads" ? (
        <div className="space-y-6">
          <section>
            <SectionTitle title="Leads & Placement Test" subtitle="Theo dõi hiệu quả tuyển sinh và xếp lớp" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Tổng lead" value={formatNumber(num(leads?.total, leads?.totalLeads))} icon={<UserPlus size={18} />} />
              <KpiCard title="Lead mới" value={formatNumber(num(leads?.new, leads?.newLeads))} icon={<Activity size={18} />} />
              <KpiCard title="Lead đã ghi danh" value={formatNumber(num(leads?.enrolled, leads?.enrolledLeads))} icon={<GraduationCap size={18} />} />
              <KpiCard title="Tỷ lệ chuyển đổi" value={formatPercent(leads?.conversionRate)} icon={<TrendingUp size={18} />} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ChartCard title="Lead theo trạng thái">
              <FunnelChart data={leadsBreakdown} />
            </ChartCard>

            <ChartCard title="Trạng thái lead  ">
              <DashboardLineChart data={leadsLine} height={220} strokeColor="#dc2626" />
              <Legend data={leadsLine} />
            </ChartCard>

            <ChartCard title="Placement test theo trạng thái  ">
              <DashboardLineChart data={placementLine} height={220} strokeColor="#dc2626" />
              <Legend data={placementLine} />
            </ChartCard>
          </section>
        </div>
      ) : null}

      {activeTab === "academic" ? (
        <div className="space-y-6">
          <section>
            <SectionTitle title="Học vụ" subtitle="Điểm danh, bài tập, nghỉ phép, tín chỉ bù" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Tỷ lệ điểm danh" value={formatPercent(attendance?.attendanceRate)} icon={<ClipboardCheck size={18} />} />
              <KpiCard title="Tỷ lệ nộp bài" value={formatPercent(homework?.submissionRate)} icon={<BookOpen size={18} />} />
              <KpiCard title="Tỷ lệ chấm bài" value={formatPercent(homework?.gradedRate)} icon={<Activity size={18} />} />
              <KpiCard title="Đơn nghỉ phép" value={formatNumber(num(leave?.total, leave?.totalRequests))} icon={<CalendarDays size={18} />} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ChartCard title="Điểm danh  ">
              <DashboardLineChart data={attendanceLine} height={220} strokeColor="#dc2626" />
              <Legend data={attendanceLine} />
            </ChartCard>

            <ChartCard title="Bài tập theo tiến độ (Bar)">
              <DashboardBarChart data={homeworkBars} height={220} />
            </ChartCard>

            <ChartCard title="Nghỉ phép theo trạng thái  ">
              <DashboardLineChart data={leaveLine} height={220} strokeColor="#dc2626" />
              <Legend data={leaveLine} />
            </ChartCard>

            <ChartCard title="Tín chỉ bù theo trạng thái  ">
              <DashboardLineChart data={makeupLine} height={220} strokeColor="#dc2626" />
              <Legend data={makeupLine} />
            </ChartCard>

            <ChartCard title="Placement test hoàn thành">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard title="Tổng bài test" value={formatNumber(num(placementTests?.total, placementTests?.totalTests))} icon={<ClipboardCheck size={16} />} />
                <KpiCard title="Hoàn thành" value={formatNumber(num(placementTests?.completed, placementTests?.completedTests))} icon={<GraduationCap size={16} />} />
                <KpiCard title="Không tham dự" value={formatNumber(num(placementTests?.noShow, placementTests?.noShowTests))} icon={<Users size={16} />} />
                <KpiCard title="Tỷ lệ hoàn thành" value={formatPercent(placementTests?.completionRate)} icon={<TrendingUp size={16} />} />
              </div>
            </ChartCard>
          </section>
        </div>
      ) : null}

      {activeTab === "hr" ? (
        <div className="space-y-6">
          <section>
            <SectionTitle title="Nhân sự (HR)" subtitle="Cơ cấu nhân sự và bảng lương" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard title="Tổng nhân sự" value={formatNumber(humanResources?.totalStaff)} icon={<Briefcase size={18} />} />
              <KpiCard title="Giáo viên" value={formatNumber(humanResources?.teacherCount)} icon={<Users size={18} />} />
              <KpiCard title="Quản lý" value={formatNumber(humanResources?.managementStaffCount)} icon={<UserCog size={18} />} />
              <KpiCard title="Quản trị" value={formatNumber(humanResources?.adminCount)} icon={<UserCog size={18} />} />
              <KpiCard title="Tổng lương" value={formatMoney(humanResources?.totalPayroll)} icon={<Wallet size={18} />} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ChartCard title="Cơ cấu nhân sự (Bar)">
              <DashboardBarChart data={hrRoleBars} layout="vertical" height={240} />
            </ChartCard>

            <ChartCard title="Trạng thái payroll run  ">
              <DashboardLineChart data={payrollLine} height={220} strokeColor="#06b6d4" />
              <Legend data={payrollLine} />
            </ChartCard>

            <ChartCard title="Xu hướng vận hành HR  ">
              <DashboardLineChart data={hrTrendLine} height={220} strokeColor="#0f766e" />
              <Legend data={hrTrendLine} />
            </ChartCard>
          </section>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm text-red-700">
          Đang làm mới dữ liệu...
        </div>
      ) : null}
    </div>
  );
}
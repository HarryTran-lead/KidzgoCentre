import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  Layers3,
  Send,
} from "lucide-react";
import type { BranchDashboardResponse, ClassAcademicDashboardResponse } from "@/types/reports-v3";
import type { DashboardFocusOption } from "@/components/reports-v3/tabs/types";
import { EmptyState, SectionCard, cn, formatPercent, formatScalar } from "@/components/reports-v3/tabs/shared";

function StatCard({
  title,
  value,
  hint,
  tone,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  tone: "red" | "blue" | "green" | "amber";
  icon: ReactNode;
}) {
  const toneMap = {
    red: "from-red-600 to-red-700",
    blue: "from-blue-600 to-cyan-600",
    green: "from-emerald-600 to-teal-600",
    amber: "from-amber-600 to-orange-600",
  } as const;

  return (
    <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
          <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
        <div className={cn("rounded-xl bg-gradient-to-r p-2 text-white shadow-sm", toneMap[tone])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

type DashboardTabProps = {
  reportCount: number;
  openRiskAlertsCount: number;
  pendingRecommendationsCount: number;
  csRecommendationsCount: number;
  canSeeBranchDashboard: boolean;
  dashboardFocus: "class" | "branch";
  dashboardFocusOptions: readonly DashboardFocusOption[];
  setDashboardFocus: (value: "class" | "branch") => void;
  selectedClassId: string;
  classDashboard: ClassAcademicDashboardResponse | null;
  selectedBranchId: string;
  branchDashboard: BranchDashboardResponse | null;
};

function getWeakStudentDetails(value: ClassAcademicDashboardResponse["weakStudents"]) {
  return Array.isArray(value) ? value : [];
}

function getWeakStudentCount(dashboard: ClassAcademicDashboardResponse) {
  if (Array.isArray(dashboard.weakStudents)) return dashboard.weakStudents.length;
  return dashboard.weakStudents ?? dashboard.riskStudents;
}

export default function DashboardTab({
  reportCount,
  openRiskAlertsCount,
  pendingRecommendationsCount,
  csRecommendationsCount,
  canSeeBranchDashboard,
  dashboardFocus,
  dashboardFocusOptions,
  setDashboardFocus,
  selectedClassId,
  classDashboard,
  selectedBranchId,
  branchDashboard,
}: DashboardTabProps) {
  const weakStudentDetails = classDashboard ? getWeakStudentDetails(classDashboard.weakStudents) : [];
  const weakStudentCount = classDashboard ? getWeakStudentCount(classDashboard) : undefined;
  const classPacing = classDashboard?.classPacing;
  const reviewRatio = classPacing?.reviewRatioPercent ?? classPacing?.reviewRatio;
  const plannedProgress = classPacing?.plannedProgressPercent ?? classPacing?.plannedProgress;
  const actualProgress = classPacing?.actualProgressPercent ?? classPacing?.actualProgress;

  return (
    <div className="grid gap-6 [grid-template-columns:minmax(0,7fr)_minmax(0,3fr)] max-[1400px]:grid-cols-1">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Báo cáo" value={String(reportCount)} hint="Lịch sử của học viên đang chọn" tone="red" icon={<BarChart3 size={18} />} />
          <StatCard title="Rủi ro đang mở" value={String(openRiskAlertsCount)} hint="Cảnh báo rủi ro ở lớp đang chọn" tone="amber" icon={<AlertTriangle size={18} />} />
          <StatCard title="Đề xuất chờ xử lý" value={String(pendingRecommendationsCount)} hint="Đề xuất đang chờ xử lý" tone="blue" icon={<ClipboardList size={18} />} />
          <StatCard title="Theo dõi CS" value={String(csRecommendationsCount)} hint="Đề xuất giao cho CS" tone="green" icon={<Send size={18} />} />
        </div>

        {dashboardFocus === "class" || !canSeeBranchDashboard ? (
          <SectionCard title="Tổng quan học thuật lớp" subtitle="Đọc dữ liệu lớp đã chọn để xem tiến độ, rủi ro và nhu cầu hỗ trợ." icon={<BookOpen size={18} />}>
            {selectedClassId && classDashboard ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">{classDashboard.className || "Lớp học"}</div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-700">
                    <div>Tổng học viên: <span className="font-semibold">{formatScalar(classDashboard.totalStudents)}</span></div>
                    <div>Học viên yếu: <span className="font-semibold">{formatScalar(weakStudentCount)}</span></div>
                    <div>Học viên chậm tiến độ: <span className="font-semibold">{formatScalar(classDashboard.delayedStudents)}</span></div>
                    <div>Đánh giá chưa đạt: <span className="font-semibold">{formatScalar(classDashboard.failedAssessments)}</span></div>
                    <div>Cần hỗ trợ bổ sung: <span className="font-semibold">{formatScalar(classDashboard.remedialRequired)}</span></div>
                    <div>Tỷ lệ ôn tập: <span className="font-semibold">{formatPercent(reviewRatio)}</span></div>
                    <div>Tiến độ kế hoạch: <span className="font-semibold">{formatPercent(plannedProgress)}</span></div>
                    <div>Tiến độ thực tế: <span className="font-semibold">{formatPercent(actualProgress)}</span></div>
                    <div>Rủi ro chậm giáo trình: <span className="font-semibold">{formatScalar(classPacing?.curriculumDelayRisk)}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">Học viên cần hỗ trợ</div>
                  <div className="mt-3 space-y-2">
                    {weakStudentDetails.length ? weakStudentDetails.map((item, index) => (
                      <div key={`${item.studentId || index}`} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                        <div className="font-medium text-gray-900">{item.studentName || "Học viên"}</div>
                        <div className="text-gray-600">{item.reason || "Chưa có lý do chi tiết"}</div>
                      </div>
                    )) : <div className="text-sm text-gray-500">Hiện chưa có học viên cần hỗ trợ trong tổng quan này.</div>}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="Chưa có tổng quan lớp" description="Chọn lớp để tải tổng quan học thuật và cảnh báo rủi ro." />
            )}
          </SectionCard>
        ) : null}

        {canSeeBranchDashboard && dashboardFocus === "branch" ? (
          <SectionCard title="Tổng quan chi nhánh" subtitle="Dành cho quản lý và quản trị để theo dõi rủi ro lớp, gói sắp hết hạn và số ca đánh giá chưa đạt." icon={<Building2 size={18} />}>
            {selectedBranchId && branchDashboard ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Lớp đang hoạt động: <span className="font-semibold">{formatScalar(branchDashboard.totalActiveClasses)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Học viên đang hoạt động: <span className="font-semibold">{formatScalar(branchDashboard.totalActiveStudents)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Học viên có rủi ro: <span className="font-semibold">{formatScalar(branchDashboard.riskStudents)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Lớp có rủi ro: <span className="font-semibold">{formatScalar(branchDashboard.riskClasses)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Gói sắp hết hạn: <span className="font-semibold">{formatScalar(branchDashboard.packageExpiringCount)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Đánh giá chưa đạt: <span className="font-semibold">{formatScalar(branchDashboard.assessmentFailCount)}</span></div>
              </div>
            ) : (
              <EmptyState title="Chưa chọn chi nhánh" description="Chọn chi nhánh ở bộ lọc để hiển thị dashboard cấp quản lý." />
            )}
          </SectionCard>
        ) : null}
      </div>

      <div className="space-y-4">
        {canSeeBranchDashboard ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Layers3 size={16} />
              Tập trung xem dữ liệu
            </div>
            <div className="flex flex-wrap gap-2">
              {dashboardFocusOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDashboardFocus(option.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
                    dashboardFocus === option.id
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Tóm tắt nhanh</div>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between gap-2">
              <span>Tổng báo cáo</span>
              <span className="font-semibold">{reportCount}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Rủi ro mở</span>
              <span className="font-semibold">{openRiskAlertsCount}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Đề xuất chờ</span>
              <span className="font-semibold">{pendingRecommendationsCount}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Đề xuất CS</span>
              <span className="font-semibold">{csRecommendationsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

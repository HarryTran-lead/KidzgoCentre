"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileBarChart,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { fetchClassDetail, fetchTeacherClasses } from "@/app/api/teacher/classes";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import { getAllClasses, getClassStudents } from "@/lib/api/classService";
import { extractApiError } from "@/lib/api/extractApiError";
import {
  createReportPeriod,
  createReportTemplate,
  deleteReportPeriod,
  deleteReportTemplate,
  generateReport,
  getBranchDashboard,
  getClassAcademicDashboard,
  getClassRiskAlerts,
  getReportPeriods,
  getReportTemplates,
  getRiskRuleConfigs,
  getStudentReportById,
  getStudentRecommendations,
  getStudentReports,
  publishReportToParent,
  shareReport,
  updateReportPeriod,
  updateReportTemplate,
  updateRiskRuleConfig,
} from "@/lib/api/reportsV3Service";
import type {
  BranchDashboardResponse,
  ClassAcademicDashboardResponse,
  RecommendationDto,
  ReportPeriodDto,
  ReportPeriodType,
  ReportShareChannel,
  ReportTemplateDto,
  ReportTemplateType,
  ReportsV3GenerateType,
  ReportsV3Snapshot,
  RiskAlertDto,
  RiskRuleConfigDto,
  StudentReportDetailDto,
  StudentReportListItemDto,
} from "@/types/reports-v3";

type InternalRole = "teacher" | "management" | "admin";
type WorkspaceTab =
  | "dashboard"
  | "generate"
  | "reports"
  | "follow-up"
  | "periods"
  | "templates"
  | "risk-rules";

type Option = {
  id: string;
  label: string;
  meta?: string;
};

type PeriodDraft = {
  id?: string;
  code: string;
  name: string;
  type: ReportPeriodType;
  startDate: string;
  endDate: string;
};

type TemplateDraft = {
  id?: string;
  code: string;
  name: string;
  type: ReportTemplateType;
  contentSchema: string;
  isActive: boolean;
};

const REPORT_TYPE_LABELS: Record<ReportsV3GenerateType, string> = {
  parent: "Báo cáo phụ huynh",
  academic: "Báo cáo học thuật",
  internal: "Báo cáo nội bộ",
};

const PERIOD_TYPE_LABELS: Record<ReportPeriodType, string> = {
  weekly: "Theo tuần",
  monthly: "Theo tháng",
  module: "Theo mô-đun",
  custom: "Tùy chỉnh",
};

const TEMPLATE_TYPE_LABELS: Record<ReportTemplateType, string> = {
  parent: "Mẫu phụ huynh",
  academic: "Mẫu học thuật",
  class: "Mẫu lớp học",
  branch: "Mẫu chi nhánh",
  internal: "Mẫu nội bộ",
};

const SHARE_CHANNEL_LABELS: Record<ReportShareChannel, string> = {
  app: "Ứng dụng",
  email: "Email",
  zalo: "Zalo",
  sms: "SMS",
};

const RECOMMENDATION_ROLE_LABELS: Record<string, string> = {
  teacher: "Giáo viên",
  academic_manager: "Quản lý học thuật",
  cs: "Chăm sóc khách hàng",
  admin: "Quản trị viên",
};

const INSIGHT_TYPE_LABELS: Record<string, string> = {
  strength: "Điểm mạnh",
  weakness: "Điểm cần cải thiện",
  risk: "Rủi ro",
  recommendation: "Đề xuất",
  note: "Ghi chú",
};

const RISK_SEVERITY_LABELS: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const RISK_TYPE_LABELS: Record<string, string> = {
  low_attendance: "Điểm danh thấp",
  academic_fail: "Học thuật chưa đạt",
  package_expiring: "Gói học sắp hết hạn",
  class_curriculum_delay: "Chậm tiến độ giáo trình",
};

const PERIOD_TYPE_OPTIONS: ReportPeriodType[] = ["weekly", "monthly", "module", "custom"];
const TEMPLATE_TYPE_OPTIONS: ReportTemplateType[] = ["parent", "academic", "class", "branch", "internal"];
const DEFAULT_TEMPLATE_SCHEMA = JSON.stringify({ blocks: [] }, null, 2);
const DASHBOARD_FOCUS_OPTIONS = [
  { id: "class", label: "Theo lớp", icon: <BookOpen size={14} /> },
  { id: "branch", label: "Theo chi nhánh", icon: <Building2 size={14} /> },
] as const;

const ROLE_CONTENT: Record<InternalRole, { title: string; subtitle: string; checkList: string[] }> = {
  teacher: {
    title: "Theo dõi từng học viên và lớp học",
    subtitle: "Ưu tiên tạo báo cáo và xử lý theo dõi học thuật theo phạm vi lớp phụ trách.",
    checkList: [
      "Chọn đúng lớp và học viên trước khi tạo báo cáo.",
      "Theo dõi rủi ro và đề xuất cần xử lý theo từng học viên.",
      "Không công bố phụ huynh trực tiếp ở vai trò giáo viên.",
    ],
  },
  management: {
    title: "Giám sát học thuật theo lớp và chi nhánh",
    subtitle: "Tập trung vào dashboard tổng hợp, quản lý kỳ báo cáo và vận hành luồng công bố.",
    checkList: [
      "Theo dõi xu hướng rủi ro và học viên cần hỗ trợ.",
      "Quản lý kỳ báo cáo, rà soát template trước khi vận hành.",
      "Công bố báo cáo phụ huynh khi báo cáo đã hoàn thành.",
    ],
  },
  admin: {
    title: "Điều phối toàn cục và chuẩn hóa vận hành",
    subtitle: "Bao phủ toàn bộ không gian Reports V3: danh mục, template, luật rủi ro và công bố phụ huynh.",
    checkList: [
      "Kiểm soát cấu hình template và luật rủi ro.",
      "Theo dõi dữ liệu cấp chi nhánh để phát hiện bất thường sớm.",
      "Kiểm tra quyền công bố và nhật ký chia sẻ khi có sự cố.",
    ],
  },
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getErrMsg(error: unknown, fallback: string) {
  return extractApiError(error, fallback);
}

function normalizeText(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeStatusLabel(value?: string | null) {
  const key = normalizeText(value);
  if (!key) return "Không xác định";
  if (key === "completed") return "Hoàn thành";
  if (key === "processing") return "Đang xử lý";
  if (key === "pending") return "Chờ xử lý";
  if (key === "failed") return "Thất bại";
  if (key === "superseded") return "Đã thay thế";
  if (key === "open") return "Đang mở";
  if (key === "resolved") return "Đã xử lý";
  if (key === "ignored") return "Bỏ qua";
  if (key === "accepted") return "Đã nhận";
  if (key === "rejected") return "Từ chối";
  if (key === "done") return "Hoàn tất";
  if (key === "sent") return "Đã gửi";
  if (key === "viewed") return "Đã xem";
  return value ?? "Không xác định";
}

function statusTone(value?: string | null) {
  const key = normalizeText(value);
  if (["completed", "resolved", "accepted", "done", "sent", "viewed"].includes(key)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (["processing", "pending", "open", "superseded"].includes(key)) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (["failed", "rejected", "ignored"].includes(key)) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
}

function formatScalar(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

function prettifyCode(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "Không xác định";
  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatReportType(value?: string | null) {
  const key = normalizeText(value);
  return REPORT_TYPE_LABELS[key as ReportsV3GenerateType] || prettifyCode(value);
}

function formatPeriodType(value?: string | null) {
  const key = normalizeText(value);
  return PERIOD_TYPE_LABELS[key as ReportPeriodType] || prettifyCode(value);
}

function formatTemplateType(value?: string | null) {
  const key = normalizeText(value);
  return TEMPLATE_TYPE_LABELS[key as ReportTemplateType] || prettifyCode(value);
}

function formatShareChannel(value?: string | null) {
  const key = normalizeText(value);
  return SHARE_CHANNEL_LABELS[key as ReportShareChannel] || prettifyCode(value);
}

function formatRecommendationRole(value?: string | null) {
  const key = normalizeText(value);
  return RECOMMENDATION_ROLE_LABELS[key] || prettifyCode(value);
}

function formatRiskSeverity(value?: string | null) {
  const key = normalizeText(value);
  return RISK_SEVERITY_LABELS[key] || prettifyCode(value);
}

function formatInsightType(value?: string | null) {
  const key = normalizeText(value);
  return INSIGHT_TYPE_LABELS[key] || prettifyCode(value);
}

function formatRiskType(value?: string | null) {
  const key = normalizeText(value);
  return RISK_TYPE_LABELS[key] || prettifyCode(value);
}

function dedupeOptions(options: Option[]) {
  return Array.from(new Map(options.map((option) => [option.id, option])).values());
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function extractBranchOptions(payload: unknown): Option[] {
  const response = payload as
    | {
        data?: {
          branches?: Array<Record<string, unknown>>;
          items?: Array<Record<string, unknown>>;
        };
      }
    | undefined;

  const rows = Array.isArray(response?.data?.branches)
    ? response.data.branches
    : Array.isArray(response?.data?.items)
      ? response.data.items
      : [];

  return dedupeOptions(
    rows
      .map((item) => {
        const id = String(item.id ?? "").trim();
        if (!id) return null;
        const label = String(item.name ?? item.code ?? id).trim();
        const meta = String(item.code ?? "").trim();
        return { id, label, meta };
      })
      .filter(notNull),
  );
}

function extractClassOptions(payload: unknown): Option[] {
  const response = payload as
    | {
        data?: {
          classes?: { items?: Array<Record<string, unknown>> };
          items?: Array<Record<string, unknown>>;
        };
      }
    | Array<Record<string, unknown>>
    | undefined;

  const rows = Array.isArray(response)
    ? response
    : Array.isArray(response?.data?.classes?.items)
      ? response.data.classes.items
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : [];

  return dedupeOptions(
    rows
      .map((item) => {
        const id = String(item.id ?? item.classId ?? "").trim();
        if (!id) return null;
        const code = String(item.code ?? item.classCode ?? "").trim();
        const rawLabel = item.name ?? item.className ?? item.classTitle ?? item.title;
        const label = String((rawLabel ?? code) || id).trim();
        const metaParts = [code, String(item.branchName ?? "").trim()].filter(Boolean);
        return { id, label, meta: metaParts.join(" • ") };
      })
      .filter(notNull),
  );
}

function extractAdminStudents(payload: unknown): Option[] {
  const response = payload as
    | {
        data?: {
          students?: { items?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
          items?: Array<Record<string, unknown>>;
        };
      }
    | Array<Record<string, unknown>>
    | undefined;

  const rows = Array.isArray(response)
    ? response
    : Array.isArray(response?.data?.students)
      ? response.data.students
      : Array.isArray(response?.data?.students?.items)
        ? response.data.students.items
        : Array.isArray(response?.data?.items)
          ? response.data.items
          : [];

  return dedupeOptions(
    rows
      .map((item) => {
        const id = String(
          item.studentProfileId ?? item.studentId ?? item.profileId ?? item.id ?? "",
        ).trim();
        if (!id) return null;
        const label = String(
          item.studentName ?? item.fullName ?? item.displayName ?? item.name ?? id,
        ).trim();
        const meta = String(item.className ?? item.email ?? "").trim();
        return { id, label, meta };
      })
      .filter(notNull),
  );
}

function extractTeacherStudents(payload: Awaited<ReturnType<typeof fetchClassDetail>> | null): Option[] {
  if (!payload?.students?.length) return [];

  return dedupeOptions(
    payload.students.map((student) => ({
      id: String(student.id),
      label: student.name,
      meta: student.email || student.phone || "",
    })),
  );
}

function defaultPeriodDraft(): PeriodDraft {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return {
    code: "",
    name: "",
    type: "monthly",
    startDate: `${yyyy}-${mm}-01`,
    endDate: `${yyyy}-${mm}-${dd}`,
  };
}

function defaultTemplateDraft(): TemplateDraft {
  return {
    code: "",
    name: "",
    type: "parent",
    contentSchema: DEFAULT_TEMPLATE_SCHEMA,
    isActive: true,
  };
}

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
  icon: React.ReactNode;
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

function SectionCard({
  title,
  subtitle,
  icon,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-50 p-2 text-red-700">{icon}</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
      <div className="text-sm font-semibold text-gray-800">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{description}</div>
    </div>
  );
}

function SnapshotSummary({ snapshot }: { snapshot?: ReportsV3Snapshot | null }) {
  if (!snapshot) {
    return <EmptyState title="Chưa có snapshot" description="Báo cáo này chưa trả về snapshot chi tiết." />;
  }

  const attendance = snapshot.attendance_summary;
  const progress = snapshot.learning_progress;
  const assessment = snapshot.assessment_summary;
  const tickets = snapshot.ticket_summary;
  const evaluation = snapshot.teacher_evaluation;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Điểm danh</div>
        <div className="mt-2 text-sm text-gray-700">Tỷ lệ: <span className="font-semibold">{formatPercent(attendance?.attendance_rate)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Có mặt: {formatScalar(attendance?.present)} / {formatScalar(attendance?.total_sections)}</div>
        <div className="mt-1 text-sm text-gray-700">Vắng không báo: {formatScalar(attendance?.absent_without_notice)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tiến độ học tập</div>
        <div className="mt-2 text-sm text-gray-700">Mức hoàn thành: <span className="font-semibold">{formatPercent(progress?.completion_percent)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Bài học hiện tại: {formatScalar(progress?.current_lesson)}</div>
        <div className="mt-1 text-sm text-gray-700">Điều kiện lên lớp: {formatScalar(progress?.promotion_status)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đánh giá</div>
        <div className="mt-2 text-sm text-gray-700">Kết quả: <span className="font-semibold">{formatScalar(assessment?.latest_result)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Điểm gần nhất: {formatScalar(assessment?.latest_score)}</div>
        <div className="mt-1 text-sm text-gray-700">Nhận xét giáo viên: {formatScalar(assessment?.teacher_comment)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vé học</div>
        <div className="mt-2 text-sm text-gray-700">Đã cấp: {formatScalar(tickets?.granted)}</div>
        <div className="mt-1 text-sm text-gray-700">Đã dùng: {formatScalar(tickets?.consumed)}</div>
        <div className="mt-1 text-sm text-gray-700">Còn lại: <span className="font-semibold">{formatScalar(tickets?.remaining)}</span></div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đánh giá giáo viên</div>
        <div className="mt-2 text-sm text-gray-700">Nói: {formatScalar(evaluation?.speaking)}</div>
        <div className="mt-1 text-sm text-gray-700">Tự tin: {formatScalar(evaluation?.confidence)}</div>
        <div className="mt-1 text-sm text-gray-700">Tham gia: {formatScalar(evaluation?.participation)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thông điệp</div>
        <div className="mt-2 text-sm text-gray-700">Gửi phụ huynh: {formatScalar(snapshot.parent_message)}</div>
        <div className="mt-1 text-sm text-gray-700">Ghi chú nội bộ: {formatScalar(snapshot.internal_notes)}</div>
      </div>
    </div>
  );
}

export default function ReportsV3FunctionalWorkspace({ role }: { role: InternalRole }) {
  const canManageCatalog = role !== "teacher";
  const canEditTemplates = role === "admin";
  const canEditRiskRules = role === "admin";
  const canPublishToParent = role !== "teacher";
  const canSeeBranchDashboard = role !== "teacher";

  const tabs = useMemo(() => {
    const base: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
      { id: "dashboard", label: "Tổng quan", icon: <BarChart3 size={16} /> },
      { id: "generate", label: "Tạo báo cáo", icon: <Sparkles size={16} /> },
      { id: "reports", label: "Lịch sử", icon: <FileBarChart size={16} /> },
      { id: "follow-up", label: "Theo dõi", icon: <BellRing size={16} /> },
    ];

    if (canManageCatalog) {
      base.push({ id: "periods", label: "Kỳ báo cáo", icon: <CalendarClock size={16} /> });
      base.push({ id: "templates", label: "Mẫu báo cáo", icon: <FileText size={16} /> });
    }

    if (canEditRiskRules) {
      base.push({ id: "risk-rules", label: "Luật rủi ro", icon: <ShieldAlert size={16} /> });
    }

    return base;
  }, [canEditRiskRules, canManageCatalog]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("dashboard");
  const [branchOptions, setBranchOptions] = useState<Option[]>([]);
  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [studentOptions, setStudentOptions] = useState<Option[]>([]);
  const [periods, setPeriods] = useState<ReportPeriodDto[]>([]);
  const [templates, setTemplates] = useState<ReportTemplateDto[]>([]);
  const [riskRules, setRiskRules] = useState<RiskRuleConfigDto[]>([]);
  const [reports, setReports] = useState<StudentReportListItemDto[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlertDto[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationDto[]>([]);
  const [classDashboard, setClassDashboard] = useState<ClassAcademicDashboardResponse | null>(null);
  const [branchDashboard, setBranchDashboard] = useState<BranchDashboardResponse | null>(null);
  const [reportDetail, setReportDetail] = useState<StudentReportDetailDto | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [reportType, setReportType] = useState<ReportsV3GenerateType>("parent");
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("");
  const [shareRecipientName, setShareRecipientName] = useState("");
  const [shareRecipientContact, setShareRecipientContact] = useState("");
  const [shareChannel, setShareChannel] = useState<ReportShareChannel>("app");
  const [periodDraft, setPeriodDraft] = useState<PeriodDraft>(defaultPeriodDraft);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(defaultTemplateDraft);
  const [riskRuleDrafts, setRiskRuleDrafts] = useState<Record<string, { isActive: boolean; score: string; parametersJson: string }>>({});
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const [savingGenerate, setSavingGenerate] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [publishingParent, setPublishingParent] = useState(false);
  const [sharingReport, setSharingReport] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showScopeFilters, setShowScopeFilters] = useState(true);
  const [dashboardFocus, setDashboardFocus] = useState<"class" | "branch">("class");

  const loadPeriods = useCallback(async () => {
    const result = await getReportPeriods({ page: 1, pageSize: 100 });
    setPeriods(result.items);
    setSelectedPeriodId((current) => current || result.items[0]?.id || "");
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!canManageCatalog) {
      setTemplates([]);
      return;
    }
    const result = await getReportTemplates({ page: 1, pageSize: 100 });
    setTemplates(result.items);
  }, [canManageCatalog]);

  const loadRiskRules = useCallback(async () => {
    if (!canEditRiskRules) {
      setRiskRules([]);
      setRiskRuleDrafts({});
      return;
    }
    const items = await getRiskRuleConfigs();
    setRiskRules(items);
    setRiskRuleDrafts(
      Object.fromEntries(
        items.map((item) => [
          item.riskType,
          {
            isActive: item.isActive,
            score: String(item.score),
            parametersJson: item.parametersJson || "{}",
          },
        ]),
      ),
    );
  }, [canEditRiskRules]);

  const loadBranches = useCallback(async () => {
    if (!canSeeBranchDashboard) {
      setBranchOptions([]);
      return;
    }
    const response = await getAllBranchesPublic({ limit: 200, isActive: true });
    setBranchOptions(extractBranchOptions(response));
  }, [canSeeBranchDashboard]);

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      if (role === "teacher") {
        const result = await fetchTeacherClasses({ pageNumber: 1, pageSize: 200 });
        const options = dedupeOptions(
          result.classes.map((item) => ({
            id: item.id,
            label: item.name,
            meta: [item.code, item.teacher].filter(Boolean).join(" • "),
          })),
        );
        setClassOptions(options);
        setSelectedClassId((current) => (options.some((item) => item.id === current) ? current : options[0]?.id || ""));
        return;
      }

      const response = await getAllClasses({
        pageNumber: 1,
        pageSize: 200,
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      });
      const options = extractClassOptions(response);
      setClassOptions(options);
      setSelectedClassId((current) => (options.some((item) => item.id === current) ? current : options[0]?.id || ""));
    } finally {
      setLoadingClasses(false);
    }
  }, [role, selectedBranchId]);

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) {
      setStudentOptions([]);
      setSelectedStudentId("");
      return;
    }

    setLoadingStudents(true);
    try {
      const options = role === "teacher"
        ? extractTeacherStudents(await fetchClassDetail({ classId: selectedClassId, pageNumber: 1, pageSize: 200 }))
        : extractAdminStudents(await getClassStudents(selectedClassId, { pageNumber: 1, pageSize: 200 }));
      setStudentOptions(options);
      setSelectedStudentId((current) => (options.some((item) => item.id === current) ? current : options[0]?.id || ""));
    } finally {
      setLoadingStudents(false);
    }
  }, [role, selectedClassId]);

  const loadClassData = useCallback(async () => {
    if (!selectedClassId) {
      setClassDashboard(null);
      setRiskAlerts([]);
      return;
    }

    setLoadingFollowUp(true);
    try {
      const [dashboard, alerts] = await Promise.all([
        getClassAcademicDashboard(selectedClassId, selectedPeriodId ? { periodId: selectedPeriodId } : undefined),
        getClassRiskAlerts(selectedClassId, { page: 1, pageSize: 100 }),
      ]);
      setClassDashboard(dashboard);
      setRiskAlerts(alerts.items);
    } finally {
      setLoadingFollowUp(false);
    }
  }, [selectedClassId, selectedPeriodId]);

  const loadBranchData = useCallback(async () => {
    if (!canSeeBranchDashboard || !selectedBranchId) {
      setBranchDashboard(null);
      return;
    }

    const result = await getBranchDashboard(selectedBranchId);
    setBranchDashboard(result);
  }, [canSeeBranchDashboard, selectedBranchId]);

  const loadStudentData = useCallback(async () => {
    if (!selectedStudentId) {
      setReports([]);
      setRecommendations([]);
      setSelectedReportId("");
      return;
    }

    setLoadingReports(true);
    try {
      const [reportList, recommendationList] = await Promise.all([
        getStudentReports(selectedStudentId, { page: 1, pageSize: 100 }),
        getStudentRecommendations(selectedStudentId, { page: 1, pageSize: 100 }),
      ]);

      setReports(reportList.items);
      setRecommendations(recommendationList.items);
      setSelectedReportId((current) => (reportList.items.some((item) => item.id === current) ? current : reportList.items[0]?.id || ""));
    } finally {
      setLoadingReports(false);
    }
  }, [selectedStudentId]);

  const loadReportDetail = useCallback(async () => {
    if (!selectedReportId) {
      setReportDetail(null);
      return;
    }

    setLoadingDetail(true);
    try {
      const detail = await getStudentReportById(selectedReportId);
      setReportDetail(detail);
      setShareRecipientName((current) => current || `Phụ huynh của ${detail.studentName || "học viên"}`);
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedReportId]);

  useEffect(() => {
    let active = true;
    setLoadingBoot(true);
    setPageError(null);

    Promise.allSettled([loadPeriods(), loadTemplates(), loadRiskRules(), loadBranches()])
      .then((results) => {
        if (!active) return;
        const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;
        if (rejected) {
          setPageError(getErrMsg(rejected.reason, "Không thể tải dữ liệu Reports V3."));
        }
      })
      .finally(() => {
        if (active) setLoadingBoot(false);
      });

    return () => {
      active = false;
    };
  }, [loadBranches, loadPeriods, loadRiskRules, loadTemplates]);

  useEffect(() => {
    void loadClasses().catch((error) => {
      setPageError(getErrMsg(error, "Không thể tải danh sách lớp học."));
    });
  }, [loadClasses]);

  useEffect(() => {
    void loadStudents().catch((error) => {
      setPageError(getErrMsg(error, "Không thể tải danh sách học viên."));
    });
  }, [loadStudents]);

  useEffect(() => {
    void loadClassData().catch((error) => {
      setPageError(getErrMsg(error, "Không thể tải bảng tổng quan lớp học."));
    });
  }, [loadClassData]);

  useEffect(() => {
    void loadBranchData().catch((error) => {
      setPageError(getErrMsg(error, "Không thể tải bảng tổng quan chi nhánh."));
    });
  }, [loadBranchData]);

  useEffect(() => {
    void loadStudentData().catch((error) => {
      setPageError(getErrMsg(error, "Không thể tải danh sách báo cáo."));
    });
  }, [loadStudentData]);

  useEffect(() => {
    void loadReportDetail().catch((error) => {
      setPageError(getErrMsg(error, "Không thể tải chi tiết báo cáo."));
    });
  }, [loadReportDetail]);

  useEffect(() => {
    if (!canSeeBranchDashboard && dashboardFocus !== "class") {
      setDashboardFocus("class");
    }
  }, [canSeeBranchDashboard, dashboardFocus]);

  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchesSearch = !reportSearch.trim()
        || `${item.studentName || ""} ${item.className || ""} ${item.reportType || ""}`
          .toLowerCase()
          .includes(reportSearch.trim().toLowerCase());
      const matchesStatus = !reportStatusFilter || normalizeText(item.status) === normalizeText(reportStatusFilter);
      const matchesType = !reportTypeFilter || normalizeText(item.reportType) === normalizeText(reportTypeFilter);
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [reportSearch, reportStatusFilter, reportTypeFilter, reports]);

  const csRecommendations = useMemo(
    () => recommendations.filter((item) => normalizeText(item.assignedRole) === "cs"),
    [recommendations],
  );
  const pendingRecommendations = useMemo(
    () => recommendations.filter((item) => normalizeText(item.status) === "pending"),
    [recommendations],
  );
  const openRiskAlerts = useMemo(
    () => riskAlerts.filter((item) => normalizeText(item.status) === "open"),
    [riskAlerts],
  );

  const handleGenerate = async () => {
    if (!selectedStudentId || !selectedPeriodId) {
      toast.destructive({
        title: "Thiếu dữ liệu",
        description: "Cần chọn học viên và kỳ báo cáo trước khi tạo.",
      });
      return;
    }

    setSavingGenerate(true);
    try {
      const result = await generateReport({
        reportType,
        studentId: selectedStudentId,
        periodId: selectedPeriodId,
        classId: selectedClassId || undefined,
        branchId: selectedBranchId || undefined,
      });

      toast.success({
        title: "Tạo báo cáo thành công",
        description: `Đã tạo ${formatReportType(reportType)} cho ${studentOptions.find((item) => item.id === selectedStudentId)?.label || "học viên"}.`,
      });
      setActiveTab("reports");
      await loadStudentData();
      setSelectedReportId(result.studentReportId);
      await loadClassData();
    } catch (error) {
      toast.destructive({
        title: "Tạo báo cáo thất bại",
        description: getErrMsg(error, "Không thể tạo báo cáo."),
      });
    } finally {
      setSavingGenerate(false);
    }
  };

  const handlePublishToParent = async () => {
    if (!reportDetail?.id) return;
    setPublishingParent(true);
    try {
      await publishReportToParent(reportDetail.id);
      toast.success({ title: "Đã công bố", description: "Báo cáo phụ huynh đã được mở cho phụ huynh." });
      await loadStudentData();
      await loadReportDetail();
    } catch (error) {
      toast.destructive({ title: "Công bố thất bại", description: getErrMsg(error, "Không thể công bố cho phụ huynh.") });
    } finally {
      setPublishingParent(false);
    }
  };

  const handleShare = async () => {
    if (!reportDetail?.id) return;
    if (!shareRecipientName.trim() || !shareRecipientContact.trim()) {
      toast.destructive({ title: "Thiếu dữ liệu", description: "Cần nhập tên và thông tin liên hệ người nhận." });
      return;
    }

    setSharingReport(true);
    try {
      await shareReport(reportDetail.id, {
        channel: shareChannel,
        recipientName: shareRecipientName.trim(),
        recipientContact: shareRecipientContact.trim(),
      });
      toast.success({ title: "Đã ghi nhận chia sẻ", description: "Nhật ký chia sẻ đã được tạo." });
      await loadReportDetail();
    } catch (error) {
      toast.destructive({ title: "Chia sẻ thất bại", description: getErrMsg(error, "Không thể chia sẻ báo cáo.") });
    } finally {
      setSharingReport(false);
    }
  };

  const handleSavePeriod = async () => {
    if (!periodDraft.code.trim() || !periodDraft.name.trim() || !periodDraft.startDate || !periodDraft.endDate) {
      toast.destructive({ title: "Thiếu dữ liệu", description: "Kỳ báo cáo cần mã, tên, ngày bắt đầu và ngày kết thúc." });
      return;
    }

    setSavingPeriod(true);
    try {
      const payload = {
        code: periodDraft.code.trim(),
        name: periodDraft.name.trim(),
        type: periodDraft.type,
        startDate: periodDraft.startDate,
        endDate: periodDraft.endDate,
      };

      if (periodDraft.id) {
        await updateReportPeriod(periodDraft.id, payload);
      } else {
        await createReportPeriod(payload);
      }

      toast.success({ title: "Đã lưu kỳ báo cáo", description: "Danh mục kỳ báo cáo đã được cập nhật." });
      setPeriodDraft(defaultPeriodDraft());
      await loadPeriods();
    } catch (error) {
      toast.destructive({ title: "Lưu kỳ báo cáo thất bại", description: getErrMsg(error, "Không thể lưu kỳ báo cáo.") });
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!window.confirm("Xóa kỳ báo cáo này?")) return;
    try {
      await deleteReportPeriod(periodId);
      toast.success({ title: "Đã xóa kỳ báo cáo", description: "Kỳ báo cáo đã được xóa." });
      if (periodDraft.id === periodId) {
        setPeriodDraft(defaultPeriodDraft());
      }
      await loadPeriods();
    } catch (error) {
      toast.destructive({ title: "Xóa kỳ báo cáo thất bại", description: getErrMsg(error, "Không thể xóa kỳ báo cáo.") });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateDraft.code.trim() || !templateDraft.name.trim()) {
      toast.destructive({ title: "Thiếu dữ liệu", description: "Mẫu báo cáo cần mã và tên." });
      return;
    }

    if (templateDraft.contentSchema.trim()) {
      try {
        const parsed = JSON.parse(templateDraft.contentSchema);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Schema nội dung phải là đối tượng JSON.");
        }
      } catch (error) {
        toast.destructive({
          title: "Schema không hợp lệ",
          description: getErrMsg(error, "Schema nội dung phải là đối tượng JSON hợp lệ."),
        });
        return;
      }
    }

    setSavingTemplate(true);
    try {
      const payload = {
        code: templateDraft.code.trim(),
        name: templateDraft.name.trim(),
        type: templateDraft.type,
        contentSchema: templateDraft.contentSchema.trim() || null,
        isActive: templateDraft.isActive,
      };

      if (templateDraft.id) {
        await updateReportTemplate(templateDraft.id, payload);
      } else {
        await createReportTemplate(payload);
      }

      toast.success({ title: "Đã lưu mẫu báo cáo", description: "Mẫu báo cáo đã được cập nhật." });
      setTemplateDraft(defaultTemplateDraft());
      await loadTemplates();
    } catch (error) {
      toast.destructive({ title: "Lưu mẫu báo cáo thất bại", description: getErrMsg(error, "Không thể lưu mẫu báo cáo.") });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm("Xóa mẫu báo cáo này?")) return;
    try {
      await deleteReportTemplate(templateId);
      toast.success({ title: "Đã xóa mẫu báo cáo", description: "Mẫu báo cáo đã được xóa." });
      if (templateDraft.id === templateId) {
        setTemplateDraft(defaultTemplateDraft());
      }
      await loadTemplates();
    } catch (error) {
      toast.destructive({ title: "Xóa mẫu báo cáo thất bại", description: getErrMsg(error, "Không thể xóa mẫu báo cáo.") });
    }
  };

  const handleSaveRiskRule = async (riskType: string) => {
    const draft = riskRuleDrafts[riskType];
    if (!draft) return;

    if (!draft.parametersJson.trim()) {
      toast.destructive({ title: "Thiếu dữ liệu", description: "Thông số JSON không được để trống." });
      return;
    }

    try {
      const parsed = JSON.parse(draft.parametersJson);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Thông số JSON phải là đối tượng JSON.");
      }
    } catch (error) {
      toast.destructive({ title: "JSON không hợp lệ", description: getErrMsg(error, "Thông số JSON phải là đối tượng JSON hợp lệ.") });
      return;
    }

    try {
      await updateRiskRuleConfig(riskType, {
        isActive: draft.isActive,
        score: Number(draft.score || 0),
        parametersJson: draft.parametersJson,
      });
      toast.success({ title: "Đã lưu luật", description: `Luật rủi ro ${formatRiskType(riskType)} đã được cập nhật.` });
      await loadRiskRules();
    } catch (error) {
      toast.destructive({ title: "Lưu luật rủi ro thất bại", description: getErrMsg(error, "Không thể lưu luật rủi ro.") });
    }
  };

  const roleLabel = role === "teacher" ? "Giáo viên" : role === "management" ? "Quản lý học thuật" : "Quản trị viên";
  const reportCount = reports.length;
  const roleContent = ROLE_CONTENT[role];
  const scopeLabel = {
    branch: branchOptions.find((item) => item.id === selectedBranchId)?.label || (canSeeBranchDashboard ? "Tất cả chi nhánh / chưa chọn" : "Theo quyền hiện tại"),
    className: classOptions.find((item) => item.id === selectedClassId)?.label || "Chưa chọn lớp",
    student: studentOptions.find((item) => item.id === selectedStudentId)?.label || "Chưa chọn học viên",
    period: periods.find((item) => item.id === selectedPeriodId)?.name || "Chưa chọn kỳ báo cáo",
  };

  return (
    <div className="space-y-6 bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Không gian Báo cáo V3</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-600">
                Snapshot bất biến theo từng kỳ giúp tách rõ vận hành báo cáo mới và giảm xung đột với báo cáo cũ.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              Phạm vi: {roleLabel}
            </span>
            <button
              type="button"
              onClick={() => setShowScopeFilters((current) => !current)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <SlidersHorizontal size={14} />
              Bộ lọc phạm vi
              {showScopeFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div>
            <div className="text-sm font-semibold text-slate-900">{roleContent.title}</div>
            <div className="mt-1 text-sm text-slate-600">{roleContent.subtitle}</div>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {roleContent.checkList.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {showScopeFilters ? (
          <div className={cn("mt-4 grid gap-3 md:grid-cols-2", canSeeBranchDashboard ? "xl:grid-cols-4" : "xl:grid-cols-3")}>
            {canSeeBranchDashboard ? (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Chi nhánh</label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700">
                    <SelectValue placeholder="Tất cả chi nhánh / chưa chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả chi nhánh / chưa chọn</SelectItem>
                    {branchOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Lớp học</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700">
                  <SelectValue placeholder={loadingClasses ? "Đang tải lớp..." : "Chọn lớp"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{loadingClasses ? "Đang tải lớp..." : "Chọn lớp"}</SelectItem>
                  {classOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Học viên</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700">
                  <SelectValue placeholder={loadingStudents ? "Đang tải học viên..." : "Chọn học viên"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{loadingStudents ? "Đang tải học viên..." : "Chọn học viên"}</SelectItem>
                  {studentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Kỳ báo cáo</label>
              <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700">
                  <SelectValue placeholder="Chọn kỳ báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Chọn kỳ báo cáo</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className={cn("grid gap-2 text-sm text-slate-700", canSeeBranchDashboard ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
              {canSeeBranchDashboard ? (
                <div><span className="text-slate-500">Chi nhánh:</span> <span className="font-medium">{scopeLabel.branch}</span></div>
              ) : null}
              <div><span className="text-slate-500">Lớp:</span> <span className="font-medium">{scopeLabel.className}</span></div>
              <div><span className="text-slate-500">Học viên:</span> <span className="font-medium">{scopeLabel.student}</span></div>
              <div><span className="text-slate-500">Kỳ báo cáo:</span> <span className="font-medium">{scopeLabel.period}</span></div>
            </div>
          </div>
        )}

        {pageError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-red-700 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                : "border-transparent bg-white text-gray-700 hover:border-red-100 hover:bg-red-50",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loadingBoot ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2 size={18} className="animate-spin" />
            Đang tải không gian Báo cáo V3...
          </div>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Báo cáo" value={String(reportCount)} hint="Lịch sử của học viên đang chọn" tone="red" icon={<FileBarChart size={18} />} />
            <StatCard title="Rủi ro đang mở" value={String(openRiskAlerts.length)} hint="Cảnh báo rủi ro ở lớp đang chọn" tone="amber" icon={<AlertTriangle size={18} />} />
            <StatCard title="Đề xuất chờ xử lý" value={String(pendingRecommendations.length)} hint="Đề xuất đang chờ xử lý" tone="blue" icon={<ClipboardList size={18} />} />
            <StatCard title="Theo dõi CS" value={String(csRecommendations.length)} hint="Đề xuất giao cho CS" tone="green" icon={<Send size={18} />} />
          </div>

          {canSeeBranchDashboard ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Layers3 size={16} />
                Tập trung xem dữ liệu
              </div>
              <div className="flex flex-wrap gap-2">
                {DASHBOARD_FOCUS_OPTIONS.map((option) => (
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

          {dashboardFocus === "class" || !canSeeBranchDashboard ? (
            <SectionCard title="Tổng quan học thuật lớp" subtitle="Đọc dữ liệu lớp đã chọn để xem tiến độ, rủi ro và nhu cầu hỗ trợ." icon={<BookOpen size={18} />}>
              {selectedClassId && classDashboard ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">{classDashboard.className || "Lớp học"}</div>
                    <div className="mt-3 grid gap-2 text-sm text-gray-700">
                      <div>Tổng học viên: <span className="font-semibold">{formatScalar(classDashboard.totalStudents)}</span></div>
                      <div>Học viên có rủi ro: <span className="font-semibold">{formatScalar(classDashboard.riskStudents)}</span></div>
                      <div>Đánh giá chưa đạt: <span className="font-semibold">{formatScalar(classDashboard.failedAssessments)}</span></div>
                      <div>Cần hỗ trợ bổ sung: <span className="font-semibold">{formatScalar(classDashboard.remedialRequired)}</span></div>
                      <div>Tỷ lệ ôn tập: <span className="font-semibold">{formatPercent(classDashboard.classPacing?.reviewRatio)}</span></div>
                      <div>Rủi ro chậm giáo trình: <span className="font-semibold">{formatScalar(classDashboard.classPacing?.curriculumDelayRisk)}</span></div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">Học viên cần hỗ trợ</div>
                    <div className="mt-3 space-y-2">
                      {classDashboard.weakStudents?.length ? classDashboard.weakStudents.map((item, index) => (
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
      ) : null}

      {!loadingBoot && activeTab === "generate" ? (
        <div className="space-y-6">
          <SectionCard title="Tạo báo cáo học viên" subtitle="Tạo snapshot bất biến theo học viên + kỳ + loại báo cáo, không chạm dữ liệu điểm danh/vé học/tiến độ cũ." icon={<Sparkles size={18} />}>
            <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Loại báo cáo</label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReportType(key as ReportsV3GenerateType)}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          reportType === key
                            ? "border-red-500 bg-white shadow-sm"
                            : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/30",
                        )}
                      >
                        <div className="text-sm font-semibold text-gray-900">{label}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {key === "parent" ? "Ngôn ngữ thân thiện cho phụ huynh" : key === "academic" ? "Hiển thị rủi ro, điểm số, điểm yếu cho học thuật" : "Chỉ dùng nội bộ, không công bố phụ huynh"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-red-200 bg-white px-4 py-4 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900">Ngữ cảnh hiện tại</div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>Chi nhánh: <span className="font-medium">{branchOptions.find((item) => item.id === selectedBranchId)?.label || "—"}</span></div>
                    <div>Lớp học: <span className="font-medium">{classOptions.find((item) => item.id === selectedClassId)?.label || "—"}</span></div>
                    <div>Học viên: <span className="font-medium">{studentOptions.find((item) => item.id === selectedStudentId)?.label || "—"}</span></div>
                    <div>Kỳ báo cáo: <span className="font-medium">{periods.find((item) => item.id === selectedPeriodId)?.name || "—"}</span></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-red-50 p-2 text-red-700"><FileText size={18} /></div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Checklist trước khi tạo</div>
                    <div className="mt-1 text-sm text-gray-500">Kiểm tra lớp/học viên/kỳ trước khi chạy để tránh sai phạm vi.</div>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li>Một báo cáo học viên dùng chung snapshot cho bản phụ huynh/học thuật/nội bộ.</li>
                  <li>Báo cáo cũ không thay đổi khi dữ liệu vận hành thay đổi về sau.</li>
                  <li>Công bố cho phụ huynh là bước riêng, không tự động chạy sau khi tạo báo cáo.</li>
                </ul>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={savingGenerate || !selectedStudentId || !selectedPeriodId}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingGenerate ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Tạo báo cáo
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "reports" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
          <SectionCard title="Lịch sử báo cáo" subtitle="Lịch sử của học viên đang chọn, tách riêng khỏi báo cáo tháng/buổi cũ." icon={<FileBarChart size={18} />}>
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder="Tìm theo tên, lớp, loại báo cáo"
                  className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                />
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
                    <SelectValue placeholder="Tất cả loại báo cáo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả loại báo cáo</SelectItem>
                    <SelectItem value="parent">{formatReportType("parent")}</SelectItem>
                    <SelectItem value="academic">{formatReportType("academic")}</SelectItem>
                    <SelectItem value="internal">{formatReportType("internal")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                  <SelectTrigger className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả trạng thái</SelectItem>
                    <SelectItem value="completed">{normalizeStatusLabel("completed")}</SelectItem>
                    <SelectItem value="processing">{normalizeStatusLabel("processing")}</SelectItem>
                    <SelectItem value="pending">{normalizeStatusLabel("pending")}</SelectItem>
                    <SelectItem value="failed">{normalizeStatusLabel("failed")}</SelectItem>
                    <SelectItem value="superseded">{normalizeStatusLabel("superseded")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loadingReports ? (
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải lịch sử báo cáo...
                </div>
              ) : filteredReports.length ? (
                <div className="space-y-2">
                  {filteredReports.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedReportId(item.id)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        selectedReportId === item.id
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white hover:bg-gray-50",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">{item.studentName || "Báo cáo học viên"}</div>
                          <div className="mt-1 text-sm text-gray-500">{item.className || "Chưa có lớp"} • {formatReportType(item.reportType)}</div>
                        </div>
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>
                          {normalizeStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Ngày tạo: {formatDateTime(item.createdAt)}</span>
                        <span>Đã công bố phụ huynh: {item.isParentPublished ? "Có" : "Không"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="Chưa có lịch sử báo cáo" description="Tạo báo cáo đầu tiên hoặc chọn học viên khác để xem lịch sử." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Chi tiết báo cáo"
            subtitle="Snapshot bất biến, insight, rủi ro, đề xuất và nhật ký chia sẻ đều đọc từ chi tiết báo cáo V3."
            icon={<FileText size={18} />}
            action={
              <button
                type="button"
                onClick={() => {
                  void Promise.allSettled([loadStudentData(), loadReportDetail(), loadClassData(), loadBranchData()]);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={14} /> Làm mới
              </button>
            }
          >
            {loadingDetail ? (
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" /> Đang tải chi tiết báo cáo...
              </div>
            ) : reportDetail ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{reportDetail.studentName || "Báo cáo học viên"}</div>
                    <div className="mt-1 text-sm text-gray-500">{reportDetail.className || "Chưa có lớp"} • {formatReportType(reportDetail.reportType)}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(reportDetail.status))}>
                      {normalizeStatusLabel(reportDetail.status)}
                    </span>
                    {reportDetail.isParentPublished ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đã công bố phụ huynh</span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kỳ báo cáo</div>
                    <div className="mt-2 text-sm text-gray-700">{reportDetail.reportPeriodName || "—"}</div>
                    <div className="mt-1 text-xs text-gray-500">{formatDate(reportDetail.reportPeriodFrom)} - {formatDate(reportDetail.reportPeriodTo)}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thời gian tạo</div>
                    <div className="mt-2 text-sm text-gray-700">{formatDateTime(reportDetail.createdAt)}</div>
                    <div className="mt-1 text-xs text-gray-500">Công bố phụ huynh lúc: {formatDateTime(reportDetail.parentPublishedAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tóm tắt</div>
                    <div className="mt-2 text-sm text-gray-700">{reportDetail.summaryText || "Chưa có phần tóm tắt."}</div>
                  </div>
                </div>

                <SnapshotSummary snapshot={reportDetail.snapshot} />

                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Nhận định</div>
                    <div className="mt-3 space-y-2">
                      {reportDetail.insights?.length ? reportDetail.insights.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">{formatInsightType(item.insightType)}</div>
                          <div className="mt-1">{item.content}</div>
                        </div>
                      )) : <div className="text-sm text-gray-500">Chưa có nhận định.</div>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Rủi ro</div>
                    <div className="mt-3 space-y-2">
                      {reportDetail.risks?.length ? reportDetail.risks.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-gray-900">{formatRiskType(item.riskType)}</div>
                            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(item.severity))}>{formatRiskSeverity(item.severity)}</span>
                          </div>
                          <div className="mt-1">{item.reason}</div>
                        </div>
                      )) : <div className="text-sm text-gray-500">Chưa có cảnh báo rủi ro trong chi tiết.</div>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Đề xuất</div>
                    <div className="mt-3 space-y-2">
                      {reportDetail.recommendations?.length ? reportDetail.recommendations.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">{formatRecommendationRole(item.assignedRole)}</div>
                          <div className="mt-1">{item.content}</div>
                        </div>
                      )) : <div className="text-sm text-gray-500">Chưa có đề xuất trong chi tiết.</div>}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Công bố và chia sẻ</div>
                      <div className="text-sm text-gray-500">Chỉ được công bố khi báo cáo phụ huynh ở trạng thái hoàn thành. Chia sẻ chỉ tạo nhật ký, không tạo lại báo cáo.</div>
                    </div>
                    {canPublishToParent && normalizeText(reportDetail.reportType) === "parent" && normalizeText(reportDetail.status) === "completed" && !reportDetail.isParentPublished ? (
                      <button
                        type="button"
                        onClick={handlePublishToParent}
                        disabled={publishingParent}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {publishingParent ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Công bố cho phụ huynh
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={shareRecipientName}
                      onChange={(event) => setShareRecipientName(event.target.value)}
                      placeholder="Tên người nhận"
                      className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                    />
                    <input
                      value={shareRecipientContact}
                      onChange={(event) => setShareRecipientContact(event.target.value)}
                      placeholder="Thông tin liên hệ người nhận"
                      className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                    />
                    <Select value={shareChannel} onValueChange={(value) => setShareChannel(value as ReportShareChannel)}>
                      <SelectTrigger className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
                        <SelectValue placeholder="Kênh chia sẻ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="app">{formatShareChannel("app")}</SelectItem>
                        <SelectItem value="email">{formatShareChannel("email")}</SelectItem>
                        <SelectItem value="zalo">{formatShareChannel("zalo")}</SelectItem>
                        <SelectItem value="sms">{formatShareChannel("sms")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharingReport || normalizeText(reportDetail.reportType) !== "parent"}
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sharingReport ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Tạo nhật ký chia sẻ
                  </button>

                  <div className="mt-4 space-y-2">
                    {reportDetail.shareLogs?.length ? reportDetail.shareLogs.map((item) => (
                      <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium text-gray-900">{item.recipientName} • {formatShareChannel(item.channel)}</div>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Gửi lúc {formatDateTime(item.sentAt)} • Xem lúc {formatDateTime(item.viewedAt)}</div>
                      </div>
                    )) : <div className="text-sm text-gray-500">Chưa có nhật ký chia sẻ.</div>}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-slate-950 p-4 text-xs text-slate-100">
                  <div className="mb-2 font-semibold text-white">Dữ liệu snapshot (JSON)</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(reportDetail.snapshot ?? {}, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <EmptyState title="Chưa chọn báo cáo" description="Chọn một báo cáo ở cột trái để xem snapshot, rủi ro và đề xuất." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "follow-up" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Cảnh báo rủi ro" subtitle="Đọc rủi ro từ tổng quan lớp và chi tiết báo cáo, không cập nhật dữ liệu gốc." icon={<AlertTriangle size={18} />}>
            {loadingFollowUp ? (
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" /> Đang tải cảnh báo rủi ro...
              </div>
            ) : riskAlerts.length ? (
              <div className="space-y-2">
                {riskAlerts.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{item.studentName || formatRiskType(item.riskType)}</div>
                        <div className="mt-1 text-sm text-gray-600">{item.reason}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.severity))}>{formatRiskSeverity(item.severity)}</span>
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có cảnh báo rủi ro" description="Chọn lớp có dữ liệu rủi ro hoặc tạo báo cáo để làm giàu dữ liệu theo dõi." />
            )}
          </SectionCard>

          <SectionCard title="Đề xuất hành động" subtitle="Danh sách hành động theo vai trò giáo viên / quản lý học thuật / CS / quản trị." icon={<BellRing size={18} />}>
            {recommendations.length ? (
              <div className="space-y-2">
                {recommendations.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{item.studentName || "Đề xuất"}</div>
                        <div className="mt-1 text-sm text-gray-600">{item.content}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{formatRecommendationRole(item.assignedRole)}</span>
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có đề xuất" description="Chọn học viên và tạo báo cáo để lấy danh sách hành động theo vai trò." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "periods" && canManageCatalog ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
          <SectionCard title="Danh mục kỳ báo cáo" subtitle="Theo tuần, tháng, mô-đun hoặc tùy chỉnh. Tạo báo cáo sẽ dùng mốc ngày của kỳ." icon={<CalendarClock size={18} />}>
            {periods.length ? (
              <div className="space-y-2">
                {periods.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="mt-1 text-sm text-gray-500">{item.code} • {formatPeriodType(item.type)} • {formatDate(item.startDate)} - {formatDate(item.endDate)}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPeriodDraft({
                            id: item.id,
                            code: item.code,
                            name: item.name,
                            type: item.type as ReportPeriodType,
                            startDate: item.startDate?.slice(0, 10) || "",
                            endDate: item.endDate?.slice(0, 10) || "",
                          })}
                          className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Chỉnh sửa
                        </button>
                        {role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => void handleDeletePeriod(item.id)}
                            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Xóa
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có kỳ báo cáo" description="Tạo kỳ báo cáo đầu tiên để chạy tạo báo cáo theo mốc thời gian rõ ràng." />
            )}
          </SectionCard>

          <SectionCard title={periodDraft.id ? "Chỉnh sửa kỳ báo cáo" : "Tạo kỳ báo cáo"} subtitle="Quản lý có thể tạo/cập nhật kỳ báo cáo. Quyền xóa chỉ mở cho quản trị viên." icon={<FileText size={18} />}>
            <div className="space-y-3">
              <input value={periodDraft.code} onChange={(event) => setPeriodDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Mã kỳ báo cáo" className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
              <input value={periodDraft.name} onChange={(event) => setPeriodDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Tên kỳ báo cáo" className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
              <Select value={periodDraft.type} onValueChange={(value) => setPeriodDraft((current) => ({ ...current, type: value as ReportPeriodType }))}>
                <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700">
                  <SelectValue placeholder="Loại kỳ báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_TYPE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{formatPeriodType(item)}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={periodDraft.startDate} onChange={(event) => setPeriodDraft((current) => ({ ...current, startDate: event.target.value }))} className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
                <input type="date" value={periodDraft.endDate} onChange={(event) => setPeriodDraft((current) => ({ ...current, endDate: event.target.value }))} className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleSavePeriod} disabled={savingPeriod} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {savingPeriod ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Lưu kỳ báo cáo
                </button>
                <button type="button" onClick={() => setPeriodDraft(defaultPeriodDraft())} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Đặt lại</button>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "templates" && canManageCatalog ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <SectionCard title="Danh mục mẫu báo cáo" subtitle="Mẫu phụ huynh/học thuật/nội bộ phục vụ render báo cáo. Mẫu lớp/chi nhánh dùng cho quản trị." icon={<FileText size={18} />}>
            {templates.length ? (
              <div className="space-y-2">
                {templates.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="mt-1 text-sm text-gray-500">{item.code} • {formatTemplateType(item.type)} • {item.isActive ? "Đang dùng" : "Ngừng dùng"}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTemplateDraft({
                            id: item.id,
                            code: item.code,
                            name: item.name,
                            type: item.type as ReportTemplateType,
                            contentSchema: item.contentSchema || DEFAULT_TEMPLATE_SCHEMA,
                            isActive: item.isActive,
                          })}
                          className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Xem
                        </button>
                        {canEditTemplates ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteTemplate(item.id)}
                            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Xóa
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có mẫu báo cáo" description="Nếu backend không có mẫu đúng loại đang hoạt động, hệ thống có thể tự tạo mẫu mặc định khi tạo báo cáo." />
            )}
          </SectionCard>

          <SectionCard title={canEditTemplates ? (templateDraft.id ? "Chỉnh sửa mẫu báo cáo" : "Tạo mẫu báo cáo") : "Chi tiết mẫu báo cáo"} subtitle={canEditTemplates ? "Chỉ quản trị viên được tạo/sửa/xóa mẫu báo cáo. Quản lý ở chế độ chỉ đọc." : "Chế độ chỉ đọc cho quản lý để rà soát schema nội dung."} icon={<Sparkles size={18} />}>
            <div className="space-y-3">
              <input value={templateDraft.code} onChange={(event) => setTemplateDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Mã mẫu báo cáo" disabled={!canEditTemplates} className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300" />
              <input value={templateDraft.name} onChange={(event) => setTemplateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Tên mẫu báo cáo" disabled={!canEditTemplates} className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300" />
              <Select value={templateDraft.type} onValueChange={(value) => setTemplateDraft((current) => ({ ...current, type: value as ReportTemplateType }))} disabled={!canEditTemplates}>
                <SelectTrigger className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 disabled:bg-gray-50">
                  <SelectValue placeholder="Loại mẫu báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{formatTemplateType(item)}</SelectItem>)}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                <input type="checkbox" checked={templateDraft.isActive} onChange={(event) => setTemplateDraft((current) => ({ ...current, isActive: event.target.checked }))} disabled={!canEditTemplates} />
                Kích hoạt mẫu báo cáo
              </label>
              <textarea value={templateDraft.contentSchema} onChange={(event) => setTemplateDraft((current) => ({ ...current, contentSchema: event.target.value }))} disabled={!canEditTemplates} rows={16} className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300" />
              {canEditTemplates ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Lưu mẫu báo cáo
                  </button>
                  <button type="button" onClick={() => setTemplateDraft(defaultTemplateDraft())} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Đặt lại</button>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "risk-rules" && canEditRiskRules ? (
        <SectionCard title="Cấu hình luật rủi ro" subtitle="Bộ luật MVP cho các nhóm low_attendance, academic_fail, package_expiring, class_curriculum_delay..." icon={<ShieldAlert size={18} />}>
          {riskRules.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {riskRules.map((item) => {
                const draft = riskRuleDrafts[item.riskType] ?? {
                  isActive: item.isActive,
                  score: String(item.score),
                  parametersJson: item.parametersJson || "{}",
                };

                return (
                  <div key={item.riskType} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{formatRiskType(item.riskType)}</div>
                        <div className="mt-1 text-sm text-gray-500">Điểm hệ thống: {item.score}</div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(event) => setRiskRuleDrafts((current) => ({
                            ...current,
                            [item.riskType]: { ...draft, isActive: event.target.checked },
                          }))}
                        />
                        Đang kích hoạt
                      </label>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input value={draft.score} onChange={(event) => setRiskRuleDrafts((current) => ({ ...current, [item.riskType]: { ...draft, score: event.target.value } }))} placeholder="Điểm 0..100" className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
                      <textarea value={draft.parametersJson} onChange={(event) => setRiskRuleDrafts((current) => ({ ...current, [item.riskType]: { ...draft, parametersJson: event.target.value } }))} rows={8} className="rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-700 outline-none focus:border-red-300" />
                      <button type="button" onClick={() => void handleSaveRiskRule(item.riskType)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white">
                        <CheckCircle2 size={14} /> Lưu luật
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Chưa có luật rủi ro" description="Backend chưa trả về cấu hình luật rủi ro nào cho Báo cáo V3." />
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}

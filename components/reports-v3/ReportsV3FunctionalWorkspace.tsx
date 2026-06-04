"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BellRing,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  FileText,
  GraduationCap,
  Loader2,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import ConfirmModal from "@/components/ConfirmModal";
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
  RiskAlertDto,
  RiskRuleConfigDto,
  StudentReportDetailDto,
  StudentReportListItemDto,
} from "@/types/reports-v3";
import DashboardTab from "@/components/reports-v3/tabs/DashboardTab";
import FollowUpTab from "@/components/reports-v3/tabs/FollowUpTab";
import GenerateReportModal from "@/components/reports-v3/tabs/GenerateReportModal";
import PeriodsTab from "@/components/reports-v3/tabs/PeriodsTab";
import ReportsTab from "@/components/reports-v3/tabs/ReportsTab";
import RiskRulesTab from "@/components/reports-v3/tabs/RiskRulesTab";
import TemplatesTab from "@/components/reports-v3/tabs/TemplatesTab";
import { cn } from "@/components/reports-v3/tabs/shared";
import type { DashboardFocusOption, Option, PeriodDraft, TemplateDraft } from "@/components/reports-v3/tabs/types";

type InternalRole = "teacher" | "management" | "admin";
type WorkspaceTab =
  | "dashboard"
  | "reports"
  | "follow-up"
  | "periods"
  | "templates"
  | "risk-rules";

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
  "1": "Giáo viên",
  "2": "Quản lý học thuật",
  "3": "Chăm sóc khách hàng",
  "4": "Quản trị viên",
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
  attendance_discipline: "Kỷ luật điểm danh",
  learning_delay: "Chậm tiến độ học tập",
  weak_communication: "Giao tiếp yếu",
  high_review_ratio: "Tỷ lệ ôn tập cao",
};

const PERIOD_TYPE_OPTIONS: ReportPeriodType[] = ["weekly", "monthly", "module", "custom"];
const TEMPLATE_TYPE_OPTIONS: ReportTemplateType[] = ["parent", "academic", "class", "branch", "internal"];
const DEFAULT_TEMPLATE_CONTENT_SCHEMA = {
  strengths: {
    good_attendance: "Điểm danh ổn định và đều đặn.",
    strong_progress: "Tiến độ học tốt trong mô-đun hiện tại.",
    confident_speaking: "Tích cực phát biểu và giao tiếp tự tin.",
  },
  weaknesses: {
    learning_delay: "Tiến độ học tập đang chậm hơn kế hoạch mô-đun.",
    assessment_fail: "Kết quả đánh giá gần nhất cần được kèm bổ sung.",
    weak_communication: "Mức tự tin khi giao tiếp cần được hỗ trợ thêm.",
  },
  risk_reasons: {
    AcademicFail: "Kết quả đánh giá gần nhất là KHÔNG ĐẠT.",
    LearningDelay: "Mức hoàn thành ({completionPercent}%) thấp hơn kỳ vọng ({expectedCompletionPercent}%) với biên độ {delayBufferPercent}%.",
    LowAttendance: "Tỷ lệ điểm danh ({attendanceRate}%) thấp hơn ngưỡng {attendanceRateBelow}%.",
    HighReviewRatio: "Tỷ lệ ôn tập ({classReviewRatioPercent}%) đang từ mức {reviewRatioAtLeast}% trở lên.",
    PackageExpiring: "Số buổi học còn lại ({remainingTickets}) đang ở mức bằng hoặc thấp hơn {remainingTicketsAtMost}.",
    WeakCommunication: "Điểm nói ({speaking}) hoặc mức tự tin ({confidence}) đang ở mức bằng hoặc thấp hơn ngưỡng cấu hình.",
    AttendanceDiscipline: "Đã phát sinh {absentWithoutNotice} lần vắng không báo (ngưỡng: {absentWithoutNoticeAtLeast}).",
    ClassCurriculumDelay: "Tiến độ lớp ({classActualProgressPercent}%) đang chậm hơn tiến độ kỳ vọng ({expectedCompletionPercent}%).",
  },
  internal_notes: {
    insight_generated: "Đã chạy thành công cơ chế sinh nhận định theo luật.",
    snapshot_immutable: "Snapshot báo cáo phụ huynh được tạo từ nguồn chỉ đọc.",
  },
  parent_messages: {
    default: "Học viên đang duy trì nhịp học ổn định và có thể tiếp tục mục tiêu của mô-đun tiếp theo.",
    AcademicFail: "Học viên cần thêm thời gian để củng cố sự tự tin khi nói trước mốc học tập tiếp theo.",
    LowAttendance: "Phụ huynh vui lòng hỗ trợ duy trì đi học đều để tiến độ học được cải thiện ổn định.",
    PackageExpiring: "Số buổi còn lại đang thấp ({remainingTickets}). Vui lòng xem phương án gia hạn gói học.",
  },
  recommendations: {
    default: "Theo dõi thêm với học viên và phụ huynh để có hành động điều chỉnh.",
    AcademicFail: "Tạo đề xuất phụ đạo trước lần đánh giá lại.",
    LearningDelay: "Bổ sung hỗ trợ ôn tập tập trung cho các bài học đang chậm.",
    LowAttendance: "Liên hệ phụ huynh để xác minh lịch đi học và lý do vắng.",
    HighReviewRatio: "Rà soát kế hoạch giảng dạy để cân bằng giữa ôn tập và nội dung mới.",
    PackageExpiring: "Tư vấn phụ huynh về các phương án gia hạn gói học.",
    WeakCommunication: "Tăng cường các hoạt động tập trung vào kỹ năng nói trong lớp.",
    AttendanceDiscipline: "Xác nhận lại quy định điểm danh với phụ huynh và học viên.",
    ClassCurriculumDelay: "Rà soát nhịp độ lớp học và kế hoạch giảng dạy.",
  },
};
const DEFAULT_TEMPLATE_SCHEMA = JSON.stringify(DEFAULT_TEMPLATE_CONTENT_SCHEMA, null, 2);
const DASHBOARD_FOCUS_OPTIONS: readonly DashboardFocusOption[] = [
  { id: "class", label: "Theo lớp", icon: <BookOpen size={14} /> },
  { id: "branch", label: "Theo chi nhánh", icon: <Building2 size={14} /> },
] as const;

type DeleteTargetType = "period" | "template";

function getErrMsg(error: unknown, fallback: string) {
  return extractApiError(error, fallback);
}

function normalizeText(value?: string | number | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCodeKey(value?: string | number | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  return normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .replace(/__+/g, "_")
    .toLowerCase();
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

function prettifyCode(value?: string | number | null) {
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

function normalizeRecommendationRoleKey(value?: string | number | null) {
  const key = normalizeText(value);
  if (key === "1") return "teacher";
  if (key === "2") return "academic_manager";
  if (key === "3") return "cs";
  if (key === "4") return "admin";
  return key;
}

function formatRecommendationRole(value?: string | number | null) {
  const key = normalizeRecommendationRoleKey(value);
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
  const key = normalizeCodeKey(value);
  return RISK_TYPE_LABELS[key] || prettifyCode(value);
}

function reportTypeTone(value?: string | null) {
  const key = normalizeText(value);
  if (key === "parent") return "border-blue-200 bg-blue-50 text-blue-700";
  if (key === "academic") return "border-violet-200 bg-violet-50 text-violet-700";
  if (key === "internal") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

function dedupeOptions(options: Option[]) {
  return Array.from(new Map(options.map((option) => [option.id, option])).values());
}

function mergeRiskAlerts(...groups: Array<RiskAlertDto[] | undefined>) {
  const merged = new Map<string, RiskAlertDto>();

  groups.forEach((items) => {
    items?.forEach((item, index) => {
      const key = item.id || `${item.studentId || "class"}-${item.riskType}-${item.reason}-${index}`;
      const current = merged.get(key);
      merged.set(
        key,
        current
          ? {
              ...item,
              ...current,
              studentName: current.studentName || item.studentName,
              className: current.className || item.className,
              branchName: current.branchName || item.branchName,
            }
          : item,
      );
    });
  });

  return Array.from(merged.values());
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

export default function ReportsV3FunctionalWorkspace({ role }: { role: InternalRole }) {
  const canManageCatalog = role !== "teacher";
  const canEditTemplates = role === "admin";
  const canEditRiskRules = role === "admin";
  const canPublishToParent = role !== "teacher";
  const canSeeBranchDashboard = role !== "teacher";

  const tabs = useMemo(() => {
    const base: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
      { id: "dashboard", label: "Tổng quan", icon: <BarChart3 size={16} /> },
      { id: "reports", label: "Báo cáo", icon: <FileBarChart size={16} /> },
    ];

    if (canManageCatalog) {
      base.push({ id: "periods", label: "Kỳ báo cáo", icon: <CalendarClock size={16} /> });
      base.push({ id: "templates", label: "Mẫu báo cáo", icon: <FileText size={16} /> });
    }

    if (canEditRiskRules) {
      base.push({ id: "risk-rules", label: "Cấu hình rủi ro", icon: <ShieldAlert size={16} /> });
    }

    base.push({ id: "follow-up", label: "Thông báo rủi ro", icon: <BellRing size={16} /> });

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
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    targetType: DeleteTargetType | null;
    targetId: string;
    targetLabel: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    targetType: null,
    targetId: "",
    targetLabel: "",
    isLoading: false,
  });

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
      setRiskAlerts(mergeRiskAlerts(alerts.items, dashboard.riskAlerts));
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

  const studentNameById = useMemo(
    () => new Map(studentOptions.map((item) => [item.id, item.label])),
    [studentOptions],
  );

  const riskAlertsWithStudentNames = useMemo(
    () => riskAlerts.map((item) => {
      const studentId = String(item.studentId ?? "").trim();
      if (!studentId || item.studentName) return item;
      const studentName = studentNameById.get(studentId);
      return studentName ? { ...item, studentName } : item;
    }),
    [riskAlerts, studentNameById],
  );

  const csRecommendations = useMemo(
    () => recommendations.filter((item) => normalizeRecommendationRoleKey(item.assignedRole) === "cs"),
    [recommendations],
  );
  const pendingRecommendations = useMemo(
    () => recommendations.filter((item) => normalizeText(item.status) === "pending"),
    [recommendations],
  );
  const openRiskAlerts = useMemo(
    () => riskAlertsWithStudentNames.filter((item) => normalizeText(item.status) === "open"),
    [riskAlertsWithStudentNames],
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
      setShowGenerateModal(false);
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

  const openDeleteConfirm = (targetType: DeleteTargetType, targetId: string, targetLabel: string) => {
    setDeleteConfirm({
      isOpen: true,
      targetType,
      targetId,
      targetLabel,
      isLoading: false,
    });
  };

  const closeDeleteConfirm = () => {
    if (deleteConfirm.isLoading) return;
    setDeleteConfirm({
      isOpen: false,
      targetType: null,
      targetId: "",
      targetLabel: "",
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.targetType || !deleteConfirm.targetId) return;

    setDeleteConfirm((current) => ({ ...current, isLoading: true }));
    try {
      if (deleteConfirm.targetType === "period") {
        await handleDeletePeriod(deleteConfirm.targetId);
      } else {
        await handleDeleteTemplate(deleteConfirm.targetId);
      }
      setDeleteConfirm({
        isOpen: false,
        targetType: null,
        targetId: "",
        targetLabel: "",
        isLoading: false,
      });
    } finally {
      setDeleteConfirm((current) => ({ ...current, isLoading: false }));
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
      toast.success({ title: "Đã lưu cấu hình", description: `Cấu hình rủi ro ${formatRiskType(riskType)} đã được cập nhật.` });
      await loadRiskRules();
    } catch (error) {
      toast.destructive({ title: "Lưu cấu hình rủi ro thất bại", description: getErrMsg(error, "Không thể lưu cấu hình rủi ro.") });
    }
  };

  const roleLabel = role === "teacher" ? "Giáo viên" : role === "management" ? "Quản lý học thuật" : "Quản trị viên";
  const reportCount = reports.length;
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
        <DashboardTab
          reportCount={reportCount}
          openRiskAlertsCount={openRiskAlerts.length}
          pendingRecommendationsCount={pendingRecommendations.length}
          csRecommendationsCount={csRecommendations.length}
          canSeeBranchDashboard={canSeeBranchDashboard}
          dashboardFocus={dashboardFocus}
          dashboardFocusOptions={DASHBOARD_FOCUS_OPTIONS}
          setDashboardFocus={setDashboardFocus}
          selectedClassId={selectedClassId}
          classDashboard={classDashboard}
          selectedBranchId={selectedBranchId}
          branchDashboard={branchDashboard}
        />
      ) : null}

      {!loadingBoot && activeTab === "reports" ? (
        <ReportsTab
          reportSearch={reportSearch}
          setReportSearch={setReportSearch}
          reportTypeFilter={reportTypeFilter}
          setReportTypeFilter={setReportTypeFilter}
          reportStatusFilter={reportStatusFilter}
          setReportStatusFilter={setReportStatusFilter}
          loadingReports={loadingReports}
          filteredReports={filteredReports}
          selectedReportId={selectedReportId}
          setSelectedReportId={setSelectedReportId}
          loadingDetail={loadingDetail}
          reportDetail={reportDetail}
          canPublishToParent={canPublishToParent}
          publishingParent={publishingParent}
          sharingReport={sharingReport}
          shareRecipientName={shareRecipientName}
          setShareRecipientName={setShareRecipientName}
          shareRecipientContact={shareRecipientContact}
          setShareRecipientContact={setShareRecipientContact}
          shareChannel={shareChannel}
          setShareChannel={setShareChannel}
          onRefresh={() => {
            void Promise.allSettled([loadStudentData(), loadReportDetail(), loadClassData(), loadBranchData()]);
          }}
          onOpenGenerate={() => setShowGenerateModal(true)}
          onPublishToParent={() => {
            void handlePublishToParent();
          }}
          onShare={() => {
            void handleShare();
          }}
          formatReportType={formatReportType}
          normalizeStatusLabel={normalizeStatusLabel}
          statusTone={statusTone}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          formatInsightType={formatInsightType}
          formatRiskType={formatRiskType}
          formatRiskSeverity={formatRiskSeverity}
          formatRecommendationRole={formatRecommendationRole}
          formatShareChannel={formatShareChannel}
          reportTypeTone={reportTypeTone}
          normalizeText={normalizeText}
        />
      ) : null}

      {!loadingBoot && activeTab === "follow-up" ? (
        <FollowUpTab
          loadingFollowUp={loadingFollowUp}
          riskAlerts={riskAlertsWithStudentNames}
          recommendations={recommendations}
          formatRiskType={formatRiskType}
          statusTone={statusTone}
          formatRiskSeverity={formatRiskSeverity}
          normalizeStatusLabel={normalizeStatusLabel}
          formatRecommendationRole={formatRecommendationRole}
        />
      ) : null}

      <GenerateReportModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        reportType={reportType}
        setReportType={setReportType}
        reportTypeLabels={REPORT_TYPE_LABELS}
        branchOptions={branchOptions}
        classOptions={classOptions}
        studentOptions={studentOptions}
        periods={periods}
        selectedBranchId={selectedBranchId}
        selectedClassId={selectedClassId}
        selectedStudentId={selectedStudentId}
        selectedPeriodId={selectedPeriodId}
        onGenerate={() => {
          void handleGenerate();
        }}
        savingGenerate={savingGenerate}
      />

      {!loadingBoot && activeTab === "periods" && canManageCatalog ? (
        <PeriodsTab
          periods={periods}
          periodDraft={periodDraft}
          setPeriodDraft={setPeriodDraft}
          periodTypeOptions={PERIOD_TYPE_OPTIONS}
          formatPeriodType={formatPeriodType}
          formatDate={formatDate}
          onSavePeriod={() => {
            void handleSavePeriod();
          }}
          onDeletePeriod={(periodId) => {
            const period = periods.find((item) => item.id === periodId);
            openDeleteConfirm("period", periodId, period?.name || "kỳ báo cáo");
          }}
          onResetPeriodDraft={() => setPeriodDraft(defaultPeriodDraft())}
          savingPeriod={savingPeriod}
          canDeletePeriod={role === "admin"}
        />
      ) : null}

      {!loadingBoot && activeTab === "templates" && canManageCatalog ? (
        <TemplatesTab
          templates={templates}
          templateDraft={templateDraft}
          setTemplateDraft={setTemplateDraft}
          templateTypeOptions={TEMPLATE_TYPE_OPTIONS}
          formatTemplateType={formatTemplateType}
          onSaveTemplate={() => {
            void handleSaveTemplate();
          }}
          onDeleteTemplate={(templateId) => {
            const template = templates.find((item) => item.id === templateId);
            openDeleteConfirm("template", templateId, template?.name || "mẫu báo cáo");
          }}
          onResetTemplateDraft={() => setTemplateDraft(defaultTemplateDraft())}
          savingTemplate={savingTemplate}
          canEditTemplates={canEditTemplates}
          defaultTemplateSchema={DEFAULT_TEMPLATE_SCHEMA}
        />
      ) : null}

      {!loadingBoot && activeTab === "risk-rules" && canEditRiskRules ? (
        <RiskRulesTab
          riskRules={riskRules}
          riskRuleDrafts={riskRuleDrafts}
          setRiskRuleDrafts={setRiskRuleDrafts}
          formatRiskType={formatRiskType}
          onSaveRiskRule={(riskType) => {
            void handleSaveRiskRule(riskType);
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title={deleteConfirm.targetType === "period" ? "Xác nhận xóa kỳ báo cáo" : "Xác nhận xóa mẫu báo cáo"}
        message={`Bạn có chắc chắn muốn xóa ${deleteConfirm.targetLabel}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteConfirm.isLoading}
      />
    </div>
  );
}

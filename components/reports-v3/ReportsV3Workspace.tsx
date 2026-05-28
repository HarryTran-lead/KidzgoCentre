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
  ClipboardList,
  FileBarChart,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchClassDetail, fetchTeacherClasses } from "@/app/api/teacher/classes";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import { getAllClasses, getClassStudents } from "@/lib/api/classService";
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
  parent: "Parent Report",
  academic: "Academic Report",
  internal: "Internal Report",
};

const PERIOD_TYPE_OPTIONS: ReportPeriodType[] = ["weekly", "monthly", "module", "custom"];
const TEMPLATE_TYPE_OPTIONS: ReportTemplateType[] = ["parent", "academic", "class", "branch", "internal"];
const DEFAULT_TEMPLATE_SCHEMA = JSON.stringify({ blocks: [] }, null, 2);

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getErrMsg(error: unknown, fallback: string) {
  const payload = error as {
    response?: {
      data?: {
        detail?: string;
        message?: string;
      };
    };
    message?: string;
  };

  return payload?.response?.data?.detail || payload?.response?.data?.message || payload?.message || fallback;
}

function normalizeText(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeStatusLabel(value?: string | null) {
  const key = normalizeText(value);
  if (!key) return "Unknown";
  if (key === "completed") return "Completed";
  if (key === "processing") return "Processing";
  if (key === "pending") return "Pending";
  if (key === "failed") return "Failed";
  if (key === "superseded") return "Superseded";
  if (key === "open") return "Open";
  if (key === "resolved") return "Resolved";
  if (key === "ignored") return "Ignored";
  if (key === "accepted") return "Accepted";
  if (key === "rejected") return "Rejected";
  if (key === "done") return "Done";
  return value ?? "Unknown";
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
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
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
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance</div>
        <div className="mt-2 text-sm text-gray-700">Rate: <span className="font-semibold">{formatPercent(attendance?.attendance_rate)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Present: {formatScalar(attendance?.present)} / {formatScalar(attendance?.total_sections)}</div>
        <div className="mt-1 text-sm text-gray-700">Absent no notice: {formatScalar(attendance?.absent_without_notice)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Learning Progress</div>
        <div className="mt-2 text-sm text-gray-700">Completion: <span className="font-semibold">{formatPercent(progress?.completion_percent)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Current lesson: {formatScalar(progress?.current_lesson)}</div>
        <div className="mt-1 text-sm text-gray-700">Promotion: {formatScalar(progress?.promotion_status)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assessment</div>
        <div className="mt-2 text-sm text-gray-700">Result: <span className="font-semibold">{formatScalar(assessment?.latest_result)}</span></div>
        <div className="mt-1 text-sm text-gray-700">Latest score: {formatScalar(assessment?.latest_score)}</div>
        <div className="mt-1 text-sm text-gray-700">Teacher comment: {formatScalar(assessment?.teacher_comment)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ticket</div>
        <div className="mt-2 text-sm text-gray-700">Granted: {formatScalar(tickets?.granted)}</div>
        <div className="mt-1 text-sm text-gray-700">Consumed: {formatScalar(tickets?.consumed)}</div>
        <div className="mt-1 text-sm text-gray-700">Remaining: <span className="font-semibold">{formatScalar(tickets?.remaining)}</span></div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teacher Evaluation</div>
        <div className="mt-2 text-sm text-gray-700">Speaking: {formatScalar(evaluation?.speaking)}</div>
        <div className="mt-1 text-sm text-gray-700">Confidence: {formatScalar(evaluation?.confidence)}</div>
        <div className="mt-1 text-sm text-gray-700">Participation: {formatScalar(evaluation?.participation)}</div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Message</div>
        <div className="mt-2 text-sm text-gray-700">Parent: {formatScalar(snapshot.parent_message)}</div>
        <div className="mt-1 text-sm text-gray-700">Internal: {formatScalar(snapshot.internal_notes)}</div>
      </div>
    </div>
  );
}

export default function ReportsV3Workspace({ role }: { role: InternalRole }) {
  const canManageCatalog = role !== "teacher";
  const canEditTemplates = role === "admin";
  const canEditRiskRules = role === "admin";
  const canPublishToParent = role !== "teacher";
  const canSeeBranchDashboard = role !== "teacher";

  const tabs = useMemo(() => {
    const base: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
      { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} /> },
      { id: "generate", label: "Generate", icon: <Sparkles size={16} /> },
      { id: "reports", label: "History", icon: <FileBarChart size={16} /> },
      { id: "follow-up", label: "Follow-up", icon: <BellRing size={16} /> },
    ];

    if (canManageCatalog) {
      base.push({ id: "periods", label: "Periods", icon: <CalendarClock size={16} /> });
      base.push({ id: "templates", label: "Templates", icon: <FileText size={16} /> });
    }

    if (canEditRiskRules) {
      base.push({ id: "risk-rules", label: "Risk Rules", icon: <ShieldAlert size={16} /> });
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
      setShareRecipientName((current) => current || `Parent of ${detail.studentName || "student"}`);
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
      setPageError(getErrMsg(error, "Không thể tải dashboard lớp học."));
    });
  }, [loadClassData]);

  useEffect(() => {
    void loadBranchData().catch((error) => {
      setPageError(getErrMsg(error, "Không thể tải dashboard chi nhánh."));
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
        description: "Cần chọn học viên và kỳ báo cáo trước khi generate.",
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
        title: "Generate thành công",
        description: `Report run ${result.reportRunId} đã được tạo.`,
      });
      setActiveTab("reports");
      await loadStudentData();
      setSelectedReportId(result.studentReportId);
      await loadClassData();
    } catch (error) {
      toast.destructive({
        title: "Generate thất bại",
        description: getErrMsg(error, "Không thể generate báo cáo."),
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
      toast.success({ title: "Đã publish", description: "Parent report đã được mở cho phụ huynh." });
      await loadStudentData();
      await loadReportDetail();
    } catch (error) {
      toast.destructive({ title: "Publish thất bại", description: getErrMsg(error, "Không thể publish cho phụ huynh.") });
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
      toast.success({ title: "Đã ghi nhận share", description: "Share log đã được tạo." });
      await loadReportDetail();
    } catch (error) {
      toast.destructive({ title: "Share thất bại", description: getErrMsg(error, "Không thể share báo cáo.") });
    } finally {
      setSharingReport(false);
    }
  };

  const handleSavePeriod = async () => {
    if (!periodDraft.code.trim() || !periodDraft.name.trim() || !periodDraft.startDate || !periodDraft.endDate) {
      toast.destructive({ title: "Thiếu dữ liệu", description: "Period cần code, name, start date và end date." });
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

      toast.success({ title: "Đã lưu period", description: "Danh mục kỳ báo cáo đã được cập nhật." });
      setPeriodDraft(defaultPeriodDraft());
      await loadPeriods();
    } catch (error) {
      toast.destructive({ title: "Lưu period thất bại", description: getErrMsg(error, "Không thể lưu kỳ báo cáo.") });
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!window.confirm("Xóa kỳ báo cáo này?")) return;
    try {
      await deleteReportPeriod(periodId);
      toast.success({ title: "Đã xóa period", description: "Kỳ báo cáo đã được xóa." });
      if (periodDraft.id === periodId) {
        setPeriodDraft(defaultPeriodDraft());
      }
      await loadPeriods();
    } catch (error) {
      toast.destructive({ title: "Xóa period thất bại", description: getErrMsg(error, "Không thể xóa kỳ báo cáo.") });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateDraft.code.trim() || !templateDraft.name.trim()) {
      toast.destructive({ title: "Thiếu dữ liệu", description: "Template cần code và name." });
      return;
    }

    if (templateDraft.contentSchema.trim()) {
      try {
        const parsed = JSON.parse(templateDraft.contentSchema);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Content schema phải là JSON object.");
        }
      } catch (error) {
        toast.destructive({
          title: "Schema không hợp lệ",
          description: getErrMsg(error, "Content schema phải là JSON object hợp lệ."),
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

      toast.success({ title: "Đã lưu template", description: "Template báo cáo đã được cập nhật." });
      setTemplateDraft(defaultTemplateDraft());
      await loadTemplates();
    } catch (error) {
      toast.destructive({ title: "Lưu template thất bại", description: getErrMsg(error, "Không thể lưu template báo cáo.") });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm("Xóa template này?")) return;
    try {
      await deleteReportTemplate(templateId);
      toast.success({ title: "Đã xóa template", description: "Template báo cáo đã được xóa." });
      if (templateDraft.id === templateId) {
        setTemplateDraft(defaultTemplateDraft());
      }
      await loadTemplates();
    } catch (error) {
      toast.destructive({ title: "Xóa template thất bại", description: getErrMsg(error, "Không thể xóa template báo cáo.") });
    }
  };

  const handleSaveRiskRule = async (riskType: string) => {
    const draft = riskRuleDrafts[riskType];
    if (!draft) return;

    if (!draft.parametersJson.trim()) {
      toast.destructive({ title: "Thiếu dữ liệu", description: "ParametersJson không được để trống." });
      return;
    }

    try {
      const parsed = JSON.parse(draft.parametersJson);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("ParametersJson phải là JSON object.");
      }
    } catch (error) {
      toast.destructive({ title: "JSON không hợp lệ", description: getErrMsg(error, "ParametersJson phải là JSON object hợp lệ.") });
      return;
    }

    try {
      await updateRiskRuleConfig(riskType, {
        isActive: draft.isActive,
        score: Number(draft.score || 0),
        parametersJson: draft.parametersJson,
      });
      toast.success({ title: "Đã lưu rule", description: `Risk rule ${riskType} đã được cập nhật.` });
      await loadRiskRules();
    } catch (error) {
      toast.destructive({ title: "Lưu risk rule thất bại", description: getErrMsg(error, "Không thể lưu risk rule.") });
    }
  };

  const roleLabel = role === "teacher" ? "Giáo viên" : role === "management" ? "Academic Manager" : "Admin";
  const reportCount = reports.length;

  return (
    <div className="space-y-6 bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports V3 Workspace</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-600">
                Module reporting phase 3 chạy song song với monthly/session report cũ. Snapshot, insight, risk, recommendation,
                publish và share được tách route riêng để tránh conflict luồng hiện tại.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
            Scope: {roleLabel}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Branch</label>
            <select
              value={selectedBranchId}
              onChange={(event) => setSelectedBranchId(event.target.value)}
              disabled={!canSeeBranchDashboard}
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none ring-0 transition focus:border-red-300"
            >
              <option value="">{canSeeBranchDashboard ? "Tất cả chi nhánh / chưa chọn" : "Branch theo quyền hiện tại"}</option>
              {branchOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Class</label>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none ring-0 transition focus:border-red-300"
            >
              <option value="">{loadingClasses ? "Đang tải lớp..." : "Chọn lớp"}</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Student</label>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none ring-0 transition focus:border-red-300"
            >
              <option value="">{loadingStudents ? "Đang tải học viên..." : "Chọn học viên"}</option>
              {studentOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Report Period</label>
            <select
              value={selectedPeriodId}
              onChange={(event) => setSelectedPeriodId(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none ring-0 transition focus:border-red-300"
            >
              <option value="">Chọn kỳ báo cáo</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>{period.name}</option>
              ))}
            </select>
          </div>
        </div>

        {pageError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-red-700 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                : "border-red-200 bg-white text-gray-700 hover:bg-red-50",
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
            Đang tải Reports V3 workspace...
          </div>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Reports" value={String(reportCount)} hint="History của học viên đang chọn" tone="red" icon={<FileBarChart size={18} />} />
            <StatCard title="Open Risks" value={String(openRiskAlerts.length)} hint="Risk alert ở lớp đang chọn" tone="amber" icon={<AlertTriangle size={18} />} />
            <StatCard title="Pending Recs" value={String(pendingRecommendations.length)} hint="Recommendation đang chờ xử lý" tone="blue" icon={<ClipboardList size={18} />} />
            <StatCard title="CS Follow-up" value={String(csRecommendations.length)} hint="Recommendation assigned cho CS" tone="green" icon={<Send size={18} />} />
          </div>

          <SectionCard title="Class Academic Dashboard" subtitle="Đọc dữ liệu lớp đã chọn để xem pace, risk và remedial footprint." icon={<BookOpen size={18} />}>
            {selectedClassId && classDashboard ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">{classDashboard.className || "Lớp học"}</div>
                  <div className="mt-3 grid gap-2 text-sm text-gray-700">
                    <div>Tổng học viên: <span className="font-semibold">{formatScalar(classDashboard.totalStudents)}</span></div>
                    <div>Risk students: <span className="font-semibold">{formatScalar(classDashboard.riskStudents)}</span></div>
                    <div>Failed assessments: <span className="font-semibold">{formatScalar(classDashboard.failedAssessments)}</span></div>
                    <div>Remedial required: <span className="font-semibold">{formatScalar(classDashboard.remedialRequired)}</span></div>
                    <div>Review ratio: <span className="font-semibold">{formatPercent(classDashboard.classPacing?.reviewRatio)}</span></div>
                    <div>Curriculum delay risk: <span className="font-semibold">{formatScalar(classDashboard.classPacing?.curriculumDelayRisk)}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">Weak students</div>
                  <div className="mt-3 space-y-2">
                    {classDashboard.weakStudents?.length ? classDashboard.weakStudents.map((item, index) => (
                      <div key={`${item.studentId || index}`} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                        <div className="font-medium text-gray-900">{item.studentName || "Học viên"}</div>
                        <div className="text-gray-600">{item.reason || "Chưa có lý do chi tiết"}</div>
                      </div>
                    )) : <div className="text-sm text-gray-500">Chưa có weak student trong dashboard hiện tại.</div>}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="Chưa có dashboard lớp" description="Chọn lớp để tải academic dashboard và risk alerts." />
            )}
          </SectionCard>

          <SectionCard title="Branch Dashboard" subtitle="Dành cho management/admin để theo dõi risk classes, package expiring và assessment fail count." icon={<Building2 size={18} />}>
            {canSeeBranchDashboard && selectedBranchId && branchDashboard ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Active classes: <span className="font-semibold">{formatScalar(branchDashboard.totalActiveClasses)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Active students: <span className="font-semibold">{formatScalar(branchDashboard.totalActiveStudents)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Risk students: <span className="font-semibold">{formatScalar(branchDashboard.riskStudents)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Risk classes: <span className="font-semibold">{formatScalar(branchDashboard.riskClasses)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Package expiring: <span className="font-semibold">{formatScalar(branchDashboard.packageExpiringCount)}</span></div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">Assessment fail: <span className="font-semibold">{formatScalar(branchDashboard.assessmentFailCount)}</span></div>
              </div>
            ) : (
              <EmptyState title="Chưa có branch dashboard" description="Chọn chi nhánh để xem summary cấp center manager/academic manager." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "generate" ? (
        <div className="space-y-6">
          <SectionCard title="Generate Student Report" subtitle="Generate tạo snapshot immutable theo student + period + report type. Không chạm dữ liệu Attendance/Ticket/Progress cũ." icon={<Sparkles size={18} />}>
            <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Report Type</label>
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
                          {key === "parent" ? "Ngôn ngữ nhẹ cho phụ huynh" : key === "academic" ? "Hiện risk, score, weakness cho academic" : "Internal only, không publish cho parent"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-red-200 bg-white px-4 py-4 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900">Context hiện tại</div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>Branch: <span className="font-medium">{branchOptions.find((item) => item.id === selectedBranchId)?.label || "—"}</span></div>
                    <div>Class: <span className="font-medium">{classOptions.find((item) => item.id === selectedClassId)?.label || "—"}</span></div>
                    <div>Student: <span className="font-medium">{studentOptions.find((item) => item.id === selectedStudentId)?.label || "—"}</span></div>
                    <div>Period: <span className="font-medium">{periods.find((item) => item.id === selectedPeriodId)?.name || "—"}</span></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-red-50 p-2 text-red-700"><FileText size={18} /></div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Generate checklist</div>
                    <div className="mt-1 text-sm text-gray-500">Kiểm tra class/student/period trước khi chạy để tránh report sai scope.</div>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li>Student report dùng cùng snapshot cho parent/academic/internal.</li>
                  <li>Report cũ không đổi khi dữ liệu runtime thay đổi sau này.</li>
                  <li>Publish cho parent là bước riêng, không chạy tự động sau generate.</li>
                </ul>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={savingGenerate || !selectedStudentId || !selectedPeriodId}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingGenerate ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate report
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "reports" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
          <SectionCard title="Report History" subtitle="History của học viên đang chọn, tách riêng khỏi monthly/session report cũ." icon={<FileBarChart size={18} />}>
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder="Tìm theo tên, lớp, type"
                  className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                />
                <select
                  value={reportTypeFilter}
                  onChange={(event) => setReportTypeFilter(event.target.value)}
                  className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                >
                  <option value="">All types</option>
                  <option value="parent">Parent</option>
                  <option value="academic">Academic</option>
                  <option value="internal">Internal</option>
                </select>
                <select
                  value={reportStatusFilter}
                  onChange={(event) => setReportStatusFilter(event.target.value)}
                  className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                >
                  <option value="">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="superseded">Superseded</option>
                </select>
              </div>

              {loadingReports ? (
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải report history...
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
                          <div className="font-semibold text-gray-900">{item.studentName || "Student report"}</div>
                          <div className="mt-1 text-sm text-gray-500">{item.className || "No class"} • {item.reportType}</div>
                        </div>
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>
                          {normalizeStatusLabel(item.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Created: {formatDateTime(item.createdAt)}</span>
                        <span>Parent published: {item.isParentPublished ? "Yes" : "No"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="Chưa có report history" description="Generate report đầu tiên hoặc chọn học viên khác để xem lịch sử." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Report Detail"
            subtitle="Snapshot immutable, insight, risk, recommendation và share log đều đọc từ report detail V3."
            icon={<FileText size={18} />}
            action={
              <button
                type="button"
                onClick={() => {
                  void Promise.allSettled([loadStudentData(), loadReportDetail(), loadClassData(), loadBranchData()]);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            }
          >
            {loadingDetail ? (
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" /> Đang tải chi tiết report...
              </div>
            ) : reportDetail ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{reportDetail.studentName || "Student report"}</div>
                    <div className="mt-1 text-sm text-gray-500">{reportDetail.className || "No class"} • {reportDetail.reportType}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(reportDetail.status))}>
                      {normalizeStatusLabel(reportDetail.status)}
                    </span>
                    {reportDetail.isParentPublished ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Parent published</span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Period</div>
                    <div className="mt-2 text-sm text-gray-700">{reportDetail.reportPeriodName || "—"}</div>
                    <div className="mt-1 text-xs text-gray-500">{formatDate(reportDetail.reportPeriodFrom)} - {formatDate(reportDetail.reportPeriodTo)}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</div>
                    <div className="mt-2 text-sm text-gray-700">{formatDateTime(reportDetail.createdAt)}</div>
                    <div className="mt-1 text-xs text-gray-500">Parent publish at: {formatDateTime(reportDetail.parentPublishedAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</div>
                    <div className="mt-2 text-sm text-gray-700">{reportDetail.summaryText || "Chưa có summary text."}</div>
                  </div>
                </div>

                <SnapshotSummary snapshot={reportDetail.snapshot} />

                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Insights</div>
                    <div className="mt-3 space-y-2">
                      {reportDetail.insights?.length ? reportDetail.insights.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">{item.insightType}</div>
                          <div className="mt-1">{item.content}</div>
                        </div>
                      )) : <div className="text-sm text-gray-500">Chưa có insight.</div>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Risks</div>
                    <div className="mt-3 space-y-2">
                      {reportDetail.risks?.length ? reportDetail.risks.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-gray-900">{item.riskType}</div>
                            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(item.severity))}>{item.severity}</span>
                          </div>
                          <div className="mt-1">{item.reason}</div>
                        </div>
                      )) : <div className="text-sm text-gray-500">Chưa có risk alert trong detail.</div>}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">Recommendations</div>
                    <div className="mt-3 space-y-2">
                      {reportDetail.recommendations?.length ? reportDetail.recommendations.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">{item.assignedRole}</div>
                          <div className="mt-1">{item.content}</div>
                        </div>
                      )) : <div className="text-sm text-gray-500">Chưa có recommendation trong detail.</div>}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Publish & Share</div>
                      <div className="text-sm text-gray-500">Publish chỉ mở cho parent report ở trạng thái Completed. Share log không regenerate report.</div>
                    </div>
                    {canPublishToParent && normalizeText(reportDetail.reportType) === "parent" && normalizeText(reportDetail.status) === "completed" && !reportDetail.isParentPublished ? (
                      <button
                        type="button"
                        onClick={handlePublishToParent}
                        disabled={publishingParent}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {publishingParent ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Publish to parent
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={shareRecipientName}
                      onChange={(event) => setShareRecipientName(event.target.value)}
                      placeholder="Recipient name"
                      className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                    />
                    <input
                      value={shareRecipientContact}
                      onChange={(event) => setShareRecipientContact(event.target.value)}
                      placeholder="Recipient contact"
                      className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                    />
                    <select
                      value={shareChannel}
                      onChange={(event) => setShareChannel(event.target.value as ReportShareChannel)}
                      className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300"
                    >
                      <option value="app">App</option>
                      <option value="email">Email</option>
                      <option value="zalo">Zalo</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharingReport || normalizeText(reportDetail.reportType) !== "parent"}
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sharingReport ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Create share log
                  </button>

                  <div className="mt-4 space-y-2">
                    {reportDetail.shareLogs?.length ? reportDetail.shareLogs.map((item) => (
                      <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium text-gray-900">{item.recipientName} • {item.channel}</div>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Sent {formatDateTime(item.sentAt)} • Viewed {formatDateTime(item.viewedAt)}</div>
                      </div>
                    )) : <div className="text-sm text-gray-500">Chưa có share log.</div>}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-slate-950 p-4 text-xs text-slate-100">
                  <div className="mb-2 font-semibold text-white">Snapshot JSON</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(reportDetail.snapshot ?? {}, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <EmptyState title="Chưa chọn report" description="Chọn một report ở cột trái để xem snapshot, risk và recommendation." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "follow-up" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Risk Alerts" subtitle="Đọc risk từ class dashboard và report detail, không update dữ liệu gốc." icon={<AlertTriangle size={18} />}>
            {loadingFollowUp ? (
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" /> Đang tải risk alerts...
              </div>
            ) : riskAlerts.length ? (
              <div className="space-y-2">
                {riskAlerts.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{item.studentName || item.riskType}</div>
                        <div className="mt-1 text-sm text-gray-600">{item.reason}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.severity))}>{item.severity}</span>
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có risk alerts" description="Chọn lớp có dữ liệu rủi ro hoặc generate report để làm giàu follow-up." />
            )}
          </SectionCard>

          <SectionCard title="Recommendations" subtitle="Action list theo role teacher / academic manager / cs / admin." icon={<BellRing size={18} />}>
            {recommendations.length ? (
              <div className="space-y-2">
                {recommendations.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{item.studentName || "Recommendation"}</div>
                        <div className="mt-1 text-sm text-gray-600">{item.content}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.assignedRole}</span>
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", statusTone(item.status))}>{normalizeStatusLabel(item.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có recommendations" description="Chọn học viên và generate report để lấy action list theo role." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "periods" && canManageCatalog ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
          <SectionCard title="Report Periods" subtitle="Weekly, monthly, module, custom. Generate dùng start/end date của period." icon={<CalendarClock size={18} />}>
            {periods.length ? (
              <div className="space-y-2">
                {periods.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="mt-1 text-sm text-gray-500">{item.code} • {item.type} • {formatDate(item.startDate)} - {formatDate(item.endDate)}</div>
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
                          Edit
                        </button>
                        {role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => void handleDeletePeriod(item.id)}
                            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có period" description="Tạo kỳ báo cáo đầu tiên để chạy generate theo mốc thời gian rõ ràng." />
            )}
          </SectionCard>

          <SectionCard title={periodDraft.id ? "Edit Period" : "Create Period"} subtitle="Management có thể create/update period. Delete chỉ mở cho admin." icon={<FileText size={18} />}>
            <div className="space-y-3">
              <input value={periodDraft.code} onChange={(event) => setPeriodDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Code" className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
              <input value={periodDraft.name} onChange={(event) => setPeriodDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Name" className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
              <select value={periodDraft.type} onChange={(event) => setPeriodDraft((current) => ({ ...current, type: event.target.value as ReportPeriodType }))} className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300">
                {PERIOD_TYPE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={periodDraft.startDate} onChange={(event) => setPeriodDraft((current) => ({ ...current, startDate: event.target.value }))} className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
                <input type="date" value={periodDraft.endDate} onChange={(event) => setPeriodDraft((current) => ({ ...current, endDate: event.target.value }))} className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleSavePeriod} disabled={savingPeriod} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {savingPeriod ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Save period
                </button>
                <button type="button" onClick={() => setPeriodDraft(defaultPeriodDraft())} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Reset</button>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "templates" && canManageCatalog ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <SectionCard title="Report Templates" subtitle="Template type parent/academic/internal phục vụ render report. Class/branch hiện chỉ lưu và quản trị." icon={<FileText size={18} />}>
            {templates.length ? (
              <div className="space-y-2">
                {templates.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="mt-1 text-sm text-gray-500">{item.code} • {item.type} • {item.isActive ? "Active" : "Inactive"}</div>
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
                          View
                        </button>
                        {canEditTemplates ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteTemplate(item.id)}
                            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Chưa có template" description="Nếu backend không có template active đúng loại, hệ thống có thể auto-create default template khi generate." />
            )}
          </SectionCard>

          <SectionCard title={canEditTemplates ? (templateDraft.id ? "Edit Template" : "Create Template") : "Template Detail"} subtitle={canEditTemplates ? "Admin mới được CRUD template. Management giữ mode read-only." : "Read-only cho management để review content schema."} icon={<Sparkles size={18} />}>
            <div className="space-y-3">
              <input value={templateDraft.code} onChange={(event) => setTemplateDraft((current) => ({ ...current, code: event.target.value }))} placeholder="Code" disabled={!canEditTemplates} className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300" />
              <input value={templateDraft.name} onChange={(event) => setTemplateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Name" disabled={!canEditTemplates} className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300" />
              <select value={templateDraft.type} onChange={(event) => setTemplateDraft((current) => ({ ...current, type: event.target.value as ReportTemplateType }))} disabled={!canEditTemplates} className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300">
                {TEMPLATE_TYPE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                <input type="checkbox" checked={templateDraft.isActive} onChange={(event) => setTemplateDraft((current) => ({ ...current, isActive: event.target.checked }))} disabled={!canEditTemplates} />
                Active template
              </label>
              <textarea value={templateDraft.contentSchema} onChange={(event) => setTemplateDraft((current) => ({ ...current, contentSchema: event.target.value }))} disabled={!canEditTemplates} rows={16} className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-50 focus:border-red-300" />
              {canEditTemplates ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Save template
                  </button>
                  <button type="button" onClick={() => setTemplateDraft(defaultTemplateDraft())} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Reset</button>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {!loadingBoot && activeTab === "risk-rules" && canEditRiskRules ? (
        <SectionCard title="Risk Rule Config" subtitle="Rule MVP cho low_attendance, academic_fail, package_expiring, class_curriculum_delay..." icon={<ShieldAlert size={18} />}>
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
                        <div className="font-semibold text-gray-900">{item.riskType}</div>
                        <div className="mt-1 text-sm text-gray-500">Backend score {item.score}</div>
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
                        Active
                      </label>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <input value={draft.score} onChange={(event) => setRiskRuleDrafts((current) => ({ ...current, [item.riskType]: { ...draft, score: event.target.value } }))} placeholder="Score 0..100" className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-700 outline-none focus:border-red-300" />
                      <textarea value={draft.parametersJson} onChange={(event) => setRiskRuleDrafts((current) => ({ ...current, [item.riskType]: { ...draft, parametersJson: event.target.value } }))} rows={8} className="rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-700 outline-none focus:border-red-300" />
                      <button type="button" onClick={() => void handleSaveRiskRule(item.riskType)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white">
                        <CheckCircle2 size={14} /> Save rule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Chưa có risk rules" description="Backend chưa trả về risk rule config nào cho Reports V3." />
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}

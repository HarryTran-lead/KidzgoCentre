"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileBarChart,
  FileText,
  MessageSquare,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ClassItem, Student } from "@/types/teacher/classes";
import { fetchClassDetail, fetchTeacherClasses } from "@/app/api/teacher/classes";
import type { SessionReportItem } from "@/types/teacher/sessionReport";
import OverviewTab from "@/components/reports/monthly-tabs/overview-tab";
import TeacherToolsTab from "@/components/reports/monthly-tabs/teacher-tools-tab";
import ManageToolsTab from "@/components/reports/monthly-tabs/manage-tools-tab";
import ReportsTab from "@/components/reports/monthly-tabs/reports-tab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";

type MonthlyRole = "teacher" | "management" | "viewer";
type ReportStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Published" | string;
type WorkspaceTab = "overview" | "reports" | "teacher-tools" | "manage-tools";

const STATUS_ALIAS: Record<string, string> = {
  Review: "Submitted",
};

const STATUS_LABEL_VI: Record<string, string> = {
  Draft: "Nháp",
  Submitted: "Đã gửi",
  Approved: "Đã duyệt",
  Rejected: "Cần chỉnh sửa",
  Published: "Đã công bố",
};

function normalizeStatus(status?: string) {
  const normalized = String(status ?? "").trim();
  return STATUS_ALIAS[normalized] ?? normalized;
}

type MonthlyJob = {
  id: string;
  branchId: string;
  month: number;
  year: number;
  status: string;
};

type MonthlyComment = {
  id: string;
  content: string;
  createdAt?: string;
  authorName?: string;
  commenterName?: string;
};

type BranchOption = {
  id: string;
  name?: string;
  code?: string;
  isActive?: boolean;
};

type MonthlyReport = {
  id: string;
  studentProfileId?: string;
  studentName?: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  jobId?: string;
  status: ReportStatus;
  month: number;
  year: number;
  draftContent?: string;
  finalContent?: string;
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  programId?: string;
  programName?: string;
  topicsData?: string;
  comments?: MonthlyComment[];
  updatedAt?: string;
};

type RecentCommentItem = {
  id: string;
  content: string;
  createdAt?: string;
  authorName?: string;
  reportId: string;
  studentName?: string;
  className?: string;
};

type DraftPayload = {
  draft_text?: string;
  draftText?: string;
};

type Paginated<T> = { items?: T[]; data?: T[] };
type ReportPayload = Paginated<MonthlyReport> & { reports?: Paginated<MonthlyReport> };
type JobPayload = Paginated<MonthlyJob> & { jobs?: Paginated<MonthlyJob> };
type SessionReportPayload = Paginated<SessionReportItem> & {
  sessionReports?: Paginated<SessionReportItem> | SessionReportItem[];
};
const REPORT_PAGE_SIZE = 200;
const REPORT_MAX_PAGES = 50;
const SESSION_REPORT_PAGE_SIZE = 100;
const SESSION_REPORT_MAX_PAGES = 30;

function getPaginatedItems<T>(
  payload: Paginated<T> | { [key: string]: unknown } | undefined,
  key?: string,
): T[] {
  if (!payload) return [];

  const direct = payload as Paginated<T>;
  if (Array.isArray(direct.items)) return direct.items;
  if (Array.isArray(direct.data)) return direct.data;

  if (key) {
    const payloadObj = payload as Record<string, unknown>;
    const nested = payloadObj[key] as Paginated<T> | undefined;
    if (Array.isArray(nested?.items)) return nested.items;
    if (Array.isArray(nested?.data)) return nested.data;
  }

  return [];
}

function getToken() {
  if (typeof window === "undefined") return "";

  const localToken =
    localStorage.getItem("kidzgo.accessToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (localToken) return localToken;

  const cookieToken = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("kidzgo.accessToken="))
    ?.split("=")
    .slice(1)
    .join("=");

  return cookieToken || "";
}

function normalizeDraftContent(raw?: string | null): string {
  if (!raw) return "";
  let normalized = raw.trim();
  if (!normalized) return "";

  for (let i = 0; i < 3; i += 1) {
    const canTryJson =
      normalized.startsWith("{") ||
      normalized.startsWith("[") ||
      normalized.startsWith('"');

    if (!canTryJson) break;

    try {
      const parsed = JSON.parse(normalized) as DraftPayload | string;
      if (typeof parsed === "string") {
        normalized = parsed.trim();
        continue;
      }
      const candidate = parsed?.draft_text ?? parsed?.draftText;
      if (typeof candidate === "string") {
        normalized = candidate.trim();
      }
      break;
    } catch {
      break;
    }
  }

  return normalized
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\t/g, "\t")
    .trim();
}

function formatDateYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { fromDate: formatDateYMD(start), toDate: formatDateYMD(end) };
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let payload: any = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể xử lý monthly report");
  }

  return (payload?.data ?? payload) as T;
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const displayStatus = STATUS_ALIAS[status] ?? status;
  const label = STATUS_LABEL_VI[displayStatus] ?? displayStatus;
  const map: Record<string, string> = {
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Submitted: "bg-red-50 text-red-700 border-red-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
    Published: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const icons: Record<string, React.ReactNode> = {
    Draft: <FileText size={12} />,
    Submitted: <Clock size={12} />,
    Approved: <CheckCircle2 size={12} />,
    Rejected: <AlertCircle size={12} />,
    Published: <Send size={12} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${map[displayStatus] || "bg-slate-100 text-slate-700 border-slate-200"
        }`}
    >
      {icons[displayStatus] || <FileText size={12} />}
      {label}
    </span>
  );
}

export default function MonthlyReportsWorkspace({ role, initialClassId, initialStudentId, initialMonth, initialYear, initialTab }: { role: MonthlyRole; initialClassId?: string | null; initialStudentId?: string | null; initialMonth?: number | null; initialYear?: number | null; initialTab?: string | null }) {
  const [jobs, setJobs] = useState<MonthlyJob[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");

  const [month, setMonth] = useState(initialMonth ?? new Date().getMonth() + 1);
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [branchId, setBranchId] = useState("");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [classQuery, setClassQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClassId ?? null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId ?? null);
  const [draftInput, setDraftInput] = useState("");
  const [activeReportDetail, setActiveReportDetail] = useState<MonthlyReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [teacherClassItems, setTeacherClassItems] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [sessionReports, setSessionReports] = useState<SessionReportItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState("");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentReportId, setCommentReportId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentRejectAfterSend, setCommentRejectAfterSend] = useState(true);
  const [recentComments, setRecentComments] = useState<RecentCommentItem[]>([]);
  const [recentCommentsLoading, setRecentCommentsLoading] = useState(false);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showTeacherTools, setShowTeacherTools] = useState(false);
  const [showManageTools, setShowManageTools] = useState(false);
  const [showRecentComments, setShowRecentComments] = useState(false);
  const [jobFlowLoading, setJobFlowLoading] = useState(false);

  const canManage = role === "management";
  const isTeacher = role === "teacher";
  const isViewer = role === "viewer";
  const defaultTab: WorkspaceTab = initialTab === "reports" || initialTab === "teacher-tools" || initialTab === "manage-tools" || initialTab === "overview"
    ? initialTab as WorkspaceTab
    : isTeacher
      ? (initialStudentId ? "reports" : "teacher-tools")
      : canManage
        ? "manage-tools"
        : "reports";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(defaultTab);

  const workspaceTabs = useMemo(() => {
    if (isTeacher) {
      return [
        { id: "teacher-tools" as const, label: "Soạn báo cáo", icon: FileText },
        { id: "reports" as const, label: "Danh sách", icon: FileBarChart },
        { id: "overview" as const, label: "Tổng quan", icon: CalendarDays },
      ];
    }

    if (canManage) {
      return [
        { id: "manage-tools" as const, label: "Hàng chờ", icon: Clock },
        { id: "reports" as const, label: "Danh sách", icon: FileBarChart },
        { id: "overview" as const, label: "Tổng quan", icon: CalendarDays },
      ];
    }

    return [
      { id: "reports" as const, label: "Báo cáo", icon: FileBarChart },
      { id: "overview" as const, label: "Tổng quan", icon: CalendarDays },
    ];
  }, [canManage, isTeacher]);

  useEffect(() => {
    const isValid = workspaceTabs.some((tab) => tab.id === activeTab);
    if (!isValid && workspaceTabs.length > 0) {
      setActiveTab(workspaceTabs[0].id);
    }
  }, [activeTab, workspaceTabs]);

  useEffect(() => {
    if (activeTab === "teacher-tools") setShowTeacherTools(true);
    if (activeTab === "manage-tools") setShowManageTools(true);
  }, [activeTab]);

  useEffect(() => {
    if (!canManage || typeof window === "undefined") return;
    if (branchId) return;
    const selectedBranchId = localStorage.getItem("kidzgo_selected_branch_id");
    if (selectedBranchId && selectedBranchId !== "all") {
      setBranchId(selectedBranchId);
    }
  }, [branchId, canManage]);

  useEffect(() => {
    if (!canManage || typeof window === "undefined") return;

    const syncBranchId = (value: string | null) => {
      if (!value || value === "all") {
        setBranchId("");
        return;
      }
      setBranchId(value);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== "kidzgo_selected_branch_id") return;
      syncBranchId(event.newValue);
    };

    const onLocalStorageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string; newValue?: string | null }>;
      if (customEvent.detail?.key !== "kidzgo_selected_branch_id") return;
      syncBranchId(customEvent.detail?.newValue ?? null);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("localStorageChange", onLocalStorageChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("localStorageChange", onLocalStorageChange);
    };
  }, [canManage]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const reportBaseQuery = new URLSearchParams({
        month: `${month}`,
        year: `${year}`,
        pageSize: `${REPORT_PAGE_SIZE}`,
      });

      if (isViewer) reportBaseQuery.set("status", "Published");

      const jobsQuery = new URLSearchParams({
        month: `${month}`,
        year: `${year}`,
        pageNumber: "1",
        pageSize: "200",
      });
      if (canManage && branchId) jobsQuery.set("branchId", branchId);

      const fetchAllReports = async () => {
        const collected: MonthlyReport[] = [];
        for (let page = 1; page <= REPORT_MAX_PAGES; page += 1) {
          const reportQuery = new URLSearchParams(reportBaseQuery);
          reportQuery.set("pageNumber", `${page}`);
          const pageResult = await apiFetch<ReportPayload>(
            `/api/monthly-reports?${reportQuery.toString()}`,
          );
          const pageItems = getPaginatedItems<MonthlyReport>(pageResult, "reports");
          if (!pageItems.length) break;
          collected.push(...pageItems);
          if (pageItems.length < REPORT_PAGE_SIZE) break;
        }
        return Array.from(new Map(collected.map((report) => [report.id, report])).values());
      };

      const [jobResult, reportResult] = await Promise.all([
        canManage
          ? apiFetch<JobPayload>(
            `/api/monthly-reports/jobs?${jobsQuery.toString()}`,
          )
          : Promise.resolve({ items: [] } as JobPayload),
        fetchAllReports(),
      ]);

      const jobItems = getPaginatedItems<MonthlyJob>(jobResult, "jobs");
      const reportItems = reportResult;
      const scopedReports =
        canManage && branchId
          ? (() => {
            const jobIdSet = new Set(jobItems.map((job) => job.id));
            if (!jobIdSet.size) return [];
            return reportItems.filter((report) => report.jobId && jobIdSet.has(report.jobId));
          })()
          : reportItems;

      setJobs(jobItems);
      setReports(scopedReports);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [branchId, canManage, isViewer, month, year]);

  const refreshActiveReportDetail = useCallback(async () => {
    if (!activeReportId) return;
    try {
      const detail = await apiFetch<MonthlyReport>(`/api/monthly-reports/${activeReportId}`);
      setActiveReportDetail(detail ?? null);
      setDraftInput(normalizeDraftContent(detail?.draftContent));
    } catch {
      // Keep existing detail if explicit refresh detail fails.
    }
  }, [activeReportId]);

  const handleManualRefresh = useCallback(async () => {
    await fetchData();
    await refreshActiveReportDetail();
  }, [fetchData, refreshActiveReportDetail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isTeacher) return;

    let alive = true;
    setClassesLoading(true);
    setClassesError("");

    fetchTeacherClasses({ pageNumber: 1, pageSize: 200 })
      .then((result) => {
        if (!alive) return;
        setTeacherClassItems(result.classes || []);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setClassesError(
          e instanceof Error ? e.message : "Không thể tải danh sách lớp học.",
        );
      })
      .finally(() => {
        if (!alive) return;
        setClassesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isTeacher]);

  useEffect(() => {
    if (!canManage) return;

    let alive = true;
    setBranchesLoading(true);

    apiFetch<{ branches?: BranchOption[] } | BranchOption[]>(`/api/branches/all`)
      .then((result) => {
        if (!alive) return;
        const list = Array.isArray(result) ? result : result?.branches ?? [];
        const activeBranches = list.filter((item) => item?.isActive !== false);
        setBranchOptions(activeBranches);
        if (!branchId && typeof window !== "undefined") {
          const selectedBranchId = localStorage.getItem("kidzgo_selected_branch_id");
          const matched =
            selectedBranchId && selectedBranchId !== "all"
              ? activeBranches.find((item) => item.id === selectedBranchId)
              : null;
          if (matched) {
            setBranchId(matched.id);
          }
        }
      })
      .catch(() => {
        if (!alive) return;
        setBranchOptions([]);
      })
      .finally(() => {
        if (!alive) return;
        setBranchesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [canManage]);

  const aggregateJob = useCallback(async (jobId: string) => {
    await apiFetch(`/api/monthly-reports/jobs/${jobId}/aggregate`, { method: "POST" });
  }, []);

  const resolveJobIdFromPayload = (payload: unknown) => {
    if (!payload || typeof payload !== "object") return "";
    const job = payload as { id?: string; job?: { id?: string }; data?: { id?: string } };
    return job.id || job.job?.id || job.data?.id || "";
  };

  const createJob = useCallback(async () => {
    if (!branchId.trim()) {
      setError("Vui lòng chọn chi nhánh.");
      return;
    }

    setJobFlowLoading(true);
    setError("");
    setMessage("");

    try {
      const created = await apiFetch("/api/monthly-reports/jobs", {
        method: "POST",
        body: JSON.stringify({ month, year, branchId }),
      });

      let jobId = resolveJobIdFromPayload(created);

      if (!jobId) {
        const jobsQuery = new URLSearchParams({
          month: `${month}`,
          year: `${year}`,
          branchId,
          pageNumber: "1",
          pageSize: "200",
        });
        const refreshedJobs = await apiFetch<JobPayload>(
          `/api/monthly-reports/jobs?${jobsQuery.toString()}`,
        );
        const matchingJobs = getPaginatedItems<MonthlyJob>(refreshedJobs, "jobs").filter(
          (job) => job.branchId === branchId && job.month === month && job.year === year,
        );
        jobId =
          (matchingJobs.length > 0 ? matchingJobs[0]?.id : "") ||
          (matchingJobs.length > 0 ? matchingJobs[matchingJobs.length - 1]?.id : "") ||
          "";
      }

      if (!jobId) {
        throw new Error("Không tìm thấy đợt báo cáo vừa khởi tạo để đồng bộ dữ liệu.");
      }

      await aggregateJob(jobId);
      setMessage("Đã khởi tạo đợt báo cáo và đồng bộ dữ liệu.");
      toast({ title: "Thành công", description: "Đã khởi tạo đợt báo cáo và đồng bộ dữ liệu.", variant: "success" });
      await fetchData();
    } catch (e: unknown) {
      const errMsg = e instanceof Error
        ? e.message
        : "Không thể khởi tạo đợt báo cáo và đồng bộ dữ liệu.";
      setError(errMsg);
      toast({ title: "Lỗi", description: errMsg, variant: "destructive" });
    } finally {
      setJobFlowLoading(false);
    }
  }, [aggregateJob, branchId, fetchData, month, year]);

  const runAction = async (
    reportId: string,
    action: string,
    method: "POST" | "PUT" = "POST",
    body?: Record<string, string>,
  ) => {
    const actionKey = `${reportId}:${action}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    setError("");
    setMessage("");
    try {
      const result = await apiFetch(`/api/monthly-reports/${reportId}/${action}`, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMessage(`Đã xử lý ${action}`);
      toast({ title: "Thành công", description: `Đã xử lý ${action}`, variant: "success" });
      if (action === "comments" && reportId === activeReportId && result) {
        const newComment = result as MonthlyComment;
        setActiveReportDetail((prev) => {
          if (!prev) return prev;
          const nextComments = Array.isArray(prev.comments)
            ? [...prev.comments, newComment]
            : [newComment];
          return { ...prev, comments: nextComments };
        });
      }
      await fetchData();
      if (reportId === activeReportId) {
        const detail = await apiFetch<MonthlyReport>(`/api/monthly-reports/${reportId}`);
        setActiveReportDetail(detail ?? null);
        setDraftInput(normalizeDraftContent(detail?.draftContent));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Không thể ${action}`);
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : `Không thể ${action}`, variant: "destructive" });
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const openCommentDialog = (reportId: string) => {
    setActiveReportId(reportId);
    setCommentReportId(reportId);
    setCommentInput("Vui lòng bổ sung phần điểm mạnh/điểm yếu.");
    setCommentRejectAfterSend(true);
    setCommentModalOpen(true);
  };

  const closeCommentDialog = () => {
    setCommentModalOpen(false);
    setCommentReportId(null);
    setCommentInput("");
    setCommentRejectAfterSend(true);
  };

  const submitComment = async () => {
    if (!commentReportId) return;
    const content = commentInput.trim();
    if (!content) {
      setError("Vui lòng nhập nội dung comment.");
      return;
    }
    const report = reports.find((item) => item.id === commentReportId);
    await runAction(commentReportId, "comments", "POST", { content });
    if (commentRejectAfterSend && report && normalizeStatus(report.status) === "Submitted") {
      await runAction(commentReportId, "reject");
      setMessage("Đã gửi góp ý và chuyển report về Rejected để teacher chỉnh sửa.");
    } else if (commentRejectAfterSend && report) {
      setMessage("Đã gửi góp ý. Report không ở trạng thái Submitted nên chưa thể Reject.");
    }
    closeCommentDialog();
  };

  const teacherClassIdSet = useMemo(
    () => new Set(teacherClassItems.map((item) => item.id)),
    [teacherClassItems],
  );

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const reportStatus = normalizeStatus(r.status);
      const selectedStatus = normalizeStatus(statusFilter);
      const statusOk = statusFilter === "Tất cả" || reportStatus === selectedStatus;
      const textOk =
        !q ||
        (r.studentName || "").toLowerCase().includes(q) ||
        (r.teacherName || "").toLowerCase().includes(q) ||
        (r.className || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      const classOk =
        !selectedClassId ||
        r.classId === selectedClassId ||
        (isTeacher && Boolean(selectedStudentId) && r.studentProfileId === selectedStudentId);
      const studentOk = !selectedStudentId || r.studentProfileId === selectedStudentId;
      const classId = r.classId ?? "";
      const teacherScopeOk = !isTeacher || (Boolean(classId) && teacherClassIdSet.has(classId));
      return statusOk && textOk && classOk && studentOk && teacherScopeOk;
    });
  }, [isTeacher, reports, searchQuery, selectedClassId, selectedStudentId, statusFilter, teacherClassIdSet]);

  const teacherWorkflowReports = useMemo(() => {
    return reports.filter((r) => {
      const classOk =
        !selectedClassId ||
        r.classId === selectedClassId ||
        (Boolean(selectedStudentId) && r.studentProfileId === selectedStudentId);
      const studentOk = !selectedStudentId || r.studentProfileId === selectedStudentId;
      const classId = r.classId ?? "";
      const teacherScopeOk = !isTeacher || (Boolean(classId) && teacherClassIdSet.has(classId));
      return classOk && studentOk && teacherScopeOk;
    });
  }, [isTeacher, reports, selectedClassId, selectedStudentId, teacherClassIdSet]);

  const teacherClasses = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    return teacherClassItems.filter((item) =>
      (item.name || "").toLowerCase().includes(q) ||
      (item.code || "").toLowerCase().includes(q),
    );
  }, [classQuery, teacherClassItems]);

  const managementClasses = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; reportCount: number }>();
    reports.forEach((report) => {
      if (!report.classId) return;
      const current = seen.get(report.classId);
      if (current) {
        current.reportCount += 1;
        return;
      }
      seen.set(report.classId, {
        id: report.classId,
        name: report.className || `Lớp ${report.classId.slice(0, 8)}`,
        reportCount: 1,
      });
    });
    const q = classQuery.trim().toLowerCase();
    return Array.from(seen.values()).filter((item) =>
      item.name.toLowerCase().includes(q),
    );
  }, [classQuery, reports]);

  const managementStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const seen = new Map<string, { id: string; name: string; reportCount: number }>();
    reports
      .filter((report) => report.classId === selectedClassId)
      .forEach((report) => {
        if (!report.studentProfileId) return;
        const current = seen.get(report.studentProfileId);
        if (current) {
          current.reportCount += 1;
          return;
        }
        seen.set(report.studentProfileId, {
          id: report.studentProfileId,
          name: report.studentName || `Student ${report.studentProfileId.slice(0, 8)}`,
          reportCount: 1,
        });
      });
    return Array.from(seen.values());
  }, [reports, selectedClassId]);

  const classFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    reports.forEach((report) => {
      if (!report.classId) return;
      if (map.has(report.classId)) return;
      map.set(report.classId, report.className || `Lớp ${report.classId.slice(0, 8)}`);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [reports]);

  const selectedClassName = useMemo(() => {
    if (!selectedClassId) return "";
    const fromList = managementClasses.find((item) => item.id === selectedClassId)?.name;
    if (fromList) return fromList;
    return reports.find((report) => report.classId === selectedClassId)?.className || selectedClassId;
  }, [managementClasses, reports, selectedClassId]);

  const selectedStudentName = useMemo(() => {
    if (!selectedStudentId) return "";
    const fromList = managementStudents.find((item) => item.id === selectedStudentId)?.name;
    if (fromList) return fromList;
    return reports.find((report) => report.studentProfileId === selectedStudentId)?.studentName || selectedStudentId;
  }, [managementStudents, reports, selectedStudentId]);

  const managementClassProgress = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        published: number;
        approved: number;
        pending: number;
      }
    >();

    reports.forEach((report) => {
      if (!report.classId) return;
      const status = normalizeStatus(report.status);
      const current =
        map.get(report.classId) ??
        {
          id: report.classId,
          name: report.className || `Lớp ${report.classId.slice(0, 8)}`,
          total: 0,
          published: 0,
          approved: 0,
          pending: 0,
        };

      current.total += 1;
      if (status === "Published") current.published += 1;
      else if (status === "Approved") current.approved += 1;
      else current.pending += 1;

      map.set(report.classId, current);
    });

    return Array.from(map.values());
  }, [reports]);

  const teacherClassProgress = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        submitted: number;
        approved: number;
        pending: number;
        draft: number;
      }
    >();

    teacherWorkflowReports.forEach((report) => {
      if (!report.classId) return;
      const status = normalizeStatus(report.status);
      const current =
        map.get(report.classId) ??
        {
          id: report.classId,
          name: report.className || `Lớp ${report.classId.slice(0, 8)}`,
          total: 0,
          submitted: 0,
          approved: 0,
          pending: 0,
          draft: 0,
        };

      current.total += 1;
      if (status === "Draft") current.draft += 1;
      else if (status === "Submitted") current.submitted += 1;
      else if (status === "Approved") current.approved += 1;
      else if (status === "Published") { current.submitted += 1; current.approved += 1; }
      else current.pending += 1;

      map.set(report.classId, current);
    });

    return Array.from(map.values());
  }, [teacherWorkflowReports]);

  const activeReportSource = isTeacher ? teacherWorkflowReports : filteredReports;

  const activeReport = useMemo(
    () => activeReportSource.find((r) => r.id === activeReportId) || activeReportSource[0],
    [activeReportId, activeReportSource],
  );

  const displayReport = useMemo(() => {
    if (!activeReportDetail) return activeReport;

    const rawDetail = activeReportDetail as MonthlyReport & {
      assignedTeacherName?: string;
      teacherFullName?: string;
      teacher?: { name?: string };
    };

    const teacherName =
      rawDetail.teacherName ||
      rawDetail.assignedTeacherName ||
      rawDetail.teacherFullName ||
      rawDetail.teacher?.name ||
      activeReport?.teacherName ||
      "";

    return {
      ...rawDetail,
      teacherName,
    };
  }, [activeReport, activeReportDetail]);

  useEffect(() => {
    if (!detailModalOpen) return;

    window.dispatchEvent(new CustomEvent("portal:sidebar-modal-open"));
    return () => {
      window.dispatchEvent(new CustomEvent("portal:sidebar-modal-close"));
    };
  }, [detailModalOpen]);

  useEffect(() => {
    if (!isTeacher) return;

    if (selectedClassId && !teacherClassItems.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(null);
      setSelectedStudentId(null);
      setClassStudents([]);
      setSessionReports([]);
      return;
    }

    if (selectedStudentId && !classStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(null);
      setSessionReports([]);
    }
  }, [classStudents, isTeacher, selectedClassId, selectedStudentId, teacherClassItems]);

  useEffect(() => {
    if (!isTeacher) return;

    if (!selectedClassId) {
      setClassStudents([]);
      return;
    }

    let alive = true;
    setStudentsLoading(true);
    setStudentsError("");

    fetchClassDetail({ classId: selectedClassId, pageNumber: 1, pageSize: 200 })
      .then((result) => {
        if (!alive) return;
        setClassStudents(result.students || []);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setStudentsError(
          e instanceof Error ? e.message : "Không thể tải danh sách học sinh.",
        );
        setClassStudents([]);
      })
      .finally(() => {
        if (!alive) return;
        setStudentsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isTeacher, selectedClassId]);

  useEffect(() => {
    if (!isTeacher) return;

    if (!selectedStudentId || !selectedClassId) {
      setSessionReports([]);
      return;
    }

    let alive = true;
    setSessionsLoading(true);
    setSessionsError("");

    const { fromDate, toDate } = getMonthRange(year, month);
    const fetchAllSessionReports = async () => {
      const collected: SessionReportItem[] = [];

      for (let page = 1; page <= SESSION_REPORT_MAX_PAGES; page += 1) {
        const query = new URLSearchParams({
          studentProfileId: selectedStudentId,
          classId: selectedClassId,
          fromDate,
          toDate,
          pageNumber: `${page}`,
          pageSize: `${SESSION_REPORT_PAGE_SIZE}`,
        });

        const result = await apiFetch<SessionReportPayload>(`/api/session-reports?${query.toString()}`);
        const pageItems = getPaginatedItems(result, "sessionReports");

        if (!pageItems.length) break;
        collected.push(...pageItems);
        if (pageItems.length < SESSION_REPORT_PAGE_SIZE) break;
      }

      return Array.from(
        new Map(collected.map((item) => [String(item.id ?? item.sessionId ?? Math.random()), item])).values(),
      );
    };

    fetchAllSessionReports()
      .then((items) => {
        if (!alive) return;
        setSessionReports(items);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setSessionsError(
          e instanceof Error ? e.message : "Không thể tải nhận xét buổi học.",
        );
        setSessionReports([]);
      })
      .finally(() => {
        if (!alive) return;
        setSessionsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isTeacher, month, selectedClassId, selectedStudentId, year]);

  useEffect(() => {
    if (!isTeacher) return;
    if (!selectedStudentId || !selectedClassId) return;

    let alive = true;
    const resolveTeacherReport = async () => {
      const baseParams = {
        studentProfileId: selectedStudentId,
        month: `${month}`,
        year: `${year}`,
        pageNumber: "1",
        pageSize: "20",
      };

      const attempts: Array<Record<string, string>> = [{ ...baseParams, classId: selectedClassId }];

      for (const params of attempts) {
        const query = new URLSearchParams(params);
        const result = await apiFetch<ReportPayload>(`/api/monthly-reports?${query.toString()}`);
        const items = getPaginatedItems<MonthlyReport>(result, "reports");
        if (!items.length) continue;

        const matched =
          items.find(
            (item) =>
              item.studentProfileId === selectedStudentId &&
              item.classId === selectedClassId,
          ) ?? items[0];

        if (!matched || !alive) return;

        setReports((prev) => {
          const next = prev.filter((r) => r.id !== matched.id);
          return [matched, ...next];
        });
        setActiveReportId(matched.id);
        return;
      }
    };

    resolveTeacherReport().catch(() => {
      // Keep UI usable with existing local list if lookup endpoint fails.
    });

    return () => {
      alive = false;
    };
  }, [isTeacher, month, selectedClassId, selectedStudentId, year]);

  useEffect(() => {
    if (!activeReportId) {
      setActiveReportDetail(null);
      setDraftInput("");
      setDetailError("");
      return;
    }

    let alive = true;
    setDetailLoading(true);
    setDetailError("");

    apiFetch<MonthlyReport>(`/api/monthly-reports/${activeReportId}`)
      .then((detail) => {
        if (!alive) return;
        setActiveReportDetail(detail ?? null);
        setDraftInput(normalizeDraftContent(detail?.draftContent));
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setDetailError(e instanceof Error ? e.message : "Không thể tải chi tiết báo cáo.");
        setActiveReportDetail(null);
      })
      .finally(() => {
        if (!alive) return;
        setDetailLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [activeReportId]);

  useEffect(() => {
    if (!activeReportSource.length) {
      setActiveReportId(null);
      return;
    }

    if (activeReportId && activeReportSource.some((r) => r.id === activeReportId)) return;

    setActiveReportId(activeReportSource[0].id);
  }, [activeReportId, activeReportSource]);

  useEffect(() => {
    if (!reports.length) {
      setRecentComments([]);
      return;
    }

    let alive = true;
    setRecentCommentsLoading(true);

    const reportIds = reports.slice(0, 20).map((report) => report.id);
    Promise.all(
      reportIds.map((reportId) =>
        apiFetch<MonthlyReport>(`/api/monthly-reports/${reportId}`).catch(() => null),
      ),
    )
      .then((details) => {
        if (!alive) return;
        const items: RecentCommentItem[] = details
          .filter((detail): detail is MonthlyReport => Boolean(detail))
          .flatMap((detail) =>
            (detail.comments ?? []).map((comment) => ({
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt,
              authorName: comment.authorName || comment.commenterName,
              reportId: detail.id,
              studentName: detail.studentName,
              className: detail.className,
            })),
          )
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 10);

        setRecentComments(items);
      })
      .finally(() => {
        if (!alive) return;
        setRecentCommentsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reports]);

  const focusReport = (reportId: string) => {
    const targetReport = reports.find((report) => report.id === reportId);
    if (targetReport?.classId) setSelectedClassId(targetReport.classId);
    if (targetReport?.studentProfileId) setSelectedStudentId(targetReport.studentProfileId);
    setActiveReportId(reportId);
  };

  const openReportDetail = useCallback(
    (reportId: string) => {
      focusReport(reportId);
      setActiveTab("reports");
    },
    [focusReport],
  );

  const generateAiDraftFromStudent = useCallback(async () => {
    if (!displayReport?.id || !sessionReports.length) {
      setError("Vui lòng chọn học sinh có dữ liệu session report để tạo nháp AI.");
      return;
    }

    await runAction(displayReport.id, "generate-draft");
    openReportDetail(displayReport.id);
  }, [displayReport?.id, openReportDetail, runAction, sessionReports.length]);

  const syncScopeToReports = useCallback((classId: string | null, studentId: string | null, openReports = true) => {
    setSelectedClassId(classId);
    setSelectedStudentId(studentId);
    setSearchQuery("");
    setStatusFilter("Tất cả");
    if (openReports) setActiveTab("reports");
  }, []);

  const clearScopeFilter = useCallback(() => {
    setSelectedClassId(null);
    setSelectedStudentId(null);
  }, []);

  const openClassScope = useCallback(
    (classId: string) => {
      setSelectedClassId(classId);
      setSelectedStudentId(null);
      setSearchQuery("");
      setStatusFilter("Tất cả");
      setActiveTab(isTeacher ? "teacher-tools" : "reports");
    },
    [isTeacher],
  );

  const openReportInTeacherTools = useCallback(
    (report: MonthlyReport) => {
      setSelectedClassId(report.classId || null);
      setSelectedStudentId(report.studentProfileId || null);
      setActiveTab("teacher-tools");
    },
    [],
  );

  const openReportFromComment = (reportId: string) => {
    openReportDetail(reportId);
  };

  const stats = useMemo(() => {
    const total = reports.length;
    const drafts = reports.filter((r) => normalizeStatus(r.status) === "Draft").length;
    const submitted = reports.filter((r) => normalizeStatus(r.status) === "Submitted").length;
    const approved = reports.filter((r) => normalizeStatus(r.status) === "Approved").length;
    return { total, drafts, submitted, approved };
  }, [reports]);

  const teacherTaskSummary = useMemo(() => {
    const draftCount = reports.filter((r) => normalizeStatus(r.status) === "Draft").length;
    const rejectedCount = reports.filter((r) => normalizeStatus(r.status) === "Rejected").length;
    const commentedReportIds = new Set(recentComments.map((c) => c.reportId));
    const hasCommentCount = reports.filter((r) => commentedReportIds.has(r.id)).length;
    return { draftCount, rejectedCount, hasCommentCount };
  }, [recentComments, reports]);

  const adminSummary = useMemo(() => {
    if (!canManage) {
      return { pendingReview: 0, needTeacherFix: 0, readyToPublish: 0, published: 0 };
    }
    return {
      pendingReview: reports.filter((r) => normalizeStatus(r.status) === "Submitted").length,
      needTeacherFix: reports.filter((r) => normalizeStatus(r.status) === "Rejected").length,
      readyToPublish: reports.filter((r) => normalizeStatus(r.status) === "Approved").length,
      published: reports.filter((r) => normalizeStatus(r.status) === "Published").length,
    };
  }, [canManage, reports]);

  const adminPriorityReports = useMemo(() => {
    if (!canManage) return [];
    return reports
      .filter((report) => {
        const status = normalizeStatus(report.status);
        return status === "Submitted" || status === "Rejected" || status === "Approved";
      })
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 8);
  }, [canManage, reports]);

  const teacherPriorityReports = useMemo(() => {
    if (!isTeacher) return [];
    const commentedReportIds = new Set(recentComments.map((c) => c.reportId));
    const needAction = reports.filter((r) => {
      const status = normalizeStatus(r.status);
      return status === "Draft" || status === "Rejected" || commentedReportIds.has(r.id);
    });
    return needAction
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [isTeacher, recentComments, reports]);

  const teacherClassSummary = useMemo(() => {
    if (!isTeacher) {
      return { total: 0, noReport: 0, inProgress: 0, completed: 0 };
    }

    const byClass = new Map<string, MonthlyReport[]>();
    reports.forEach((report) => {
      if (!report.classId) return;
      const current = byClass.get(report.classId) ?? [];
      current.push(report);
      byClass.set(report.classId, current);
    });

    const result = { total: teacherClassItems.length, noReport: 0, inProgress: 0, completed: 0 };

    teacherClassItems.forEach((classItem) => {
      const classReports = byClass.get(classItem.id) ?? [];
      if (!classReports.length) {
        result.noReport += 1;
        return;
      }

      const expectedStudents = Number(classItem.students ?? 0);
      const hasEnoughReports = expectedStudents > 0 ? classReports.length >= expectedStudents : true;
      const allReviewedOrPublished = classReports.every((report) => {
        const status = normalizeStatus(report.status);
        return status === "Submitted" || status === "Approved" || status === "Published";
      });

      if (hasEnoughReports && allReviewedOrPublished) {
        result.completed += 1;
      } else {
        result.inProgress += 1;
      }
    });

    return result;
  }, [isTeacher, reports, teacherClassItems]);

  const teacherClassStatusRows = useMemo(() => {
    if (!isTeacher) return [];

    const byClass = new Map<string, MonthlyReport[]>();
    reports.forEach((report) => {
      if (!report.classId) return;
      const current = byClass.get(report.classId) ?? [];
      current.push(report);
      byClass.set(report.classId, current);
    });

    return teacherClassItems.map((classItem) => {
      const classReports = byClass.get(classItem.id) ?? [];
      const expectedStudents = Number(classItem.students ?? 0);
      const reviewedCount = classReports.filter((report) => {
        const status = normalizeStatus(report.status);
        return status === "Submitted" || status === "Approved" || status === "Published";
      }).length;

      let statusLabel = "Chưa có báo cáo";
      let statusClass = "bg-rose-50 text-rose-700";
      if (classReports.length > 0) {
        statusLabel = "Đang làm";
        statusClass = "bg-amber-50 text-amber-700";
      }
      if (
        classReports.length > 0 &&
        (expectedStudents === 0 || classReports.length >= expectedStudents) &&
        reviewedCount === classReports.length
      ) {
        statusLabel = "Đã báo cáo";
        statusClass = "bg-emerald-50 text-emerald-700";
      }

      return {
        id: classItem.id,
        name: classItem.name,
        code: classItem.code,
        expectedStudents,
        reportCount: classReports.length,
        reviewedCount,
        statusLabel,
        statusClass,
      };
    });
  }, [isTeacher, reports, teacherClassItems]);

  const canTeacherSubmit = (status: ReportStatus) =>
    normalizeStatus(status) === "Draft" || normalizeStatus(status) === "Rejected";
  const canManagementApprove = (status: ReportStatus) =>
    normalizeStatus(status) === "Submitted";
  const canManagementPublish = (status: ReportStatus) =>
    normalizeStatus(status) === "Approved";

  const openTeacherTools = useCallback(() => {
    setShowTeacherTools(true);
    setActiveTab("teacher-tools");
  }, []);

  const openTeacherDrafts = useCallback(() => {
    setStatusFilter("Draft");
    setActiveTab("reports");
  }, []);

  const openTeacherRejected = useCallback(() => {
    setStatusFilter("Rejected");
    setActiveTab("reports");
  }, []);

  const openManagementQueue = useCallback(() => {
    setStatusFilter("Submitted");
    setActiveTab("reports");
  }, []);

  const openManagementPublishQueue = useCallback(() => {
    setStatusFilter("Approved");
    setActiveTab("reports");
  }, []);

  const openManagementTools = useCallback(() => {
    setShowManageTools(true);
    setActiveTab("manage-tools");
  }, []);

  const openPublishedReports = useCallback(() => {
    setStatusFilter("Published");
    setActiveTab("reports");
  }, []);

  const visibleReportIds = useMemo(
    () => filteredReports.map((report) => report.id),
    [filteredReports],
  );

  const toggleReportSelection = (reportId: string) => {
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      visibleReportIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedReportIds(new Set());
  };

  const getEligibleIds = (ids: string[], action: "approve" | "publish") => {
    const statusRequired = action === "approve" ? "Submitted" : "Approved";
    return reports
      .filter((report) => ids.includes(report.id))
      .filter((report) => normalizeStatus(report.status) === statusRequired)
      .map((report) => report.id);
  };

  const runBulkAction = async (action: "approve" | "publish", ids: string[]) => {
    const eligibleIds = getEligibleIds(ids, action);
    const skipped = ids.length - eligibleIds.length;

    if (!eligibleIds.length) {
      setError("Không có báo cáo phù hợp để xử lý.");
      return;
    }

    setBulkLoading(action);
    const results = await Promise.allSettled(
      eligibleIds.map((id) =>
        apiFetch(`/api/monthly-reports/${id}/${action}`, { method: "POST" }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = eligibleIds.length - failed;

    if (failed > 0) {
      setError(`Có ${failed} báo cáo xử lý thất bại.`);
      toast({ title: "Lỗi", description: `Có ${failed} báo cáo xử lý thất bại.`, variant: "destructive" });
    }

    const skippedText = skipped > 0 ? `, bỏ qua ${skipped} báo cáo không đúng trạng thái` : "";
    setMessage(`Đã ${action} ${succeeded} báo cáo${skippedText}.`);
    toast({ title: "Thành công", description: `Đã ${action} ${succeeded} báo cáo${skippedText}.`, variant: "success" });
    setBulkLoading("");
    fetchData();
  };

  const roleLabel = isTeacher
    ? "Giáo viên"
    : canManage
      ? "Quản lý"
      : "Người xem";

  const workspaceHeading = isTeacher
    ? "Soạn và gửi báo cáo tháng"
    : canManage
      ? "Duyệt và công bố báo cáo tháng"
      : "Theo dõi báo cáo tháng";

  const workspaceDescription = isTeacher
    ? "Chọn đúng kỳ báo cáo, xem nhanh việc ưu tiên rồi đi thẳng vào công cụ giáo viên."
    : canManage
      ? "Theo dõi nhanh tiến độ, mở đúng hàng chờ và xử lý báo cáo mà không phải cuộn qua nhiều khối."
      : "Xem nhanh báo cáo đã công bố trong kỳ đang chọn.";

  const activeTabDescription =
    activeTab === "overview"
      ? "Tổng quan: xem nhanh tiến độ, hạng mục ưu tiên và bức tranh toàn bộ kỳ báo cáo."
      : activeTab === "reports"
        ? canManage
          ? "Danh sách báo cáo: mở hàng chờ duyệt, lọc theo trạng thái rồi review hoặc công bố từng báo cáo."
          : isTeacher
            ? "Danh sách báo cáo: kiểm tra Draft, Rejected hoặc các báo cáo đã có góp ý để xử lý tiếp."
            : "Danh sách báo cáo: xem các báo cáo đã công bố trong kỳ đang chọn."
        : activeTab === "teacher-tools"
          ? "Bắt đầu soạn: chọn lớp, học sinh, xem dữ liệu buổi học rồi tạo nháp AI để hoàn thiện báo cáo."
          : "Hàng chờ xử lý: điều phối theo lớp, theo dõi tiến độ và chạy duyệt hoặc công bố hàng loạt.";

  return (
    <div className="space-y-6 bg-gray-50 rounded-3xl">
      {/* Period Settings */}
      <div className="rounded-xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-5  transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={18} className="text-red-600" />
          <h3 className="text-sm font-semibold text-gray-900">Thiết lập kỳ báo cáo</h3>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:shadow-sm cursor-pointer"
            >
              <RefreshCw size={14} />
              Làm mới
            </button>
            {canManage && (
              <button
                onClick={createJob}
                disabled={jobFlowLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-red-500/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileBarChart size={14} />
                {jobFlowLoading ? "Đang đồng bộ..." : "Mở kỳ báo cáo tháng"}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tháng</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Năm</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          {canManage && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Building2 size={12} className="inline mr-1" />
                Chi nhánh
              </label>
              <Select
                value={branchId || ""}
                onValueChange={(val) => {
                  if (val === "all") {
                    setBranchId("");
                  } else {
                    setBranchId(val);
                  }
                }}
                disabled={branchesLoading}
              >
                <SelectTrigger className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-red-200">
                  <SelectValue placeholder={branchesLoading ? "Đang tải..." : "Chọn chi nhánh"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                  {branchOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.code || item.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {message}
          </div>
        )}
      </div>

      {/* Progress Section for Teacher - Always Show */}
      {isTeacher && (
        <div className="mt-6 rounded-xl bg-gradient-to-br from-white to-red-50 transition-all duration-500 hover:shadow-xl hover:shadow-red-200/40 border border-red-100 p-5">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 blur-lg opacity-30"></div>
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Tiến độ báo cáo tháng</h3>
                  <p className="text-xs text-gray-500">Tổng quan tình hình các lớp giảng dạy</p>
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1.5 shadow-inner">
                <span className="text-xs font-semibold text-gray-700">
                  Đã nộp: <span className="text-emerald-600">{Math.round(
                    teacherClassProgress.length > 0 
                      ? ((teacherClassProgress.reduce((sum, c) => sum + c.submitted + c.approved, 0) / teacherClassProgress.reduce((sum, c) => sum + c.total, 0)) * 100)
                      : 0
                  )}%</span>
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 max-h-[400px] overflow-auto pr-1">
              {teacherClassProgress.map((item) => {
                const submittedCount = item.submitted + item.approved;
                const percentage = item.total > 0 ? (submittedCount / item.total) * 100 : 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedClassId(item.id);
                      setSelectedStudentId(null);
                      setActiveTab("reports");
                    }}
                    className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 p-3 transition-all duration-300 hover:shadow-lg hover:border-amber-200 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="relative">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 truncate text-sm">{item.name}</h4>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">{Math.round(percentage)}%</div>
                          <div className="text-[9px] text-gray-400">{item.total} báo cáo</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <div className="rounded bg-amber-50 p-1 text-center text-amber-700 font-medium">{item.draft} Nháp</div>
                        <div className="rounded bg-red-50 p-1 text-center text-red-700 font-medium">{item.submitted} Nộp</div>
                        <div className="rounded bg-emerald-50 p-1 text-center text-emerald-700 font-medium">{item.approved} Duyệt</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}

      <div className="mt-2">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {workspaceTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                    : "text-gray-600 hover:bg-red-50 hover:text-red-600"
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-gray-500">{activeTabDescription}</p>
      </div>

      {/* Content Sections */}
      {activeTab === "overview" && (
        <OverviewTab
          isTeacher={isTeacher}
          canManage={canManage}
          isViewer={isViewer}
          month={month}
          year={year}
          showManageTools={showManageTools}
          setShowManageTools={setShowManageTools}
          setStatusFilter={setStatusFilter}
          openClassScope={openClassScope}
          openReportDetail={openReportDetail}
          focusReport={focusReport}
          teacherClassSummary={teacherClassSummary}
          teacherClassStatusRows={teacherClassStatusRows}
          teacherTaskSummary={teacherTaskSummary}
          teacherPriorityReports={teacherPriorityReports}
          adminSummary={adminSummary}
          adminPriorityReports={adminPriorityReports}
          renderStatusBadge={(status) => <StatusBadge status={status} />}
        />
      )}

      {activeTab === "teacher-tools" && isTeacher && (
        <TeacherToolsTab
          month={month}
          year={year}
          classQuery={classQuery}
          setClassQuery={setClassQuery}
          setMonth={setMonth}
          setYear={setYear}
          showTeacherTools={showTeacherTools}
          setShowTeacherTools={setShowTeacherTools}
          teacherClasses={teacherClasses}
          classesLoading={classesLoading}
          classesError={classesError}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          setSelectedStudentId={setSelectedStudentId}
          setSessionReports={setSessionReports}
          classStudents={classStudents}
          studentsLoading={studentsLoading}
          studentsError={studentsError}
          selectedStudentId={selectedStudentId}
          activeReport={activeReport}
          displayReport={displayReport}
          sessionReports={sessionReports}
          sessionsLoading={sessionsLoading}
          sessionsError={sessionsError}
          actionLoading={actionLoading}
          runAction={(reportId, action) => runAction(reportId, action)}
          generateAiDraftFromStudent={generateAiDraftFromStudent}
          openReportDetail={openReportDetail}
          teacherClassProgress={teacherClassProgress}
          teacherReports={reports}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === "manage-tools" && canManage && showManageTools && (
        <ManageToolsTab
          classQuery={classQuery}
          setClassQuery={setClassQuery}
          selectedClassId={selectedClassId}
          selectedStudentId={selectedStudentId}
          managementClasses={managementClasses}
          managementStudents={managementStudents}
          managementClassProgress={managementClassProgress}
          reports={reports}
          bulkLoading={bulkLoading}
          setActiveTab={() => setActiveTab("reports")}
          syncScopeToReports={syncScopeToReports}
          runBulkAction={runBulkAction}
        />
      )}

      {activeTab === "reports" && (
        <ReportsTab
          canManage={canManage}
          isTeacher={isTeacher}
          month={month}
          year={year}
          jobs={jobs}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedClassId={selectedClassId}
          selectedStudentId={selectedStudentId}
          setSelectedClassId={setSelectedClassId}
          setSelectedStudentId={setSelectedStudentId}
          selectedClassName={selectedClassName}
          selectedStudentName={selectedStudentName}
          classFilterOptions={classFilterOptions}
          clearScopeFilter={clearScopeFilter}
          selectedReportIds={selectedReportIds}
          selectAllVisible={selectAllVisible}
          clearSelection={clearSelection}
          bulkLoading={bulkLoading}
          runBulkAction={runBulkAction}
          filteredReports={filteredReports}
          displayReport={displayReport}
          detailLoading={detailLoading}
          detailError={detailError}
          draftInput={draftInput}
          setDraftInput={setDraftInput}
          actionLoading={actionLoading}
          runAction={runAction}
          canTeacherSubmit={canTeacherSubmit}
          canManagementApprove={canManagementApprove}
          canManagementPublish={canManagementPublish}
          setActiveReportId={setActiveReportId}
          setDetailModalOpen={setDetailModalOpen}
          toggleReportSelection={toggleReportSelection}
          openCommentDialog={openCommentDialog}
          recentCommentsLoading={recentCommentsLoading}
          recentComments={recentComments}
          openReportFromComment={openReportFromComment}
          showRecentComments={showRecentComments}
          setShowRecentComments={setShowRecentComments}
          formatDateTime={formatDateTime}
          fetchData={fetchData}
          apiFetch={apiFetch}
                    openReportInTeacherTools={openReportInTeacherTools}
          renderStatusBadge={(status) => <StatusBadge status={status} />}
        />
      )}

      {/* Detail Modal — portal */}
      {detailModalOpen && displayReport && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetailModalOpen(false)}>
          <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chi tiết báo cáo</h2>
                    <p className="text-sm text-red-100">Thông tin chi tiết báo cáo tháng</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-white/60">
                      <FileText size={14} className="text-red-600" />
                    </div>
                    <span className="text-xs font-medium text-red-600">Học sinh</span>
                  </div>
                  <p className="text-base font-bold text-gray-900 leading-tight">{displayReport.studentName || displayReport.studentProfileId || "N/A"}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-white/60">
                      <Building2 size={14} className="text-amber-600" />
                    </div>
                    <span className="text-xs font-medium text-amber-600">Lớp</span>
                  </div>
                  <p className="text-base font-bold text-gray-900 leading-tight">{displayReport.className || displayReport.classId || "N/A"}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-white/60">
                      <CalendarDays size={14} className="text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-blue-600">Tháng/Năm</span>
                  </div>
                  <p className="text-base font-bold text-gray-900 leading-tight">{displayReport.month}/{displayReport.year}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-white/60">
                      <Clock size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-emerald-600">Trạng thái</span>
                  </div>
                  <div className="mt-1"><StatusBadge status={displayReport.status} /></div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Nội dung báo cáo - chiếm 3/5 */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <FileBarChart size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Nội dung báo cáo</h3>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">{draftInput || "Chưa có nội dung nháp."}</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar - chiếm 2/5 */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Thông tin giáo viên */}
                  <div className="rounded-2xl bg-gradient-to-br from-white to-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-red-100">
                        <Send size={16} className="text-red-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700">Giáo viên</h3>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                        {displayReport.teacherName ? displayReport.teacherName.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{displayReport.teacherName || "N/A"}</p>
                        <p className="text-xs text-gray-500">Giáo viên phụ trách</p>
                      </div>
                    </div>
                    {displayReport.pdfUrl && (
                      <a
                        href={displayReport.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-red-100">
                          <FileBarChart size={16} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">File PDF đính kèm</p>
                          <p className="text-sm font-medium text-red-600 hover:text-red-700">Xem chi tiết →</p>
                        </div>
                      </a>
                    )}
                  </div>

                  {/* Góp ý từ Staff/Admin */}
                  {displayReport.comments && displayReport.comments.length > 0 && (
                    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-100">
                            <MessageSquare size={16} className="text-amber-600" />
                          </div>
                          <h3 className="text-sm font-semibold text-gray-700">Góp ý từ Staff</h3>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          {displayReport.comments.length}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {displayReport.comments.slice().reverse().map((c) => (
                          <div key={c.id} className="p-3 rounded-xl bg-white border border-amber-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {c.authorName ? c.authorName.charAt(0).toUpperCase() : "S"}
                              </div>
                              <span className="font-medium text-gray-900 text-xs">{c.authorName || c.commenterName || "Staff/Admin"}</span>
                              {c.createdAt && (
                                <span className="text-[10px] text-gray-400 ml-auto">{formatDateTime(c.createdAt)}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed pl-7">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Comment Modal — portal */}
      {commentModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeCommentDialog}>
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <MessageSquare size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Gửi góp ý cho giáo viên</h2>
                    <p className="text-sm text-red-100">Nội dung sẽ hiển thị trong báo cáo</p>
                  </div>
                </div>
                <button
                  onClick={closeCommentDialog}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Nhập góp ý cho giáo viên..."
                />
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={commentRejectAfterSend}
                    onChange={(e) => setCommentRejectAfterSend(e.target.checked)}
                    className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                  />
                  Đồng thời trả report về teacher để sửa lại (Reject)
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  className="px-5 py-2 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={closeCommentDialog}
                >
                  Hủy
                </button>
                <button
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!commentReportId || actionLoading[`${commentReportId}:comments`]}
                  onClick={submitComment}
                >
                  {commentReportId && actionLoading[`${commentReportId}:comments`]
                    ? "Đang gửi..."
                    : "Gửi góp ý"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
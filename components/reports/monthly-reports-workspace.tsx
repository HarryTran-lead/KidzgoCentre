"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileBarChart,
  FileText,
  Send,
} from "lucide-react";
import type { ClassItem, Student } from "@/types/teacher/classes";
import { fetchClassDetail, fetchTeacherClasses } from "@/app/api/teacher/classes";
import type { SessionReportItem } from "@/types/teacher/sessionReport";
import OverviewTab from "@/components/reports/monthly-tabs/overview-tab";
import TeacherToolsTab from "@/components/reports/monthly-tabs/teacher-tools-tab";
import ManageToolsTab from "@/components/reports/monthly-tabs/manage-tools-tab";
import ReportsTab from "@/components/reports/monthly-tabs/reports-tab";

type MonthlyRole = "teacher" | "management" | "viewer";
type ReportStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Published" | string;
type WorkspaceTab = "overview" | "reports" | "teacher-tools" | "manage-tools";

const STATUS_ALIAS: Record<string, string> = {
  Review: "Submitted",
};

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
  return date.toLocaleString("vi-VN");
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
  const map: Record<string, string> = {
    Draft: "bg-amber-50 text-amber-700 border-amber-200",
    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
    Published: "bg-purple-50 text-purple-700 border-purple-200",
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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${
        map[displayStatus] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {icons[displayStatus] || <FileText size={12} />}
      {displayStatus}
    </span>
  );
}

export default function MonthlyReportsWorkspace({ role }: { role: MonthlyRole }) {
  const [jobs, setJobs] = useState<MonthlyJob[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả");

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [branchId, setBranchId] = useState("");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [classQuery, setClassQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
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

  const canManage = role === "management";
  const isTeacher = role === "teacher";
  const isViewer = role === "viewer";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(isViewer ? "reports" : "overview");

  const workspaceTabs = useMemo(() => {
    const tabs: Array<{ id: WorkspaceTab; label: string }> = [
      { id: "overview", label: "Tổng quan" },
      { id: "reports", label: "Danh sách báo cáo" },
    ];
    if (isTeacher) tabs.push({ id: "teacher-tools", label: "Công cụ giáo viên" });
    if (canManage) tabs.push({ id: "manage-tools", label: "Điều phối quản lý" });
    return tabs;
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

  const createJob = async () => {
    if (!branchId.trim()) return setError("Vui lòng chọn chi nhánh.");
    try {
      await apiFetch("/api/monthly-reports/jobs", {
        method: "POST",
        body: JSON.stringify({ month, year, branchId }),
      });
      setMessage("Đã khởi tạo đợt báo cáo tháng.");
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể khởi tạo đợt báo cáo.");
    }
  };

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
      const statusOk = statusFilter === "Tất cả" || r.status === statusFilter;
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

  const normalizeStatus = (status: ReportStatus) => STATUS_ALIAS[status] ?? status;

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


  const activeReportSource = isTeacher ? teacherWorkflowReports : filteredReports;

  const activeReport = useMemo(
    () => activeReportSource.find((r) => r.id === activeReportId) || activeReportSource[0],
    [activeReportId, activeReportSource],
  );

  const displayReport = activeReportDetail ?? activeReport;

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
    const query = new URLSearchParams({
      studentProfileId: selectedStudentId,
      classId: selectedClassId,
      fromDate,
      toDate,
      pageNumber: "1",
      pageSize: "50",
    });

    apiFetch<SessionReportPayload>(`/api/session-reports?${query.toString()}`)
      .then((result) => {
        if (!alive) return;
        setSessionReports(getPaginatedItems(result, "sessionReports"));
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
    }

    const skippedText = skipped > 0 ? `, bỏ qua ${skipped} báo cáo không đúng trạng thái` : "";
    setMessage(`Đã ${action} ${succeeded} báo cáo${skippedText}.`);
    setBulkLoading("");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-white p-4 md:p-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white">
              <FileBarChart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feedback lớp học theo tháng</h1>
              <p className="text-sm text-gray-600">
                Quy trình dễ dùng: Giáo viên nộp báo cáo &rarr; Quản lý duyệt/góp ý &rarr; Công bố cho phụ huynh và học viên.

              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isTeacher && (
              <>
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                />
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </>
            )}
            {canManage && (
              <select
                className="rounded-xl border px-3 py-2 text-sm min-w-56"
                value={branchId}
                onChange={() => {}}
                disabled
                title="Chi nhánh đồng bộ theo bộ lọc ở sidebar"
              >
                <option value="">
                  {branchesLoading ? "Đang tải chi nhánh..." : "Chọn chi nhánh"}
                </option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name || branch.code || branch.id}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleManualRefresh}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
            >
              Làm mới
            </button>
            {canManage && (
              <button
                onClick={createJob}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white"
              >
                Khởi tạo đợt báo cáo
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {message && (
          <p className="mt-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="text-sm text-red-600">Tổng báo cáo</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="text-sm text-amber-600">Bản nháp</div>
          <div className="text-2xl font-bold">{stats.drafts}</div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="text-sm text-blue-600">Đã nộp</div>
          <div className="text-2xl font-bold">{stats.submitted}</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="text-sm text-emerald-600">Đã duyệt</div>
          <div className="text-2xl font-bold">{stats.approved}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {workspaceTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-red-50 hover:text-red-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="px-2 pt-2 text-xs text-slate-600">
          {activeTab === "overview" && "Tổng quan: xem số liệu nhanh và hạng mục ưu tiên."}
          {activeTab === "reports" && "Danh sách báo cáo: tìm kiếm, lọc, duyệt và xem chi tiết từng báo cáo."}
          {activeTab === "teacher-tools" && "Công cụ giáo viên: chọn lớp/học sinh, xem dữ liệu buổi học, tạo nháp AI."}
          {activeTab === "manage-tools" && "Điều phối quản lý: lọc theo lớp, duyệt/công bố hàng loạt, theo dõi tiến độ."}
        </p>
      </div>

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
          openReportDetail={openReportDetail}
        />
      )}

      {activeTab === "manage-tools" && canManage && showManageTools && (
        <ManageToolsTab
          month={month}
          year={year}
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
          renderStatusBadge={(status) => <StatusBadge status={status} />}
        />
      )}

      {detailModalOpen && displayReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Báo cáo chi tiết</h3>
                <p className="text-sm text-gray-500">
                  {displayReport.studentName || displayReport.studentProfileId} •{" "}
                  {displayReport.className || displayReport.classId || "N/A"} •{" "}
                  {displayReport.month}/{displayReport.year}
                </p>
              </div>
              <button
                className="rounded border px-3 py-1 text-sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <StatusBadge status={displayReport.status} />
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 text-sm text-gray-700 whitespace-pre-line">
                {draftInput || "Chưa có nội dung nháp."}
              </div>
            </div>
          </div>
        </div>
      )}

      {commentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gửi comment cho giáo viên</h3>
              <button className="rounded border px-3 py-1 text-sm" onClick={closeCommentDialog}>
                Đóng
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Nội dung này sẽ hiển thị ở phần bình luận của report.
            </p>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              rows={5}
              className="mt-3 w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
              placeholder="Nhập góp ý..."
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={commentRejectAfterSend}
                onChange={(e) => setCommentRejectAfterSend(e.target.checked)}
              />
              Đồng thời trả report về teacher để sửa lại (Reject)
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={closeCommentDialog}
              >
                Hủy
              </button>
              <button
                className="rounded bg-pink-600 px-3 py-2 text-sm text-white disabled:bg-slate-300"
                disabled={!commentReportId || actionLoading[`${commentReportId}:comments`]}
                onClick={submitComment}
              >
                {commentReportId && actionLoading[`${commentReportId}:comments`]
                  ? "Đang gửi..."
                  : "Gửi comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileBarChart,
  FileCheck,
  FileText,
  Filter,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import type { ClassItem, Student } from "@/types/teacher/classes";
import { fetchClassDetail, fetchTeacherClasses } from "@/app/api/teacher/classes";
import type { SessionReportItem } from "@/types/teacher/sessionReport";

type MonthlyRole = "teacher" | "management" | "viewer";
type ReportStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Published" | string;

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

  if (key && key in payload) {
    const nested = payload[key] as Paginated<T> | undefined;
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
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as DraftPayload;
      return parsed?.draft_text ?? parsed?.draftText ?? trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
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

  const canManage = role === "management";
  const isTeacher = role === "teacher";
  const isViewer = role === "viewer";

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
      setMessage("Đã tạo monthly report job.");
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tạo job.");
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
        setActiveReportDetail((prev) => {
          if (!prev) return prev;
          const nextComments = Array.isArray(prev.comments) ? [...prev.comments, result] : [result];
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
      return statusOk && textOk && classOk && studentOk;
    });
  }, [isTeacher, reports, searchQuery, selectedClassId, selectedStudentId, statusFilter]);

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


  const activeReport = useMemo(
    () => filteredReports.find((r) => r.id === activeReportId) || filteredReports[0],
    [filteredReports, activeReportId],
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
    if (!filteredReports.length) {
      setActiveReportId(null);
      return;
    }

    if (activeReportId && filteredReports.some((r) => r.id === activeReportId)) return;

    setActiveReportId(filteredReports[0].id);
  }, [activeReportId, filteredReports]);

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

  const openReportFromComment = (reportId: string) => {
    focusReport(reportId);
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
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6 space-y-6">
      <div className="rounded-2xl border border-red-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white">
              <FileBarChart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Báo cáo tháng (workflow chuẩn)</h1>
              <p className="text-sm text-gray-600">
                Gom dữ liệu buổi học → Teacher draft/edit/submit → Staff/Admin review (comment nếu
                cần chỉnh) → Teacher sửa lại → Staff/Admin approve → Publish cho parent/student.
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
              onClick={fetchData}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
            >
              Làm mới
            </button>
            {canManage && (
              <button
                onClick={createJob}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white"
              >
                Tạo Job
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {message && (
          <p className="mt-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-red-200 bg-white p-4">
          <div className="text-sm text-red-600">Tổng báo cáo</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-white p-4">
          <div className="text-sm text-amber-600">Bản nháp</div>
          <div className="text-2xl font-bold">{stats.drafts}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-white p-4">
          <div className="text-sm text-blue-600">Đã nộp</div>
          <div className="text-2xl font-bold">{stats.submitted}</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-white p-4">
          <div className="text-sm text-emerald-600">Đã duyệt</div>
          <div className="text-2xl font-bold">{stats.approved}</div>
        </div>
      </div>

      {isTeacher && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold">Tổng quan lớp trong tháng {month}/{year}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
              <div className="text-xs text-gray-600">Tổng lớp dạy</div>
              <div className="text-xl font-bold">{teacherClassSummary.total}</div>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
              <div className="text-xs text-gray-600">Chưa có báo cáo</div>
              <div className="text-xl font-bold">{teacherClassSummary.noReport}</div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
              <div className="text-xs text-gray-600">Đang làm</div>
              <div className="text-xl font-bold">{teacherClassSummary.inProgress}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <div className="text-xs text-gray-600">Đã báo cáo</div>
              <div className="text-xl font-bold">{teacherClassSummary.completed}</div>
            </div>
          </div>

          <div className="max-h-52 overflow-auto rounded-xl border border-red-100">
            <table className="w-full text-xs">
              <thead className="bg-red-50/60 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2">Lớp</th>
                  <th className="px-3 py-2">Tiến độ</th>
                  <th className="px-3 py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {teacherClassStatusRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{row.name}</div>
                      <div className="text-gray-500">{row.code || row.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.reportCount}/{row.expectedStudents || "?"} học sinh có báo cáo
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] ${row.statusClass}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
                {!teacherClassStatusRows.length && (
                  <tr>
                    <td className="px-3 py-3 text-gray-500" colSpan={3}>
                      Chưa có dữ liệu lớp trong tháng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isTeacher && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold">Việc cần làm nhanh</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <button
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left"
              onClick={() => setStatusFilter("Draft")}
            >
              <div className="text-xs text-gray-600">Đang là nháp</div>
              <div className="text-xl font-bold text-amber-700">{teacherTaskSummary.draftCount}</div>
            </button>
            <button
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-left"
              onClick={() => setStatusFilter("Rejected")}
            >
              <div className="text-xs text-gray-600">Bị trả về sửa</div>
              <div className="text-xl font-bold text-rose-700">{teacherTaskSummary.rejectedCount}</div>
            </button>
            <button
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-left"
              onClick={() => setStatusFilter("Tất cả")}
            >
              <div className="text-xs text-gray-600">Có góp ý từ admin/staff</div>
              <div className="text-xl font-bold text-blue-700">{teacherTaskSummary.hasCommentCount}</div>
            </button>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Danh sách ưu tiên xử lý</div>
            <div className="grid gap-2 md:grid-cols-2">
              {teacherPriorityReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => focusReport(report.id)}
                  className="rounded-lg border border-red-100 bg-red-50/40 p-2 text-left text-xs hover:bg-red-100/60"
                >
                  <div className="font-semibold text-gray-900">
                    {report.studentName || report.studentProfileId || report.id}
                  </div>
                  <div className="text-gray-600">{report.className || report.classId || "N/A"}</div>
                  <div className="mt-1">
                    <StatusBadge status={report.status} />
                  </div>
                </button>
              ))}
              {teacherPriorityReports.length === 0 && (
                <p className="text-xs text-gray-500">Không có report cần ưu tiên xử lý.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {canManage && (
        <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h3 className="font-semibold">Bảng điều phối review Admin/Staff</h3>
            <div className="text-xs text-gray-600">
              Ưu tiên xử lý theo thứ tự: Submitted → Rejected → Approved.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <button
              className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-left"
              onClick={() => setStatusFilter("Submitted")}
            >
              <div className="text-xs text-gray-600">Chờ duyệt</div>
              <div className="text-xl font-bold text-blue-700">{adminSummary.pendingReview}</div>
            </button>
            <button
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-left"
              onClick={() => setStatusFilter("Rejected")}
            >
              <div className="text-xs text-gray-600">Đã trả teacher sửa</div>
              <div className="text-xl font-bold text-rose-700">{adminSummary.needTeacherFix}</div>
            </button>
            <button
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left"
              onClick={() => setStatusFilter("Approved")}
            >
              <div className="text-xs text-gray-600">Sẵn sàng publish</div>
              <div className="text-xl font-bold text-emerald-700">{adminSummary.readyToPublish}</div>
            </button>
            <button
              className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-left"
              onClick={() => setStatusFilter("Published")}
            >
              <div className="text-xs text-gray-600">Đã publish</div>
              <div className="text-xl font-bold text-purple-700">{adminSummary.published}</div>
            </button>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
            <div className="mb-2 text-xs font-semibold text-gray-700">Hàng đợi xử lý nhanh</div>
            <div className="grid gap-2 md:grid-cols-2">
              {adminPriorityReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => focusReport(report.id)}
                  className="rounded-lg border border-red-100 bg-white p-2 text-left text-xs hover:bg-red-50"
                >
                  <div className="font-semibold text-gray-900">
                    {report.studentName || report.studentProfileId || report.id}
                  </div>
                  <div className="text-gray-600">{report.className || report.classId || "N/A"}</div>
                  <div className="mt-1">
                    <StatusBadge status={report.status} />
                  </div>
                </button>
              ))}
              {!adminPriorityReports.length && (
                <p className="text-xs text-gray-500">Không có report cần xử lý ngay.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isTeacher && (
            <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-4">
              <h3 className="font-semibold">Luồng làm việc Teacher</h3>
              <p className="text-xs text-gray-600">
                1) Chọn lớp đang dạy → 2) Chọn tháng/năm → 3) Chọn học sinh → 4) Xem dữ liệu theo
                buổi và Generate AI draft → 5) Chỉnh sửa rồi Submit → 6) Nhận comment (nếu có) →
                7) Sửa lại và Submit → 8) Staff/Admin approve → 9) Publish cho parent/student.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Tìm lớp</label>
                  <input
                    value={classQuery}
                    onChange={(e) => setClassQuery(e.target.value)}
                    placeholder="Nhập tên lớp..."
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="text-xs text-gray-600">
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700">Chọn thời gian trước</div>
                    <div className="flex gap-2">
                      <input
                        className="w-24 rounded-xl border px-3 py-2 text-sm"
                        type="number"
                        min={1}
                        max={12}
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                      />
                      <input
                        className="w-28 rounded-xl border px-3 py-2 text-sm"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                      />
                    </div>
                    <div>Khuyến nghị chọn tháng/năm trước rồi mới chọn lớp và học sinh.</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-red-100 p-3">
                  <div className="mb-2 text-xs font-semibold text-gray-700">
                    Danh sách lớp ({teacherClasses.length})
                  </div>
                  <div className="max-h-40 space-y-1 overflow-auto">
                    {classesLoading && (
                      <p className="text-xs text-gray-500">Đang tải lớp...</p>
                    )}
                    {classesError && <p className="text-xs text-red-500">{classesError}</p>}
                    {teacherClasses.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedClassId(item.id);
                          setSelectedStudentId(null);
                          setSessionReports([]);
                        }}
                        className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                          selectedClassId === item.id
                            ? "bg-red-600 text-white"
                            : "bg-red-50 text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div>{item.students} học sinh • {item.code}</div>
                      </button>
                    ))}
                    {!classesLoading && !teacherClasses.length && (
                      <p className="text-xs text-gray-500">Chưa có lớp phù hợp.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 p-3">
                  <div className="mb-2 text-xs font-semibold text-gray-700">
                    Danh sách học sinh {selectedClassId ? `(${classStudents.length})` : ""}
                  </div>
                  <div className="max-h-40 space-y-1 overflow-auto">
                    {studentsLoading && (
                      <p className="text-xs text-gray-500">Đang tải học sinh...</p>
                    )}
                    {studentsError && <p className="text-xs text-red-500">{studentsError}</p>}
                    {classStudents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedStudentId(item.id)}
                        className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                          selectedStudentId === item.id
                            ? "bg-indigo-600 text-white"
                            : "bg-indigo-50 text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div>Student ID: {item.id.slice(0, 8)}</div>
                      </button>
                    ))}
                    {selectedClassId && !studentsLoading && !classStudents.length && (
                      <p className="text-xs text-gray-500">Lớp này chưa có monthly report.</p>
                    )}
                    {!selectedClassId && (
                      <p className="text-xs text-gray-500">Vui lòng chọn lớp trước.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50/30 p-3">
                <div className="mb-2 text-xs font-semibold text-gray-700">
                  Buổi học trong thời gian đã chọn
                </div>
                {!selectedStudentId && (
                  <p className="text-xs text-gray-500">
                    Chọn học sinh để xem nhận xét buổi học.
                  </p>
                )}
                {selectedStudentId && (
                  <div className="space-y-2">
                    {sessionsLoading && (
                      <p className="text-xs text-gray-500">Đang tải nhận xét buổi học...</p>
                    )}
                    {sessionsError && <p className="text-xs text-red-500">{sessionsError}</p>}
                    {!sessionsLoading && !sessionReports.length && (
                      <p className="text-xs text-gray-500">Chưa có nhận xét buổi học.</p>
                    )}
                    {!activeReport && (
                      <p className="text-xs text-amber-700">
                        Chưa có monthly report cho học sinh này ở {month}/{year}. Vui lòng chọn tháng khác
                        hoặc nhờ Staff/Admin tạo job và aggregate trước.
                      </p>
                    )}
                    {sessionReports.map((report) => (
                      <div key={report.id ?? report.sessionId} className="rounded-lg border bg-white p-2 text-xs">
                        <div className="font-semibold">
                          {report.reportDate ? `Ngày: ${report.reportDate}` : "Buổi học"}
                        </div>
                        <div className="text-gray-600">
                          {report.feedback || "Chưa có nhận xét."}
                        </div>
                      </div>
                    ))}
                    <button
                      disabled={!activeReport || actionLoading[`${displayReport?.id}:generate-draft`]}
                      onClick={() => activeReport && runAction(displayReport.id, "generate-draft")}
                      className="w-full rounded bg-purple-600 px-3 py-2 text-xs text-white disabled:bg-slate-300"
                    >
                      {actionLoading[`${displayReport?.id}:generate-draft`]
                        ? "Đang tổng hợp AI..."
                        : "AI tổng hợp và tạo nháp báo cáo tháng"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {canManage && (
            <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
              <h3 className="font-semibold">Luồng làm việc Staff/Admin</h3>
              <p className="text-xs text-gray-600">
                1) Xem danh sách báo cáo đã nộp (Submitted/Review) → 2) Comment nếu cần chỉnh sửa →
                3) Chờ teacher sửa và submit lại → 4) Approve → 5) Publish cho parent/student.
              </p>
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-3 text-xs text-gray-700">
                Nếu cần góp ý: dùng nút Comment để gửi phản hồi. Báo cáo chỉ Publish khi đã Approve.
              </div>
            </div>
          )}
          {canManage && (
            <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-4">
              <h3 className="font-semibold">Lọc theo lớp/học viên</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Tìm lớp</label>
                  <input
                    value={classQuery}
                    onChange={(e) => setClassQuery(e.target.value)}
                    placeholder="Nhập tên lớp..."
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Đang xem thời gian: <span className="font-semibold">{month}/{year}</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-red-100 p-3">
                  <div className="mb-2 text-xs font-semibold text-gray-700">
                    Danh sách lớp ({managementClasses.length})
                  </div>
                  <div className="max-h-40 space-y-1 overflow-auto">
                    {managementClasses.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedClassId(item.id);
                          setSelectedStudentId(null);
                        }}
                        className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                          selectedClassId === item.id
                            ? "bg-red-600 text-white"
                            : "bg-red-50 text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div>{item.reportCount} báo cáo</div>
                      </button>
                    ))}
                    {!managementClasses.length && (
                      <p className="text-xs text-gray-500">Chưa có lớp phù hợp.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 p-3">
                  <div className="mb-2 text-xs font-semibold text-gray-700">
                    Danh sách học sinh {selectedClassId ? `(${managementStudents.length})` : ""}
                  </div>
                  <div className="max-h-40 space-y-1 overflow-auto">
                    {managementStudents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedStudentId(item.id)}
                        className={`w-full rounded-lg px-2 py-2 text-left text-xs ${
                          selectedStudentId === item.id
                            ? "bg-indigo-600 text-white"
                            : "bg-indigo-50 text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div>{item.reportCount} báo cáo</div>
                      </button>
                    ))}
                    {selectedClassId && !managementStudents.length && (
                      <p className="text-xs text-gray-500">Lớp này chưa có báo cáo.</p>
                    )}
                    {!selectedClassId && (
                      <p className="text-xs text-gray-500">Vui lòng chọn lớp trước.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {canManage && (
            <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
              <h3 className="font-semibold">Hành động nhanh</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={!selectedClassId || bulkLoading !== ""}
                  className="rounded bg-emerald-600 px-3 py-2 text-xs text-white disabled:bg-slate-300"
                  onClick={() => {
                    const classIds = reports
                      .filter((report) => report.classId === selectedClassId)
                      .map((report) => report.id);
                    runBulkAction("approve", classIds);
                  }}
                >
                  {bulkLoading === "approve" ? "Đang approve lớp..." : "Approve lớp"}
                </button>
                <button
                  disabled={!selectedClassId || bulkLoading !== ""}
                  className="rounded bg-sky-600 px-3 py-2 text-xs text-white disabled:bg-slate-300"
                  onClick={() => {
                    const classIds = reports
                      .filter((report) => report.classId === selectedClassId)
                      .map((report) => report.id);
                    runBulkAction("publish", classIds);
                  }}
                >
                  {bulkLoading === "publish" ? "Đang publish lớp..." : "Publish lớp"}
                </button>
              </div>
              <p className="text-xs text-gray-600">
                Chọn lớp ở trên để áp dụng approve/publish toàn bộ học viên trong lớp đó.
              </p>
            </div>
          )}
          {canManage && (
            <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
              <h3 className="font-semibold">Tiến độ lớp theo tháng</h3>
              <p className="text-xs text-gray-600">
                Tổng hợp theo báo cáo tháng {month}/{year}. Hoàn thành khi tất cả báo cáo trong lớp
                đã Publish.
              </p>
              <div className="max-h-48 space-y-2 overflow-auto">
                {managementClassProgress.map((item) => {
                  const completed = item.total > 0 && item.published === item.total;
                  return (
                    <div key={item.id} className="rounded-lg border p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{item.name}</div>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] ${
                            completed
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-600">
                        Tổng: {item.total} • Published: {item.published} • Approved: {item.approved} • Chờ xử lý:{" "}
                        {item.pending}
                      </div>
                    </div>
                  );
                })}
                {!managementClassProgress.length && (
                  <p className="text-xs text-gray-500">Chưa có dữ liệu báo cáo trong tháng này.</p>
                )}
              </div>
            </div>
          )}
          {isViewer && (
            <div className="rounded-2xl border border-red-200 bg-white p-4 space-y-3">
              <h3 className="font-semibold">Luồng xem Parent/Student</h3>
              <p className="text-xs text-gray-600">
                Chỉ xem được báo cáo đã Publish. Dùng bộ lọc để tìm theo tháng/năm hoặc học sinh.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-red-200 bg-white p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xl">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo học sinh, giáo viên, mã report..."
                className="w-full rounded-xl border border-red-200 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm"
              >
                {["Tất cả", "Draft", "Submitted", "Approved", "Rejected", "Published", "Review"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {isTeacher && (
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "Tất cả" ? "bg-red-600 text-white border-red-600" : "bg-white"}`}
                onClick={() => setStatusFilter("Tất cả")}
              >
                Tất cả
              </button>
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "Draft" ? "bg-amber-600 text-white border-amber-600" : "bg-white"}`}
                onClick={() => setStatusFilter("Draft")}
              >
                Cần submit
              </button>
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "Rejected" ? "bg-rose-600 text-white border-rose-600" : "bg-white"}`}
                onClick={() => setStatusFilter("Rejected")}
              >
                Cần sửa lại
              </button>
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "Submitted" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
                onClick={() => setStatusFilter("Submitted")}
              >
                Đang chờ duyệt
              </button>
            </div>
          )}

          {canManage && (
            <div className="rounded-2xl border border-red-200 bg-white p-3 text-xs text-gray-700 flex flex-wrap items-center gap-2">
              <span>Đã chọn: {selectedReportIds.size}</span>
              <button
                className="rounded border px-2 py-1"
                onClick={selectAllVisible}
                disabled={!filteredReports.length}
              >
                Chọn tất cả
              </button>
              <button className="rounded border px-2 py-1" onClick={clearSelection}>
                Bỏ chọn
              </button>
              <button
                className="rounded bg-emerald-600 px-2 py-1 text-white disabled:bg-slate-300"
                disabled={selectedReportIds.size === 0 || bulkLoading !== ""}
                onClick={() => runBulkAction("approve", Array.from(selectedReportIds))}
              >
                {bulkLoading === "approve" ? "Đang approve..." : "Approve selected"}
              </button>
              <button
                className="rounded bg-sky-600 px-2 py-1 text-white disabled:bg-slate-300"
                disabled={selectedReportIds.size === 0 || bulkLoading !== ""}
                onClick={() => runBulkAction("publish", Array.from(selectedReportIds))}
              >
                {bulkLoading === "publish" ? "Đang publish..." : "Publish selected"}
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-red-200 bg-white overflow-hidden">
            <div className="border-b border-red-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold">Danh sách báo cáo ({filteredReports.length})</h3>
              {loading && <span className="text-sm text-gray-500">Đang tải...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-50/60 text-left text-xs uppercase text-gray-600">
                  <tr>
                    {canManage && <th className="px-4 py-3">Chọn</th>}
                    <th className="px-4 py-3">Báo cáo</th>
                    <th className="px-4 py-3">Giáo viên</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-red-50/40 cursor-pointer"
                      onClick={() => setActiveReportId(report.id)}
                    >
                      {canManage && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedReportIds.has(report.id)}
                            onChange={() => toggleReportSelection(report.id)}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          {report.studentName || report.studentProfileId || report.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {report.className || report.classId || "N/A"} • {report.month}/{report.year}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1">
                          <User size={12} />
                          {report.teacherName || "Teacher"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="rounded border px-2 py-1 text-xs"
                            onClick={() => {
                              setActiveReportId(report.id);
                              setDetailModalOpen(true);
                            }}
                          >
                            <Eye size={12} />
                          </button>
                          {isTeacher && (
                            <button
                              className="rounded bg-purple-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                              disabled={actionLoading[`${report.id}:generate-draft`]}
                              onClick={() => runAction(report.id, "generate-draft")}
                            >
                              {actionLoading[`${report.id}:generate-draft`] ? "Đang tạo..." : <Sparkles size={12} />}
                            </button>
                          )}
                          {isTeacher && (
                            <button
                              disabled={!canTeacherSubmit(report.status)}
                              className="rounded bg-indigo-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                              onClick={() => runAction(report.id, "submit")}
                            >
                              Submit
                            </button>
                          )}
                          {canManage && (
                            <button
                              className="rounded bg-pink-600 px-2 py-1 text-xs text-white"
                              onClick={() => openCommentDialog(report.id)}
                            >
                              Comment
                            </button>
                          )}
                          {canManage && (
                            <button
                              disabled={!canManagementApprove(report.status)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                              onClick={() => runAction(report.id, "approve")}
                            >
                              Approve
                            </button>
                          )}
                          {canManage && (
                            <button
                              disabled={!canManagementApprove(report.status)}
                              className="rounded bg-amber-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                              onClick={() => runAction(report.id, "reject")}
                            >
                              Reject
                            </button>
                          )}
                          {canManage && (
                            <button
                              disabled={!canManagementPublish(report.status)}
                              className="rounded bg-sky-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                              onClick={() => runAction(report.id, "publish")}
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReports.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">Không có báo cáo phù hợp.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-white p-4">
            <h3 className="mb-2 font-semibold flex items-center gap-2">
              <FileCheck size={16} /> Chi tiết report
            </h3>
            {displayReport ? (
              <div className="space-y-2 text-sm">
                {detailLoading && <div className="text-xs text-gray-500">Đang tải chi tiết...</div>}
                {detailError && <div className="text-xs text-red-500">{detailError}</div>}
                <div className="font-semibold">
                  {displayReport.studentName || displayReport.studentProfileId}
                </div>
                <div className="text-gray-600">
                  {displayReport.className || displayReport.classId || "N/A"}
                </div>
                <StatusBadge status={displayReport.status} />
                <div className="text-xs text-gray-500">Teacher: {displayReport.teacherName || "N/A"}</div>
                {isTeacher && (
                  <button
                    disabled={!canTeacherSubmit(displayReport.status)}
                    className="mt-2 w-full rounded bg-cyan-700 px-3 py-2 text-xs font-medium text-white disabled:bg-slate-300"
                    onClick={() =>
                      runAction(displayReport.id, "draft", "PUT", {
                        draftContent: draftInput || "",
                      })
                    }
                  >
                    {actionLoading[`${displayReport.id}:draft`] ? "Đang lưu..." : "Update Draft (manual)"}
                  </button>
                )}
                {isTeacher && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Nội dung nháp (có thể edit)
                    </label>
                    <textarea
                      value={draftInput}
                      onChange={(e) => setDraftInput(e.target.value)}
                      rows={6}
                      placeholder="Nhập nội dung nháp..."
                      className="w-full rounded-xl border border-red-200 px-3 py-2 text-xs"
                    />
                  </div>
                )}
                {isTeacher && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-gray-700">
                    <div className="font-semibold text-gray-900">Góp ý từ Staff/Admin</div>
                    {displayReport.comments?.length ? (
                      <ul className="mt-2 space-y-2">
                        {(displayReport.comments ?? []).slice().reverse().map((c) => (
                          <li key={c.id} className="rounded border border-amber-100 bg-white p-2">
                            <div className="font-medium text-gray-900">
                              {c.authorName || c.commenterName || "Staff/Admin"}
                            </div>
                            <div className="mt-1 whitespace-pre-line">{c.content}</div>
                            {c.createdAt && (
                              <div className="mt-1 text-[11px] text-gray-500">{formatDateTime(c.createdAt)}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-gray-600">Chưa có góp ý.</p>
                    )}
                  </div>
                )}
                {isTeacher && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-gray-700">
                    <div className="font-semibold text-gray-900">Dữ liệu theo buổi học</div>
                    <p className="mt-1">
                      Sau khi bấm AI Generate Draft, Teacher có thể đọc bản nháp, chỉnh sửa nội dung theo góp ý comment
                      của Staff/Admin rồi Submit lại.
                    </p>
                  </div>
                )}
                <button className="w-full rounded border border-red-200 px-3 py-2 text-xs">
                  <Download size={12} className="inline mr-1" /> Export/PDF
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Chọn report để xem chi tiết.</p>
            )}
          </div>

          {canManage && (
            <div className="rounded-2xl border border-red-200 bg-white p-4">
              <h3 className="mb-2 font-semibold flex items-center gap-2">
                <TrendingUp size={16} /> Tiến độ thu thập
              </h3>
              <p className="text-sm text-gray-600">
                Jobs tháng {month}/{year}: {jobs.length}
              </p>
              <div className="mt-2 space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border p-2 text-xs">
                    <div>
                      {job.month}/{job.year} • {job.status}
                    </div>
                    <button
                      className="mt-1 rounded bg-blue-600 px-2 py-1 text-white"
                      onClick={() =>
                        apiFetch(`/api/monthly-reports/jobs/${job.id}/aggregate`, { method: "POST" }).then(fetchData)
                      }
                    >
                      Aggregate
                    </button>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-xs text-gray-500">Chưa có job.</p>}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-red-200 bg-white p-4">
            <h3 className="mb-2 font-semibold flex items-center gap-2">
              <MessageSquare size={16} /> Bình luận gần nhất
            </h3>
            {recentCommentsLoading && <p className="text-xs text-gray-500">Đang tải bình luận...</p>}
            {!recentCommentsLoading && recentComments.length ? (
              <ul className="space-y-2 text-xs">
                {recentComments.slice(0, 3).map((c) => (
                  <li
                    key={c.id}
                    className="rounded border p-2 cursor-pointer hover:bg-red-50/40"
                    onClick={() => openReportFromComment(c.reportId)}
                  >
                    <div className="font-medium text-gray-900">
                      {c.studentName || "Học viên"} • {c.className || "N/A"}
                    </div>
                    <div className="mt-1">
                      {c.authorName || "Staff/Admin"}: {c.content}
                    </div>
                    {c.createdAt && <div className="mt-1 text-[11px] text-gray-500">{formatDateTime(c.createdAt)}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">Chưa có bình luận.</p>
            )}
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-3 text-xs text-gray-600 flex items-center gap-2">
            <Zap size={14} className="text-red-500" /> Report flow đã gắn role: Teacher / Staff-Admin / Viewer.
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 flex items-center gap-2">
        <Users size={12} /> Viewer chỉ thấy Published là do API filter theo role viewer.
      </div>

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

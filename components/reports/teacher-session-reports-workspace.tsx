"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  Edit3, 
  RefreshCcw, 
  Send, 
  XCircle,
  FileText,
  AlertCircle,
  Search,
  ArrowUpDown,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Users,
  Building2,
  GraduationCap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type SessionReportStatus = "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | string;

type SessionReport = {
  id: string;
  sessionId?: string;
  studentProfileId?: string;
  studentName?: string;
  classId?: string;
  className?: string;
  teacherUserId?: string;
  teacherName?: string;
  reportDate?: string;
  feedback?: string;
  reason?: string;
  comment?: string;
  comments?: Array<{ id?: string; content?: string; comment?: string; createdAt?: string; authorName?: string; commenterName?: string }>;
  status?: SessionReportStatus;
  createdAt?: string;
  updatedAt?: string;
};

type Paginated<T> = { items?: T[]; data?: T[] };
type SessionReportPayload = Paginated<Record<string, unknown>> & {
  sessionReports?: Paginated<Record<string, unknown>> | Record<string, unknown>[];
};

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
    throw new Error(extractErrorMessage(payload, "Không thể xử lý session report."));
  }

  return (payload?.data ?? payload) as T;
}

function pick(raw: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return undefined;
}

function extractErrorMessage(payload: any, fallback: string) {
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const detail = typeof payload?.detail === "string" ? payload.detail.trim() : "";
  if (title === "SessionReport.InvalidStatus" && detail) {
    return "Không thể gửi duyệt session report đã ở trạng thái Published.";
  }

  const message =
    payload?.message ||
    payload?.detail ||
    payload?.error?.message ||
    payload?.error ||
    payload?.title ||
    (Array.isArray(payload?.errors) ? payload.errors.join(", ") : undefined);
  return typeof message === "string" && message.trim() ? message : fallback;
}

function normalizeReport(raw: Record<string, unknown>): SessionReport | null {
  const id = pick(raw, "id", "Id", "reportId", "ReportId");
  if (!id) return null;
  const comments = Array.isArray(raw.comments)
    ? (raw.comments as Record<string, unknown>[]).map((item) => ({
        id: pick(item, "id", "Id"),
        content: pick(item, "content", "Content", "comment", "Comment"),
        comment: pick(item, "comment", "Comment", "content", "Content"),
        createdAt: pick(item, "createdAt", "CreatedAt"),
        authorName: pick(item, "authorName", "AuthorName", "commenterName", "CommenterName"),
        commenterName: pick(item, "commenterName", "CommenterName", "authorName", "AuthorName"),
      }))
    : [];

  return {
    id,
    sessionId: pick(raw, "sessionId", "SessionId"),
    studentProfileId: pick(raw, "studentProfileId", "StudentProfileId"),
    studentName: pick(raw, "studentName", "StudentName", "displayName"),
    classId: pick(raw, "classId", "ClassId"),
    className: pick(raw, "className", "ClassName"),
    teacherUserId: pick(raw, "teacherUserId", "TeacherUserId"),
    teacherName: pick(raw, "teacherName", "TeacherName"),
    reportDate: pick(raw, "reportDate", "ReportDate"),
    feedback: pick(raw, "feedback", "Feedback"),
    reason: pick(raw, "reason", "Reason", "rejectReason", "RejectReason", "rejectionReason", "RejectionReason"),
    comment: pick(raw, "comment", "Comment", "latestComment", "LatestComment"),
    comments,
    status: pick(raw, "status", "Status"),
    createdAt: pick(raw, "createdAt", "CreatedAt"),
    updatedAt: pick(raw, "updatedAt", "UpdatedAt"),
  };
}

function resolveAdminComment(report?: SessionReport | null) {
  if (!report) return "";

  const direct = String(report.comment ?? "").trim();
  if (direct) return direct;

  const latest = (report.comments ?? [])
    .map((item) => String(item.content ?? item.comment ?? "").trim())
    .filter(Boolean)
    .at(-1);
  if (latest) return latest;

  return String(report.reason ?? "").trim();
}

function unwrapReportRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  if (raw.item && typeof raw.item === "object") return raw.item as Record<string, unknown>;
  if (raw.sessionReport && typeof raw.sessionReport === "object") return raw.sessionReport as Record<string, unknown>;
  if (raw.data && typeof raw.data === "object") return unwrapReportRecord(raw.data) ?? (raw.data as Record<string, unknown>);
  return raw;
}

function getPaginatedItems(payload: SessionReportPayload | undefined): SessionReport[] {
  if (!payload) return [];
  const direct = payload as Record<string, unknown>;
  let rows: Record<string, unknown>[] = [];

  if (Array.isArray(payload.items)) rows = payload.items;
  else if (Array.isArray(payload.data)) rows = payload.data;
  else if (Array.isArray(payload.sessionReports)) rows = payload.sessionReports;
  else if (
    payload.sessionReports &&
    typeof payload.sessionReports === "object" &&
    Array.isArray(payload.sessionReports.items)
  ) {
    rows = payload.sessionReports.items;
  } else if (
    payload.sessionReports &&
    typeof payload.sessionReports === "object" &&
    Array.isArray(payload.sessionReports.data)
  ) {
    rows = payload.sessionReports.data;
  } else if (Array.isArray(direct["sessionReports"])) {
    rows = direct["sessionReports"] as Record<string, unknown>[];
  }

  return rows.map((row) => normalizeReport(row)).filter((row): row is SessionReport => Boolean(row));
}

function normalizeStatus(status?: string) {
  return String(status ?? "").trim().toUpperCase();
}

function formatDateTime(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = normalizeStatus(status);
  const cls = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium";
  
  if (normalized === "REVIEW") {
    return (
      <span className={`${cls} bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200`}>
        <Clock size={12} />
        Đang duyệt
      </span>
    );
  }
  if (normalized === "APPROVED") {
    return (
      <span className={`${cls} bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200`}>
        <CheckCircle2 size={12} />
        Đã duyệt
      </span>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <span className={`${cls} bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200`}>
        <XCircle size={12} />
        Từ chối
      </span>
    );
  }
  if (normalized === "PUBLISHED") {
    return (
      <span className={`${cls} bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200`}>
        <Send size={12} />
        Đã xuất bản
      </span>
    );
  }
  if (normalized === "DRAFT") {
    return (
      <span className={`${cls} bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border border-gray-200`}>
        <Edit3 size={12} />
        Nháp
      </span>
    );
  }
  return <span className={`${cls} bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border border-gray-200`}>{normalized || "N/A"}</span>;
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function TeacherSessionReportsWorkspace() {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReport, setActiveReport] = useState<SessionReport | null>(null);
  const [draftInput, setDraftInput] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // Stats
  const stats = {
    total: reports.length,
    draft: reports.filter(r => normalizeStatus(r.status) === "DRAFT").length,
    review: reports.filter(r => normalizeStatus(r.status) === "REVIEW").length,
    approved: reports.filter(r => normalizeStatus(r.status) === "APPROVED").length,
    published: reports.filter(r => normalizeStatus(r.status) === "PUBLISHED").length,
    rejected: reports.filter(r => normalizeStatus(r.status) === "REJECTED").length,
  };

  const statsList = [
    { title: 'Tổng số báo cáo', value: `${stats.total}`, icon: <FileText size={20} />, color: 'from-red-600 to-red-700', subtitle: 'Toàn hệ thống' },
    { title: 'Bản nháp', value: `${stats.draft}`, icon: <Edit3 size={20} />, color: 'from-gray-500 to-gray-600', subtitle: 'Chưa gửi duyệt' },
    { title: 'Chờ duyệt', value: `${stats.review}`, icon: <Clock size={20} />, color: 'from-red-500 to-red-600', subtitle: 'Đang xử lý' },
    { title: 'Đã duyệt', value: `${stats.approved}`, icon: <CheckCircle2 size={20} />, color: 'from-emerald-500 to-emerald-600', subtitle: 'Chờ xuất bản' },
    { title: 'Đã xuất bản', value: `${stats.published}`, icon: <Send size={20} />, color: 'from-slate-500 to-slate-600', subtitle: 'Đã công khai' },
    { title: 'Từ chối', value: `${stats.rejected}`, icon: <XCircle size={20} />, color: 'from-rose-500 to-rose-600', subtitle: 'Cần chỉnh sửa' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({
        pageNumber: "1",
        pageSize: "200",
      });
      const payload = await apiFetch<SessionReportPayload>(`/api/session-reports?${query.toString()}`);
      const items = getPaginatedItems(payload).sort((a, b) => {
        const aTime = Date.parse(String(a.updatedAt ?? a.createdAt ?? "")) || 0;
        const bTime = Date.parse(String(b.updatedAt ?? b.createdAt ?? "")) || 0;
        return bTime - aTime;
      });
      setReports(items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách session report.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const status = normalizeStatus(report.status);
      const statusOk = statusFilter === "ALL" || status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return statusOk;
      return (
        statusOk &&
        ((report.studentName || "").toLowerCase().includes(q) ||
          (report.className || "").toLowerCase().includes(q) ||
          (report.teacherName || "").toLowerCase().includes(q) ||
          (report.feedback || "").toLowerCase().includes(q) ||
          (report.studentProfileId || "").toLowerCase().includes(q) ||
          (report.classId || "").toLowerCase().includes(q))
      );
    });
  }, [reports, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const pagedReports = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, pageNumber, pageSize]);

  useEffect(() => {
    setPageNumber(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  const refreshActiveReport = useCallback(async (reportId: string) => {
    try {
      const detail = await apiFetch<Record<string, unknown>>(`/api/session-reports/${reportId}`);
      const normalized = normalizeReport(unwrapReportRecord(detail) ?? detail);
      if (normalized) {
        setActiveReport(normalized);
        setDraftInput(normalized.feedback || "");
      }
    } catch {
      // keep current data if refresh fails
    }
  }, []);

  const openEditor = async (report: SessionReport) => {
    setActiveReport(report);
    setDraftInput(report.feedback || "");
    setMessage("");
    setError("");
    if (report.id) {
      await refreshActiveReport(report.id);
    }
  };

  const handleSave = async () => {
    if (!activeReport?.id) return;
    setSaveLoading(true);
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/session-reports/${activeReport.id}`, {
        method: "PUT",
        body: JSON.stringify({ feedback: draftInput }),
      });
      setMessage("Đã lưu session report.");
      toast.success({ title: "Lưu thành công", description: "Session report đã được lưu.", duration: 3000 });
      await fetchData();
      await refreshActiveReport(activeReport.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể lưu session report.");
    } finally {
      setSaveLoading(false);
    }
  };

  const canSubmit = activeReport
    ? normalizeStatus(activeReport.status) === "DRAFT" || normalizeStatus(activeReport.status) === "REJECTED"
    : false;

  const handleSubmitReview = async () => {
    if (!activeReport?.id) return;
    setSubmitLoading(true);
    setError("");
    setMessage("");
    try {
      const needSave = (draftInput || "").trim() !== String(activeReport.feedback || "").trim();
      if (needSave) {
        await apiFetch(`/api/session-reports/${activeReport.id}`, {
          method: "PUT",
          body: JSON.stringify({ feedback: draftInput }),
        });
      }
      await apiFetch(`/api/session-reports/${activeReport.id}/submit`, { method: "POST" });
      setMessage("Đã gửi duyệt session report.");
      toast.success({ title: "Gửi duyệt thành công", description: "Session report đã được gửi để duyệt.", duration: 3000 });
      await fetchData();
      await refreshActiveReport(activeReport.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể gửi duyệt session report.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-[400px] bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsList.map((stat, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${stat.color}`}></div>
            <div className="relative flex items-center justify-between gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-sm flex-shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-600 truncate">{stat.title}</div>
                <div className="text-xl font-bold text-gray-900 leading-tight">{stat.value}</div>
                {stat.subtitle && <div className="text-[11px] text-gray-500 truncate">{stat.subtitle}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="inline-flex rounded-xl border border-red-200 bg-white p-1">
              {[
                { k: 'ALL', label: 'Tất cả', count: stats.total },
                { k: 'DRAFT', label: 'Nháp', count: stats.draft },
                { k: 'REJECTED', label: 'Từ chối', count: stats.rejected },
                { k: 'REVIEW', label: 'Chờ duyệt', count: stats.review },
                { k: 'APPROVED', label: 'Đã duyệt', count: stats.approved },
                { k: 'PUBLISHED', label: 'Đã xuất bản', count: stats.published }
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setStatusFilter(item.k)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${statusFilter === item.k
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-red-50'
                    }`}
                >
                  {item.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === item.k ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo học sinh, lớp, giáo viên..."
                className="h-10 w-full sm:w-80 rounded-xl border border-red-200 bg-white pl-9 pr-9 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              {searchQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              {filteredReports.length} kết quả
            </div>
          </div>
        </div>
      </div>

      {/* Error/Message Display */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reports Table */}
        <div className="lg:col-span-2 rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách báo cáo buổi học</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{filteredReports.length} báo cáo</span>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <RefreshCcw size={14} />
                  Làm mới
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200 sticky top-0 bg-white z-10">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Học sinh</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lớp / Giáo viên</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Cập nhật</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {pagedReports.map((report) => (
                  <tr
                    key={report.id}
                    className={`group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200 cursor-pointer ${activeReport?.id === report.id ? "bg-red-50/60" : ""
                      }`}
                    onClick={() => void openEditor(report)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-xs">
                          {report.studentName?.charAt(0) || "HS"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{report.studentName || "N/A"}</div>
                          <div className="text-xs text-gray-500">{report.reportDate ? formatDateTime(report.reportDate) : "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Building2 size={14} className="text-gray-400" />
                          <span className="font-medium">{report.className || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Users size={12} className="text-gray-400" />
                          <span>GV: {report.teacherName || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {formatDateTime(report.updatedAt || report.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void openEditor(report);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                      >
                        <Edit3 size={14} />
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && filteredReports.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                <FileText size={24} className="text-red-400" />
              </div>
              <div className="text-gray-600 font-medium">Không tìm thấy báo cáo</div>
              <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc đợi báo cáo mới</div>
            </div>
          )}

          {!loading && filteredReports.length > 0 && (
            <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold text-gray-900">{(pageNumber - 1) * pageSize + 1}-{Math.min(pageNumber * pageSize, filteredReports.length)}</span>
                  {" "}trong tổng số <span className="font-semibold text-gray-900">{filteredReports.length}</span> báo cáo
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                    disabled={pageNumber <= 1}
                    className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Trang {pageNumber}/{totalPages}
                  </span>
                  <button
                    onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                    disabled={pageNumber >= totalPages}
                    className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Panel */}
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Edit3 size={18} className="text-red-600" />
              Chỉnh sửa báo cáo
            </h3>
            <p className="text-sm text-gray-600 mt-1">Chỉnh sửa nội dung và gửi duyệt lại</p>
          </div>

          <div className="p-6">
            {!activeReport && (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                  <FileText size={24} className="text-red-400" />
                </div>
                <p className="text-gray-600">Chọn một báo cáo trong danh sách để chỉnh sửa</p>
              </div>
            )}

            {activeReport && (
              <div className="space-y-5">
                {/* Report Info */}
                <div className="bg-white rounded-xl border border-red-100 p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                    <GraduationCap size={16} className="text-red-600" />
                    Thông tin báo cáo
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Học sinh:</span>
                      <span className="font-medium text-gray-900">{activeReport.studentName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lớp:</span>
                      <span className="font-medium text-gray-900">{activeReport.className || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giáo viên:</span>
                      <span className="font-medium text-gray-900">{activeReport.teacherName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Trạng thái:</span>
                      <StatusBadge status={activeReport.status} />
                    </div>
                  </div>

                  {/* Admin Comment if rejected */}
                  {resolveAdminComment(activeReport) && normalizeStatus(activeReport.status) === "REJECTED" && (
                    <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={14} className="text-rose-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-rose-800 mb-1">Lý do từ chối từ Admin:</p>
                          <p className="text-sm text-rose-700">{resolveAdminComment(activeReport)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback Editor */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={14} className="text-red-600" />
                    Nội dung báo cáo
                  </label>
                  <textarea
                    value={draftInput}
                    onChange={(e) => setDraftInput(e.target.value)}
                    rows={10}
                    className="w-full rounded-xl border border-red-200 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all resize-none"
                    placeholder="Nhập nội dung báo cáo chi tiết về buổi học..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading || submitLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 font-semibold hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saveLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Lưu nháp
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={!canSubmit || saveLoading || submitLoading}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                      canSubmit && !saveLoading && !submitLoading
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/25"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {submitLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Gửi duyệt
                      </>
                    )}
                  </button>
                </div>

                {!canSubmit && activeReport && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
                    Chỉ có thể gửi duyệt khi báo cáo ở trạng thái "Nháp" hoặc "Từ chối"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
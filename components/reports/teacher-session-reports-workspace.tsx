"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Edit3, RefreshCcw, Send, XCircle } from "lucide-react";
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
  return date.toLocaleString("vi-VN");
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = normalizeStatus(status);
  const cls = "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium";
  if (normalized === "REVIEW") {
    return <span className={`${cls} bg-red-50 text-red-700 border-red-200`}><Clock size={12} />REVIEW</span>;
  }
  if (normalized === "APPROVED") {
    return <span className={`${cls} bg-emerald-50 text-emerald-700 border-emerald-200`}><CheckCircle2 size={12} />APPROVED</span>;
  }
  if (normalized === "REJECTED") {
    return <span className={`${cls} bg-rose-50 text-rose-700 border-rose-200`}><XCircle size={12} />REJECTED</span>;
  }
  if (normalized === "PUBLISHED") {
    return <span className={`${cls} bg-slate-100 text-slate-700 border-slate-300`}><Send size={12} />PUBLISHED</span>;
  }
  return <span className={`${cls} bg-slate-100 text-slate-700 border-slate-200`}>{normalized || "N/A"}</span>;
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Session Reports Của Giáo Viên</h2>
          <p className="text-sm text-gray-600">Theo dõi report bị từ chối, chỉnh sửa và gửi duyệt lại.</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCcw size={14} />
          Làm mới
        </button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo học sinh/lớp/nội dung feedback..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:max-w-xl"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="ALL">TẤT CẢ</option>
          <option value="REJECTED">REJECTED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="REVIEW">REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200">
          <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Học sinh</th>
                <th className="px-3 py-2">Lớp</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Cập nhật</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedReports.map((report) => (
                <tr
                  key={report.id}
                  className={`cursor-pointer hover:bg-slate-50 ${activeReport?.id === report.id ? "bg-red-50/40" : ""}`}
                  onClick={() => void openEditor(report)}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{report.studentName || "N/A"}</div>
                    <div className="text-xs text-gray-500">{report.reportDate || "N/A"}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    <div>{report.className || "N/A"}</div>
                    <div>{report.teacherName || "N/A"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{formatDateTime(report.updatedAt || report.createdAt)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void openEditor(report);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      <Edit3 size={12} />
                      Mở
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {!loading && filteredReports.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">Không có session report phù hợp.</div>
          )}
          {loading && <div className="p-6 text-center text-sm text-gray-500">Đang tải...</div>}
          {!loading && filteredReports.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-gray-600">
              <span>
                Trang {pageNumber}/{totalPages} - {filteredReports.length} bản ghi
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                  disabled={pageNumber <= 1}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                  disabled={pageNumber >= totalPages}
                  className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Chỉnh sửa Report</h3>
          {!activeReport && <p className="text-sm text-gray-500">Chọn một report trong danh sách để xem/chỉnh sửa.</p>}
          {activeReport && (
            <>
              <div className="space-y-1 text-xs text-gray-600">
                <div><span className="font-medium text-gray-900">Học sinh:</span> {activeReport.studentName || "N/A"}</div>
                <div><span className="font-medium text-gray-900">Lớp:</span> {activeReport.className || "N/A"}</div>
                <div><span className="font-medium text-gray-900">Trạng thái:</span> <StatusBadge status={activeReport.status} /></div>
                {resolveAdminComment(activeReport) ? (
                  <div className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
                    <span className="font-medium">Comment từ admin:</span> {resolveAdminComment(activeReport)}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Nội dung feedback</label>
                <textarea
                  value={draftInput}
                  onChange={(e) => setDraftInput(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSave}
                  disabled={saveLoading || submitLoading}
                  className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:bg-slate-300"
                >
                  {saveLoading ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={!canSubmit || saveLoading || submitLoading}
                  className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:bg-slate-300"
                >
                  {submitLoading ? "Đang gửi..." : "Gửi duyệt"}
                </button>
              </div>
              {!canSubmit && (
                <p className="text-xs text-gray-500">
                  Chỉ gửi duyệt được khi report ở trạng thái DRAFT/REJECTED.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

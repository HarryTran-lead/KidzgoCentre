"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Eye, RefreshCcw, Send, XCircle } from "lucide-react";

type SessionReportStatus = "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | string;

type SessionReport = {
  id?: string | null;
  sessionId?: string | null;
  studentProfileId?: string | null;
  teacherUserId?: string | null;
  classId?: string | null;
  reportDate?: string | null;
  feedback?: string | null;
  reason?: string | null;
  comment?: string | null;
  comments?: Array<{ id?: string | null; content?: string | null; comment?: string | null; createdAt?: string | null; authorName?: string | null; commenterName?: string | null }>;
  status?: SessionReportStatus | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

type Paginated<T> = { items?: T[]; data?: T[] };
type SessionReportPayload = Paginated<SessionReport> & {
  sessionReports?: Paginated<SessionReport> | SessionReport[];
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
    throw new Error(payload?.message || "Không thể xử lý session report.");
  }

  return (payload?.data ?? payload) as T;
}

function getPaginatedItems(payload: SessionReportPayload | undefined): SessionReport[] {
  if (!payload) return [];
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.sessionReports)) return payload.sessionReports;
  if (
    payload.sessionReports &&
    typeof payload.sessionReports === "object" &&
    Array.isArray(payload.sessionReports.items)
  ) {
    return payload.sessionReports.items;
  }
  if (
    payload.sessionReports &&
    typeof payload.sessionReports === "object" &&
    Array.isArray(payload.sessionReports.data)
  ) {
    return payload.sessionReports.data;
  }
  return [];
}

function normalizeStatus(status?: string | null) {
  return String(status ?? "").trim().toUpperCase();
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function shortId(value?: string | null) {
  if (!value) return "N/A";
  return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function resolveName(payload: any): string {
  return String(
    payload?.displayName ??
      payload?.fullName ??
      payload?.studentName ??
      payload?.teacherName ??
      payload?.name ??
      payload?.className ??
      payload?.code ??
      "",
  ).trim();
}

function resolveRejectReason(report: SessionReport): string {
  const raw = report as Record<string, unknown>;
  const reason =
    report.reason ??
    report.comment ??
    (typeof raw.rejectReason === "string" ? raw.rejectReason : undefined) ??
    (typeof raw.rejectionReason === "string" ? raw.rejectionReason : undefined) ??
    (typeof raw.comment === "string" ? raw.comment : undefined) ??
    (typeof raw.latestComment === "string" ? raw.latestComment : undefined) ??
    (typeof raw.Reason === "string" ? raw.Reason : undefined) ??
    (typeof raw.RejectReason === "string" ? raw.RejectReason : undefined) ??
    (typeof raw.RejectionReason === "string" ? raw.RejectionReason : undefined);
  if (String(reason ?? "").trim()) return String(reason ?? "").trim();

  if (Array.isArray(report.comments)) {
    const latest = report.comments
      .map((item) => String(item?.content ?? item?.comment ?? "").trim())
      .filter(Boolean)
      .at(-1);
    if (latest) return latest;
  }

  return String(reason ?? "").trim();
}

function unwrapReportRecord(payload: unknown): SessionReport | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  if (raw.item && typeof raw.item === "object") return raw.item as SessionReport;
  if (raw.sessionReport && typeof raw.sessionReport === "object") return raw.sessionReport as SessionReport;
  if (raw.data && typeof raw.data === "object") return unwrapReportRecord(raw.data) ?? (raw.data as SessionReport);
  return raw as SessionReport;
}

function buildLocalRejectedReport(reportId: string, commentText: string): Partial<SessionReport> {
  const trimmed = commentText.trim();
  if (!trimmed) return { id: reportId };

  return {
    id: reportId,
    status: "REJECTED",
    reason: trimmed,
    comment: trimmed,
    comments: [
      {
        id: `local-${reportId}`,
        content: trimmed,
        comment: trimmed,
        createdAt: new Date().toISOString(),
        authorName: "Admin",
        commenterName: "Admin",
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function buildLocalComment(commentText: string) {
  const trimmed = commentText.trim();
  return {
    id: `local-comment-${Date.now()}`,
    content: trimmed,
    comment: trimmed,
    createdAt: new Date().toISOString(),
    authorName: "Admin",
    commenterName: "Admin",
  };
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = normalizeStatus(status);
  const common = "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium";
  if (normalized === "REVIEW") {
    return (
      <span className={`${common} bg-blue-50 text-blue-700 border-blue-200`}>
        <Clock size={12} />
        REVIEW
      </span>
    );
  }
  if (normalized === "APPROVED") {
    return (
      <span className={`${common} bg-emerald-50 text-emerald-700 border-emerald-200`}>
        <CheckCircle2 size={12} />
        APPROVED
      </span>
    );
  }
  if (normalized === "PUBLISHED") {
    return (
      <span className={`${common} bg-purple-50 text-purple-700 border-purple-200`}>
        <Send size={12} />
        PUBLISHED
      </span>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <span className={`${common} bg-rose-50 text-rose-700 border-rose-200`}>
        <XCircle size={12} />
        REJECTED
      </span>
    );
  }
  return <span className={`${common} bg-slate-100 text-slate-700 border-slate-200`}>{normalized || "N/A"}</span>;
}

export default function SessionReportsReviewWorkspace() {
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("REVIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailReport, setDetailReport] = useState<SessionReport | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SessionReport | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  const [studentNameMap, setStudentNameMap] = useState<Record<string, string>>({});
  const [classNameMap, setClassNameMap] = useState<Record<string, string>>({});
  const [teacherNameMap, setTeacherNameMap] = useState<Record<string, string>>({});

  const openDetail = useCallback(async (report: SessionReport) => {
    setDetailReport(report);
    const reportId = String(report.id ?? "");
    if (!reportId) return;

    try {
      const detail = await apiFetch<Record<string, unknown>>(`/api/session-reports/${reportId}`);
      const normalized = unwrapReportRecord(detail);
      if (normalized) {
        setDetailReport((prev) => ({ ...(prev ?? {}), ...normalized }));
      }
    } catch {
      // keep list data if detail fetch fails
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ pageNumber: "1", pageSize: "200" });
      const result = await apiFetch<SessionReportPayload>(`/api/session-reports?${query.toString()}`);
      const items = getPaginatedItems(result);
      const deduped = Array.from(new Map(items.map((item) => [item.id, item])).values()).sort((a, b) => {
        const aTime = Date.parse(String(a.updatedAt ?? a.createdAt ?? "")) || 0;
        const bTime = Date.parse(String(b.updatedAt ?? b.createdAt ?? "")) || 0;
        return bTime - aTime;
      });
      setReports(deduped);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải session report.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const studentIds = Array.from(
      new Set(reports.map((r) => String(r.studentProfileId ?? "").trim()).filter((id) => id && !studentNameMap[id])),
    );
    const classIds = Array.from(
      new Set(reports.map((r) => String(r.classId ?? "").trim()).filter((id) => id && !classNameMap[id])),
    );
    const teacherIds = Array.from(
      new Set(reports.map((r) => String(r.teacherUserId ?? "").trim()).filter((id) => id && !teacherNameMap[id])),
    );

    if (!studentIds.length && !classIds.length && !teacherIds.length) return;

    Promise.all([
      Promise.all(
        studentIds.slice(0, 100).map(async (id) => {
          try {
            const payload = await apiFetch<any>(`/api/profiles/${id}`);
            return [id, resolveName(payload) || shortId(id)] as const;
          } catch {
            return [id, shortId(id)] as const;
          }
        }),
      ),
      Promise.all(
        classIds.slice(0, 100).map(async (id) => {
          try {
            const payload = await apiFetch<any>(`/api/classes/${id}`);
            return [id, resolveName(payload) || shortId(id)] as const;
          } catch {
            return [id, shortId(id)] as const;
          }
        }),
      ),
      Promise.all(
        teacherIds.slice(0, 100).map(async (id) => {
          try {
            const payload = await apiFetch<any>(`/api/admin/users/${id}`);
            return [id, resolveName(payload) || shortId(id)] as const;
          } catch {
            return [id, shortId(id)] as const;
          }
        }),
      ),
    ]).then(([students, classes, teachers]) => {
      if (students.length) {
        setStudentNameMap((prev) => ({ ...prev, ...Object.fromEntries(students) }));
      }
      if (classes.length) {
        setClassNameMap((prev) => ({ ...prev, ...Object.fromEntries(classes) }));
      }
      if (teachers.length) {
        setTeacherNameMap((prev) => ({ ...prev, ...Object.fromEntries(teachers) }));
      }
    });
  }, [reports, studentNameMap, classNameMap, teacherNameMap]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const status = normalizeStatus(report.status);
      const statusOk = statusFilter === "ALL" || status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return statusOk;

      const studentId = String(report.studentProfileId ?? "");
      const classId = String(report.classId ?? "");
      const teacherId = String(report.teacherUserId ?? "");

      const studentName = studentNameMap[studentId] || "";
      const className = classNameMap[classId] || "";
      const teacherName = teacherNameMap[teacherId] || "";

      return (
        statusOk &&
        ((report.feedback || "").toLowerCase().includes(q) ||
          studentId.toLowerCase().includes(q) ||
          classId.toLowerCase().includes(q) ||
          teacherId.toLowerCase().includes(q) ||
          studentName.toLowerCase().includes(q) ||
          className.toLowerCase().includes(q) ||
          teacherName.toLowerCase().includes(q))
      );
    });
  }, [reports, searchQuery, statusFilter, studentNameMap, classNameMap, teacherNameMap]);

  const runAction = useCallback(
    async (
      reportId: string,
      action: "approve" | "reject" | "publish" | "comments",
      body?: Record<string, string>,
    ) => {
      const key = `${reportId}:${action}`;
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      setError("");
      setMessage("");
      try {
        const actionResult = await apiFetch<Record<string, unknown>>(`/api/session-reports/${reportId}/${action}`, {
          method: "POST",
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        const normalizedActionResult = unwrapReportRecord(actionResult);

        if (normalizedActionResult) {
          setReports((prev) =>
            prev.map((item) =>
              String(item.id ?? "") === reportId ? { ...item, ...normalizedActionResult } : item,
            ),
          );
          setDetailReport((prev) => {
            if (!prev || String(prev.id ?? "") !== reportId) return prev;
            return { ...prev, ...normalizedActionResult };
          });
        } else if (action === "comments" && body?.content) {
          const optimisticComment = buildLocalComment(body.content);
          setReports((prev) =>
            prev.map((item) =>
              String(item.id ?? "") === reportId
                ? { ...item, comments: [...(item.comments ?? []), optimisticComment] }
                : item,
            ),
          );
          setDetailReport((prev) => {
            if (!prev || String(prev.id ?? "") !== reportId) return prev;
            return { ...prev, comments: [...(prev.comments ?? []), optimisticComment] };
          });
        } else if (action === "reject" && body?.reason) {
          const optimistic = buildLocalRejectedReport(reportId, body.reason);
          setReports((prev) =>
            prev.map((item) => (String(item.id ?? "") === reportId ? { ...item, ...optimistic } : item)),
          );
          setDetailReport((prev) => {
            if (!prev || String(prev.id ?? "") !== reportId) return prev;
            return { ...prev, ...optimistic };
          });
        }

        setMessage(action === "comments" ? "Đã gửi comment cho session report." : `Đã ${action} session report.`);
        await fetchData();
        try {
          const detail = await apiFetch<Record<string, unknown>>(`/api/session-reports/${reportId}`);
          const normalized = unwrapReportRecord(detail);
          if (normalized) {
            setDetailReport((prev) => {
              if (!prev || String(prev.id ?? "") !== reportId) return prev;
              return { ...prev, ...normalized };
            });
          }
        } catch {
          // ignore detail refresh failure
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Không thể xử lý session report.");
      } finally {
        setActionLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [fetchData],
  );

  const openRejectModal = (report: SessionReport) => {
    setRejectTarget(report);
    setRejectReasonInput(resolveRejectReason(report));
  };

  const closeRejectModal = () => {
    setRejectTarget(null);
    setRejectReasonInput("");
  };

  const submitReject = async () => {
    const reportId = String(rejectTarget?.id ?? "");
    const reason = rejectReasonInput.trim();
    if (!reportId || !reason) return;
    await runAction(reportId, "comments", { content: reason });
    await runAction(reportId, "reject", { reason });
    closeRejectModal();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Duyệt Session Report Theo Buổi</h2>
          <p className="text-sm text-gray-600">Luồng duyệt: REVIEW -&gt; APPROVED -&gt; PUBLISHED</p>
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
          placeholder="Tìm theo tên/ID học sinh, lớp, giáo viên hoặc nội dung"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm md:max-w-xl"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="REVIEW">REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ALL">Tất cả</option>
        </select>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Session</th>
              <th className="px-3 py-2">Học sinh</th>
              <th className="px-3 py-2">Lớp / GV</th>
              <th className="px-3 py-2">Nội dung</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Cập nhật</th>
              <th className="px-3 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReports.map((report) => {
              const reportId = String(report.id ?? "");
              const status = normalizeStatus(report.status);
              const studentId = String(report.studentProfileId ?? "");
              const classId = String(report.classId ?? "");
              const teacherId = String(report.teacherUserId ?? "");

              return (
                <tr key={reportId || `${report.sessionId}:${studentId}:${report.reportDate}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{shortId(report.sessionId)}</div>
                    <div className="text-xs text-gray-500">{report.reportDate || "N/A"}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    <div className="font-medium text-gray-900">{studentNameMap[studentId] || shortId(studentId)}</div>
                    <div className="text-gray-500">{shortId(studentId)}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    <div className="font-medium text-gray-900">{classNameMap[classId] || shortId(classId)}</div>
                    <div>{teacherNameMap[teacherId] || shortId(teacherId)}</div>
                  </td>
                  <td className="px-3 py-2 max-w-md">
                    <button
                      onClick={() => void openDetail(report)}
                      className="w-full text-left"
                      title="Bấm để xem đầy đủ"
                    >
                      <p className="line-clamp-2 text-xs text-gray-700 hover:text-blue-700">
                        {report.feedback || "(Không có nội dung)"}
                      </p>
                    </button>
                    {resolveRejectReason(report) ? (
                      <p className="mt-1 text-[11px] text-rose-600">Lý do reject: {resolveRejectReason(report)}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{formatDateTime(report.updatedAt || report.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => void openDetail(report)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        <Eye size={12} />
                        Review
                      </button>
                      <button
                        disabled={!reportId || status !== "REVIEW" || actionLoading[`${reportId}:approve`]}
                        onClick={() => reportId && runAction(reportId, "approve")}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                      >
                        Approve
                      </button>
                      <button
                        disabled={!reportId || status !== "REVIEW" || actionLoading[`${reportId}:reject`]}
                        onClick={() => openRejectModal(report)}
                        className="rounded bg-amber-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                      >
                        Reject
                      </button>
                      <button
                        disabled={!reportId || status !== "APPROVED" || actionLoading[`${reportId}:publish`]}
                        onClick={() => reportId && runAction(reportId, "publish")}
                        className="rounded bg-sky-600 px-2 py-1 text-xs text-white disabled:bg-slate-300"
                      >
                        Publish
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filteredReports.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">Không có session report phù hợp.</div>
        )}
        {loading && <div className="p-6 text-center text-sm text-gray-500">Đang tải session report...</div>}
      </div>

      {detailReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết Session Report</h3>
                <p className="text-sm text-gray-500">
                  {formatDateTime(detailReport.updatedAt || detailReport.createdAt)} - <StatusBadge status={detailReport.status} />
                </p>
              </div>
              <button
                onClick={() => setDetailReport(null)}
                className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs text-gray-500">Học sinh</div>
                <div className="font-medium text-gray-900">
                  {studentNameMap[String(detailReport.studentProfileId ?? "")] || shortId(detailReport.studentProfileId)}
                </div>
                <div className="text-xs text-gray-500">{detailReport.studentProfileId}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs text-gray-500">Lớp</div>
                <div className="font-medium text-gray-900">
                  {classNameMap[String(detailReport.classId ?? "")] || shortId(detailReport.classId)}
                </div>
                <div className="text-xs text-gray-500">{detailReport.classId}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs text-gray-500">Giáo viên</div>
                <div className="font-medium text-gray-900">
                  {teacherNameMap[String(detailReport.teacherUserId ?? "")] || shortId(detailReport.teacherUserId)}
                </div>
                <div className="text-xs text-gray-500">{detailReport.teacherUserId}</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs text-gray-500">Session</div>
                <div className="font-medium text-gray-900">{shortId(detailReport.sessionId)}</div>
                <div className="text-xs text-gray-500">{detailReport.sessionId}</div>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 p-3">
              <div className="mb-1 text-xs text-gray-500">Feedback</div>
              <div className="whitespace-pre-line text-sm text-gray-800">{detailReport.feedback || "(Không có nội dung)"}</div>
              {resolveRejectReason(detailReport) ? (
                <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                  Lý do reject: {resolveRejectReason(detailReport)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Từ chối Session Report</h3>
              <p className="text-sm text-gray-600">Nội dung này sẽ được lưu thành comment và sau đó report sẽ bị reject để giáo viên sửa lại.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700">
                Comment / lý do từ chối
              </label>
              <textarea
                id="reject-reason"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                rows={4}
                placeholder="Ví dụ: Feedback chưa đủ chi tiết về tiến bộ và phần cần cải thiện."
                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeRejectModal}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={submitReject}
                disabled={!rejectReasonInput.trim() || actionLoading[`${String(rejectTarget.id ?? "")}:reject`]}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white disabled:bg-slate-300"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

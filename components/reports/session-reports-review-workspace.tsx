"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
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
  Eye as EyeIcon,
  Megaphone,
  Building2,
  GraduationCap,
  Users
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { nowISOVN } from "@/lib/datetime";

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

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${color}`}></div>
      <div className="relative flex items-center justify-between gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">{title}</div>
          <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
          {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = String(status ?? "").trim().toUpperCase();
  const common = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium";

  if (normalized === "REVIEW") {
    return (
      <span className={`${common} bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200`}>
        <Clock size={12} />
        Đang duyệt
      </span>
    );
  }
  if (normalized === "APPROVED") {
    return (
      <span className={`${common} bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200`}>
        <CheckCircle2 size={12} />
        Đã duyệt
      </span>
    );
  }
  if (normalized === "PUBLISHED") {
    return (
      <span className={`${common} bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200`}>
        <Megaphone size={12} />
        Đã xuất bản
      </span>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <span className={`${common} bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200`}>
        <XCircle size={12} />
        Từ chối
      </span>
    );
  }
  return <span className={`${common} bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 border border-gray-200`}>{normalized || "N/A"}</span>;
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
        createdAt: nowISOVN(),
        authorName: "Admin",
        commenterName: "Admin",
      },
    ],
    updatedAt: nowISOVN(),
  };
}

function buildLocalComment(commentText: string) {
  const trimmed = commentText.trim();
  return {
    id: `local-comment-${Date.now()}`,
    content: trimmed,
    comment: trimmed,
    createdAt: nowISOVN(),
    authorName: "Admin",
    commenterName: "Admin",
  };
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
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
  const [sortKey, setSortKey] = useState<"student" | "class" | "status" | "updatedAt" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

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

  const toggleSort = (key: NonNullable<typeof sortKey>) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const filteredReports = useMemo(() => {
    let filtered = reports.filter((report) => {
      const status = String(report.status ?? "").trim().toUpperCase();
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

    if (sortKey) {
      filtered.sort((a, b) => {
        let aVal = "";
        let bVal = "";

        switch (sortKey) {
          case "student":
            aVal = studentNameMap[String(a.studentProfileId ?? "")] || String(a.studentProfileId ?? "");
            bVal = studentNameMap[String(b.studentProfileId ?? "")] || String(b.studentProfileId ?? "");
            break;
          case "class":
            aVal = classNameMap[String(a.classId ?? "")] || String(a.classId ?? "");
            bVal = classNameMap[String(b.classId ?? "")] || String(b.classId ?? "");
            break;
          case "status":
            aVal = String(a.status ?? "");
            bVal = String(b.status ?? "");
            break;
          case "updatedAt":
            aVal = String(a.updatedAt ?? a.createdAt ?? "");
            bVal = String(b.updatedAt ?? b.createdAt ?? "");
            break;
        }

        const res = aVal.localeCompare(bVal);
        return sortDir === "asc" ? res : -res;
      });
    }

    return filtered;
  }, [reports, searchQuery, statusFilter, studentNameMap, classNameMap, teacherNameMap, sortKey, sortDir]);

  const allVisibleIds = useMemo(
    () => filteredReports.map((r) => String(r.id ?? "")).filter(id => id),
    [filteredReports]
  );

  const selectedVisibleCount = useMemo(
    () => allVisibleIds.filter((id) => selectedIds[id]).length,
    [allVisibleIds, selectedIds]
  );

  const allVisibleSelected = allVisibleIds.length > 0 && selectedVisibleCount === allVisibleIds.length;

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        allVisibleIds.forEach((id) => {
          delete next[id];
        });
      } else {
        allVisibleIds.forEach((id) => {
          next[id] = true;
        });
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const stats = {
    total: reports.length,
    review: reports.filter(r => String(r.status ?? "").trim().toUpperCase() === "REVIEW").length,
    approved: reports.filter(r => String(r.status ?? "").trim().toUpperCase() === "APPROVED").length,
    published: reports.filter(r => String(r.status ?? "").trim().toUpperCase() === "PUBLISHED").length,
    rejected: reports.filter(r => String(r.status ?? "").trim().toUpperCase() === "REJECTED").length,
  };

  const statsList = [
    {
      title: 'Tổng số báo cáo',
      value: `${stats.total}`,
      icon: <FileText size={20} />,
      color: 'from-red-600 to-red-700',
      subtitle: 'Toàn hệ thống'
    },
    {
      title: 'Chờ duyệt',
      value: `${stats.review}`,
      icon: <Clock size={20} />,
      color: 'from-red-500 to-red-600',
      subtitle: 'Cần xử lý ngay'
    },
    {
      title: 'Đã duyệt',
      value: `${stats.approved}`,
      icon: <CheckCircle2 size={20} />,
      color: 'from-emerald-500 to-emerald-600',
      subtitle: 'Chờ xuất bản'
    },
    {
      title: 'Đã xuất bản',
      value: `${stats.published}`,
      icon: <Megaphone size={20} />,
      color: 'from-slate-500 to-slate-600',
      subtitle: 'Đã công khai'
    },
    {
      title: 'Từ chối',
      value: `${stats.rejected}`,
      icon: <XCircle size={20} />,
      color: 'from-rose-500 to-rose-600',
      subtitle: 'Cần chỉnh sửa'
    }
  ];

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
        if (action === "approve") {
          toast.success({ title: "Duyệt thành công", description: "Báo cáo đã được duyệt.", duration: 3000 });
        } else if (action === "reject") {
          toast.success({ title: "Từ chối thành công", description: "Báo cáo đã bị từ chối và gửi lại cho giáo viên.", duration: 3000 });
        } else if (action === "publish") {
          toast.success({ title: "Xuất bản thành công", description: "Báo cáo đã được xuất bản cho phụ huynh xem.", duration: 3000 });
        }
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

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6 flex items-center justify-center">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsList.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="inline-flex rounded-xl border border-red-200 bg-white p-1">
              {[
                { k: 'REVIEW', label: 'Chờ duyệt', count: stats.review },
                { k: 'APPROVED', label: 'Đã duyệt', count: stats.approved },
                { k: 'PUBLISHED', label: 'Đã xuất bản', count: stats.published },
                { k: 'REJECTED', label: 'Từ chối', count: stats.rejected },
                { k: 'ALL', label: 'Tất cả', count: stats.total }
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
            {selectedVisibleCount > 0 && (
              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-red-200">
                Đã chọn: <span className="font-semibold text-red-600">{selectedVisibleCount}</span> báo cáo
              </div>
            )}
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

      {/* Main Table */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
              <tr>
                <th className="py-3 px-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                    onClick={() => toggleSort("student")}
                    type="button"
                  >
                    Học sinh{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "student" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                    onClick={() => toggleSort("class")}
                    type="button"
                  >
                    Lớp / Giáo viên{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "class" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Nội dung báo cáo</span>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                    onClick={() => toggleSort("status")}
                    type="button"
                  >
                    Trạng thái{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "status" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <button
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-red-700 cursor-pointer"
                    onClick={() => toggleSort("updatedAt")}
                    type="button"
                  >
                    Cập nhật{" "}
                    <ArrowUpDown
                      size={14}
                      className={sortKey === "updatedAt" ? "text-red-600" : "text-gray-400"}
                    />
                  </button>
                </th>
                <th className="py-3 px-6 text-left">
                  <span className="text-sm font-semibold text-gray-700">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const reportId = String(report.id ?? "");
                  const status = String(report.status ?? "").trim().toUpperCase();
                  const studentId = String(report.studentProfileId ?? "");
                  const classId = String(report.classId ?? "");
                  const teacherId = String(report.teacherUserId ?? "");

                  return (
                    <tr
                      key={reportId || `${report.sessionId}:${studentId}:${report.reportDate}`}
                      className="group hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={!!selectedIds[reportId]}
                          onChange={() => reportId && toggleSelectOne(reportId)}
                          className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200 cursor-pointer"
                          aria-label={`Chọn báo cáo của ${studentNameMap[studentId] || shortId(studentId)}`}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-xs">
                            {studentNameMap[studentId]?.charAt(0) || "HS"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {studentNameMap[studentId] || "Đang tải..."}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">{classNameMap[classId] || "Đang tải..."}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            GV: {teacherNameMap[teacherId] || "Đang tải..."}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 max-w-md">
                        <button
                          onClick={() => void openDetail(report)}
                          className="w-full text-left group"
                          title="Bấm để xem đầy đủ"
                        >
                          <p className="line-clamp-2 text-sm text-gray-700 group-hover:text-red-600 transition-colors">
                            {report.feedback || "(Không có nội dung)"}
                          </p>
                        </button>
                        {resolveRejectReason(report) && status === "REJECTED" && (
                          <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                            <MessageSquare size={10} />
                            {resolveRejectReason(report)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">
                        {formatDateTime(report.updatedAt || report.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => void openDetail(report)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <EyeIcon size={14} />
                          </button>
                          {status === "REVIEW" && (
                            <>
                              <button
                                disabled={!reportId || actionLoading[`${reportId}:approve`]}
                                onClick={() => reportId && runAction(reportId, "approve")}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer disabled:opacity-50"
                                title="Duyệt"
                              >
                                <ThumbsUp size={14} />
                              </button>
                              <button
                                disabled={!reportId || actionLoading[`${reportId}:reject`]}
                                onClick={() => openRejectModal(report)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors text-gray-400 hover:text-rose-600 cursor-pointer disabled:opacity-50"
                                title="Từ chối"
                              >
                                <ThumbsDown size={14} />
                              </button>
                            </>
                          )}
                          {status === "APPROVED" && (
                            <button
                              disabled={!reportId || actionLoading[`${reportId}:publish`]}
                              onClick={() => reportId && runAction(reportId, "publish")}
                              className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-gray-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                              title="Xuất bản"
                            >
                              <Send size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                      <FileText size={24} className="text-red-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không tìm thấy báo cáo</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc đợi báo cáo mới</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredReports.length > 0 && (
          <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-gray-900">1-{filteredReports.length}</span>
                {" "}trong tổng số <span className="font-semibold text-gray-900">{filteredReports.length}</span> báo cáo
                {selectedVisibleCount > 0 && (
                  <span className="ml-2 text-red-600">• Đã chọn {selectedVisibleCount} báo cáo</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {/* Detail Modal - Improved Version */}
      {detailReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chi tiết báo cáo buổi học</h2>
                    <p className="text-sm text-red-100">Thông tin chi tiết về báo cáo của học sinh</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailReport(null)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-gradient-to-r from-red-50 to-slate-50 rounded-xl p-5 border border-red-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Trạng thái */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Trạng thái
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white">
                        <StatusBadge status={detailReport.status} />
                      </div>
                    </div>

                    {/* Ngày báo cáo */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock size={16} className="text-red-600" />
                        Ngày báo cáo
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900">
                        {formatDateTime(detailReport.reportDate || detailReport.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin học sinh và lớp */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                    Thông tin học sinh & lớp
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Học sinh */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <GraduationCap size={16} className="text-red-600" />
                        Học sinh
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white text-gray-900">
                        <div className="font-medium">
                          {studentNameMap[String(detailReport.studentProfileId ?? "")] || "Đang tải..."}
                        </div>
                      </div>
                    </div>

                    {/* Lớp học */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Building2 size={16} className="text-red-600" />
                        Lớp học
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white text-gray-900">
                        <div className="font-medium">
                          {classNameMap[String(detailReport.classId ?? "")] || "Đang tải..."}
                        </div>
                      </div>
                    </div>

                    {/* Giáo viên */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Users size={16} className="text-red-600" />
                        Giáo viên
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white text-gray-900">
                        <div className="font-medium">
                          {teacherNameMap[String(detailReport.teacherUserId ?? "")] || "Đang tải..."}
                        </div>
                      </div>
                    </div>

                    {/* Buổi học */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock size={16} className="text-red-600" />
                        Buổi học
                      </label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white text-gray-900">
                        <div className="text-sm">{formatDateTime(detailReport.reportDate || detailReport.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nội dung báo cáo */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                    Nội dung báo cáo
                  </h3>
                  <div className="px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 min-h-[120px] leading-relaxed whitespace-pre-wrap">
                    {detailReport.feedback || (
                      <span className="text-gray-400 italic">Không có nội dung báo cáo</span>
                    )}
                  </div>
                </div>

                {/* Lý do từ chối (nếu có) */}
                {resolveRejectReason(detailReport) && (
                  <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
                    <h3 className="text-lg font-semibold text-rose-800 mb-3 flex items-center gap-2">
                      <XCircle size={20} className="text-rose-600" />
                      Lý do từ chối
                    </h3>
                    <div className="px-4 py-3 rounded-xl bg-white border border-rose-200 text-rose-700 leading-relaxed">
                      {resolveRejectReason(detailReport)}
                    </div>
                  </div>
                )}

                {/* Thông tin bổ sung */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {detailReport.createdAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} className="text-gray-400" />
                        <span className="font-medium">Ngày tạo:</span>
                        <span>{formatDateTime(detailReport.createdAt)}</span>
                      </div>
                    )}
                    {detailReport.updatedAt && detailReport.updatedAt !== detailReport.createdAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <RefreshCcw size={14} className="text-gray-400" />
                        <span className="font-medium">Cập nhật lần cuối:</span>
                        <span>{formatDateTime(detailReport.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDetailReport(null)}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Đóng
                </button>
                {String(detailReport.status ?? "").trim().toUpperCase() === "REVIEW" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const reportId = String(detailReport.id ?? "");
                        if (reportId) {
                          runAction(reportId, "approve");
                          setDetailReport(null);
                        }
                      }}
                      disabled={!detailReport.id || actionLoading[`${detailReport.id}:approve`]}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ThumbsUp size={16} />
                      Duyệt báo cáo
                    </button>
                    <button
                      onClick={() => {
                        setRejectTarget(detailReport);
                        setDetailReport(null);
                      }}
                      disabled={!detailReport.id || actionLoading[`${detailReport.id}:reject`]}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ThumbsDown size={16} />
                      Từ chối
                    </button>
                  </div>
                )}
                {String(detailReport.status ?? "").trim().toUpperCase() === "APPROVED" && (
                  <button
                    onClick={() => {
                      const reportId = String(detailReport.id ?? "");
                      if (reportId) {
                        runAction(reportId, "publish");
                        setDetailReport(null);
                      }
                    }}
                    disabled={!detailReport.id || actionLoading[`${detailReport.id}:publish`]}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold hover:shadow-lg hover:shadow-slate-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={16} />
                    Xuất bản
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {/* Reject Modal - Improved Version */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <XCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Từ chối báo cáo</h2>
                    <p className="text-sm text-red-100">
                      Vui lòng cung cấp lý do để giáo viên chỉnh sửa lại báo cáo
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeRejectModal}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Thông tin báo cáo bị từ chối */}
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Báo cáo của học sinh:</p>
                    <p className="line-clamp-2 text-red-700">
                      {rejectTarget.feedback || "(Không có nội dung)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form từ chối */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reject-reason" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MessageSquare size={16} className="text-red-600" />
                    Lý do từ chối <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="reject-reason"
                      value={rejectReasonInput}
                      onChange={(e) => setRejectReasonInput(e.target.value)}
                      rows={5}
                      placeholder="Ví dụ: Feedback chưa đủ chi tiết về tiến bộ và phần cần cải thiện của học sinh..."
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all resize-none"
                      autoFocus
                    />
                    {!rejectReasonInput.trim() && (
                      <div className="absolute bottom-3 right-3">
                        <AlertCircle size={14} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Lý do sẽ được gửi đến giáo viên để họ chỉnh sửa lại báo cáo
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={closeRejectModal}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={submitReject}
                  disabled={!rejectReasonInput.trim() || actionLoading[`${String(rejectTarget.id ?? "")}:reject`]}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2",
                    rejectReasonInput.trim() && !actionLoading[`${String(rejectTarget.id ?? "")}:reject`]
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-500/25"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {actionLoading[`${String(rejectTarget.id ?? "")}:reject`] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <ThumbsDown size={16} />
                      Xác nhận từ chối
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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

type MonthlyRole = "teacher" | "management" | "viewer";
type ReportStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Published" | string;

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
};

type MonthlyReport = {
  id: string;
  studentProfileId?: string;
  studentName?: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  status: ReportStatus;
  month: number;
  year: number;
  draftContent?: string;
  comments?: MonthlyComment[];
};

type Paginated<T> = { items?: T[]; data?: T[] };

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
}

async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể xử lý monthly report");
  }

  return (payload?.data ?? payload) as T;
}

function StatusBadge({ status }: { status: ReportStatus }) {
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
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${map[status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {icons[status] || <FileText size={12} />}
      {status}
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

  const canManage = role === "management";
  const isTeacher = role === "teacher";
  const isViewer = role === "viewer";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const reportQuery = new URLSearchParams({
        month: `${month}`,
        year: `${year}`,
        pageNumber: "1",
        pageSize: "50",
      });

      if (isViewer) reportQuery.set("status", "Published");

      const [jobResult, reportResult] = await Promise.all([
        canManage
          ? apiFetch<Paginated<MonthlyJob>>(`/api/monthly-reports/jobs?month=${month}&year=${year}&pageNumber=1&pageSize=20`)
          : Promise.resolve({ items: [] }),
        apiFetch<Paginated<MonthlyReport>>(`/api/monthly-reports?${reportQuery.toString()}`),
      ]);

      setJobs(jobResult.items || jobResult.data || []);
      setReports(reportResult.items || reportResult.data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [canManage, isViewer, month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createJob = async () => {
    if (!branchId.trim()) return setError("Vui lòng nhập branchId.");
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

  const runAction = async (reportId: string, action: string, method: "POST" | "PUT" = "POST", body?: Record<string, string>) => {
    try {
      await apiFetch(`/api/monthly-reports/${reportId}/${action}`, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMessage(`Đã xử lý ${action}`);
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : `Không thể ${action}`);
    }
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
      return statusOk && textOk;
    });
  }, [reports, searchQuery, statusFilter]);

  const activeReport = useMemo(
    () => filteredReports.find((r) => r.id === activeReportId) || filteredReports[0],
    [filteredReports, activeReportId],
  );

  const stats = useMemo(() => {
    const total = reports.length;
    const drafts = reports.filter((r) => r.status === "Draft").length;
    const submitted = reports.filter((r) => r.status === "Submitted").length;
    const approved = reports.filter((r) => r.status === "Approved").length;
    return { total, drafts, submitted, approved };
  }, [reports]);

  const canTeacherSubmit = (status: ReportStatus) => status === "Draft" || status === "Rejected";
  const canManagementApprove = (status: ReportStatus) => status === "Submitted";
  const canManagementPublish = (status: ReportStatus) => status === "Approved";

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
              <p className="text-sm text-gray-600">Gom dữ liệu buổi học → Teacher draft/edit/submit → Staff/Admin review → Publish cho parent/student.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            {canManage && (
              <input className="rounded-xl border px-3 py-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="Branch ID" />
            )}
            <button onClick={fetchData} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm">Làm mới</button>
            {canManage && <button onClick={createJob} className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white">Tạo Job</button>}
          </div>
        </div>

        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-red-200 bg-white p-4"><div className="text-sm text-red-600">Tổng báo cáo</div><div className="text-2xl font-bold">{stats.total}</div></div>
        <div className="rounded-2xl border border-red-200 bg-white p-4"><div className="text-sm text-amber-600">Bản nháp</div><div className="text-2xl font-bold">{stats.drafts}</div></div>
        <div className="rounded-2xl border border-red-200 bg-white p-4"><div className="text-sm text-blue-600">Đã nộp</div><div className="text-2xl font-bold">{stats.submitted}</div></div>
        <div className="rounded-2xl border border-red-200 bg-white p-4"><div className="text-sm text-emerald-600">Đã duyệt</div><div className="text-2xl font-bold">{stats.approved}</div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-red-200 bg-white p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm theo học sinh, giáo viên, mã report..." className="w-full rounded-xl border border-red-200 py-2 pl-9 pr-3 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-red-200 px-3 py-2 text-sm">
                {["Tất cả", "Draft", "Submitted", "Approved", "Rejected", "Published"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white overflow-hidden">
            <div className="border-b border-red-100 p-4 flex items-center justify-between">
              <h3 className="font-semibold">Danh sách báo cáo ({filteredReports.length})</h3>
              {loading && <span className="text-sm text-gray-500">Đang tải...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-50/60 text-left text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Báo cáo</th>
                    <th className="px-4 py-3">Giáo viên</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-red-50/40 cursor-pointer" onClick={() => setActiveReportId(report.id)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{report.studentName || report.studentProfileId || report.id}</div>
                        <div className="text-xs text-gray-500">{report.className || report.classId || "N/A"} • {report.month}/{report.year}</div>
                      </td>
                      <td className="px-4 py-3"><div className="inline-flex items-center gap-1"><User size={12} />{report.teacherName || "Teacher"}</div></td>
                      <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                          <button className="rounded border px-2 py-1 text-xs" onClick={() => setActiveReportId(report.id)}><Eye size={12} /></button>
                          {isTeacher && <button className="rounded bg-purple-600 px-2 py-1 text-xs text-white" onClick={() => runAction(report.id, "generate-draft")}><Sparkles size={12} /></button>}
                          {isTeacher && <button disabled={!canTeacherSubmit(report.status)} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white disabled:bg-slate-300" onClick={() => runAction(report.id, "submit")}>Submit</button>}
                          {canManage && <button className="rounded bg-pink-600 px-2 py-1 text-xs text-white" onClick={() => runAction(report.id, "comments", "POST", { content: "Vui lòng bổ sung phần điểm mạnh/điểm yếu." })}>Comment</button>}
                          {canManage && <button disabled={!canManagementApprove(report.status)} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:bg-slate-300" onClick={() => runAction(report.id, "approve")}>Approve</button>}
                          {canManage && <button disabled={!canManagementApprove(report.status)} className="rounded bg-amber-600 px-2 py-1 text-xs text-white disabled:bg-slate-300" onClick={() => runAction(report.id, "reject")}>Reject</button>}
                          {canManage && <button disabled={!canManagementPublish(report.status)} className="rounded bg-sky-600 px-2 py-1 text-xs text-white disabled:bg-slate-300" onClick={() => runAction(report.id, "publish")}>Publish</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReports.length === 0 && <div className="p-8 text-center text-sm text-gray-500">Không có báo cáo phù hợp.</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-white p-4">
            <h3 className="mb-2 font-semibold flex items-center gap-2"><FileCheck size={16} /> Chi tiết report</h3>
            {activeReport ? (
              <div className="space-y-2 text-sm">
                <div className="font-semibold">{activeReport.studentName || activeReport.studentProfileId}</div>
                <div className="text-gray-600">{activeReport.className || activeReport.classId || "N/A"}</div>
                <StatusBadge status={activeReport.status} />
                <div className="text-xs text-gray-500">Teacher: {activeReport.teacherName || "N/A"}</div>
                {isTeacher && (
                  <button
                    disabled={!canTeacherSubmit(activeReport.status)}
                    className="mt-2 w-full rounded bg-cyan-700 px-3 py-2 text-xs font-medium text-white disabled:bg-slate-300"
                    onClick={() => runAction(activeReport.id, "draft", "PUT", { draftContent: "{\"overview\":\"Teacher updated manually\"}" })}
                  >
                    Update Draft (manual)
                  </button>
                )}
                <button className="w-full rounded border border-red-200 px-3 py-2 text-xs"><Download size={12} className="inline mr-1"/> Export/PDF</button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Chọn report để xem chi tiết.</p>
            )}
          </div>

          {canManage && (
            <div className="rounded-2xl border border-red-200 bg-white p-4">
              <h3 className="mb-2 font-semibold flex items-center gap-2"><TrendingUp size={16} /> Tiến độ thu thập</h3>
              <p className="text-sm text-gray-600">Jobs tháng {month}/{year}: {jobs.length}</p>
              <div className="mt-2 space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border p-2 text-xs">
                    <div>{job.month}/{job.year} • {job.status}</div>
                    <button className="mt-1 rounded bg-blue-600 px-2 py-1 text-white" onClick={() => apiFetch(`/api/monthly-reports/jobs/${job.id}/aggregate`, { method: "POST" }).then(fetchData)}>Aggregate</button>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-xs text-gray-500">Chưa có job.</p>}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-red-200 bg-white p-4">
            <h3 className="mb-2 font-semibold flex items-center gap-2"><MessageSquare size={16} /> Bình luận gần nhất</h3>
            {activeReport?.comments?.length ? (
              <ul className="space-y-2 text-xs">
                {activeReport.comments.slice(0, 3).map((c) => (
                  <li key={c.id} className="rounded border p-2">{c.authorName || "Staff/Admin"}: {c.content}</li>
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

      <div className="text-xs text-gray-500 flex items-center gap-2"><Users size={12} /> Viewer chỉ thấy Published là do API filter theo role viewer.</div>
    </div>
  );
}
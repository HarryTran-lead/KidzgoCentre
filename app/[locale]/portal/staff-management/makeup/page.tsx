"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  PlusCircle,
  Search,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  approveLeaveRequest,
  getLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/leaveRequestService";

import type { LeaveRequestRecord, LeaveRequestStatus } from "@/types/leaveRequest";

import LeaveRequestCreateModal from "@/components/portal/parent/modalsLeaveRequest/LeaveRequestCreateModal";
import MakeupSessionCreateModal, {
  type CreateMakeupPayload,
} from "@/components/portal/parent/modalsLeaveRequest/MakeupSessionCreateModal";

/* ===================== Types ===================== */

type LeaveRequestStatusLabel =
  | "Auto-approve"
  | "Đã duyệt"
  | "Chờ duyệt"
  | "Từ chối";

type LeaveRequest = {
  id: string;
  student: string;
  course: string;
  type: string;
  requestTime: string;
  sessionTime: string;
  status: LeaveRequestStatusLabel;
  credit: number;
  note: string;
  raw?: LeaveRequestRecord;
};

/* ===================== Constants ===================== */

const statusMap: Record<LeaveRequestStatus, LeaveRequestStatusLabel> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  AUTO_APPROVED: "Auto-approve",
};

const statusOptions: (LeaveRequestStatusLabel | "Tất cả")[] = [
  "Tất cả",
  "Chờ duyệt",
  "Đã duyệt",
  "Từ chối",
  "Auto-approve",
];

/* ===================== Helpers ===================== */

const mapLeaveRequests = (items: LeaveRequestRecord[]): LeaveRequest[] => {
  if (!items?.length) return [];

  return items.map((item) => {
    const statusKey = item.status ?? "PENDING";
    const statusLabel = statusMap[statusKey] ?? "Chờ duyệt";

    const start = item.sessionDate ?? "";
    const end = item.endDate ?? item.sessionDate ?? ""; // tránh undefined
    const isSingleDay = !!start && !!end && start === end;

    return {
      id: item.id,
      student:
        item.studentName ?? item.requesterName ?? item.studentProfileId,
      course: item.className ?? item.classId,
      type: isSingleDay ? "Nghỉ 1 ngày" : "Nghỉ dài ngày",
      requestTime: item.createdAt ?? item.submittedAt ?? "-",
      sessionTime: start ? (end ? `${start} → ${end}` : start) : "-",
      status: statusLabel,
      credit: statusLabel === "Auto-approve" && isSingleDay ? 1 : 0,
      note: item.reason ?? "-",
      raw: item,
    };
  });
};

/* ===================== UI bits ===================== */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string; // ex: "from-pink-500 to-rose-500"
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r ${color}`}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div
          className={`p-2 rounded-xl bg-gradient-to-r ${color} text-white shadow-sm flex-shrink-0`}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-600 truncate">
            {title}
          </div>
          <div className="text-xl font-bold text-gray-900 leading-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-[11px] text-gray-500 truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveRequestStatusLabel }) {
  const map: Record<
    LeaveRequestStatusLabel,
    { cls: string; icon: LucideIcon }
  > = {
    "Chờ duyệt": {
      cls: "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200",
      icon: Clock,
    },
    "Đã duyệt": {
      cls: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Từ chối": {
      cls: "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200",
      icon: XCircle,
    },
    "Auto-approve": {
      cls: "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200",
      icon: CheckCircle2,
    },
  };

  const cfg = map[status];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}
    >
      <Icon size={12} />
      <span>{status}</span>
    </span>
  );
}

function Banner({
  kind,
  text,
}: {
  kind: "error" | "success";
  text: string;
}) {
  const cls =
    kind === "error"
      ? "border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700";

  const Icon = kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5" />
        <div className="text-sm font-medium">{text}</div>
      </div>
    </div>
  );
}

/* ===================== Page ===================== */

export default function Page() {
  const [requestItems, setRequestItems] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    LeaveRequestStatusLabel | "Tất cả"
  >("Tất cả");

  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [openMakeupModal, setOpenMakeupModal] = useState(false);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoadingRequests(true);
      setActionError(null);
      try {
        const response = await getLeaveRequests();
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.items ?? [];
        setRequestItems(mapLeaveRequests(data));
      } catch {
        setActionError("Không thể tải danh sách đơn xin nghỉ.");
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  const stats = useMemo(() => {
    const total = requestItems.length;
    const pending = requestItems.filter((r) => r.status === "Chờ duyệt").length;
    const approved = requestItems.filter((r) => r.status === "Đã duyệt").length;
    const rejected = requestItems.filter((r) => r.status === "Từ chối").length;
    const auto = requestItems.filter((r) => r.status === "Auto-approve").length;
    return { total, pending, approved, rejected, auto };
  }, [requestItems]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return requestItems.filter((r) => {
      const matchesStatus =
        statusFilter === "Tất cả" || r.status === statusFilter;

      const matchesSearch =
        !q ||
        r.student.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.course ?? "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [requestItems, searchQuery, statusFilter]);

  const updateRequestStatus = (id: string, status: LeaveRequestStatusLabel) => {
    setRequestItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, credit: status === "Auto-approve" ? 1 : 0 }
          : item
      )
    );
  };

  const handleApprove = async (id: string) => {
    setActionError(null);
    setActionMessage(null);
    try {
      await approveLeaveRequest(id);
      updateRequestStatus(id, "Đã duyệt");
      setActionMessage(
        "Đã duyệt đơn. Duyệt thủ công không tự tạo MakeUpCredit."
      );
    } catch {
      setActionError("Duyệt đơn thất bại.");
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    setActionMessage(null);
    try {
      await rejectLeaveRequest(id);
      updateRequestStatus(id, "Từ chối");
      setActionMessage("Đã từ chối đơn xin nghỉ.");
    } catch {
      setActionError("Từ chối đơn thất bại.");
    }
  };

  // TODO: nối API tạo lịch bù
  const handleCreateMakeup = async (payload: CreateMakeupPayload) => {
    console.log("Create makeup payload:", payload);
    setActionMessage("Đã tạo lịch bù (demo). Nối API create makeup ở đây.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-lg">
            <CalendarDays size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Học bù & MakeUpCredit
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Duyệt đơn nghỉ và xếp lịch học bù.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors">
            <Download size={16} /> Xuất DS
          </button>

          <button
            onClick={() => setOpenLeaveModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors"
          >
            <FileText size={16} /> Tạo đơn nghỉ
          </button>

          <button
            onClick={() => setOpenMakeupModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            <PlusCircle size={16} /> Tạo lịch bù
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Tổng đơn"
          value={String(stats.total)}
          subtitle="Trong danh sách"
          icon={FileText}
          color="from-pink-500 to-rose-500"
        />
        <StatCard
          title="Chờ duyệt"
          value={String(stats.pending)}
          subtitle="Cần xử lý"
          icon={Clock}
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Đã duyệt"
          value={String(stats.approved)}
          subtitle="Duyệt thủ công"
          icon={CheckCircle2}
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Từ chối"
          value={String(stats.rejected)}
          subtitle="Không hợp lệ"
          icon={XCircle}
          color="from-rose-500 to-pink-500"
        />
        <StatCard
          title="Auto-approve"
          value={String(stats.auto)}
          subtitle="Đủ điều kiện"
          icon={CheckCircle2}
          color="from-blue-500 to-cyan-500"
        />
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {actionError && <Banner kind="error" text={actionError} />}
        {actionMessage && <Banner kind="success" text={actionMessage} />}
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as any)
                }
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {loadingRequests && (
              <div className="text-sm text-gray-500">
                Đang tải danh sách...
              </div>
            )}
          </div>

          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, học viên, khóa..."
              className="h-10 w-80 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách đơn nghỉ
            </h2>
            <div className="text-sm text-gray-600 font-medium">
              {filtered.length} đơn
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Học viên
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Khóa
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Thời gian
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Credit
                </th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-pink-100">
              {filtered.length > 0 ? (
                filtered.map((r) => {
                  const disabled = r.status !== "Chờ duyệt";

                  return (
                    <tr
                      key={r.id}
                      className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {r.student}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {r.id}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {r.course}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.type}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">
                          {r.sessionTime}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-gray-900">
                          {r.credit}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={disabled}
                            onClick={() => handleApprove(r.id)}
                            className={`p-1.5 rounded-lg border border-pink-200 bg-white transition-colors ${
                              disabled
                                ? "opacity-40 cursor-not-allowed text-gray-400"
                                : "text-gray-500 hover:text-pink-600 hover:bg-pink-50 cursor-pointer"
                            }`}
                            title="Duyệt"
                          >
                            <ShieldCheck size={14} />
                          </button>

                          <button
                            disabled={disabled}
                            onClick={() => handleReject(r.id)}
                            className={`p-1.5 rounded-lg border border-pink-200 bg-white transition-colors ${
                              disabled
                                ? "opacity-40 cursor-not-allowed text-gray-400"
                                : "text-gray-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            }`}
                            title="Từ chối"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                      <Search size={24} className="text-pink-400" />
                    </div>
                    <div className="text-gray-600 font-medium">
                      Không có đơn phù hợp
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Thử thay đổi bộ lọc hoặc từ khóa
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <LeaveRequestCreateModal
        open={openLeaveModal}
        onClose={() => setOpenLeaveModal(false)}
        onCreated={(record) => {
          const mapped = mapLeaveRequests([record]);
          setRequestItems((prev) => [...mapped, ...prev]);
        }}
      />

      <MakeupSessionCreateModal
        open={openMakeupModal}
        onClose={() => setOpenMakeupModal(false)}
        onCreate={handleCreateMakeup}
      />
    </div>
  );
}

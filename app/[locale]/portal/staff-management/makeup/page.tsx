"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Search,
  ShieldCheck,
  XCircle,
  Plus,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  approveLeaveRequest,
  getLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/leaveRequestService";

import type { LeaveRequestRecord } from "@/types/leaveRequest";
import { useMakeupCredit } from "@/lib/api/makeupCreditService";
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
  parentName: string;
  className: string;
  type: string;
  requestTime: string;
  sessionTime: string;
  status: LeaveRequestStatusLabel;
  credit: number;
  note: string;
  raw?: LeaveRequestRecord;
};

/* ===================== Constants ===================== */

const statusMap = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  AUTO_APPROVED: "Auto-approve",
} as const;

type NormalizedStatusKey = keyof typeof statusMap;

const statusOptions: (LeaveRequestStatusLabel | "Tất cả")[] = [
  "Tất cả",
  "Chờ duyệt",
  "Đã duyệt",
  "Từ chối",
  "Auto-approve",
];

/* ===================== Helpers ===================== */

function normalizeStatus(input: unknown): NormalizedStatusKey {
  if (!input) return "PENDING";

  const raw = String(input).trim();
  const s = raw.replace(/\s+/g, "_").replace(/-+/g, "_").toUpperCase();

  // backend hay trả: Approved / Rejected / Pending
  if (s === "APPROVED") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  if (s === "PENDING") return "PENDING";

  // vài biến thể hay gặp
  if (s === "AUTOAPPROVED" || s === "AUTO_APPROVED" || s === "AUTO_APPROVE")
    return "AUTO_APPROVED";

  return "PENDING";
}

const mapLeaveRequests = (items: LeaveRequestRecord[]): LeaveRequest[] => {
  if (!items?.length) return [];

  return items.map((item) => {
    const statusKey = normalizeStatus((item as any).status);
    const statusLabel = statusMap[statusKey];

    const start = (item as any).sessionDate ?? "";
    const end = (item as any).endDate ?? (item as any).sessionDate ?? "";
    const isSingleDay = !!start && !!end && start === end;

    return {
      id: (item as any).id,
      student:
        (item as any).studentName ??
        (item as any).studentProfileId ??
        "Chưa có học viên",
      parentName: (item as any).requesterName ?? "Chưa có phụ huynh",
      className: (item as any).className ?? (item as any).classId ?? "Chưa có lớp",
      type: isSingleDay ? "Nghỉ 1 ngày" : "Nghỉ dài ngày",
      requestTime: (item as any).createdAt ?? (item as any).requestedAt ?? (item as any).submittedAt ?? "-",
      sessionTime: start ? (end ? `${start} → ${end}` : start) : "-",
      status: statusLabel,
      credit: statusLabel === "Auto-approve" && isSingleDay ? 1 : 0,
      note: (item as any).reason ?? "-",
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
  icon: LucideIcon;
  color: string; // ex: "from-pink-500 to-rose-500"
}) {
  return (
    <div className="rounded-2xl border border-pink-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-700">{title}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
        </div>
        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveRequestStatusLabel }) {
  const cls =
    status === "Đã duyệt"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Từ chối"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : status === "Auto-approve"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex items-center rounded-xl border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
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

function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  onClose,
  onConfirm,
  disabled,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  onClose: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-pink-100">
        <div className="p-5 space-y-3">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <p className="text-sm text-gray-600 whitespace-pre-line">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-pink-100 px-5 py-3">
          <button
            onClick={onClose}
            disabled={disabled}
            className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-pink-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-50"
          >
            {confirmText}
          </button>
        </div>
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
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatusLabel | "Tất cả">("Tất cả");

  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [openMakeupModal, setOpenMakeupModal] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    request: LeaveRequest;
  } | null>(null);

  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoadingRequests(true);
      setActionError(null);
      try {
        const response = await getLeaveRequests();
        const data = Array.isArray((response as any).data)
          ? (response as any).data
          : (response as any).data?.items ?? [];
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
      const matchesStatus = statusFilter === "Tất cả" || r.status === statusFilter;

      const matchesSearch =
        !q ||
        r.student.toLowerCase().includes(q) ||
        r.parentName.toLowerCase().includes(q) ||
        (r.className ?? "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);

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
      setActionMessage("Đã duyệt đơn. Duyệt thủ công không tự tạo MakeUpCredit.");
      return true;
    } catch {
      setActionError("Duyệt đơn thất bại.");
      return false;
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    setActionMessage(null);
    try {
      await rejectLeaveRequest(id);
      updateRequestStatus(id, "Từ chối");
      setActionMessage("Đã từ chối đơn xin nghỉ.");
      return true;
    } catch {
      setActionError("Từ chối đơn thất bại.");
      return false;
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setProcessingAction(true);

    const ok =
      confirmAction.type === "approve"
        ? await handleApprove(confirmAction.request.id)
        : await handleReject(confirmAction.request.id);

    // đóng modal dù ok hay fail (vì đã show banner)
    setConfirmAction(null);
    setProcessingAction(false);

    return ok;
  };

  // TODO: nối API tạo lịch bù
  const handleCreateMakeup = async (payload: CreateMakeupPayload) => {
     setActionError(null);
    setActionMessage(null);
    try {
      await useMakeupCredit(payload.makeupCreditId, {
        classId: payload.targetClassId,
        targetSessionId: payload.targetSessionId,
        date: payload.date,
        time: payload.time,
        note: payload.note,
      });
      setActionMessage("Đã tạo lịch bù thành công.");
    } catch {
      setActionError("Tạo lịch bù thất bại.");
    }
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
            <p className="text-sm text-gray-600 mt-1">Duyệt đơn nghỉ và xếp lịch học bù.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOpenLeaveModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg"
          >
            <Plus size={16} />
            Tạo đơn nghỉ
          </button>

          <button
            onClick={() => setOpenMakeupModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-pink-50"
          >
            <Clock3 size={16} />
            Tạo lịch bù
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(actionError || actionMessage) && (
        <div className="space-y-3">
          {actionError && <Banner kind="error" text={actionError} />}
          {actionMessage && <Banner kind="success" text={actionMessage} />}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Tổng" value={String(stats.total)} icon={CalendarDays} color="from-pink-500 to-rose-500" />
        <StatCard title="Chờ duyệt" value={String(stats.pending)} icon={Clock3} color="from-amber-500 to-orange-500" />
        <StatCard title="Đã duyệt" value={String(stats.approved)} icon={ShieldCheck} color="from-emerald-500 to-teal-500" />
        <StatCard title="Từ chối" value={String(stats.rejected)} icon={XCircle} color="from-rose-500 to-pink-500" />
        <StatCard title="Auto" value={String(stats.auto)} icon={CheckCircle2} color="from-blue-500 to-indigo-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {loadingRequests && <div className="text-sm text-gray-500">Đang tải danh sách...</div>}
        </div>

        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo học viên, phụ huynh, lớp, mã đơn..."
            className="h-10 w-80 rounded-xl border border-pink-200 bg-white pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-b border-pink-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách đơn nghỉ</h2>
            <div className="text-sm text-gray-600 font-medium">{filtered.length} đơn</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-200">
              <tr>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Phụ huynh</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Học viên</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lớp</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Credit</th>
                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Thao tác</th>
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
                        <div className="text-sm font-medium text-gray-900">{r.parentName}</div>
                        <div className="text-xs text-gray-500 font-mono">{r.id}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{r.student}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{r.className}</div>
                        <div className="text-xs text-gray-500">{r.type}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">{r.sessionTime}</div>
                        <div className="text-xs text-gray-500">{r.requestTime}</div>
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold text-gray-900">{r.credit}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={disabled}
                            onClick={() => setConfirmAction({ type: "approve", request: r })}
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
                            onClick={() => setConfirmAction({ type: "reject", request: r })}
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
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 flex items-center justify-center">
                      <Search size={24} className="text-pink-400" />
                    </div>
                    <div className="text-gray-600 font-medium">Không có đơn phù hợp</div>
                    <div className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === "approve" ? "Xác nhận duyệt đơn" : "Xác nhận từ chối"}
        description={
          confirmAction
            ? `Phụ huynh: ${confirmAction.request.parentName}\nHọc viên: ${confirmAction.request.student}\nLớp: ${confirmAction.request.className}\nThời gian: ${confirmAction.request.sessionTime}`
            : ""
        }
        confirmText={confirmAction?.type === "approve" ? "Duyệt đơn" : "Từ chối"}
        disabled={processingAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

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

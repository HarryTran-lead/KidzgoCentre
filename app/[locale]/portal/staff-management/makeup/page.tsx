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
  ArrowRight,
} from "lucide-react";

import {
  approveLeaveRequest,
  getLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/leaveRequestService";

import type { LeaveRequestRecord } from "@/types/leaveRequest";

import { getMakeupCredits } from "@/lib/api/makeupCreditService";
import type { MakeupCredit } from "@/types/makeupCredit";

import LeaveRequestCreateModal from "@/components/portal/parent/modalsLeaveRequest/LeaveRequestCreateModal";
import MakeupSessionCreateModal, {
  type CreateMakeupPayload,
} from "@/components/portal/parent/modalsLeaveRequest/MakeupSessionCreateModal";

import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

/* ===================== Types ===================== */

type LeaveRequestStatusLabel = "Auto-approve" | "Đã duyệt" | "Chờ duyệt" | "Từ chối";

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

type SessionDetail = {
  id: string;
  classId: string;
  classCode?: string | null;
  classTitle?: string | null;
  plannedDatetime?: string | null;
  plannedRoomName?: string | null;
  branchName?: string | null;
};

type UsedMakeupCredit = {
  id: string;
  student: string;
  status: string;
  createdReason?: string;
  createdAt?: string;
  sourceSessionId?: string;
  usedSessionId?: string;
  sourceSession?: SessionDetail | null;
  usedSession?: SessionDetail | null;
  raw?: MakeupCredit;
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

const pickValue = (obj: any, paths: string[]) => {
  for (const p of paths) {
    const v = p.split(".").reduce((acc, k) => acc?.[k], obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const unwrap = (res: any) => {
  // axios response thường là { data: ... }
  const root = res?.data ?? res;
  // nhiều API lại wrap thêm 1 lớp data
  return root?.data ?? root;
};

const formatDateTimeVN = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function getSessionById(sessionId: string): Promise<SessionDetail | null> {
  if (!sessionId) return null;
  try {
    const res = await get<any>(`${TEACHER_ENDPOINTS.SESSIONS}/${sessionId}`);
    const api = unwrap(res);
    const s = api?.session ?? api;
    if (!s?.id) return null;

    return {
      id: s.id,
      classId: s.classId,
      classCode: s.classCode ?? null,
      classTitle: s.classTitle ?? null,
      plannedDatetime: s.plannedDatetime ?? null,
      plannedRoomName: s.plannedRoomName ?? null,
      branchName: s.branchName ?? null,
    };
  } catch {
    return null;
  }
}

function normalizeStatus(input: unknown): NormalizedStatusKey {
  if (!input) return "PENDING";

  const raw = String(input).trim();
  const s = raw.replace(/\s+/g, "_").replace(/-+/g, "_").toUpperCase();

  if (s === "APPROVED") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  if (s === "PENDING") return "PENDING";

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
      requestTime:
        (item as any).createdAt ??
        (item as any).requestedAt ??
        (item as any).submittedAt ??
        "-",
      sessionTime: start ? (end ? `${start} → ${end}` : start) : "-",
      status: statusLabel,
      credit: statusLabel === "Auto-approve" && isSingleDay ? 1 : 0,
      note: (item as any).reason ?? "-",
      raw: item,
    };
  });
};

const mapUsedMakeupCredits = (items: MakeupCredit[]): UsedMakeupCredit[] => {
  if (!items?.length) return [];

  return items.map((item) => ({
    id: String(pickValue(item, ["id"]) ?? ""),
    student:
      (pickValue(item, ["studentName", "studentFullName", "studentProfileName"]) as
        | string
        | undefined) ??
      (pickValue(item, ["studentProfileId", "studentId"]) as string | undefined) ??
      "Chưa rõ học viên",
    status: String(pickValue(item, ["status"]) ?? "Used"),
    createdReason: (pickValue(item, ["createdReason"]) as string | undefined) ?? undefined,
    createdAt: (pickValue(item, ["createdAt"]) as string | undefined) ?? undefined,
    sourceSessionId: (pickValue(item, ["sourceSessionId"]) as string | undefined) ?? undefined,
    usedSessionId: (pickValue(item, ["usedSessionId"]) as string | undefined) ?? undefined,
    raw: item,
  }));
};

const sessionTitle = (session: SessionDetail | null | undefined) =>
  [session?.classCode, session?.classTitle].filter(Boolean).join(" - ") || "Chưa có lớp";

const sessionMeta = (session: SessionDetail | null | undefined) =>
  [session?.branchName, session?.plannedRoomName].filter(Boolean).join(" • ");

/* ===================== UI bits ===================== */

function Banner({ kind, text }: { kind: "error" | "success"; text: string }) {
  const cls =
    kind === "error"
      ? "border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700";
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5" />
        <div className="text-sm font-medium whitespace-pre-line">{text}</div>
      </div>
    </div>
  );
}

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
        <div
          className={`h-12 w-12 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center shadow-lg`}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  disabled,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-pink-100">
        <div className="p-5 border-b border-pink-100">
          <div className="text-lg font-bold text-gray-900">{title}</div>
          <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
            {description}
          </div>
        </div>

        <div className="p-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-pink-50 transition-colors disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-60"
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
  const [activeTab, setActiveTab] = useState<"leave" | "makeup">("leave");

  // Leave Requests
  const [requestItems, setRequestItems] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatusLabel | "Tất cả">(
    "Tất cả"
  );

  const [openLeaveModal, setOpenLeaveModal] = useState(false);
  const [openMakeupModal, setOpenMakeupModal] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    request: LeaveRequest;
  } | null>(null);

  const [processingAction, setProcessingAction] = useState(false);

  // Used credits (Makeup list)
  const [usedCredits, setUsedCredits] = useState<UsedMakeupCredit[]>([]);
  const [loadingUsedCredits, setLoadingUsedCredits] = useState(false);
  const [usedError, setUsedError] = useState<string | null>(null);

  const fetchLeaveRequests = async () => {
    setLoadingRequests(true);
    setActionError(null);
    try {
      const response = await getLeaveRequests();
      const api = unwrap(response);
      const items = Array.isArray(api?.items) ? api.items : Array.isArray(api) ? api : [];
      setRequestItems(mapLeaveRequests(items as LeaveRequestRecord[]));
    } catch {
      setActionError("Không thể tải danh sách đơn xin nghỉ.");
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchUsedCredits = async () => {
    setLoadingUsedCredits(true);
    setUsedError(null);
    try {
      // nếu API bạn yêu cầu phân trang thì add pageNumber/pageSize ở đây
      const response = await getMakeupCredits({ status: "used", pageNumber: 1, pageSize: 100 });
      const api = unwrap(response);
      const items = Array.isArray(api?.items) ? api.items : Array.isArray(api) ? api : [];
      const mapped = mapUsedMakeupCredits(items as MakeupCredit[]);

      const sessionIds = new Set<string>();
      mapped.forEach((credit) => {
        if (credit.sourceSessionId) sessionIds.add(credit.sourceSessionId);
        if (credit.usedSessionId) sessionIds.add(credit.usedSessionId);
      });

      const sessionEntries = await Promise.all(
        Array.from(sessionIds).map(async (id) => [id, await getSessionById(id)] as const)
      );
      const sessionMap = new Map(sessionEntries);

      setUsedCredits(
        mapped.map((credit) => ({
          ...credit,
          sourceSession: credit.sourceSessionId
            ? sessionMap.get(credit.sourceSessionId) ?? null
            : null,
          usedSession: credit.usedSessionId
            ? sessionMap.get(credit.usedSessionId) ?? null
            : null,
        }))
      );
    } catch {
      setUsedError("Không thể tải danh sách đơn makeup.");
    } finally {
      setLoadingUsedCredits(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchUsedCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = requestItems.length;
    const pending = requestItems.filter((r) => r.status === "Chờ duyệt").length;
    const approved = requestItems.filter((r) => r.status === "Đã duyệt").length;
    const rejected = requestItems.filter((r) => r.status === "Từ chối").length;
    const auto = requestItems.filter((r) => r.status === "Auto-approve").length;
    return { total, pending, approved, rejected, auto };
  }, [requestItems]);

  const filteredLeave = useMemo(() => {
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

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setProcessingAction(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const id = confirmAction.request.id;

      if (confirmAction.type === "approve") {
        const res = await approveLeaveRequest(id);
        const api = unwrap(res);
        if (api?.success === false || api?.isSuccess === false) {
          throw new Error(api?.message ?? "Duyệt đơn thất bại");
        }
        setActionMessage("Duyệt đơn thành công.");
      } else {
        const res = await rejectLeaveRequest(id);
        const api = unwrap(res);
        if (api?.success === false || api?.isSuccess === false) {
          throw new Error(api?.message ?? "Từ chối đơn thất bại");
        }
        setActionMessage("Từ chối đơn thành công.");
      }

      setConfirmAction(null);
      await fetchLeaveRequests();
    } catch (e: any) {
      setActionError(e?.message ?? "Thao tác thất bại.");
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50/30 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">Staff Management • Leave & Makeup</div>
            <div className="mt-1 text-sm text-gray-600">
              Quản lý đơn xin nghỉ và đơn makeup (tách tab để khỏi rối).
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("leave");
                setOpenLeaveModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition"
            >
              <Plus size={16} />
              Tạo đơn xin nghỉ
            </button>

            <button
              onClick={() => {
                setActiveTab("makeup");
                setOpenMakeupModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition"
            >
              <Plus size={16} />
              Tạo lịch bù
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("leave")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition
              ${
                activeTab === "leave"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow"
                  : "bg-white text-gray-700 border-pink-200 hover:bg-pink-50"
              }`}
          >
            <CalendarDays size={16} />
            Đơn xin nghỉ
            <span
              className={`ml-1 rounded-lg px-2 py-0.5 text-xs font-bold
              ${
                activeTab === "leave"
                  ? "bg-white/20 text-white"
                  : "bg-pink-50 text-pink-700 border border-pink-200"
              }`}
            >
              {requestItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("makeup")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition
              ${
                activeTab === "makeup"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow"
                  : "bg-white text-gray-700 border-blue-200 hover:bg-blue-50"
              }`}
          >
            <Clock3 size={16} />
            Đơn makeup
            <span
              className={`ml-1 rounded-lg px-2 py-0.5 text-xs font-bold
              ${
                activeTab === "makeup"
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {usedCredits.length}
            </span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {actionError && <Banner kind="error" text={actionError} />}
      {actionMessage && <Banner kind="success" text={actionMessage} />}

      {/* LEAVE TAB */}
      {activeTab === "leave" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <StatCard
              title="Tổng"
              value={String(stats.total)}
              icon={CalendarDays}
              color="from-pink-500 to-rose-500"
            />
            <StatCard
              title="Chờ duyệt"
              value={String(stats.pending)}
              icon={AlertCircle}
              color="from-amber-500 to-orange-500"
            />
            <StatCard
              title="Đã duyệt"
              value={String(stats.approved)}
              icon={ShieldCheck}
              color="from-emerald-500 to-teal-500"
            />
            <StatCard
              title="Từ chối"
              value={String(stats.rejected)}
              icon={XCircle}
              color="from-rose-500 to-pink-500"
            />
            <StatCard
              title="Auto-approve"
              value={String(stats.auto)}
              icon={CheckCircle2}
              color="from-fuchsia-500 to-purple-500"
            />
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-pink-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo học viên / phụ huynh / lớp / mã đơn..."
                  className="h-11 w-full rounded-xl border border-pink-200 bg-white pl-10 pr-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-11 rounded-xl border border-pink-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={fetchLeaveRequests}
                  className="h-11 rounded-xl border border-pink-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-pink-50 transition"
                >
                  Reload
                </button>
              </div>
            </div>
          </div>

          {/* Leave Table */}
          <div className="rounded-2xl border border-pink-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-pink-100 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">Danh sách đơn xin nghỉ</div>
                {loadingRequests && <div className="text-sm text-gray-500 mt-1">Đang tải...</div>}
              </div>
              <div className="text-sm text-gray-600 font-medium">{filteredLeave.length} đơn</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-b border-pink-100">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Học viên</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Phụ huynh</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Lớp</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Ghi chú</th>
                    <th className="py-3 px-6 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-pink-50">
                  {filteredLeave.length > 0 ? (
                    filteredLeave.map((r) => {
                      const canAct = r.status === "Chờ duyệt";
                      return (
                        <tr
                          key={r.id}
                          className="group hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-white transition-all duration-200"
                        >
                          <td className="py-4 px-6">
                            <div className="text-sm font-medium text-gray-900">{r.student}</div>
                            <div className="text-xs text-gray-500 font-mono">{r.id}</div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">{r.parentName}</td>
                          <td className="py-4 px-6 text-sm text-gray-700">{r.className}</td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-700">{r.sessionTime}</div>
                            <div className="text-xs text-gray-500">{r.requestTime}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center rounded-xl border border-pink-200 bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">{r.note}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                disabled={!canAct}
                                onClick={() => setConfirmAction({ type: "approve", request: r })}
                                className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                title="Duyệt"
                              >
                                <ShieldCheck size={14} />
                                Duyệt
                              </button>
                              <button
                                disabled={!canAct}
                                onClick={() => setConfirmAction({ type: "reject", request: r })}
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                title="Từ chối"
                              >
                                <XCircle size={14} />
                                Từ chối
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
        </>
      )}

      {/* MAKEUP TAB */}
      {activeTab === "makeup" && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Danh sách đơn makeup</h2>
                <div className="text-sm text-gray-600 mt-1">
                  Hiển thị các credit đã dùng + map session để ra tên lớp / thời gian.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchUsedCredits}
                  className="h-11 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-blue-50 transition"
                >
                  Reload
                </button>
                <div className="text-sm text-gray-600 font-medium">{usedCredits.length} đơn</div>
              </div>
            </div>

            {loadingUsedCredits && (
              <div className="text-sm text-gray-500 mt-1">Đang tải danh sách đơn makeup...</div>
            )}
            {usedError && (
              <div className="mt-2">
                <Banner kind="error" text={usedError} />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-b border-blue-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Học viên</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Buổi nghỉ</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Buổi bù</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Tạo lúc</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-100">
                {usedCredits.length > 0 ? (
                  usedCredits.map((credit) => {
                    const sourceTime = credit.sourceSession?.plannedDatetime
                      ? formatDateTimeVN(credit.sourceSession.plannedDatetime)
                      : "Chưa có thời gian";
                    const usedTime = credit.usedSession?.plannedDatetime
                      ? formatDateTimeVN(credit.usedSession.plannedDatetime)
                      : "Chưa có thời gian";
                    const createdTime = credit.createdAt ? formatDateTimeVN(credit.createdAt) : "-";
                    const sourceMeta = sessionMeta(credit.sourceSession);
                    const usedMeta = sessionMeta(credit.usedSession);

                    return (
                      <tr
                        key={credit.id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-gray-900">{credit.student}</div>
                          <div className="text-xs text-gray-500 font-mono">{credit.id}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {sessionTitle(credit.sourceSession)}
                          </div>
                          <div className="text-xs text-gray-500">{sourceTime}</div>
                          {sourceMeta && <div className="text-xs text-gray-500">{sourceMeta}</div>}
                          {!credit.sourceSession && credit.sourceSessionId && (
                            <div className="text-xs text-gray-400">ID: {credit.sourceSessionId}</div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {sessionTitle(credit.usedSession)}
                          </div>
                          <div className="text-xs text-gray-500">{usedTime}</div>
                          {usedMeta && <div className="text-xs text-gray-500">{usedMeta}</div>}
                          {!credit.usedSession && credit.usedSessionId && (
                            <div className="text-xs text-gray-400">ID: {credit.usedSessionId}</div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {credit.status}
                          </span>
                          {credit.createdReason && (
                            <div className="mt-1 text-xs text-gray-500">
                              Lý do: {credit.createdReason}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-700">{createdTime}</div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                        <Search size={24} className="text-blue-400" />
                      </div>
                      <div className="text-gray-600 font-medium">Chưa có đơn makeup</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Danh sách sẽ hiển thị khi có credit đã dùng để tạo lịch bù.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
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
          setActiveTab("leave");
        }}
      />

      <MakeupSessionCreateModal
        open={openMakeupModal}
        onClose={() => setOpenMakeupModal(false)}
        onCreate={async (payload: CreateMakeupPayload) => {
          // Modal đang handle call API create bên trong onCreate từ page trước đây.
          // Bạn giữ logic cũ của bạn ở đây (gọi API create).
          // Sau khi tạo xong thì refresh list makeup.
          // NOTE: Mình để trống vì bạn chưa paste hàm create service ở page này.
          // -> nếu bạn đã có handleCreateMakeup ở file cũ thì thay vào đây.

          // Ví dụ:
          // await createMakeupSession(payload);
          // await fetchUsedCredits();

          await fetchUsedCredits();
          setActiveTab("makeup");
        }}
      />
    </div>
  );
}

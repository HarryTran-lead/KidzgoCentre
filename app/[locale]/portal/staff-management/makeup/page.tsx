"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  XCircle,
  ArrowUpDown,
  FileText,
  LucideIcon 
} from "lucide-react";
import {
  approveLeaveRequest,
  createLeaveRequest,
  getLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/leaveRequestService";
import type {
  LeaveRequestPayload,
  LeaveRequestRecord,
  LeaveRequestStatus,
} from "@/types/leaveRequest";

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

type MakeupStatus = "Chờ xác nhận" | "Đã xác nhận" | "Đã hủy";

type MakeupSession = {
  id: string;
  student: string;
  fromClass: string;
  targetClass: string;
  date: string;
  time: string;
  status: MakeupStatus;
};

/* ===================== Constants ===================== */

const initialFormState: LeaveRequestPayload = {
  studentProfileId: "",
  classId: "",
  sessionDate: "",
  endDate: "",
  reason: "",
};

const statusMap: Record<LeaveRequestStatus, LeaveRequestStatusLabel> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  AUTO_APPROVED: "Auto-approve",
};

const MAKEUP_SESSIONS: MakeupSession[] = [];

/* ===================== Helpers ===================== */

const mapLeaveRequests = (items: LeaveRequestRecord[]): LeaveRequest[] => {
  if (!items?.length) return [];

  return items.map((item) => {
    const statusKey = item.status ?? "PENDING";
    const statusLabel = statusMap[statusKey] ?? "Chờ duyệt";
    const isSingleDay =
      item.sessionDate &&
      item.endDate &&
      item.sessionDate === item.endDate;

    return {
      id: item.id,
      student:
        item.studentName ??
        item.requesterName ??
        item.studentProfileId,
      course: item.className ?? item.classId,
      type: isSingleDay ? "Nghỉ 1 ngày" : "Nghỉ dài ngày",
      requestTime: item.createdAt ?? item.submittedAt ?? "-",
      sessionTime: item.sessionDate
        ? `${item.sessionDate} → ${item.endDate}`
        : "-",
      status: statusLabel,
      credit:
        statusLabel === "Auto-approve" && isSingleDay ? 1 : 0,
      note: item.reason ?? "-",
      raw: item,
    };
  });
};

/* ===================== UI Helpers ===================== */

function StatusBadge({
  status,
}: {
  status: LeaveRequestStatusLabel | MakeupStatus;
}) {
  const map: Record<string, { cls: string; icon: LucideIcon }> = {
    "Auto-approve": {
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Đã duyệt": {
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Chờ duyệt": {
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: Clock,
    },
    "Từ chối": {
      cls: "bg-rose-50 text-rose-700 border border-rose-200",
      icon: XCircle,
    },
    "Chờ xác nhận": {
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: Clock,
    },
    "Đã xác nhận": {
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
    },
    "Đã hủy": {
      cls: "bg-rose-50 text-rose-700 border border-rose-200",
      icon: XCircle,
    },
  };

  const cfg = map[status] ?? map["Chờ duyệt"];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}
    >
      <Icon size={12} />
      {status}
    </span>
  );
}

/* ===================== Page ===================== */

export default function Page() {
  const [activeTab, setActiveTab] = useState<
    "requests" | "sessions"
  >("requests");

  const [requestItems, setRequestItems] = useState<
    LeaveRequest[]
  >([]);
  const [loadingRequests, setLoadingRequests] =
    useState(false);

  const [showCreateForm, setShowCreateForm] =
    useState(false);
  const [formState, setFormState] =
    useState<LeaveRequestPayload>(initialFormState);
  const [creating, setCreating] = useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  /* ===================== Effects ===================== */

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await getLeaveRequests();
       const data = Array.isArray(response.data)
  ? response.data
  : response.data.items;

setRequestItems(mapLeaveRequests(data));

        setRequestItems(mapLeaveRequests(data ?? []));
      } catch (err) {
        console.error(err);
        setActionError("Không thể tải danh sách đơn xin nghỉ.");
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  /* ===================== Actions ===================== */

  const handleCreateRequest = async () => {
    setCreating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await createLeaveRequest(formState);
      if (response?.data) {
        const mapped = mapLeaveRequests([response.data]);
        setRequestItems((prev) => [...mapped, ...prev]);
        setFormState(initialFormState);
        setShowCreateForm(false);
      }
      setActionMessage(
        "Đã tạo đơn xin nghỉ. Đơn tạo trước 24h sẽ auto-approve."
      );
    } catch (err) {
      console.error(err);
      setActionError("Tạo đơn xin nghỉ thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const updateRequestStatus = (
    id: string,
    status: LeaveRequestStatusLabel
  ) => {
    setRequestItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              credit: status === "Auto-approve" ? 1 : 0,
            }
          : item
      )
    );
  };

  const handleApprove = async (id: string) => {
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
    try {
      await rejectLeaveRequest(id);
      updateRequestStatus(id, "Từ chối");
      setActionMessage("Đã từ chối đơn xin nghỉ.");
    } catch {
      setActionError("Từ chối đơn thất bại.");
    }
  };

  /* ===================== Render ===================== */

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={28} className="text-pink-600" />
          <div>
            <h1 className="text-2xl font-bold">
              Học bù & MakeUpCredit
            </h1>
            <p className="text-sm text-gray-600">
              Duyệt đơn nghỉ và xếp lịch học bù
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary">
            <Download size={16} /> Xuất DS
          </button>
          <button
            onClick={() => setShowCreateForm((p) => !p)}
            className="btn-secondary"
          >
            <FileText size={16} /> Tạo đơn nghỉ
          </button>
          <button className="btn-primary">
            <PlusCircle size={16} /> Tạo lịch bù
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="rounded-xl border p-4 space-y-3">
          <div className="font-semibold">
            Tạo đơn xin nghỉ cho phụ huynh
          </div>

          <input
            placeholder="Student Profile ID"
            value={formState.studentProfileId}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                studentProfileId: e.target.value,
              }))
            }
            className="input"
          />
          <input
            placeholder="Class ID"
            value={formState.classId}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                classId: e.target.value,
              }))
            }
            className="input"
          />
          <input
            type="date"
            value={formState.sessionDate}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                sessionDate: e.target.value,
              }))
            }
            className="input"
          />
          <input
            type="date"
            value={formState.endDate}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                endDate: e.target.value,
              }))
            }
            className="input"
          />
          <textarea
            placeholder="Lý do"
            value={formState.reason}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                reason: e.target.value,
              }))
            }
            className="input"
          />

          {actionError && (
            <div className="text-sm text-rose-600">
              {actionError}
            </div>
          )}
          {actionMessage && (
            <div className="text-sm text-emerald-600">
              {actionMessage}
            </div>
          )}

          <button
            onClick={handleCreateRequest}
            disabled={creating}
            className="btn-primary"
          >
            <Send size={14} />
            {creating ? "Đang tạo..." : "Gửi đơn"}
          </button>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-3 text-left">Học viên</th>
              <th className="p-3 text-left">Khóa</th>
              <th className="p-3 text-left">Thời gian</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3 text-left">Credit</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {requestItems.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{r.student}</div>
                  <div className="text-xs text-gray-500">
                    {r.id}
                  </div>
                </td>
                <td className="p-3">{r.course}</td>
                <td className="p-3">
                  {r.sessionTime}
                </td>
                <td className="p-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-3">{r.credit}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button
                      disabled={r.status !== "Chờ duyệt"}
                      onClick={() => handleApprove(r.id)}
                      className="icon-btn"
                    >
                      <ShieldCheck size={16} />
                    </button>
                    <button
                      disabled={r.status !== "Chờ duyệt"}
                      onClick={() => handleReject(r.id)}
                      className="icon-btn"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!requestItems.length && !loadingRequests && (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center text-gray-500"
                >
                  Không có đơn xin nghỉ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

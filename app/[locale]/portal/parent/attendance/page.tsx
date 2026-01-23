"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  approveLeaveRequest,
  createLeaveRequest,
  getLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/leaveRequestService";
import { getProfiles } from "@/lib/api/authService";
import { getStudentClasses } from "@/lib/api/studentService";

import type {
  LeaveRequestPayload,
  LeaveRequestRecord,
  LeaveRequestStatus,
} from "@/types/leaveRequest";
import type { UserProfile } from "@/types/auth";
import type { StudentClass } from "@/types/student/class";

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

/* ===================== Helpers ===================== */

const mapLeaveRequests = (
  items: LeaveRequestRecord[]
): LeaveRequest[] => {
  if (!items.length) return [];

  return items.map((item) => {
    const statusKey = item.status ?? "PENDING";
    const statusLabel = statusMap[statusKey];
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

/* ===================== UI ===================== */

function StatusBadge({
  status,
}: {
  status: LeaveRequestStatusLabel | MakeupStatus;
}) {
  const map: Record<
    string,
    { cls: string; icon: LucideIcon }
  > = {
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
  const [requestItems, setRequestItems] =
    useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] =
    useState(false);

  const [showCreateForm, setShowCreateForm] =
    useState(false);
  const [formState, setFormState] =
    useState<LeaveRequestPayload>(initialFormState);
  const [creating, setCreating] = useState(false);

  const [studentProfiles, setStudentProfiles] =
    useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] =
    useState(false);
  const [profilesError, setProfilesError] =
    useState<string | null>(null);

  const [classes, setClasses] =
    useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] =
    useState(false);
  const [classesError, setClassesError] =
    useState<string | null>(null);

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
        const res = await getLeaveRequests();
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.items;
        setRequestItems(mapLeaveRequests(data));
      } catch {
        setActionError("Không thể tải danh sách đơn xin nghỉ.");
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true);
      try {
        const res = await getProfiles({
          profileType: "Student",
        });
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.profiles ?? [];
        setStudentProfiles(
          data.filter((p) => p.profileType === "Student")
        );
      } catch {
        setProfilesError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!formState.studentProfileId) return;
      setClassesLoading(true);
      try {
        const res = await getStudentClasses(
          formState.studentProfileId,
          { pageNumber: 1, pageSize: 100 }
        );
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.items ?? [];
        setClasses(data);
      } catch {
        setClassesError("Không thể tải danh sách lớp.");
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, [formState.studentProfileId]);

  const classLabel = (c: StudentClass) =>
    c.name ?? c.className ?? c.title ?? c.code ?? c.id;

  /* ===================== Actions ===================== */

  const handleCreateRequest = async () => {
    setCreating(true);
    try {
      const res = await createLeaveRequest(formState);
      if (res.data) {
        setRequestItems((prev) => [
          ...mapLeaveRequests([res.data]),
          ...prev,
        ]);
        setFormState(initialFormState);
        setShowCreateForm(false);
      }
      setActionMessage("Đã tạo đơn xin nghỉ.");
    } catch {
      setActionError("Tạo đơn xin nghỉ thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveLeaveRequest(id);
      setRequestItems((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "Đã duyệt" } : r
        )
      );
    } catch {
      setActionError("Duyệt đơn thất bại.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectLeaveRequest(id);
      setRequestItems((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "Từ chối" } : r
        )
      );
    } catch {
      setActionError("Từ chối đơn thất bại.");
    }
  };

  /* ===================== Render ===================== */

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-pink-50 text-pink-600 grid place-items-center">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý Học bù & MakeUpCredit
            </h1>
            <p className="text-sm text-slate-600">
              Phê duyệt đơn nghỉ và tạo lịch học bù.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary">
            <Download size={16} /> Xuất DS
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-secondary"
          >
            <FileText size={16} /> Tạo đơn nghỉ
          </button>
          <button className="btn-primary">
            <PlusCircle size={16} /> Tạo lịch bù
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Danh sách đơn nghỉ</div>
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm"
              placeholder="Tìm học viên / mã đơn"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase text-slate-500">
              <th className="p-3 text-left">Học viên</th>
              <th className="p-3 text-left">Khóa</th>
              <th className="p-3 text-left">Thời gian</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3 text-left">Credit</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {requestItems
              .filter((r) => {
                const q = searchQuery.toLowerCase();
                return (
                  !q ||
                  r.student.toLowerCase().includes(q) ||
                  r.id.toLowerCase().includes(q)
                );
              })
              .map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">
                      {r.student}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.id}
                    </div>
                  </td>
                  <td className="p-3">{r.course}</td>
                  <td className="p-3">{r.sessionTime}</td>
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
                  className="p-10 text-center text-slate-500"
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

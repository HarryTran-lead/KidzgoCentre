"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { getProfiles } from "@/lib/api/authService";
import {
  approvePauseEnrollmentRequest,

  cancelPauseEnrollmentRequest,
  getPauseEnrollmentRequestsWithParams,
  rejectPauseEnrollmentRequest,
  updatePauseEnrollmentOutcome,
} from "@/lib/api/pauseEnrollmentService";
import { getAllStudents } from "@/lib/api/studentService";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { todayDateOnly } from "@/lib/datetime";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import PauseEnrollmentCreateModal from "@/components/portal/pause-enrollment/PauseEnrollmentCreateModal";
import type { UserProfile } from "@/types/auth";
import type {

  PauseEnrollmentOutcome,
  PauseEnrollmentRequestRecord,
  PauseEnrollmentRequestStatus,
  PauseEnrollmentStudentOption,
} from "@/types/pauseEnrollment";
import type { StudentSummary } from "@/types/student/student";

type Context = "parent" | "staff" | "admin";

type Props = {
  context: Context;
};

type ConfirmAction =
  | {
      kind: "approve";
      requestId: string;
      title: string;
      description: string;
      confirmText: string;
    }
  | {
      kind: "reject";
      requestId: string;
      title: string;
      description: string;
      confirmText: string;
    }
  | {
      kind: "cancel";
      requestId: string;
      title: string;
      description: string;
      confirmText: string;
    };

const ALL_STATUS = "__ALL__";

const statusLabels: Record<PauseEnrollmentRequestStatus, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Cancelled: "Đã hủy",
};

const statusStyles: Record<PauseEnrollmentRequestStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
  Cancelled: "border-gray-200 bg-gray-100 text-gray-700",
};

const outcomeLabels: Record<PauseEnrollmentOutcome, string> = {
  ContinueSameClass: "Tiếp tục cùng lớp",
  ReassignEquivalentClass: "Chuyển lớp tương đương",
  ContinueWithTutoring: "Tiếp tục theo kèm riêng",
};

function normalizeStatus(value?: string | null): PauseEnrollmentRequestStatus {
  if (!value) return "Pending";

  const normalized = value.replace(/\s+/g, "").toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  return "Pending";
}

function extractProfileItems(payload: unknown): UserProfile[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as {
    data?: {
      profiles?: UserProfile[];
    };
    profiles?: UserProfile[];
  };

  if (Array.isArray(root.profiles)) return root.profiles;
  if (Array.isArray(root.data?.profiles)) return root.data.profiles;
  return [];
}

function extractStudentItems(payload: unknown): StudentSummary[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as {
    data?: {
      items?: StudentSummary[];
      students?: {
        items?: StudentSummary[];
      };
    };
  };

  if (Array.isArray(root.data?.items)) return root.data.items;
  if (Array.isArray(root.data?.students?.items)) return root.data.students.items;
  return [];
}

function extractPauseRequestItems(payload: unknown): PauseEnrollmentRequestRecord[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as {
    data?: any;
    items?: PauseEnrollmentRequestRecord[];
    pauseEnrollmentRequests?: PauseEnrollmentRequestRecord[];
  };

  if (Array.isArray(root.items)) return root.items;
  if (Array.isArray(root.pauseEnrollmentRequests)) return root.pauseEnrollmentRequests;

  const data = root.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.pauseEnrollmentRequests?.items)) return data.pauseEnrollmentRequests.items;
  if (Array.isArray(data?.pauseEnrollmentRequests)) return data.pauseEnrollmentRequests;
  if (Array.isArray(data)) return data;

  return [];
}

function ensureApiSuccess(payload: any, fallbackMessage: string) {
  if (payload?.success === false || payload?.isSuccess === false) {
    throw new Error(payload?.message ?? fallbackMessage);
  }

  return payload;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const yearMonthDay = /^\d{4}-\d{2}-\d{2}$/;
  if (yearMonthDay.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getUtcTodayKey() {
  return todayDateOnly();
}

function buildClassText(request: PauseEnrollmentRequestRecord) {
  if (Array.isArray(request.classes) && request.classes.length) {
    return request.classes
      .map((item) => item.code ?? item.title ?? item.programName ?? item.id)
      .filter(Boolean)
      .join(", ");
  }

  if (request.classId) return `Lớp legacy: ${request.classId}`;
  return "Chưa có lớp liên quan";
}

function getClassLabels(request: PauseEnrollmentRequestRecord) {
  if (Array.isArray(request.classes) && request.classes.length) {
    return request.classes
      .map((item) => item.code ?? item.title ?? item.programName ?? item.id)
      .filter(Boolean);
  }

  if (request.classId) return [`Lớp legacy: ${request.classId}`];
  return [];
}

function summarizeText(value?: string | null, fallback = "Không có ghi chú bổ sung.") {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 137)}...`;
}

function getInitials(value?: string | null, fallback = "HS") {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) return fallback;
  return parts
    .slice(-2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function getRequestAccent(status: PauseEnrollmentRequestStatus) {
  switch (status) {
    case "Approved":
      return "from-emerald-500 to-teal-500";
    case "Rejected":
      return "from-rose-500 to-pink-500";
    case "Cancelled":
      return "from-slate-500 to-slate-600";
    default:
      return "from-amber-500 to-orange-500";
  }
}

function toStudentOptionFromProfile(profile: UserProfile): PauseEnrollmentStudentOption | null {
  const id = profile.id ?? profile.studentId ?? "";
  if (!id) return null;

  return {
    id,
    label: profile.displayName ?? id,
  };
}

function toStudentOptionFromSummary(student: StudentSummary): PauseEnrollmentStudentOption | null {
  const id =
    student.id ??
    student.profileId ??
    student.studentId ??
    student.userId ??
    "";

  if (!id) return null;

  const classText = student.className
    ? student.className
    : Array.isArray(student.classNames) && student.classNames.length
      ? student.classNames.filter(Boolean).join(", ")
      : Array.isArray(student.classes) && student.classes.length
        ? student.classes
            .map((item) => item.name ?? item.className ?? item.title ?? item.code ?? item.id)
            .filter(Boolean)
            .join(", ")
        : undefined;

  return {
    id,
    label:
      student.fullName ??
      student.name ??
      student.displayName ??
      student.email ??
      id,
    parentName:
      student.parentName ??
      student.guardianName ??
      student.fatherName ??
      student.motherName ??
      undefined,
    classText,
  };
}

function mergeStudentOptions(groups: PauseEnrollmentStudentOption[][]) {
  const map = new Map<string, PauseEnrollmentStudentOption>();

  groups.flat().forEach((item) => {
    if (!item?.id) return;

    const current = map.get(item.id);
    map.set(item.id, {
      ...current,
      ...item,
    });
  });

  return Array.from(map.values());
}

function Banner({
  kind,
  text,
}: {
  kind: "error" | "success" | "info";
  text: string;
}) {
  const mapping = {
    error: {
      cls: "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700",
      icon: AlertCircle,
    },
    success: {
      cls: "border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    },
    info: {
      cls: "border-sky-200 bg-gradient-to-r from-sky-50 to-slate-50 text-sky-700",
      icon: ShieldCheck,
    },
  } as const;

  const Icon = mapping[kind].icon;

  return (
    <div className={`rounded-2xl border p-3 ${mapping[kind].cls}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5" />
        <div className="whitespace-pre-line text-sm font-medium">{text}</div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string | number;
  note: string;
  tone: "red" | "amber" | "emerald" | "slate";
}) {
  const tones = {
    red: {
      label: "text-red-600",
      panel: "from-red-600 to-rose-500",
      glow: "bg-red-500",
      icon: Clock3,
    },
    amber: {
      label: "text-amber-600",
      panel: "from-amber-500 to-orange-500",
      glow: "bg-amber-500",
      icon: AlertCircle,
    },
    emerald: {
      label: "text-emerald-600",
      panel: "from-emerald-500 to-teal-500",
      glow: "bg-emerald-500",
      icon: CheckCircle2,
    },
    slate: {
      label: "text-gray-600",
      panel: "from-slate-500 to-slate-700",
      glow: "bg-slate-500",
      icon: ShieldCheck,
    },
  } as const;
  const Icon = tones[tone].icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${tones[tone].glow}`}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${tones[tone].panel} text-white shadow-sm`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[11px] font-semibold uppercase tracking-[0.18em] ${tones[tone].label}`}
          >
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold leading-tight text-gray-900">{value}</div>
          <div className="mt-1 truncate text-xs leading-5 text-gray-500">{note}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: PauseEnrollmentRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function ActionButton({
  label,
  tone,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  tone: "primary" | "danger" | "muted";
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  const tones = {
    primary:
      "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100",
    danger:
      "border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 hover:from-rose-100 hover:to-pink-100",
    muted: "border-red-200 bg-white text-gray-700 hover:bg-red-50/60",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {label}
    </button>
  );
}

function ConfirmDialog({
  action,
  loading,
  onClose,
  onConfirm,
}: {
  action: ConfirmAction | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!action) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{action.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-red-100">
                {action.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition cursor-pointer hover:bg-gray-50 disabled:opacity-60"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 text-sm font-semibold text-white cursor-pointer shadow-lg hover:shadow-xl transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {action.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestDetailModal({
  request,
  student,
  isManagement,
  canCancel,
  outcomeForm,
  actionLoadingKey,
  onClose,
  onApprove,
  onReject,
  onCancel,
  onOutcomeChange,
  onOutcomeNoteChange,
  onSaveOutcome,
}: {
  request: PauseEnrollmentRequestRecord | null;
  student?: PauseEnrollmentStudentOption;
  isManagement: boolean;
  canCancel: boolean;
  outcomeForm: {
    outcome: PauseEnrollmentOutcome;
    outcomeNote: string;
  };
  actionLoadingKey: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onOutcomeChange: (value: PauseEnrollmentOutcome) => void;
  onOutcomeNoteChange: (value: string) => void;
  onSaveOutcome: () => void;
}) {
  if (!request) return null;

  const status = normalizeStatus(request.status);
  const canEditOutcome = isManagement && status === "Approved";
  const studentLabel = student?.label ?? "Học viên";
  const studentSubtext = student?.parentName
    ? `Phụ huynh: ${student.parentName}`
    : "";

  return (
    <div onClick={onClose} className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-6xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-base font-bold text-white shadow-lg">
                {getInitials(studentLabel)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chi tiết yêu cầu bảo lưu</h2>
                <p className="mt-1 text-sm font-medium text-red-100">{studentLabel}</p>
                <p className="mt-1 text-xs text-red-200">{studentSubtext}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors text-white cursor-pointer"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[calc(92vh-110px)] overflow-y-auto p-6">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Khoảng bảo lưu
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDate(request.pauseFrom)} - {formatDate(request.pauseTo)}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tạo lúc
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDateTime(request.requestedAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Duyệt lúc
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {formatDateTime(request.approvedAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Kết quả sau bảo lưu
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {request.outcome ? outcomeLabels[request.outcome] : "Chưa cập nhật"}
                  </div>
                  {request.outcomeAt ? (
                    <div className="mt-1 text-xs text-gray-500">
                      Cập nhật {formatDateTime(request.outcomeAt)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Lý do
                </div>
                <div className="mt-2 text-sm leading-6 text-gray-700">
                  {request.reason?.trim() || "Không có ghi chú."}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <BookOpen size={16} className="text-red-500" />
                  Lớp liên quan
                </div>

                {request.classes?.length ? (
                  <div className="space-y-3">
                    {request.classes.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-red-100 bg-red-50/40 p-4"
                      >
                        <div className="font-semibold text-gray-900">
                          {item.code ?? item.title ?? item.id}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {[item.programName, item.branchName]
                            .filter(Boolean)
                            .join(" • ") || "Chưa có thông tin chương trình"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.startDate || item.endDate
                            ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
                            : "Không có thời gian lớp"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Chưa có danh sách lớp chi tiết trong response.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 xl:sticky xl:top-0 xl:self-start">
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
                  <div className="text-lg font-bold text-gray-900">Xử lý yêu cầu</div>
                  <div className="mt-1 text-sm text-gray-500">
                    Staff/Admin thao tác trực tiếp ngay trong popup này.
                  </div>
                </div>

                <div className="space-y-3 p-6">
                  {isManagement && status === "Pending" ? (
                    <>
                      <ActionButton label="Duyệt yêu cầu" tone="primary" onClick={onApprove} />
                      <ActionButton label="Từ chối yêu cầu" tone="danger" onClick={onReject} />
                    </>
                  ) : null}

                  {canCancel ? (
                    <ActionButton label="Hủy yêu cầu" tone="danger" onClick={onCancel} />
                  ) : null}

                  {!isManagement && status !== "Pending" && !canCancel ? (
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                      Yêu cầu này không còn thao tác trực tiếp được từ phía phụ huynh.
                    </div>
                  ) : null}

                  {isManagement && status !== "Pending" && !canEditOutcome ? (
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                      Outcome chỉ cập nhật được khi yêu cầu đã ở trạng thái đã duyệt.
                    </div>
                  ) : null}
                </div>
              </div>

              {canEditOutcome ? (
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
                    <div className="text-lg font-bold text-gray-900">Cập nhật kết quả sau bảo lưu</div>
                    <div className="mt-1 text-sm text-gray-500">
                      Ghi nhận hướng xử lý sau khi học sinh quay lại.
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    <label className="block">
                      <div className="mb-2 text-sm font-semibold text-gray-700">Kết quả</div>
                      <select
                        value={outcomeForm.outcome}
                        onChange={(event) =>
                          onOutcomeChange(event.target.value as PauseEnrollmentOutcome)
                        }
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      >
                        {Object.entries(outcomeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <div className="mb-2 text-sm font-semibold text-gray-700">Ghi chú</div>
                      <textarea
                        value={outcomeForm.outcomeNote}
                        onChange={(event) => onOutcomeNoteChange(event.target.value)}
                        rows={4}
                        placeholder="Ví dụ: học sinh quay lại lớp cũ từ tuần 2 tháng sau..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={onSaveOutcome}
                      disabled={actionLoadingKey === `outcome:${request.id}`}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 text-sm font-semibold cursor-pointer text-white shadow-lg hover:shadow-xl transition disabled:opacity-60"
                    >
                      {actionLoadingKey === `outcome:${request.id}` ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : null}
                      Lưu kết quả
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PauseEnrollmentWorkspace({ context }: Props) {
  const isManagement = context !== "parent";
  const isStudentPage = context === "parent";
  const { selectedProfile } = useSelectedStudentProfile();
  const isStudentLocked = isStudentPage && !!selectedProfile?.id;
  const { selectedBranchId, isLoaded: isBranchLoaded } = useBranchFilter();

  const [studentOptions, setStudentOptions] = useState<PauseEnrollmentStudentOption[]>([]);
  const [studentOptionsLoading, setStudentOptionsLoading] = useState(false);
  const [studentOptionsError, setStudentOptionsError] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUS);
  const [searchQuery, setSearchQuery] = useState("");

  const [requests, setRequests] = useState<PauseEnrollmentRequestRecord[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const [outcomeForm, setOutcomeForm] = useState<{
    outcome: PauseEnrollmentOutcome;
    outcomeNote: string;
  }>({
    outcome: "ContinueSameClass",
    outcomeNote: "",
  });

  const titles = {
    parent: {
      title: "Bảo lưu học",
      subtitle:
        "Dùng cho nhu cầu nghỉ dài ngày theo khoảng thời gian. Luồng này tách riêng khỏi đơn xin nghỉ ngắn ngày để tránh lẫn với make-up.",
    },
    staff: {
      title: "Quản lý bảo lưu",
      subtitle:
        "Duyệt, từ chối, hủy, duyệt hàng loạt và cập nhật kết quả sau bảo lưu cho đúng nghiệp vụ ghi danh.",
    },
    admin: {
      title: "Điều phối bảo lưu",
      subtitle:
        "Theo dõi toàn bộ yêu cầu bảo lưu trên hệ thống với góc nhìn vận hành và kiểm soát outcome sau khi học sinh quay lại.",
    },
  } as const;

  const studentMap = useMemo(
    () => new Map(studentOptions.map((item) => [item.id, item])),
    [studentOptions]
  );
  const lockedStudentOption = useMemo(
    () => (selectedProfile ? toStudentOptionFromProfile(selectedProfile) : null),
    [selectedProfile]
  );
  const activeLockedStudent = useMemo(() => {
    if (!isStudentLocked || !lockedStudentOption?.id) return null;
    return studentMap.get(lockedStudentOption.id) ?? lockedStudentOption;
  }, [isStudentLocked, lockedStudentOption, studentMap]);

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId]
  );

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((item) => normalizeStatus(item.status) === "Pending").length;
    const approved = requests.filter((item) => normalizeStatus(item.status) === "Approved").length;
    const cancelled = requests.filter((item) => normalizeStatus(item.status) === "Cancelled").length;
    const needsOutcome = requests.filter(
      (item) => normalizeStatus(item.status) === "Approved" && !item.outcome
    ).length;

    return { total, pending, approved, cancelled, needsOutcome };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((item) => {
      if (!query) return true;

      const student = studentMap.get(item.studentProfileId);
      const haystack = [
        student?.label,
        student?.parentName,
        student?.classText,
        buildClassText(item),
        item.reason,
        item.outcomeNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [requests, searchQuery, studentMap]);



  const loadStudentOptions = useCallback(async () => {
    setStudentOptionsLoading(true);
    setStudentOptionsError(null);

    try {
      if (isStudentPage) {
        const fallbackOptions = lockedStudentOption ? [lockedStudentOption] : [];
        const response = await getProfiles({ profileType: "Student" });
        const fetchedOptions = extractProfileItems(response)
          .filter((item) => item.profileType === "Student")
          .map(toStudentOptionFromProfile)
          .filter((item): item is PauseEnrollmentStudentOption => Boolean(item));

        setStudentOptions(mergeStudentOptions([fallbackOptions, fetchedOptions]));
        return;
      }

      const response = await getAllStudents({
        profileType: "Student",
        isActive: true,
        pageNumber: 1,
        pageSize: 500,
      });

      const options = extractStudentItems(response)
        .map(toStudentOptionFromSummary)
        .filter((item): item is PauseEnrollmentStudentOption => Boolean(item));

      setStudentOptions(options);
    } catch {
      if (isStudentPage && lockedStudentOption) {
        setStudentOptions([lockedStudentOption]);
      } else {
        setStudentOptions([]);
        setStudentOptionsError("Không thể tải danh sách học sinh.");
      }
    } finally {
      setStudentOptionsLoading(false);
    }
  }, [isStudentPage, lockedStudentOption]);

  const loadRequests = useCallback(
    async (focusId?: string) => {
      setRequestsLoading(true);
      setRequestError(null);

      try {
        const response = await getPauseEnrollmentRequestsWithParams({
          studentProfileId: selectedStudentId || undefined,
          status: selectedStatus === ALL_STATUS ? undefined : selectedStatus,
          branchId: isManagement ? selectedBranchId ?? undefined : undefined,
          pageNumber: 1,
          pageSize: 200,
        });

        ensureApiSuccess(response, "Không thể tải danh sách bảo lưu.");
        const items = extractPauseRequestItems(response);

        setRequests(items);
        setSelectedRequestId((prev) => {
          if (focusId && items.some((item) => item.id === focusId)) return focusId;
          if (prev && items.some((item) => item.id === prev)) return prev;
          return null;
        });
      } catch (error: any) {
        setRequests([]);
        setSelectedRequestId(null);
        setRequestError(
          error?.response?.data?.message ??
            error?.message ??
            "Không thể tải danh sách bảo lưu."
        );
      } finally {
        setRequestsLoading(false);
      }
    },
    [isManagement, selectedBranchId, selectedStatus, selectedStudentId]
  );

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    void loadStudentOptions();
  }, [loadStudentOptions]);

  useEffect(() => {
    if (!studentOptions.length) {
      setSelectedStudentId("");
      return;
    }

    if (isStudentLocked && lockedStudentOption?.id) {
      setSelectedStudentId(lockedStudentOption.id);
      return;
    }

    if (isManagement) {
      setSelectedStudentId((prev) =>
        prev && studentOptions.some((item) => item.id === prev) ? prev : ""
      );
      return;
    }

    setSelectedStudentId((prev) => prev || studentOptions[0]?.id || "");
  }, [isManagement, isStudentLocked, lockedStudentOption?.id, studentOptions]);

  useEffect(() => {
    if (!selectedRequestId) return;
    if (filteredRequests.some((item) => item.id === selectedRequestId)) return;
    setSelectedRequestId(null);
  }, [filteredRequests, selectedRequestId]);

  useEffect(() => {
    if (selectedRequest) {
      setOutcomeForm({
        outcome: selectedRequest.outcome ?? "ContinueSameClass",
        outcomeNote: selectedRequest.outcomeNote ?? "",
      });
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (isManagement && !isBranchLoaded) return;
    if (isStudentPage && studentOptionsLoading) return;
    if (isStudentPage && !selectedStudentId && studentOptions.length > 0) return;

    void loadRequests();
  }, [
    isBranchLoaded,
    isManagement,
    isStudentPage,
    loadRequests,
    selectedStudentId,
    studentOptions.length,
    studentOptionsLoading,
  ]);

  const requestTitle = titles[context];

  const canCancelRequest = (request: PauseEnrollmentRequestRecord) =>
    normalizeStatus(request.status) === "Pending" &&
    request.pauseFrom > getUtcTodayKey();

  const handleReload = async () => {
    setRequestMessage(null);
    await loadRequests(selectedRequestId ?? undefined);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    setRequestError(null);
    setRequestMessage(null);

    try {
      if (confirmAction.kind === "approve") {
        const response = await approvePauseEnrollmentRequest(confirmAction.requestId);
        ensureApiSuccess(response, "Không thể duyệt yêu cầu bảo lưu.");
        setRequestMessage("Đã duyệt yêu cầu bảo lưu.");
        await loadRequests(confirmAction.requestId);
      }

      if (confirmAction.kind === "reject") {
        const response = await rejectPauseEnrollmentRequest(confirmAction.requestId);
        ensureApiSuccess(response, "Không thể từ chối yêu cầu bảo lưu.");
        setRequestMessage("Đã từ chối yêu cầu bảo lưu.");
        await loadRequests(confirmAction.requestId);
      }

      if (confirmAction.kind === "cancel") {
        const response = await cancelPauseEnrollmentRequest(confirmAction.requestId);
        ensureApiSuccess(response, "Không thể hủy yêu cầu bảo lưu.");
        setRequestMessage("Đã hủy yêu cầu bảo lưu.");
        await loadRequests(confirmAction.requestId);
      }

      setConfirmAction(null);
    } catch (error: any) {
      setRequestError(
        error?.response?.data?.message ??
          error?.message ??
          "Không thể thực hiện thao tác."
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSaveOutcome = async () => {
    if (!selectedRequest) return;

    setActionLoadingKey(`outcome:${selectedRequest.id}`);
    setRequestError(null);
    setRequestMessage(null);

    try {
      const response = await updatePauseEnrollmentOutcome(selectedRequest.id, {
        outcome: outcomeForm.outcome,
        outcomeNote: outcomeForm.outcomeNote,
      });

      ensureApiSuccess(response, "Không thể cập nhật outcome.");
      setRequestMessage("Đã cập nhật kết quả sau bảo lưu.");
      await loadRequests(selectedRequest.id);
    } catch (error: any) {
      setRequestError(
        error?.response?.data?.detail ??
          error?.response?.data?.message ??
          error?.message ??
          "Không thể cập nhật outcome."
      );
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-red-50/30 to-white p-4 md:p-6">
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${
          isPageLoaded ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <Clock3 size={26} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {requestTitle.title}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-gray-600">
                {requestTitle.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleReload()}
              disabled={requestsLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition cursor-pointer hover:bg-red-50/60 disabled:opacity-60"
            >
              {requestsLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={studentOptionsLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition cursor-pointer hover:shadow-lg disabled:opacity-60"
            >
              <Plus size={16} />
              Tạo yêu cầu
            </button>
          </div>

          <div className="grid w-full gap-4 pt-2 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label={isManagement ? "Hiển thị" : "Tổng yêu cầu"}
              value={isManagement ? filteredRequests.length : stats.total}
              note={
                isManagement
                  ? `${requests.length} yêu cầu trong phạm vi hiện tại`
                  : "Tất cả yêu cầu bảo lưu của học sinh đang chọn"
              }
              tone="red"
            />
            <MiniMetric
              label="Chờ duyệt"
              value={stats.pending}
              note={
                isManagement
                  ? "Những yêu cầu staff/admin cần xử lý"
                  : "Đang chờ trung tâm xác nhận"
              }
              tone="amber"
            />
            <MiniMetric
              label="Đã duyệt"
              value={stats.approved}
              note={
                isManagement
                  ? "Đã pause enrollment thành công"
                  : "Các đợt bảo lưu đã được chấp nhận"
              }
              tone="emerald"
            />
            <MiniMetric
              label={isManagement ? "Thiếu outcome" : "Đã hủy"}
              value={isManagement ? stats.needsOutcome : stats.cancelled}
              note={
                isManagement
                  ? "Cần cập nhật hướng xử lý sau khi quay lại"
                  : `${requests.filter(canCancelRequest).length} yêu cầu vẫn còn trong hạn hủy`
              }
              tone="slate"
            />
          </div>
        </div>

      {requestError ? <Banner kind="error" text={requestError} /> : null}
      {requestMessage ? <Banner kind="success" text={requestMessage} /> : null}
      {studentOptionsError ? <Banner kind="error" text={studentOptionsError} /> : null}

      <div
        className={`overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 shadow-sm transition-all duration-700 delay-150 ${
          isPageLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="border-b border-red-200 px-6 py-4">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            {isManagement ? (
              <label className="block">
                <div className="mb-2 text-sm font-semibold text-gray-700">Tìm kiếm</div>
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Học sinh, phụ huynh, lớp, lý do..."
                    className="h-12 w-full rounded-xl border border-red-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                  />
                </div>
              </label>
            ) : (
              <label className="block">
                <div className="mb-2 text-sm font-semibold text-gray-700">Học sinh</div>
                {isStudentLocked ? (
                  <div className="rounded-2xl border border-red-100 bg-white/90 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {activeLockedStudent?.label ?? "Đang đồng bộ học sinh"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Trang này đang khóa theo học sinh đã chọn trên thanh bên.
                        </div>
                      </div>
                      <span className="inline-flex rounded-full border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                        Cố định
                      </span>
                    </div>
                    {activeLockedStudent?.classText ? (
                      <div className="mt-3 text-xs text-gray-500">
                        Lớp hiện tại: {activeLockedStudent.classText}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    disabled={studentOptionsLoading}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                    className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                  >
                    {studentOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}

            {isManagement ? (
              <label className="block">
                <div className="mb-2 text-sm font-semibold text-gray-700">Học sinh</div>
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                >
                  <option value="">Tất cả học sinh</option>
                  {studentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parentName
                        ? `${item.label} - PH: ${item.parentName}`
                        : item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="rounded-2xl border border-red-100 bg-white/90 px-4 py-3 text-sm text-gray-600">
                <div className="font-semibold text-gray-800">Phạm vi</div>
                <div className="mt-1">
                  {activeLockedStudent?.label
                    ? `Đang hiển thị yêu cầu của ${activeLockedStudent.label} theo học sinh đã chọn trong portal.`
                    : "Yêu cầu được hiển thị theo học sinh đang chọn trong portal."}
                </div>
              </div>
            )}

            <label className="block">
              <div className="mb-2 text-sm font-semibold text-gray-700">Trạng thái</div>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
              >
                <option value={ALL_STATUS}>Tất cả</option>
                <option value="Pending">{statusLabels.Pending}</option>
                <option value="Approved">{statusLabels.Approved}</option>
                <option value="Rejected">{statusLabels.Rejected}</option>
                <option value="Cancelled">{statusLabels.Cancelled}</option>
              </select>
            </label>

            {!isManagement ? (
              <div className="rounded-2xl border border-red-100 bg-white/90 px-4 py-3 text-sm text-gray-600">
                <div className="font-semibold text-gray-800">Điểm khác với xin nghỉ</div>
                <div className="mt-1">
                  Yêu cầu bảo lưu có duyệt, hủy và outcome riêng sau khi học sinh quay lại.
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-b border-red-200 bg-gradient-to-r from-red-500/10 to-red-700/10 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách yêu cầu bảo lưu
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {isManagement
                  ? "Theo dõi, duyệt và cập nhật outcome theo từng học sinh."
                  : "Theo dõi trạng thái các yêu cầu bảo lưu của học sinh đang chọn."}
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                {filteredRequests.length} yêu cầu
              </span>

            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-red-200 bg-gradient-to-r from-red-600/5 to-red-700/5">
              <tr className="text-left text-sm font-semibold text-gray-700">

                <th className="px-6 py-4">Học sinh</th>
                <th className="px-6 py-4">Tổng quan</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-red-100">
              {!filteredRequests.length && !requestsLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-400">
                      <Search size={24} />
                    </div>
                    <div className="mt-4 text-base font-semibold text-gray-700">
                      Chưa có yêu cầu phù hợp
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Thử đổi bộ lọc hoặc tạo yêu cầu bảo lưu mới.
                    </div>
                  </td>
                </tr>
              ) : null}

              {filteredRequests.map((item) => {
                const status = normalizeStatus(item.status);
                const student = studentMap.get(item.studentProfileId);
                const isSelected = selectedRequestId === item.id;
                const isPending = status === "Pending";
                const isApproved = status === "Approved";
                const classLabels = getClassLabels(item);
                const classPreview = classLabels.slice(0, 2);
                const hiddenClassCount = Math.max(classLabels.length - classPreview.length, 0);

                return (
                  <tr
                    key={item.id}
                    className={`transition-all duration-200 ${
                      isSelected
                        ? "bg-red-50/60"
                        : "hover:bg-gradient-to-r hover:from-red-50/50 hover:to-white"
                    }`}
                  >


                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r ${getRequestAccent(
                            status
                          )} text-sm font-semibold text-white shadow-sm`}
                        >
                          {getInitials(student?.label ?? "HV")}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {student?.label ?? "Học viên"}
                          </div>
                          {student?.parentName ? (
                          <div className="text-xs text-gray-500">
                            {`Phụ huynh: ${student.parentName}`}
                          </div>
                          ) : null}
                        </div>
                      </div>
                     </td>

                    <td className="px-6 py-4 align-top text-sm text-gray-700">
                      <div className="space-y-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(item.pauseFrom)} - {formatDate(item.pauseTo)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Tạo lúc {formatDateTime(item.requestedAt)}
                          </div>
                        </div>
                        <div className="text-sm leading-6 text-gray-600">
                          {summarizeText(item.reason)}
                        </div>
                        <div className="flex max-w-[360px] flex-wrap gap-2">
                          {classPreview.length ? (
                            <>
                              {classPreview.map((label) => (
                                <span
                                  key={`${item.id}:${label}`}
                                  className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                                >
                                  {label}
                                </span>
                              ))}
                              {hiddenClassCount ? (
                                <span className="inline-flex rounded-full border border-red-100 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                                  +{hiddenClassCount} lớp khác
                                </span>
                              ) : null}
                            </>
                          ) : (
                              <span className="text-xs text-gray-400">
                              Chưa có lớp liên quan trong response
                            </span>
                          )}
                        </div>
                      </div>
                     </td>

                    <td className="px-6 py-4 align-top">
                      <div className="space-y-3">
                        <StatusBadge status={status} />
                        {item.outcome ? (
                          <div className="text-sm text-gray-700">
                            <div className="font-medium text-gray-900">
                              {outcomeLabels[item.outcome]}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {item.outcomeAt ? `Cập nhật ${formatDateTime(item.outcomeAt)}` : ""}
                            </div>
                          </div>
                        ) : isApproved ? (
                          <div className="text-xs leading-5 text-gray-500">
                            Đã duyệt nhưng chưa cập nhật outcome.
                          </div>
                        ) : (
                          <div className="text-xs leading-5 text-gray-400">
                            Chưa có cập nhật hậu xử lý.
                          </div>
                        )}
                      </div>
                     </td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          label={isSelected ? "Đang xem" : "Chi tiết"}
                          tone="muted"
                          disabled={isSelected}
                          onClick={() => setSelectedRequestId(item.id)}
                        />

                        {isManagement && isPending ? (
                          <ActionButton
                            label="Duyệt"
                            tone="primary"
                            onClick={() =>
                              setConfirmAction({
                                kind: "approve",
                                requestId: item.id,
                                title: "Duyệt yêu cầu bảo lưu",
                                description: `Học sinh: ${
                                  student?.label ?? item.studentProfileId
                                }\nKhoảng ngày: ${formatDate(item.pauseFrom)} - ${formatDate(
                                  item.pauseTo
                                )}`,
                                confirmText: "Duyệt yêu cầu",
                              })
                            }
                          />
                        ) : null}

                        {isManagement && isPending ? (
                          <ActionButton
                            label="Từ chối"
                            tone="danger"
                            onClick={() =>
                              setConfirmAction({
                                kind: "reject",
                                requestId: item.id,
                                title: "Từ chối yêu cầu bảo lưu",
                                description: `Bạn sắp từ chối yêu cầu của ${
                                  student?.label ?? item.studentProfileId
                                }. Thao tác này giữ nguyên enrollment hiện tại.`,
                                confirmText: "Từ chối yêu cầu",
                              })
                            }
                          />
                        ) : null}

                        {canCancelRequest(item) ? (
                          <ActionButton
                            label="Hủy"
                            tone="danger"
                            onClick={() =>
                              setConfirmAction({
                                kind: "cancel",
                                requestId: item.id,
                                title: "Hủy yêu cầu bảo lưu",
                                description: `Yêu cầu chỉ được hủy trước ngày bắt đầu bảo lưu.\nKhoảng ngày: ${formatDate(
                                  item.pauseFrom
                                )} - ${formatDate(item.pauseTo)}`,
                                confirmText: "Hủy yêu cầu",
                              })
                            }
                          />
                        ) : null}
                      </div>
                     </td>
                     </tr>
                );
              })}
            </tbody>
           </table>
        </div>

        {requestsLoading ? (
          <div className="flex items-center gap-2 border-t border-red-200 px-6 py-4 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Đang tải danh sách bảo lưu...
          </div>
        ) : null}

        {!requestsLoading && filteredRequests.length ? (
          <div className="border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {filteredRequests.length}
              </span>{" "}
              yêu cầu trong tổng số{" "}
              <span className="font-semibold text-gray-900">{requests.length}</span>{" "}
              bản ghi hiện có
            </div>
          </div>
        ) : null}
      </div>

      {!selectedRequest && filteredRequests.length ? (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 px-6 py-5 text-sm text-gray-500 shadow-sm transition-all duration-700 delay-200">
          Bấm <span className="font-semibold text-gray-900">Chi tiết</span> để mở popup xem hồ sơ bảo lưu và xử lý outcome ngay trong modal.
        </div>
      ) : null}

      <RequestDetailModal
        request={selectedRequest}
        student={
          selectedRequest
            ? studentMap.get(selectedRequest.studentProfileId)
            : undefined
        }
        isManagement={isManagement}
        canCancel={selectedRequest ? canCancelRequest(selectedRequest) : false}
        outcomeForm={outcomeForm}
        actionLoadingKey={actionLoadingKey}
        onClose={() => setSelectedRequestId(null)}
        onApprove={() => {
          if (!selectedRequest) return;
          setConfirmAction({
            kind: "approve",
            requestId: selectedRequest.id,
            title: "Duyệt yêu cầu bảo lưu",
            description: `Bạn sắp duyệt yêu cầu của ${
              studentMap.get(selectedRequest.studentProfileId)?.label ??
              selectedRequest.studentProfileId
            }.`,
            confirmText: "Duyệt yêu cầu",
          });
        }}
        onReject={() => {
          if (!selectedRequest) return;
          setConfirmAction({
            kind: "reject",
            requestId: selectedRequest.id,
            title: "Từ chối yêu cầu bảo lưu",
            description:
              "Thao tác này kết thúc yêu cầu hiện tại và giữ nguyên trạng thái enrollment.",
            confirmText: "Từ chối yêu cầu",
          });
        }}
        onCancel={() => {
          if (!selectedRequest) return;
          setConfirmAction({
            kind: "cancel",
            requestId: selectedRequest.id,
            title: "Hủy yêu cầu bảo lưu",
            description:
              "Yêu cầu chỉ có thể hủy trước ngày bắt đầu bảo lưu theo UTC date.",
            confirmText: "Hủy yêu cầu",
          });
        }}
        onOutcomeChange={(value) =>
          setOutcomeForm((prev) => ({
            ...prev,
            outcome: value,
          }))
        }
        onOutcomeNoteChange={(value) =>
          setOutcomeForm((prev) => ({
            ...prev,
            outcomeNote: value,
          }))
        }
        onSaveOutcome={() => void handleSaveOutcome()}
      />

      <PauseEnrollmentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        studentOptions={studentOptions}
        studentOptionsLoading={studentOptionsLoading}
        studentOptionsError={studentOptionsError}
        lockedStudentProfileId={isStudentLocked ? selectedProfile?.id ?? null : null}
        lockedStudentLabel={activeLockedStudent?.label ?? null}
        lockedStudentClassText={activeLockedStudent?.classText ?? null}
        onCreated={(record) => {
          setCreateOpen(false);
          setRequestMessage("Đã tạo yêu cầu bảo lưu.");
          void loadRequests(record.id);
        }}
      />

      <ConfirmDialog
        action={confirmAction}
        loading={confirmLoading}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void handleConfirmAction()}
      />
    </div>
  );
}
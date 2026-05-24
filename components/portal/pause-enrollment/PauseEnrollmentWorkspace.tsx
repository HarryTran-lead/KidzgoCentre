"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { getAllClasses } from "@/lib/api/classService";

import { getProfiles } from "@/lib/api/authService";
import {
  approvePauseEnrollmentRequest,
  approvePauseEnrollmentRequestsBulk,
  cancelPauseEnrollmentRequest,
  getPauseEnrollmentSettings,
  getPauseEnrollmentRequestsWithParams,
  reassignPauseEnrollmentEquivalentClass,
  rejectPauseEnrollmentRequest,
  updatePauseEnrollmentSettings,
  updatePauseEnrollmentOutcome,
} from "@/lib/api/pauseEnrollmentService";
import { getRegistrations } from "@/lib/api/registrationService";
import { getAllStudents } from "@/lib/api/studentService";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import { useToast } from "@/hooks/use-toast";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { todayDateOnly } from "@/lib/datetime";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import PauseEnrollmentCreateModal from "@/components/portal/pause-enrollment/PauseEnrollmentCreateModal";
import type { UserProfile } from "@/types/auth";
import type {
  PauseEnrollmentOutcome,
  PauseEnrollmentSettings,
  PauseEnrollmentScope,
  ReassignEquivalentClassPayload,
  PauseEnrollmentRequestRecord,
  PauseEnrollmentRequestStatus,
  PauseEnrollmentStudentOption,
} from "@/types/pauseEnrollment";
import type { Registration, WeeklyPatternEntry } from "@/types/registration";
import type { StudentClass } from "@/types/student/class";
import type { StudentSummary } from "@/types/student/student";

type Context = "parent" | "staff" | "admin";

type Props = {
  context: Context;
};

type ReassignFormState = {
  registrationId: string;
  newClassId: string;
  track: "primary" | "secondary";
  weeklyPatternJson: string;
  effectiveDate: string;
};

type ReassignClassOption = StudentClass & {
  programId?: string | null;
  programName?: string | null;
  branchId?: string | null;
  schedulePattern?: string | null;
  classSchedulePattern?: string | null;
  effectiveSchedulePattern?: string | null;
  weeklyScheduleSlots?: Array<{
    dayOfWeek?: string;
    dayCode?: string;
    startTime?: string;
    durationMinutes?: number;
  }>;
  classWeeklyScheduleSlots?: Array<{
    dayOfWeek?: string;
    dayCode?: string;
    startTime?: string;
    durationMinutes?: number;
  }>;
  weeklyPattern?: WeeklyPatternEntry[] | null;
  effectiveWeeklyPattern?: WeeklyPatternEntry[] | null;
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
    }
  | {
      kind: "approveBulk";
      requestIds: string[];
      title: string;
      description: string;
      confirmText: string;
    };

const ALL_STATUS = "__ALL__";
const ALL_CLASS = "__ALL_CLASS__";
const EMPTY_REASSIGN_REGISTRATION = "__EMPTY_REASSIGN_REGISTRATION__";
const EMPTY_REASSIGN_CLASS = "__EMPTY_REASSIGN_CLASS__";

const statusLabels: Record<PauseEnrollmentRequestStatus, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Cancelled: "Đã hủy",
};

const statusStyles: Record<PauseEnrollmentRequestStatus, string> = {
  Pending: "border-amber-300 bg-amber-100 text-amber-800",
  Approved: "border-emerald-300 bg-emerald-100 text-emerald-800",
  Rejected: "border-rose-300 bg-rose-100 text-rose-800",
  Cancelled: "border-red-300 bg-red-100 text-red-800",
};

const outcomeLabels: Record<PauseEnrollmentOutcome, string> = {
  ContinueSameClass: "Tiếp tục cùng lớp",
  ReassignEquivalentClass: "Chuyển lớp tương đương",
  ContinueWithTutoring: "Tiếp tục theo kèm riêng",
};

const REASSIGN_WEEK_DAYS = [
  { value: "2", shortLabel: "T2", label: "Thứ 2", rrule: "MO" },
  { value: "3", shortLabel: "T3", label: "Thứ 3", rrule: "TU" },
  { value: "4", shortLabel: "T4", label: "Thứ 4", rrule: "WE" },
  { value: "5", shortLabel: "T5", label: "Thứ 5", rrule: "TH" },
  { value: "6", shortLabel: "T6", label: "Thứ 6", rrule: "FR" },
  { value: "7", shortLabel: "T7", label: "Thứ 7", rrule: "SA" },
  { value: "CN", shortLabel: "CN", label: "Chủ nhật", rrule: "SU" },
] as const;

const REASSIGN_TIME_SLOTS = [
  {
    value: "morning",
    label: "Sáng",
    timeRange: "08:00 - 10:00",
    startTime: "08:00",
    durationMinutes: 120,
  },
  {
    value: "late-morning",
    label: "Trưa",
    timeRange: "10:00 - 12:00",
    startTime: "10:00",
    durationMinutes: 120,
  },
  {
    value: "afternoon",
    label: "Chiều",
    timeRange: "14:00 - 16:00",
    startTime: "14:00",
    durationMinutes: 120,
  },
  {
    value: "late-afternoon",
    label: "Chiều",
    timeRange: "16:00 - 18:00",
    startTime: "16:00",
    durationMinutes: 120,
  },
  {
    value: "evening",
    label: "Tối",
    timeRange: "18:00 - 20:00",
    startTime: "18:00",
    durationMinutes: 120,
  },
  {
    value: "late-evening",
    label: "Tối",
    timeRange: "19:30 - 21:30",
    startTime: "19:30",
    durationMinutes: 120,
  },
] as const;

const scopeLabels: Record<PauseEnrollmentScope, string> = {
  AllEligible: "Tất cả lớp",
  SingleClass: "Một lớp cụ thể",
};

const scopeStyles: Record<PauseEnrollmentScope, string> = {
  AllEligible: "border-sky-200 bg-sky-50 text-sky-700",
  SingleClass: "border-orange-200 bg-orange-50 text-orange-700",
};

function normalizeStatus(value?: string | null): PauseEnrollmentRequestStatus {
  if (!value) return "Pending";

  const normalized = value.replace(/\s+/g, "").toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "cancelled" || normalized === "canceled")
    return "Cancelled";
  return "Pending";
}

function normalizeScope(
  value?: string | null,
  classId?: string | null,
): PauseEnrollmentScope {
  if (value === "SingleClass" || value === "AllEligible") return value;
  return classId ? "SingleClass" : "AllEligible";
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
  if (Array.isArray(root.data?.students?.items))
    return root.data.students.items;
  return [];
}

function extractPauseRequestItems(
  payload: unknown,
): PauseEnrollmentRequestRecord[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as {
    data?: any;
    items?: PauseEnrollmentRequestRecord[];
    pauseEnrollmentRequests?: PauseEnrollmentRequestRecord[];
  };

  if (Array.isArray(root.items)) return root.items;
  if (Array.isArray(root.pauseEnrollmentRequests))
    return root.pauseEnrollmentRequests;

  const data = root.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.pauseEnrollmentRequests?.items))
    return data.pauseEnrollmentRequests.items;
  if (Array.isArray(data?.pauseEnrollmentRequests))
    return data.pauseEnrollmentRequests;
  if (Array.isArray(data)) return data;

  return [];
}

function classOptionLabel(item: ReassignClassOption) {
  return item.code ?? item.name ?? item.className ?? item.title ?? item.id;
}

function toReassignClassOption(item: any): ReassignClassOption {
  return {
    id: String(item?.id ?? ""),
    code: item?.code ?? null,
    name: item?.name ?? item?.className ?? item?.title ?? null,
    className: item?.className ?? item?.name ?? null,
    title: item?.title ?? null,
    mainTeacherId: item?.mainTeacherId ?? null,
    mainTeacherName: item?.mainTeacherName ?? item?.teacherName ?? null,
    programId:
      typeof item?.programId === "string"
        ? item.programId
        : typeof item?.program?.id === "string"
          ? item.program.id
          : null,
    programName:
      typeof item?.programName === "string"
        ? item.programName
        : typeof item?.program?.name === "string"
          ? item.program.name
          : null,
    branchId:
      typeof item?.branchId === "string"
        ? item.branchId
        : typeof item?.branch?.id === "string"
          ? item.branch.id
          : null,
    schedulePattern:
      typeof item?.schedulePattern === "string" ? item.schedulePattern : null,
    classSchedulePattern:
      typeof item?.classSchedulePattern === "string"
        ? item.classSchedulePattern
        : null,
    effectiveSchedulePattern:
      typeof item?.effectiveSchedulePattern === "string"
        ? item.effectiveSchedulePattern
        : null,
    weeklyScheduleSlots: Array.isArray(item?.weeklyScheduleSlots)
      ? item.weeklyScheduleSlots
      : undefined,
    classWeeklyScheduleSlots: Array.isArray(item?.classWeeklyScheduleSlots)
      ? item.classWeeklyScheduleSlots
      : undefined,
    weeklyPattern: Array.isArray(item?.weeklyPattern)
      ? item.weeklyPattern
      : undefined,
    effectiveWeeklyPattern: Array.isArray(item?.effectiveWeeklyPattern)
      ? item.effectiveWeeklyPattern
      : undefined,
  };
}

function extractClassOptions(payload: unknown): ReassignClassOption[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as {
    data?: any;
    items?: any[];
    classes?: any[];
  };

  if (Array.isArray(root.items))
    return root.items
      .map(toReassignClassOption)
      .filter((item) => Boolean(item.id));
  if (Array.isArray(root.classes))
    return root.classes
      .map(toReassignClassOption)
      .filter((item) => Boolean(item.id));

  const data = root.data;
  if (Array.isArray(data?.items))
    return data.items
      .map(toReassignClassOption)
      .filter((item: ReassignClassOption) => Boolean(item.id));
  if (Array.isArray(data?.classes?.items))
    return data.classes.items
      .map(toReassignClassOption)
      .filter((item: ReassignClassOption) => Boolean(item.id));
  if (Array.isArray(data?.classes))
    return data.classes
      .map(toReassignClassOption)
      .filter((item: ReassignClassOption) => Boolean(item.id));
  if (Array.isArray(data))
    return data
      .map(toReassignClassOption)
      .filter((item: ReassignClassOption) => Boolean(item.id));

  return [];
}

function ensureApiSuccess(payload: any, fallbackMessage: string) {
  if (payload?.success === false || payload?.isSuccess === false) {
    throw new Error(payload?.message ?? fallbackMessage);
  }

  return payload;
}

function extractPauseEnrollmentSettings(
  payload: any,
): PauseEnrollmentSettings | null {
  if (!payload || typeof payload !== "object") return null;

  const data = payload.data ?? payload;
  const reservationLimitMonths = Number(data?.reservationLimitMonths);

  if (!Number.isFinite(reservationLimitMonths) || reservationLimitMonths <= 0) {
    return null;
  }

  return {
    reservationLimitMonths,
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,
  };
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

function summarizeText(
  value?: string | null,
  fallback = "Không có ghi chú bổ sung.",
) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 137)}...`;
}

function parseWeeklyPatternJson(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
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

function toStudentOptionFromProfile(
  profile: UserProfile,
): PauseEnrollmentStudentOption | null {
  const id = profile.id ?? profile.studentId ?? "";
  if (!id) return null;

  return {
    id,
    label: profile.displayName ?? id,
  };
}

function toStudentOptionFromSummary(
  student: StudentSummary,
): PauseEnrollmentStudentOption | null {
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
            .map(
              (item) =>
                item.name ??
                item.className ??
                item.title ??
                item.code ??
                item.id,
            )
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
      cls: "border-red-200 bg-linear-to-r from-red-50 to-red-100 text-red-700",
      icon: AlertCircle,
    },
    success: {
      cls: "border-emerald-200 bg-linear-to-r from-emerald-50 to-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    },
    info: {
      cls: "border-sky-200 bg-linear-to-r from-sky-50 to-slate-50 text-sky-700",
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
  tone: "red" | "amber" | "emerald" | "slate" | "blue";
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
    blue: {
      label: "text-blue-600",
      panel: "from-blue-500 to-indigo-500",
      glow: "bg-blue-500",
      icon: ShieldCheck,
    },
  } as const;
  const Icon = tones[tone].icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl ${tones[tone].glow}`}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-r ${tones[tone].panel} text-white shadow-sm`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[11px] font-semibold  tracking-[0.18em] ${tones[tone].label}`}
          >
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold leading-tight text-gray-900">
            {value}
          </div>
          <div className="mt-1 truncate text-xs leading-5 text-gray-500">
            {note}
          </div>
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
      "border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100",
    danger:
      "border-rose-200 bg-linear-to-r from-rose-50 to-pink-50 text-rose-700 hover:from-rose-100 hover:to-pink-100",
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-red-700 p-6">
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
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-5 text-sm font-semibold text-white cursor-pointer shadow-lg hover:shadow-xl transition disabled:opacity-60"
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
  reassignForm,
  reassignRegistrations,
  reassignClasses,
  selectedReassignProgramName,
  reassignOptionsLoading,
  reassignOptionsError,
  actionLoadingKey,
  onClose,
  onApprove,
  onReject,
  onCancel,
  onOutcomeChange,
  onOutcomeNoteChange,
  onSaveOutcome,
  onReassignChange,
  onSubmitReassign,
}: {
  request: PauseEnrollmentRequestRecord | null;
  student?: PauseEnrollmentStudentOption;
  isManagement: boolean;
  canCancel: boolean;
  outcomeForm: {
    outcome: PauseEnrollmentOutcome;
    outcomeNote: string;
  };
  reassignForm: ReassignFormState;
  reassignRegistrations: Registration[];
  reassignClasses: ReassignClassOption[];
  selectedReassignProgramName?: string | null;
  reassignOptionsLoading: boolean;
  reassignOptionsError: string | null;
  actionLoadingKey: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onOutcomeChange: (value: PauseEnrollmentOutcome) => void;
  onOutcomeNoteChange: (value: string) => void;
  onSaveOutcome: () => void;
  onReassignChange: <K extends keyof ReassignFormState>(
    key: K,
    value: ReassignFormState[K],
  ) => void;
  onSubmitReassign: () => void;
}) {
  if (!request) return null;

  const status = normalizeStatus(request.status);
  const canEditOutcome = isManagement && status === "Approved";
  const scope = normalizeScope(request.scope, request.classId);
  const selectedReassignRegistration =
    reassignRegistrations.find(
      (item) => item.id === reassignForm.registrationId,
    ) ?? null;
  const selectedReassignClass =
    reassignClasses.find((item) => item.id === reassignForm.newClassId) ?? null;
  const [selectedScheduleKeys, setSelectedScheduleKeys] = useState<string[]>(
    [],
  );
  const selectedClassWeeklyPattern = useMemo(
    () => buildWeeklyPatternFromClassOption(selectedReassignClass),
    [selectedReassignClass],
  );
  const scheduleOptions = useMemo(
    () =>
      selectedClassWeeklyPattern
        .flatMap((entry) => {
          const startTime = normalizeWeeklyStartTime(entry.startTime);
          const durationMinutes = Math.max(
            0,
            Number(entry.durationMinutes) || 120,
          );
          if (!startTime) return [];

          return (entry.dayOfWeeks || []).map((day) => {
            const dayCode = normalizeWeeklyDayCode(day);
            if (!dayCode) return null;

            const dayLabel =
              REASSIGN_WEEK_DAYS.find((item) => item.rrule === dayCode)
                ?.label || dayCode;

            return {
              key: `${dayCode}|${startTime}|${durationMinutes}`,
              dayCode,
              startTime,
              durationMinutes,
              label: `${dayLabel} • ${startTime}`,
            };
          });
        })
        .filter(
          (
            item,
          ): item is {
            key: string;
            dayCode: string;
            startTime: string;
            durationMinutes: number;
            label: string;
          } => Boolean(item),
        ),
    [selectedClassWeeklyPattern],
  );
  const selectedWeeklyPattern = useMemo(() => {
    if (!scheduleOptions.length || !selectedScheduleKeys.length)
      return [] as WeeklyPatternEntry[];

    const selected = scheduleOptions.filter((item) =>
      selectedScheduleKeys.includes(item.key),
    );
    if (!selected.length) return [];

    const grouped = new Map<string, WeeklyPatternEntry>();
    selected.forEach((item) => {
      const key = `${item.startTime}|${item.durationMinutes}`;
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          dayOfWeeks: [item.dayCode],
          startTime: item.startTime,
          durationMinutes: item.durationMinutes,
        });
        return;
      }

      if (!existing.dayOfWeeks.includes(item.dayCode)) {
        existing.dayOfWeeks.push(item.dayCode);
      }
    });

    return Array.from(grouped.values()).filter(
      (entry) => entry.dayOfWeeks.length > 0 && Boolean(entry.startTime),
    );
  }, [scheduleOptions, selectedScheduleKeys]);
  const hasSecondaryProgram = Boolean(
    selectedReassignRegistration?.secondaryProgramId,
  );

  useEffect(() => {
    if (!reassignForm.newClassId || scheduleOptions.length === 0) {
      setSelectedScheduleKeys([]);
      return;
    }

    setSelectedScheduleKeys((prev) => {
      const available = new Set(scheduleOptions.map((item) => item.key));
      const kept = prev.filter((key) => available.has(key));
      return kept.length > 0 ? kept : scheduleOptions.map((item) => item.key);
    });
  }, [reassignForm.newClassId, scheduleOptions]);

  useEffect(() => {
    const nextValue = selectedWeeklyPattern.length
      ? JSON.stringify(selectedWeeklyPattern)
      : "";
    if (nextValue !== reassignForm.weeklyPatternJson) {
      onReassignChange("weeklyPatternJson", nextValue);
    }
  }, [onReassignChange, reassignForm.weeklyPatternJson, selectedWeeklyPattern]);
  const shouldShowReassignPanel =
    canEditOutcome &&
    (request.outcome === "ContinueWithTutoring" ||
      request.outcome === "ReassignEquivalentClass");
  const studentLabel = student?.label ?? "Học viên";
  const studentSubtext = student?.parentName
    ? `Phụ huynh: ${student.parentName}`
    : "";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-9990 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-red-700 px-6 py-4 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-base font-bold text-white shadow-lg">
                {getInitials(studentLabel)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Chi tiết yêu cầu bảo lưu
                </h2>
                <p className="mt-1 text-sm font-medium text-red-100">
                  {studentLabel}
                </p>
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
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 sm:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold  tracking-wide text-gray-500">
                    <span className="text-sm font-bold">Khoảng bảo lưu </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDate(request.pauseFrom)} -{" "}
                    {formatDate(request.pauseTo)}
                  </div>
                  <div
                    className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold  tracking-[0.14em] ${scopeStyles[scope]}`}
                  >
                    {scopeLabels[scope]}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold  tracking-wide text-gray-500">
                    <span className="text-sm font-bold">Tạo lúc </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDateTime(request.requestedAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold  tracking-wide text-gray-500">
                    <span className="text-sm font-bold">Duyệt lúc</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {formatDateTime(request.approvedAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold  tracking-wide text-gray-500">
                    <span className="text-sm font-bold">Kết quả sau bảo lưu</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {request.outcome
                      ? outcomeLabels[request.outcome]
                      : "Chưa cập nhật"}
                  </div>
                  {request.outcomeAt ? (
                    <div className="mt-1 text-xs text-gray-500">
                      Cập nhật {formatDateTime(request.outcomeAt)}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold  tracking-wide text-gray-500">
                    <span className="text-sm font-bold">Số buổi đã bảo lưu</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">
                    {request.reservedSessionCount ?? 0}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Hết hạn: {formatDate(request.reservationExpiresOn)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Ảnh chụp: {formatDateTime(request.reservationSnapshotAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold  tracking-wide text-gray-500">
                    <span className="text-sm font-bold">Lý do</span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-gray-700">
                    {request.reason?.trim() || "Không có ghi chú."}
                  </div>
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
              <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
                  <div className="text-lg font-bold text-gray-900">
                    Xử lý yêu cầu
                  </div>
                </div>

                <div className="space-y-3 p-6">
                  {isManagement && status === "Pending" ? (
                    <>
                      <ActionButton
                        label="Duyệt yêu cầu"
                        tone="primary"
                        onClick={onApprove}
                      />
                      <ActionButton
                        label="Từ chối yêu cầu"
                        tone="danger"
                        onClick={onReject}
                      />
                    </>
                  ) : null}

                  {canCancel ? (
                    <ActionButton
                      label="Hủy yêu cầu"
                      tone="danger"
                      onClick={onCancel}
                    />
                  ) : null}

                  {!isManagement && status !== "Pending" && !canCancel ? (
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                      Yêu cầu này không còn thao tác trực tiếp được từ phía phụ
                      huynh.
                    </div>
                  ) : null}

                  {isManagement && status !== "Pending" && !canEditOutcome ? (
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                      Outcome chỉ cập nhật được khi yêu cầu đã ở trạng thái đã
                      duyệt.
                    </div>
                  ) : null}
                </div>
              </div>

              {canEditOutcome ? (
                <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
                    <div className="text-lg font-bold text-gray-900">
                      Cập nhật kết quả sau bảo lưu
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Ghi nhận hướng xử lý sau khi học sinh quay lại.
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    <label className="block">
                      <div className="mb-2 text-sm font-semibold text-gray-700">
                        Kết quả
                      </div>
                      <Select
                        value={outcomeForm.outcome}
                        onValueChange={(value) =>
                          onOutcomeChange(value as PauseEnrollmentOutcome)
                        }
                      >
                        <SelectTrigger className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-200">
                          <SelectValue placeholder="Chọn kết quả" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(outcomeLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </label>

                    <label className="block">
                      <div className="mb-2 text-sm font-semibold text-gray-700">
                        Ghi chú
                      </div>
                      <textarea
                        value={outcomeForm.outcomeNote}
                        onChange={(event) =>
                          onOutcomeNoteChange(event.target.value)
                        }
                        rows={4}
                        placeholder="Ví dụ: học sinh quay lại lớp cũ từ tuần 2 tháng sau..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={onSaveOutcome}
                      disabled={actionLoadingKey === `outcome:${request.id}`}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-5 text-sm font-semibold cursor-pointer text-white shadow-lg hover:shadow-xl transition disabled:opacity-60"
                    >
                      {actionLoadingKey === `outcome:${request.id}` ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : null}
                      Lưu kết quả
                    </button>

                    {shouldShowReassignPanel ? (
                      <div className="mt-2 space-y-3 rounded-2xl border border-red-200 bg-red-50/40 p-4">
                        <div className="text-sm font-semibold text-gray-900">
                          Chuyển lớp tương đương
                        </div>
                        <div className="text-xs leading-5 text-gray-600">
                          Chỉ thao tác được sau khi đã lưu kết quả là "Tiếp tục
                          theo kèm riêng".
                        </div>
                        {selectedReassignProgramName ? (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                            Đang lọc lớp theo chương trình:{" "}
                            {selectedReassignProgramName}
                          </div>
                        ) : null}

                        {reassignOptionsError ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            {reassignOptionsError}
                          </div>
                        ) : null}

                        <label className="block">
                          <div className="mb-1 text-xs font-semibold tracking-wide text-gray-600">
                            Ghi danh
                          </div>
                          <Select
                            value={
                              reassignForm.registrationId ||
                              EMPTY_REASSIGN_REGISTRATION
                            }
                            onValueChange={(value) =>
                              onReassignChange(
                                "registrationId",
                                value === EMPTY_REASSIGN_REGISTRATION
                                  ? ""
                                  : value,
                              )
                            }
                            disabled={reassignOptionsLoading}
                          >
                            <SelectTrigger className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-200">
                              <SelectValue
                                placeholder={
                                  reassignOptionsLoading
                                    ? "Đang tải danh sách ghi danh..."
                                    : "Chọn ghi danh"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_REASSIGN_REGISTRATION}>
                                {reassignOptionsLoading
                                  ? "Đang tải danh sách ghi danh..."
                                  : "Chọn ghi danh"}
                              </SelectItem>
                              {reassignRegistrations.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.programName || "Chương trình"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>

                        <label className="block">
                          <div className="mb-1 text-xs font-semibold tracking-wide text-gray-600">
                            Lớp mới
                          </div>
                          <Select
                            value={
                              reassignForm.newClassId || EMPTY_REASSIGN_CLASS
                            }
                            onValueChange={(value) =>
                              onReassignChange(
                                "newClassId",
                                value === EMPTY_REASSIGN_CLASS ? "" : value,
                              )
                            }
                            disabled={reassignOptionsLoading}
                          >
                            <SelectTrigger className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-200">
                              <SelectValue
                                placeholder={
                                  reassignOptionsLoading
                                    ? "Đang tải danh sách lớp..."
                                    : "Chọn lớp mới"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_REASSIGN_CLASS}>
                                {reassignOptionsLoading
                                  ? "Đang tải danh sách lớp..."
                                  : "Chọn lớp mới"}
                              </SelectItem>
                              {reassignClasses.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {`${classOptionLabel(item)}${item.programName ? ` (${item.programName})` : ""}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!reassignOptionsLoading &&
                          !reassignClasses.length ? (
                            <div className="mt-1 text-xs text-amber-700">
                              Không có lớp phù hợp với chương trình của ghi danh
                              đã chọn.
                            </div>
                          ) : null}
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {hasSecondaryProgram ? (
                            <label className="block">
                              <div className="mb-1 text-xs font-semibold tracking-wide text-gray-600">
                                Chương trình
                              </div>
                              <Select
                                value={reassignForm.track}
                                onValueChange={(value) =>
                                  onReassignChange(
                                    "track",
                                    value as ReassignFormState["track"],
                                  )
                                }
                              >
                                <SelectTrigger className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-red-400 focus:ring-2 focus:ring-red-200">
                                  <SelectValue placeholder="Chọn chương trình" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="primary">Chính</SelectItem>
                                  <SelectItem value="secondary">Phụ</SelectItem>
                                </SelectContent>
                              </Select>
                            </label>
                          ) : null}

                          <label className="block">
                            <div className="mb-1 text-xs font-semibold tracking-wide text-gray-600">
                              Ngày hiệu lực
                            </div>
                            <input
                              type="date"
                              value={reassignForm.effectiveDate}
                              onChange={(event) =>
                                onReassignChange(
                                  "effectiveDate",
                                  event.target.value,
                                )
                              }
                              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200"
                            />
                          </label>
                        </div>

                        <div className="rounded-2xl border border-red-100 p-3">
                          <div className="mb-3 text-sm font-semibold text-gray-800">
                            Lịch học mong muốn
                          </div>
                          <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">
                            {!reassignForm.newClassId ? (
                              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                                Chọn lớp mới để xem lịch học áp dụng.
                              </div>
                            ) : scheduleOptions.length > 0 ? (
                              <>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {scheduleOptions.map((item) => {
                                    const isSelected =
                                      selectedScheduleKeys.includes(item.key);
                                    return (
                                      <button
                                        key={item.key}
                                        type="button"
                                        onClick={() =>
                                          setSelectedScheduleKeys((prev) =>
                                            prev.includes(item.key)
                                              ? prev.filter(
                                                  (key) => key !== item.key,
                                                )
                                              : [...prev, item.key],
                                          )
                                        }
                                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                                          isSelected
                                            ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                      >
                                        {item.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Đã chọn {selectedScheduleKeys.length}/
                                  {scheduleOptions.length} buổi.
                                </div>
                              </>
                            ) : (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                Lớp đã chọn chưa có dữ liệu lịch chuẩn. Vui lòng
                                kiểm tra lịch lớp trước khi chuyển.
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={onSubmitReassign}
                          disabled={
                            actionLoadingKey === `reassign:${request.id}`
                          }
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition cursor-pointer hover:bg-red-50 disabled:opacity-60"
                        >
                          {actionLoadingKey === `reassign:${request.id}` ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : null}
                          Xác nhận chuyển lớp
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4 sm:px-8">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-linear-to-r from-red-600 to-red-700 px-5 text-sm font-semibold text-white transition cursor-pointer hover:shadow-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PauseEnrollmentWorkspace({ context }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isManagement = context !== "parent";
  const isStudentPage = context === "parent";
  const { selectedProfile } = useSelectedStudentProfile();
  const isStudentLocked = isStudentPage && !!selectedProfile?.id;
  const { selectedBranchId, isLoaded: isBranchLoaded } = useBranchFilter();

  const [studentOptions, setStudentOptions] = useState<
    PauseEnrollmentStudentOption[]
  >([]);
  const [studentOptionsLoading, setStudentOptionsLoading] = useState(false);
  const [studentOptionsError, setStudentOptionsError] = useState<string | null>(
    null,
  );
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUS);
  const [selectedClassId, setSelectedClassId] = useState<string>(ALL_CLASS);
  const [searchQuery, setSearchQuery] = useState("");

  const [requests, setRequests] = useState<PauseEnrollmentRequestRecord[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [settings, setSettings] = useState<PauseEnrollmentSettings | null>(
    null,
  );
  const [settingsDraft, setSettingsDraft] = useState("3");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [filterClasses, setFilterClasses] = useState<ReassignClassOption[]>([]);
  const [filterClassesLoading, setFilterClassesLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const [outcomeForm, setOutcomeForm] = useState<{
    outcome: PauseEnrollmentOutcome;
    outcomeNote: string;
  }>({
    outcome: "ContinueSameClass",
    outcomeNote: "",
  });
  const [reassignForm, setReassignForm] = useState<ReassignFormState>({
    registrationId: "",
    newClassId: "",
    track: "primary",
    weeklyPatternJson: "",
    effectiveDate: "",
  });
  const [reassignRegistrations, setReassignRegistrations] = useState<
    Registration[]
  >([]);
  const [reassignClasses, setReassignClasses] = useState<ReassignClassOption[]>(
    [],
  );
  const [reassignOptionsLoading, setReassignOptionsLoading] = useState(false);
  const [reassignOptionsError, setReassignOptionsError] = useState<
    string | null
  >(null);

  const requestIdFromUrl = useMemo(() => {
    const raw = searchParams.get("requestId")?.trim();
    if (!raw) return null;
    return /^[0-9a-fA-F-]{36}$/.test(raw) ? raw : null;
  }, [searchParams]);

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
    [studentOptions],
  );
  const lockedStudentOption = useMemo(
    () =>
      selectedProfile ? toStudentOptionFromProfile(selectedProfile) : null,
    [selectedProfile],
  );
  const activeLockedStudent = useMemo(() => {
    if (!isStudentLocked || !lockedStudentOption?.id) return null;
    return studentMap.get(lockedStudentOption.id) ?? lockedStudentOption;
  }, [isStudentLocked, lockedStudentOption, studentMap]);

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  );

  const selectedReassignRegistration = useMemo(
    () =>
      reassignRegistrations.find(
        (item) => item.id === reassignForm.registrationId,
      ) ?? null,
    [reassignForm.registrationId, reassignRegistrations],
  );

  const selectedReassignHasSecondaryProgram = useMemo(
    () => Boolean(selectedReassignRegistration?.secondaryProgramId),
    [selectedReassignRegistration?.secondaryProgramId],
  );

  const selectedReassignProgramId = useMemo(() => {
    if (!selectedReassignRegistration) return null;
    if (
      selectedReassignHasSecondaryProgram &&
      reassignForm.track === "secondary"
    ) {
      return (
        selectedReassignRegistration.secondaryProgramId ??
        selectedReassignRegistration.programId
      );
    }
    return selectedReassignRegistration.programId;
  }, [
    reassignForm.track,
    selectedReassignHasSecondaryProgram,
    selectedReassignRegistration,
  ]);

  const selectedReassignProgramName = useMemo(() => {
    if (!selectedReassignRegistration) return null;
    if (
      selectedReassignHasSecondaryProgram &&
      reassignForm.track === "secondary"
    ) {
      return (
        selectedReassignRegistration.secondaryProgramName ??
        selectedReassignRegistration.programName
      );
    }
    return selectedReassignRegistration.programName;
  }, [
    reassignForm.track,
    selectedReassignHasSecondaryProgram,
    selectedReassignRegistration,
  ]);

  const selectedReassignCurrentClassId = useMemo(() => {
    if (!selectedReassignRegistration) {
      return String(selectedRequest?.classId || "");
    }
    if (
      selectedReassignHasSecondaryProgram &&
      reassignForm.track === "secondary"
    ) {
      return String(
        selectedReassignRegistration.secondaryClassId ||
          selectedReassignRegistration.classId ||
          selectedRequest?.classId ||
          "",
      );
    }

    return String(
      selectedReassignRegistration.classId || selectedRequest?.classId || "",
    );
  }, [
    reassignForm.track,
    selectedRequest?.classId,
    selectedReassignHasSecondaryProgram,
    selectedReassignRegistration,
  ]);

  const filteredReassignClasses = useMemo(() => {
    return reassignClasses.filter((item) => {
      if (
        selectedReassignProgramId &&
        item.programId &&
        item.programId !== selectedReassignProgramId
      ) {
        return false;
      }

      if (
        selectedReassignCurrentClassId &&
        item.id === selectedReassignCurrentClassId
      ) {
        return false;
      }

      return true;
    });
  }, [
    reassignClasses,
    selectedReassignCurrentClassId,
    selectedReassignProgramId,
  ]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(
      (item) => normalizeStatus(item.status) === "Pending",
    ).length;
    const approved = requests.filter(
      (item) => normalizeStatus(item.status) === "Approved",
    ).length;
    const cancelled = requests.filter(
      (item) => normalizeStatus(item.status) === "Cancelled",
    ).length;
    const needsOutcome = requests.filter(
      (item) => normalizeStatus(item.status) === "Approved" && !item.outcome,
    ).length;

    return { total, pending, approved, cancelled, needsOutcome };
  }, [requests]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="text-red-600" />
    ) : (
      <ArrowDown size={14} className="text-red-600" />
    );
  };

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

  const filteredAndSortedRequests = useMemo(() => {
    const sorted = [...filteredRequests];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";

        switch (sortColumn) {
          case "student":
            aVal = studentMap.get(a.studentProfileId)?.label ?? "";
            bVal = studentMap.get(b.studentProfileId)?.label ?? "";
            break;
          case "dateFrom":
            aVal = a.pauseFrom ?? "";
            bVal = b.pauseFrom ?? "";
            break;
          case "status":
            aVal = normalizeStatus(a.status);
            bVal = normalizeStatus(b.status);
            break;
          case "createdAt":
            aVal = a.requestedAt ?? "";
            bVal = b.requestedAt ?? "";
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [filteredRequests, sortColumn, sortDirection, studentMap]);

  const loadStudentOptions = useCallback(async () => {
    setStudentOptionsLoading(true);
    setStudentOptionsError(null);

    try {
      if (isStudentPage) {
        const fallbackOptions = lockedStudentOption
          ? [lockedStudentOption]
          : [];
        const response = await getProfiles({ profileType: "Student" });
        const fetchedOptions = extractProfileItems(response)
          .filter((item) => item.profileType === "Student")
          .map(toStudentOptionFromProfile)
          .filter((item): item is PauseEnrollmentStudentOption =>
            Boolean(item),
          );

        setStudentOptions(
          mergeStudentOptions([fallbackOptions, fetchedOptions]),
        );
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

  const loadFilterClasses = useCallback(async () => {
    if (!isManagement) {
      setFilterClasses([]);
      return;
    }

    setFilterClassesLoading(true);

    try {
      const response = await getAllClasses({
        pageNumber: 1,
        pageSize: 500,
        branchId: selectedBranchId ?? undefined,
      });

      setFilterClasses(extractClassOptions(response));
    } catch {
      setFilterClasses([]);
    } finally {
      setFilterClassesLoading(false);
    }
  }, [isManagement, selectedBranchId]);

  const loadSettings = useCallback(async () => {
    if (!isManagement) {
      setSettings(null);
      setSettingsError(null);
      return;
    }

    setSettingsLoading(true);
    setSettingsError(null);

    try {
      const response = await getPauseEnrollmentSettings();
      ensureApiSuccess(response, "Không thể tải cấu hình bảo lưu.");
      const nextSettings = extractPauseEnrollmentSettings(response);

      if (!nextSettings) {
        throw new Error("Dữ liệu cấu hình bảo lưu không hợp lệ.");
      }

      setSettings(nextSettings);
      setSettingsDraft(String(nextSettings.reservationLimitMonths));
    } catch (error: any) {
      setSettings(null);
      setSettingsError(
        getDomainErrorMessage(error, "Không thể tải cấu hình bảo lưu."),
      );
    } finally {
      setSettingsLoading(false);
    }
  }, [isManagement]);

  const loadRequests = useCallback(
    async (focusId?: string) => {
      setRequestsLoading(true);
      setRequestError(null);

      try {
        const response = await getPauseEnrollmentRequestsWithParams({
          studentProfileId: selectedStudentId || undefined,
          classId: selectedClassId === ALL_CLASS ? undefined : selectedClassId,
          status: selectedStatus === ALL_STATUS ? undefined : selectedStatus,
          branchId: isManagement ? (selectedBranchId ?? undefined) : undefined,
          pageNumber: 1,
          pageSize: 200,
        });

        ensureApiSuccess(response, "Không thể tải danh sách bảo lưu.");
        const items = extractPauseRequestItems(response);

        setRequests(items);
        setSelectedRequestId((prev) => {
          if (focusId && items.some((item) => item.id === focusId))
            return focusId;
          if (prev && items.some((item) => item.id === prev)) return prev;
          return null;
        });
      } catch (error: any) {
        setRequests([]);
        setSelectedRequestId(null);
        setRequestError(
          getDomainErrorMessage(error, "Không thể tải danh sách bảo lưu."),
        );
      } finally {
        setRequestsLoading(false);
      }
    },
    [
      isManagement,
      selectedBranchId,
      selectedClassId,
      selectedStatus,
      selectedStudentId,
    ],
  );

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  useEffect(() => {
    void loadStudentOptions();
  }, [loadStudentOptions]);

  useEffect(() => {
    if (isManagement && !isBranchLoaded) return;
    void loadFilterClasses();
  }, [isBranchLoaded, isManagement, loadFilterClasses]);

  useEffect(() => {
    if (!isManagement) return;
    void loadSettings();
  }, [isManagement, loadSettings]);

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
        prev && studentOptions.some((item) => item.id === prev) ? prev : "",
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
    if (selectedClassId === ALL_CLASS) return;
    if (filterClasses.some((item) => item.id === selectedClassId)) return;
    setSelectedClassId(ALL_CLASS);
  }, [filterClasses, selectedClassId]);

  useEffect(() => {
    const visiblePendingIds = new Set(
      filteredRequests
        .filter((item) => normalizeStatus(item.status) === "Pending")
        .map((item) => item.id),
    );

    setSelectedRequestIds((prev) =>
      prev.filter((id) => visiblePendingIds.has(id)),
    );
  }, [filteredRequests]);

  useEffect(() => {
    if (selectedRequest) {
      setOutcomeForm({
        outcome: selectedRequest.outcome ?? "ContinueSameClass",
        outcomeNote: selectedRequest.outcomeNote ?? "",
      });
      setReassignForm({
        registrationId: "",
        newClassId: "",
        track: "primary",
        weeklyPatternJson: "",
        effectiveDate: selectedRequest.pauseTo || "",
      });
    }
  }, [selectedRequest]);

  useEffect(() => {
    if (!reassignForm.newClassId) return;
    if (
      filteredReassignClasses.some(
        (item) => item.id === reassignForm.newClassId,
      )
    )
      return;

    setReassignForm((prev) => ({
      ...prev,
      newClassId: "",
    }));
  }, [filteredReassignClasses, reassignForm.newClassId]);

  useEffect(() => {
    if (selectedReassignHasSecondaryProgram) return;
    if (reassignForm.track === "primary") return;

    setReassignForm((prev) => ({
      ...prev,
      track: "primary",
    }));
  }, [reassignForm.track, selectedReassignHasSecondaryProgram]);

  const loadReassignOptions = useCallback(async () => {
    if (!selectedRequest?.studentProfileId) {
      setReassignRegistrations([]);
      setReassignClasses([]);
      setReassignOptionsError(null);
      return;
    }

    setReassignOptionsLoading(true);
    setReassignOptionsError(null);

    try {
      const [registrationResponse, classesResponse] = await Promise.all([
        getRegistrations({
          studentProfileId: selectedRequest.studentProfileId,
          pageNumber: 1,
          pageSize: 200,
        }),
        getAllClasses({
          pageNumber: 1,
          pageSize: 500,
          branchId: isManagement ? (selectedBranchId ?? undefined) : undefined,
        }),
      ]);

      setReassignRegistrations(registrationResponse.items ?? []);
      setReassignClasses(extractClassOptions(classesResponse));
    } catch {
      setReassignRegistrations([]);
      setReassignClasses([]);
      setReassignOptionsError(
        "Không thể tải danh sách ghi danh/lớp để chuyển tương đương.",
      );
    } finally {
      setReassignOptionsLoading(false);
    }
  }, [isManagement, selectedBranchId, selectedRequest?.studentProfileId]);

  useEffect(() => {
    if (!selectedRequest) {
      setReassignRegistrations([]);
      setReassignClasses([]);
      setReassignOptionsError(null);
      return;
    }

    const shouldLoad =
      selectedRequest.outcome === "ContinueWithTutoring" ||
      selectedRequest.outcome === "ReassignEquivalentClass";

    if (!shouldLoad) {
      setReassignRegistrations([]);
      setReassignClasses([]);
      setReassignOptionsError(null);
      return;
    }

    void loadReassignOptions();
  }, [loadReassignOptions, selectedRequest]);

  useEffect(() => {
    if (isManagement && !isBranchLoaded) return;
    if (isStudentPage && studentOptionsLoading) return;
    if (isStudentPage && !selectedStudentId && studentOptions.length > 0)
      return;

    void loadRequests(requestIdFromUrl ?? undefined);
  }, [
    isBranchLoaded,
    isManagement,
    isStudentPage,
    loadRequests,
    requestIdFromUrl,
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
    if (isManagement) {
      await loadSettings();
    }
    await loadRequests(selectedRequestId ?? undefined);
  };

  const handleSaveSettings = async () => {
    const parsed = Number(settingsDraft);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      const message = "Số tháng bảo lưu tối đa phải là số nguyên lớn hơn 0.";
      setSettingsError(message);
      toast({
        title: "Dữ liệu không hợp lệ",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setSettingsSaving(true);
    setSettingsError(null);

    try {
      const response = await updatePauseEnrollmentSettings({
        reservationLimitMonths: parsed,
      });
      ensureApiSuccess(response, "Không thể cập nhật cấu hình bảo lưu.");

      const nextSettings = extractPauseEnrollmentSettings(response);
      if (!nextSettings) {
        throw new Error("Dữ liệu cấu hình sau khi cập nhật không hợp lệ.");
      }

      setSettings(nextSettings);
      setSettingsDraft(String(nextSettings.reservationLimitMonths));
      setRequestMessage("Đã cập nhật cấu hình bảo lưu.");
      toast({
        title: "Thành công",
        description: "Đã cập nhật số tháng bảo lưu tối đa.",
        type: "success",
      });
    } catch (error: any) {
      const message = getDomainErrorMessage(
        error,
        "Không thể cập nhật cấu hình bảo lưu.",
      );
      setSettingsError(message);
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const pendingVisibleRequests = filteredRequests.filter(
    (item) => normalizeStatus(item.status) === "Pending",
  );
  const allPendingSelected =
    pendingVisibleRequests.length > 0 &&
    pendingVisibleRequests.every((item) =>
      selectedRequestIds.includes(item.id),
    );

  const toggleBulkSelect = (requestId: string, checked: boolean) => {
    setSelectedRequestIds((prev) => {
      if (checked) {
        if (prev.includes(requestId)) return prev;
        return [...prev, requestId];
      }

      return prev.filter((id) => id !== requestId);
    });
  };

  const toggleSelectAllPending = (checked: boolean) => {
    if (!checked) {
      setSelectedRequestIds([]);
      return;
    }

    setSelectedRequestIds(pendingVisibleRequests.map((item) => item.id));
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    setRequestError(null);
    setRequestMessage(null);

    try {
      if (confirmAction.kind === "approve") {
        const response = await approvePauseEnrollmentRequest(
          confirmAction.requestId,
        );
        ensureApiSuccess(response, "Không thể duyệt yêu cầu bảo lưu.");
        setRequestMessage("Đã duyệt yêu cầu bảo lưu.");
        await loadRequests(confirmAction.requestId);
        router.refresh();
      }

      if (confirmAction.kind === "reject") {
        const response = await rejectPauseEnrollmentRequest(
          confirmAction.requestId,
        );
        ensureApiSuccess(response, "Không thể từ chối yêu cầu bảo lưu.");
        setRequestMessage("Đã từ chối yêu cầu bảo lưu.");
        await loadRequests(confirmAction.requestId);
        router.refresh();
      }

      if (confirmAction.kind === "cancel") {
        const response = await cancelPauseEnrollmentRequest(
          confirmAction.requestId,
        );
        ensureApiSuccess(response, "Không thể hủy yêu cầu bảo lưu.");
        setRequestMessage("Đã hủy yêu cầu bảo lưu.");
        await loadRequests(confirmAction.requestId);
        router.refresh();
      }

      if (confirmAction.kind === "approveBulk") {
        const response = await approvePauseEnrollmentRequestsBulk({
          ids: confirmAction.requestIds,
        });

        ensureApiSuccess(
          response,
          "Không thể duyệt hàng loạt yêu cầu bảo lưu.",
        );

        const approvedIds = response.data?.approvedIds ?? [];
        const errors = response.data?.errors ?? [];

        const summary = [
          approvedIds.length
            ? `Đã duyệt ${approvedIds.length} yêu cầu.`
            : "Không có yêu cầu nào được duyệt.",
          errors.length ? `${errors.length} yêu cầu bị lỗi trong batch.` : "",
        ]
          .filter(Boolean)
          .join(" ");

        setRequestMessage(summary);
        setSelectedRequestIds([]);
        await loadRequests(selectedRequestId ?? undefined);
        router.refresh();
      }

      setConfirmAction(null);
    } catch (error: any) {
      setRequestError(
        getDomainErrorMessage(error, "Không thể thực hiện thao tác."),
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
      toast({
        title: "Thành công",
        description: "Đã lưu kết quả sau bảo lưu.",
        type: "success",
      });
      await loadRequests(selectedRequest.id);
      router.refresh();
    } catch (error: any) {
      const message = getDomainErrorMessage(
        error,
        "Không thể cập nhật outcome.",
      );
      setRequestError(message);
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleSubmitReassign = async () => {
    if (!selectedRequest) return;

    const registrationId = reassignForm.registrationId.trim();
    const newClassId = reassignForm.newClassId.trim();

    if (!registrationId) {
      const message = "Vui lòng chọn ghi danh để chuyển lớp tương đương.";
      setRequestError(message);
      toast({
        title: "Thiếu dữ liệu",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (!newClassId) {
      const message = "Vui lòng chọn lớp mới.";
      setRequestError(message);
      toast({
        title: "Thiếu dữ liệu",
        description: message,
        variant: "destructive",
      });
      return;
    }

    const weeklyPattern = parseWeeklyPatternJson(
      reassignForm.weeklyPatternJson,
    );
    if (weeklyPattern === null) {
      const message =
        "Dữ liệu lịch học không hợp lệ. Vui lòng chọn lại buổi học.";
      setRequestError(message);
      toast({
        title: "Dữ liệu không hợp lệ",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (!Array.isArray(weeklyPattern) || weeklyPattern.length === 0) {
      const message = "Vui lòng chọn ít nhất một buổi học trong lịch lớp mới.";
      setRequestError(message);
      toast({
        title: "Thiếu dữ liệu",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setActionLoadingKey(`reassign:${selectedRequest.id}`);
    setRequestError(null);
    setRequestMessage(null);

    try {
      const payload: ReassignEquivalentClassPayload = {
        registrationId,
        newClassId,
        track: reassignForm.track,
        weeklyPattern,
        effectiveDate: reassignForm.effectiveDate,
      };

      const response = await reassignPauseEnrollmentEquivalentClass(
        selectedRequest.id,
        payload,
      );

      ensureApiSuccess(response, "Không thể chuyển lớp tương đương.");
      setRequestMessage("Đã chuyển lớp tương đương thành công.");
      toast({
        title: "Thành công",
        description: "Đã xác nhận chuyển lớp tương đương thành công.",
        type: "success",
      });
      await loadRequests(selectedRequest.id);
      router.refresh();
    } catch (error: any) {
      const message = getDomainErrorMessage(
        error,
        "Không thể chuyển lớp tương đương.",
      );
      setRequestError(message);
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-linear-to-b from-red-50/30 to-white p-4 md:p-2">
      <div
        className={`space-y-4 transition-all duration-700 ${
          isPageLoaded
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
              <Clock3 size={25} />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 md:text-2xl">
                {requestTitle.title}
              </h1>
              <div
                className="text-gray-600 mt-1 flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                <p className="max-w-4xl text-sm leading-6 text-gray-600">
                  {requestTitle.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
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
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white transition cursor-pointer hover:shadow-lg disabled:opacity-60"
            >
              <Plus size={16} />
              Tạo yêu cầu
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">{isManagement ? "Hiển thị" : "Tổng yêu cầu"}</div>
                <div className="text-2xl font-extrabold text-gray-900">{isManagement ? filteredRequests.length : stats.total}</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-600 to-yellow-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Chờ duyệt</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.pending}</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">Đã duyệt</div>
                <div className="text-2xl font-extrabold text-gray-900">{stats.approved}</div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-linear-to-r from-red-600 to-red-700"></div>
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-pink-600 grid place-items-center">
                <Clock3 className="text-white" size={18} />
              </span>
              <div>
                <div className="text-sm text-gray-600">{isManagement ? "Thiếu outcome" : "Đã hủy"}</div>
                <div className="text-2xl font-extrabold text-gray-900">{isManagement ? stats.needsOutcome : stats.cancelled}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {requestError ? <Banner kind="error" text={requestError} /> : null}
      {requestMessage ? <Banner kind="success" text={requestMessage} /> : null}
      {studentOptionsError ? (
        <Banner kind="error" text={studentOptionsError} />
      ) : null}
      {settingsError ? <Banner kind="error" text={settingsError} /> : null}

      {isManagement ? (
        <div
          className={`rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/20 p-4 transition-all duration-700 delay-100 ${
            isPageLoaded
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Cấu hình bảo lưu học phí
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Giới hạn số tháng tối đa học sinh được phép bảo lưu enrollment.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {settings?.updatedAt
                  ? `Cập nhật lần cuối: ${formatDateTime(settings.updatedAt)}`
                  : settings?.createdAt
                    ? `Khởi tạo lúc: ${formatDateTime(settings.createdAt)}`
                    : "Chưa có thông tin thời gian cập nhật."}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-gray-600">
                Số tháng tối đa
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={settingsDraft}
                  onChange={(event) => setSettingsDraft(event.target.value)}
                  disabled={settingsLoading || settingsSaving}
                  className="h-10 w-28 rounded-xl border border-red-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-60"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleSaveSettings()}
                disabled={settingsLoading || settingsSaving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 text-sm font-semibold text-white transition cursor-pointer hover:shadow-lg disabled:opacity-60"
              >
                {settingsLoading || settingsSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShieldCheck size={14} />
                )}
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter Card */}
      <div
        className={`rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4 transition-all duration-700 delay-150 ${
          isPageLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-red-200">
            {(["all", "Pending", "Approved", "Rejected", "Cancelled"] as const).map((status) => {
              const counts: Record<typeof status, number> = {
                all: requests.length,
                Pending: requests.filter((r) => normalizeStatus(r.status) === "Pending").length,
                Approved: requests.filter((r) => normalizeStatus(r.status) === "Approved").length,
                Rejected: requests.filter((r) => normalizeStatus(r.status) === "Rejected").length,
                Cancelled: requests.filter((r) => normalizeStatus(r.status) === "Cancelled").length,
              };

              const labels: Record<typeof status, string> = {
                all: "Tất cả trạng thái",
                Pending: statusLabels.Pending,
                Approved: statusLabels.Approved,
                Rejected: statusLabels.Rejected,
                Cancelled: statusLabels.Cancelled,
              };

              const isActive = selectedStatus === (status === "all" ? ALL_STATUS : status);
              return (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status === "all" ? ALL_STATUS : status);
                  }}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-linear-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                      : "bg-white border-red-200 text-gray-700 hover:bg-red-50"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {labels[status]}
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-white/30 text-white"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {counts[status]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Class Filter Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={
                  isManagement
                    ? "Tìm kiếm học sinh, phụ huynh, lớp, lý do..."
                    : "Tìm kiếm yêu cầu bảo lưu..."
                }
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            {isManagement ? (
              <Select
                value={selectedClassId}
                onValueChange={(val) => setSelectedClassId(val)}
              >
                <SelectTrigger className="h-10 w-35 rounded-xl border border-red-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200">
                  <SelectValue placeholder="Lọc theo lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CLASS}>Tất cả lớp</SelectItem>
                  {filterClasses.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {classOptionLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {isManagement && filterClassesLoading ? (
              <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Đang tải lớp...
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div
        className={`overflow-hidden rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm transition-all duration-700 delay-150 ${
          isPageLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="border-b border-red-200 bg-linear-to-r from-red-500/10 to-red-700/10 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Danh sách yêu cầu bảo lưu
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {isManagement
                  ? "Theo dõi, duyệt và cập nhật outcome theo từng học sinh."
                  : "Theo dõi trạng thái các yêu cầu bảo lưu của học sinh đang chọn."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">
                  {filteredRequests.length} yêu cầu
                </span>
              </div>
              {isManagement && selectedStatus === "Pending" ? (
                <button
                  type="button"
                  disabled={!selectedRequestIds.length || requestsLoading}
                  onClick={() =>
                    setConfirmAction({
                      kind: "approveBulk",
                      requestIds: selectedRequestIds,
                      title: "Duyệt hàng loạt yêu cầu bảo lưu",
                      description: `Bạn sắp duyệt ${selectedRequestIds.length} yêu cầu đang ở trạng thái Pending.`,
                      confirmText: "Duyệt đã chọn",
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition cursor-pointer hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  Duyệt ({selectedRequestIds.length})
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-190">
            <thead className="border-b border-red-200 bg-linear-to-r from-red-600/5 to-red-700/5">
              <tr className="text-left text-sm font-semibold text-gray-700">
                {isManagement && selectedStatus === "Pending" ? (
                  <th className="px-4 py-4 w-10">
                    {pendingVisibleRequests.length ? (
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={(event) =>
                          toggleSelectAllPending(event.target.checked)
                        }
                        className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-400"
                        aria-label="Chọn tất cả request pending đang hiển thị"
                      />
                    ) : null}
                  </th>
                ) : null}

                <th
                  className="px-6 py-4 cursor-pointer hover:bg-red-50 transition-colors select-none"
                  onClick={() => handleSort("student")}
                >
                  <span className="inline-flex items-center gap-2">
                    Học sinh
                    {getSortIcon("student")}
                  </span>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-red-50 transition-colors select-none"
                  onClick={() => handleSort("dateFrom")}
                >
                  <span className="inline-flex items-center gap-2">
                    Ngày bảo lưu
                    {getSortIcon("dateFrom")}
                  </span>
                </th>
                <th className="px-6 py-4">Chi tiết</th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-red-50 transition-colors select-none"
                  onClick={() => handleSort("status")}
                >
                  <span className="inline-flex items-center gap-2">
                    Trạng thái
                    {getSortIcon("status")}
                  </span>
                </th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-red-100">
              {!filteredRequests.length && !requestsLoading ? (
                <tr>
                  <td
                    colSpan={isManagement && selectedStatus === "Pending" ? 6 : 5}
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

              {filteredAndSortedRequests.map((item) => {
                const status = normalizeStatus(item.status);
                const scope = normalizeScope(item.scope, item.classId);
                const student = studentMap.get(item.studentProfileId);
                const isSelected = selectedRequestId === item.id;
                const isPending = status === "Pending";
                const isApproved = status === "Approved";
                const classLabels = getClassLabels(item);
                const classPreview = classLabels.slice(0, 2);
                const hiddenClassCount = Math.max(
                  classLabels.length - classPreview.length,
                  0,
                );
                const isChecked = selectedRequestIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className={`transition-all duration-200 ${
                      isSelected
                        ? "bg-red-50/60"
                        : "hover:bg-linear-to-r hover:from-red-50/50 hover:to-white"
                    }`}
                  >
                    {isManagement && selectedStatus === "Pending" ? (
                      <td className="px-4 py-4 align-top">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(event) =>
                              toggleBulkSelect(item.id, event.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-400"
                            aria-label={`Chọn request ${item.id}`}
                          />
                        ) : null}
                      </td>
                    ) : null}

                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r ${getRequestAccent(
                            status,
                          )} text-sm font-semibold text-white shadow-sm`}
                        >
                          {getInitials(student?.label ?? "HV")}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-900">
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
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {formatDate(item.pauseFrom)} -{" "}
                          {formatDate(item.pauseTo)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tạo lúc {formatDateTime(item.requestedAt)}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-gray-700">
                      <div className="space-y-3">
                        <div className="text-sm leading-6 text-gray-600">
                          {summarizeText(item.reason)}
                        </div>
                        <div className="flex max-w-90 flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${scopeStyles[scope]}`}
                          >
                            {scopeLabels[scope]}
                          </span>
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
                              {item.outcomeAt
                                ? `Cập nhật ${formatDateTime(item.outcomeAt)}`
                                : ""}
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

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end text-gray-700 gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestId(item.id)}
                          disabled={isSelected}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isSelected ? "Đang xem" : "Chi tiết"}
                        >
                          <Eye size={14} />
                        </button>

                        {isManagement && isPending ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                kind: "approve",
                                requestId: item.id,
                                title: "Duyệt yêu cầu bảo lưu",
                                description: `Học sinh: ${
                                  student?.label ?? item.studentProfileId
                                }\nKhoảng ngày: ${formatDate(item.pauseFrom)} - ${formatDate(
                                  item.pauseTo,
                                )}`,
                                confirmText: "Duyệt yêu cầu",
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-emerald-600 cursor-pointer"
                            title="Duyệt"
                          >
                            <Check size={14} />
                          </button>
                        ) : null}

                        {isManagement && isPending ? (
                          <button
                            type="button"
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
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-rose-600 cursor-pointer"
                            title="Từ chối"
                          >
                            <XCircle size={14} />
                          </button>
                        ) : null}

                        {canCancelRequest(item) ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                kind: "cancel",
                                requestId: item.id,
                                title: "Hủy yêu cầu bảo lưu",
                                description: `Yêu cầu chỉ được hủy trước ngày bắt đầu bảo lưu.\nKhoảng ngày: ${formatDate(
                                  item.pauseFrom,
                                )} - ${formatDate(item.pauseTo)}`,
                                confirmText: "Hủy yêu cầu",
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-800 cursor-pointer"
                            title="Hủy"
                          >
                            <X size={14} />
                          </button>
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
          <div className="border-t border-red-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {filteredRequests.length}
              </span>{" "}
              yêu cầu trong tổng số{" "}
              <span className="font-semibold text-gray-900">
                {requests.length}
              </span>{" "}
              bản ghi hiện có
            </div>

          </div>
        ) : null}
      </div>

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
        reassignForm={reassignForm}
        reassignRegistrations={reassignRegistrations}
        reassignClasses={filteredReassignClasses}
        selectedReassignProgramName={selectedReassignProgramName}
        reassignOptionsLoading={reassignOptionsLoading}
        reassignOptionsError={reassignOptionsError}
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
        onReassignChange={(key, value) =>
          setReassignForm((prev) => ({
            ...prev,
            [key]: value,
          }))
        }
        onSubmitReassign={() => void handleSubmitReassign()}
      />

      <PauseEnrollmentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        studentOptions={studentOptions}
        studentOptionsLoading={studentOptionsLoading}
        studentOptionsError={studentOptionsError}
        lockedStudentProfileId={
          isStudentLocked ? (selectedProfile?.id ?? null) : null
        }
        lockedStudentLabel={activeLockedStudent?.label ?? null}
        lockedStudentClassText={activeLockedStudent?.classText ?? null}
        hideBusinessNote={isManagement}
        onCreated={(record) => {
          setCreateOpen(false);
          setRequestMessage("Đã tạo yêu cầu bảo lưu.");
          toast({
            title: "Thành công",
            description: "Đã tạo yêu cầu bảo lưu thành công.",
            type: "success",
          });
          void loadRequests(record.id);
          router.refresh();
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

function normalizeWeeklyDayCode(value?: unknown): string {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  const map: Record<string, string> = {
    MO: "MO",
    MON: "MO",
    TU: "TU",
    TUE: "TU",
    WE: "WE",
    WED: "WE",
    TH: "TH",
    THU: "TH",
    FR: "FR",
    FRI: "FR",
    SA: "SA",
    SAT: "SA",
    SU: "SU",
    SUN: "SU",
    T2: "MO",
    T3: "TU",
    T4: "WE",
    T5: "TH",
    T6: "FR",
    T7: "SA",
    CN: "SU",
    "2": "MO",
    "3": "TU",
    "4": "WE",
    "5": "TH",
    "6": "FR",
    "7": "SA",
  };
  return map[raw] || "";
}

function normalizeWeeklyStartTime(value?: unknown): string {
  const raw = String(value || "").trim();
  const matched = raw.match(/^(\d{1,2}):(\d{1,2})/);
  if (!matched) return "";

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeWeeklyPatternEntries(
  entries?: WeeklyPatternEntry[] | null,
): WeeklyPatternEntry[] {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      const dayOfWeeks = Array.isArray(entry?.dayOfWeeks)
        ? entry.dayOfWeeks
            .map((day) => normalizeWeeklyDayCode(day))
            .filter(Boolean)
        : [];
      const startTime = normalizeWeeklyStartTime(entry?.startTime);
      const durationMinutes = Math.max(0, Number(entry?.durationMinutes) || 0);

      return {
        dayOfWeeks,
        startTime,
        durationMinutes,
      };
    })
    .filter(
      (entry) =>
        entry.dayOfWeeks.length > 0 &&
        Boolean(entry.startTime) &&
        entry.durationMinutes > 0,
    );
}

function buildWeeklyPatternFromSlots(slots: unknown): WeeklyPatternEntry[] {
  if (!Array.isArray(slots) || slots.length === 0) return [];

  const grouped = new Map<string, WeeklyPatternEntry>();
  slots.forEach((slot: any) => {
    const day = normalizeWeeklyDayCode(slot?.dayOfWeek ?? slot?.dayCode);
    const startTime = normalizeWeeklyStartTime(slot?.startTime);
    const durationMinutes = Math.max(0, Number(slot?.durationMinutes) || 0);

    if (!day || !startTime || durationMinutes <= 0) return;

    const key = `${startTime}-${durationMinutes}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        dayOfWeeks: [day],
        startTime,
        durationMinutes,
      });
      return;
    }

    if (!existing.dayOfWeeks.includes(day)) {
      existing.dayOfWeeks.push(day);
    }
  });

  return Array.from(grouped.values()).filter(
    (entry) => entry.dayOfWeeks.length > 0,
  );
}

function buildWeeklyPatternFromRRule(
  value?: string | null,
): WeeklyPatternEntry[] {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const normalized = raw.replace(/^RRULE:/i, "");
  const tokens = normalized.split(";").map((item) => item.trim());
  const tokenMap = new Map<string, string>();

  tokens.forEach((token) => {
    const [key, val] = token.split("=");
    if (!key || !val) return;
    tokenMap.set(key.toUpperCase(), val);
  });

  const days = String(tokenMap.get("BYDAY") || "")
    .split(",")
    .map((day) => normalizeWeeklyDayCode(day))
    .filter(Boolean);
  const hour = Number(tokenMap.get("BYHOUR") || "");
  const minute = Number(tokenMap.get("BYMINUTE") || "");

  if (!days.length || Number.isNaN(hour) || Number.isNaN(minute)) return [];

  return [
    {
      dayOfWeeks: days,
      startTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      durationMinutes: 120,
    },
  ];
}

function buildWeeklyPatternFromClassOption(
  item?: ReassignClassOption | null,
): WeeklyPatternEntry[] {
  if (!item) return [];

  const fromWeeklyPattern = normalizeWeeklyPatternEntries(
    Array.isArray(item.effectiveWeeklyPattern)
      ? item.effectiveWeeklyPattern
      : Array.isArray(item.weeklyPattern)
        ? item.weeklyPattern
        : null,
  );
  if (fromWeeklyPattern.length > 0) return fromWeeklyPattern;

  const fromSlots = buildWeeklyPatternFromSlots(
    item.weeklyScheduleSlots || item.classWeeklyScheduleSlots,
  );
  if (fromSlots.length > 0) return fromSlots;

  return buildWeeklyPatternFromRRule(
    item.schedulePattern ||
      item.classSchedulePattern ||
      item.effectiveSchedulePattern,
  );
}

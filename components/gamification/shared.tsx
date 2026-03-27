"use client";

import type { ReactNode } from "react";
import type { MissionScope, MissionType, RedemptionStatus } from "@/types/gamification";
import type { StudentSummary } from "@/types/student/student";
import type { UserProfile } from "@/types/auth";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

export function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toIsoString(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function normalizeProblemMessage(error: unknown) {
  const fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.";

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const anyError = error as Record<string, any>;
  const responseData = anyError?.response?.data;

  return (
    responseData?.detail ||
    responseData?.message ||
    responseData?.title ||
    anyError?.message ||
    fallback
  );
}

export function mapMissionScopeLabel(scope: MissionScope) {
  switch (scope) {
    case "Class":
      return "Theo lớp";
    case "Group":
      return "Theo nhóm";
    default:
      return "Theo học sinh";
  }
}

export function mapMissionTypeLabel(type: MissionType) {
  switch (type) {
    case "HomeworkStreak":
      return "Chuỗi hoàn thành bài tập";
    case "ReadingStreak":
      return "Chuỗi đọc sách";
    case "NoUnexcusedAbsence":
      return "Không nghỉ học không phép";
    default:
      return "Tùy chỉnh";
  }
}

export function mapProgressStatusLabel(status: string) {
  switch (status) {
    case "Assigned":
      return "Đã giao";
    case "InProgress":
      return "Đang thực hiện";
    case "Completed":
      return "Hoàn thành";
    case "Expired":
      return "Hết hạn";
    default:
      return status;
  }
}

export function mapRedemptionStatusLabel(status: RedemptionStatus) {
  switch (status) {
    case "Requested":
      return "Đã yêu cầu";
    case "Approved":
      return "Đã duyệt";
    case "Delivered":
      return "Đã giao quà";
    case "Received":
      return "Đã nhận";
    case "Cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

export function getRedemptionStatusClasses(status: RedemptionStatus) {
  switch (status) {
    case "Requested":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Approved":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Delivered":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Received":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getMissionProgressClasses(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "InProgress":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Expired":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-200/50",
        className
      )}
    >
      {children}
    </section>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  hint,
  accent = "from-red-500 via-orange-500 to-amber-500",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
        </div>
        <div
          className={cx(
            "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            accent
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function DialogShell({
  open,
  title,
  description,
  onClose,
  children,
  widthClass = "max-w-3xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className={cx("w-full overflow-hidden rounded-3xl bg-white shadow-2xl", widthClass)}>
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              {description ? (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: Array<{ id: T; label: string }>;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cx(
            "rounded-2xl px-4 py-2 text-sm font-semibold transition",
            value === tab.id
              ? "bg-slate-900 text-white shadow-lg shadow-slate-300"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type StudentOption = {
  id: string;
  label: string;
  studentId?: string;
};

export function extractStudentOptions(payload: unknown): StudentOption[] {
  const response = payload as { data?: unknown } | undefined;
  const source = response?.data;

  const rows = Array.isArray(source)
    ? source
    : Array.isArray((source as Record<string, unknown> | undefined)?.items)
      ? ((source as Record<string, unknown>).items as unknown[])
      : [];

  const options: StudentOption[] = [];

  for (const row of rows) {
    const item = row as StudentSummary;
    const id = String(item.id ?? item.profileId ?? item.studentId ?? "").trim();
    if (!id) {
      continue;
    }

    options.push({
      id,
      label:
        item.displayName ||
        item.fullName ||
        item.name ||
        item.userName ||
        id,
      studentId: item.studentId,
    });
  }

  return options;
}

export function resolveActiveStudentProfile(
  userProfiles: UserProfile[] | undefined,
  selectedProfile: UserProfile | null | undefined,
  currentUserSelected: UserProfile | undefined
) {
  if (selectedProfile?.id) return selectedProfile;
  if (currentUserSelected?.id) return currentUserSelected;
  return userProfiles?.find((profile) => profile.profileType === "Student") ?? null;
}

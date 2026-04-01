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
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "Approved":
      return "bg-sky-500/20 text-sky-300 border-sky-500/30";
    case "Delivered":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "Received":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "Cancelled":
      return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
}

export function getMissionProgressClasses(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "InProgress":
      return "bg-sky-500/20 text-sky-300 border-sky-500/30";
    case "Expired":
      return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    default:
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }
}

export type SharedTheme = "learner" | "staff";

export function Panel({
  children,
  className,
  theme = "learner",
}: {
  children: ReactNode;
  className?: string;
  theme?: SharedTheme;
}) {
  return (
    <section
      className={cx(
        theme === "staff"
          ? "rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5 shadow-sm"
          : "rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-5 shadow-lg shadow-purple-500/10",
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
  accent = "from-purple-500 via-pink-500 to-rose-500",
  theme = "learner",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  theme?: SharedTheme;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border backdrop-blur-sm p-5 shadow-lg",
        theme === "staff"
          ? "border border-red-200 bg-gradient-to-br from-white to-red-50/30"
          : "border border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={cx(
              "text-sm font-medium",
              theme === "staff" ? "text-gray-600" : "text-purple-300/80"
            )}
          >
            {label}
          </p>
          <p
            className={cx(
              "mt-2 text-3xl font-black",
              theme === "staff" ? "text-gray-900" : "text-white"
            )}
          >
            {value}
          </p>
          {hint ? (
            <p
              className={cx(
                "mt-2 text-sm",
                theme === "staff" ? "text-gray-500" : "text-purple-300/60"
              )}
            >
              {hint}
            </p>
          ) : null}
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
  theme = "learner",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  theme?: SharedTheme;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2
          className={cx(
            "text-xl font-bold",
            theme === "staff" ? "text-gray-900" : "text-white"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cx(
              "mt-1 max-w-3xl text-sm",
              theme === "staff" ? "text-gray-500" : "text-purple-300/70"
            )}
          >
            {description}
          </p>
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
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm",
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
  theme = "learner",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  theme?: SharedTheme;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border backdrop-blur-sm px-6 py-10 text-center",
        theme === "staff"
          ? "border-red-200 bg-gradient-to-br from-white to-red-50/30"
          : "border-purple-500/30 bg-purple-900/20"
      )}
    >
      <div
        className={cx(
          "mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl shadow-lg",
          theme === "staff"
            ? "bg-red-100 text-red-600"
            : "bg-purple-500/20 text-purple-300"
        )}
      >
        {icon}
      </div>
      <h3
        className={cx(
          "text-lg font-semibold",
          theme === "staff" ? "text-gray-900" : "text-white"
        )}
      >
        {title}
      </h3>
      <p
        className={cx(
          "mx-auto mt-2 max-w-xl text-sm",
          theme === "staff" ? "text-gray-500" : "text-purple-300/70"
        )}
      >
        {description}
      </p>
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
  theme = "learner",
  headerIcon,
  footerAction,
  showFooter = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
  theme?: SharedTheme;
  headerIcon?: ReactNode;
  footerAction?: ReactNode;
  showFooter?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={cx(
          "relative w-full overflow-hidden rounded-2xl shadow-2xl border border-gray-200 bg-white",
          widthClass
        )}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                {headerIcon ? (
                  headerIcon
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {title}
                </h3>
                {description ? (
                  <p className="text-sm text-red-100">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        {/* Modal Footer */}
        {showFooter && (
          <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
            <div className="flex items-center justify-end gap-3">
              {footerAction ? (
                footerAction
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  theme = "learner",
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: Array<{ id: T; label: string }>;
  theme?: SharedTheme;
}) {
  return (
    <div
      className={cx(
        "mb-6 flex flex-wrap gap-2 rounded-3xl border backdrop-blur-sm p-2 shadow-lg",
        theme === "staff"
          ? "border-red-200 bg-gradient-to-br from-white to-red-50/30"
          : "border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80"
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cx(
            "rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
            value === tab.id
              ? theme === "staff"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm"
                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
              : theme === "staff"
                ? "text-gray-700 hover:bg-red-50"
                : "text-purple-300 hover:bg-purple-500/20 hover:text-white"
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
  classText?: string;
  helperText?: string;
  dropdownLabel?: string;
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
    const anyItem = row as Record<string, unknown>;
    const id = String(item.id ?? item.profileId ?? item.studentId ?? "").trim();
    if (!id) {
      continue;
    }

    const classText = item.className
      ? item.className
      : Array.isArray(item.classNames) && item.classNames.length
        ? item.classNames.filter(Boolean).join(", ")
        : Array.isArray(item.classes) && item.classes.length
          ? item.classes
              .map((classItem) =>
                classItem.code
                  ? `${classItem.code} - ${classItem.name ?? classItem.className ?? classItem.title ?? classItem.id ?? ""}`.trim()
                  : classItem.name ?? classItem.className ?? classItem.title ?? classItem.id
              )
              .filter(Boolean)
              .join(", ")
          : undefined;

    const branchText = String(anyItem.branchName ?? anyItem.branchTitle ?? "").trim() || undefined;
    const label =
      item.fullName ||
      item.name ||
      item.displayName ||
      item.userName ||
      item.email ||
      item.studentId ||
      id;

    const helperParts = [classText, branchText].filter(Boolean);
    const helperText = helperParts.length > 0 ? helperParts.join(" • ") : undefined;

    options.push({
      id,
      label,
      studentId: item.studentId,
      classText,
      helperText,
      dropdownLabel: helperText ? `${label} • ${helperText}` : label,
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

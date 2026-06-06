"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Download, ExternalLink, Loader2, X, User, Calendar, BookOpen, Clock, Tag, Users, GraduationCap, CalendarClock, FileText, CheckCircle, AlertCircle, Wallet, History, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  exportRegistrationEnrollmentConfirmationPdf,
  getRegistrationHistory,
} from "@/lib/api/registrationService";
import { getTicketBalance, getTicketLedger } from "@/lib/api/learningTicketService";
import type {
  Registration,
  RegistrationHistoryItem,
  RegistrationStatus,
} from "@/types/registration";
import type { LearningTicketBalance, LearningTicketLedgerItem } from "@/types/learning-ticket";

type RegistrationDetailModalProps = {
  isOpen: boolean;
  item: Registration | null;
  isLoading: boolean;
  onClose: () => void;
};

function statusLabel(status: RegistrationStatus) {
  const labels: Record<RegistrationStatus, string> = {
    New: "Mới",
    WaitingForClass: "Chờ xếp lớp",
    ClassAssigned: "Đã xếp lớp",
    Studying: "Đang học",
    Paused: "Tạm dừng",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return labels[status];
}

function historyStatusLabel(status?: string | null) {
  if (!status) return "";
  const normalized = String(status) as RegistrationStatus;
  const knownStatuses: RegistrationStatus[] = [
    "New",
    "WaitingForClass",
    "ClassAssigned",
    "Studying",
    "Paused",
    "Completed",
    "Cancelled",
  ];
  return knownStatuses.includes(normalized) ? statusLabel(normalized) : String(status);
}

function historyActionLabel(action?: string | null) {
  const normalized = String(action || "").trim();
  const labels: Record<string, string> = {
    Created: "Tạo đăng ký",
    Create: "Tạo đăng ký",
    CreateRegistration: "Tạo đăng ký",
    RegistrationCreated: "Tạo đăng ký",
    Updated: "Cập nhật đăng ký",
    Update: "Cập nhật đăng ký",
    UpdateRegistration: "Cập nhật đăng ký",
    RegistrationUpdated: "Cập nhật đăng ký",
    AssignedClass: "Xếp lớp",
    AssignClass: "Xếp lớp",
    AssignRegistrationClass: "Xếp lớp",
    ClassAssigned: "Xếp lớp",
    TransferClass: "Chuyển lớp",
    TransferRegistrationClass: "Chuyển lớp",
    TransferBranch: "Chuyển chi nhánh",
    TransferRegistrationBranch: "Chuyển chi nhánh",
    BranchTransferred: "Chuyển chi nhánh",
    Upgrade: "Nâng cấp gói học",
    UpgradeRegistration: "Nâng cấp gói học",
    RegistrationUpgraded: "Nâng cấp gói học",
    Pause: "Tạm dừng đăng ký",
    Paused: "Tạm dừng đăng ký",
    PauseRegistration: "Tạm dừng đăng ký",
    Reactivate: "Kích hoạt lại đăng ký",
    Reactivated: "Kích hoạt lại đăng ký",
    ReactivateRegistration: "Kích hoạt lại đăng ký",
    Complete: "Hoàn thành đăng ký",
    Completed: "Hoàn thành đăng ký",
    Cancelled: "Hủy đăng ký",
    Canceled: "Hủy đăng ký",
    Cancel: "Hủy đăng ký",
    CancelRegistration: "Hủy đăng ký",
  };
  if (labels[normalized]) return labels[normalized];

  const spaced = normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced || "Cập nhật đăng ký";
}

const HISTORY_FIELD_LABELS: Record<string, string> = {
  actorUserName: "Người thao tác",
  actorProfileName: "Tên hồ sơ thao tác",
  action: "Hành động",
  createdAt: "Thời gian tạo",
  timestamp: "Thời gian ghi nhận",
  updatedAt: "Thời gian cập nhật",
  role: "Vai trò",
  type: "Loại lịch sử",
  reference: "Tham chiếu",
  details: "Chi tiết",
  reason: "Lý do",
  Reason: "Lý do",
  effectiveDate: "Ngày hiệu lực",
  EffectiveDate: "Ngày hiệu lực",
  warningMessage: "Cảnh báo",
  WarningMessage: "Cảnh báo",
  operationType: "Loại chuyển đổi",
  OperationType: "Loại chuyển đổi",
  entryType: "Kiểu vào lớp",
  EntryType: "Kiểu vào lớp",
  note: "Ghi chú",
  Note: "Ghi chú",
  description: "Mô tả",
  Description: "Mô tả",
  status: "Trạng thái",
  Status: "Trạng thái",
  oldStatus: "Trạng thái cũ",
  OldStatus: "Trạng thái cũ",
  newStatus: "Trạng thái mới",
  NewStatus: "Trạng thái mới",
  classId: "Mã lớp",
  ClassId: "Mã lớp",
  oldClassName: "Lớp cũ",
  OldClassName: "Lớp cũ",
  className: "Lớp mới",
  ClassName: "Lớp mới",
  newClassName: "Lớp mới",
  NewClassName: "Lớp mới",
  oldBranchName: "Chi nhánh cũ",
  OldBranchName: "Chi nhánh cũ",
  PreviousBranchName: "Chi nhánh cũ",
  branchName: "Chi nhánh",
  BranchName: "Chi nhánh",
  newBranchName: "Chi nhánh mới",
  NewBranchName: "Chi nhánh mới",
  programName: "Chương trình",
  ProgramName: "Chương trình",
  tuitionPlanName: "Gói học",
  TuitionPlanName: "Gói học",
};

const HISTORY_HIDDEN_KEYS = new Set([
  "dataBefore",
  "dataAfter",
  "details",
  "registration",
  "Registration",
  "entityType",
  "type",
  "reference",
]);

const HISTORY_VALUE_FORMATTERS: Record<string, (value: string | null) => string> = {
  action: historyActionLabel,
  OperationType: historyActionLabel,
  operationType: historyActionLabel,
  status: historyStatusLabel,
  Status: historyStatusLabel,
  oldStatus: historyStatusLabel,
  OldStatus: historyStatusLabel,
  newStatus: historyStatusLabel,
  NewStatus: historyStatusLabel,
  createdAt: toDateTimeOrRaw,
  timestamp: toDateTimeOrRaw,
  updatedAt: toDateTimeOrRaw,
  EffectiveDate: toDateTimeOrRaw,
  effectiveDate: toDateTimeOrRaw,
};

function historyFieldLabel(key: string) {
  return (
    HISTORY_FIELD_LABELS[key] ||
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim()
  );
}

function formatHistoryRawValue(key: string, value?: string | null) {
  if (value === null || value === undefined || value === "") return "Không có";
  if (value === "ManagementStaff") return "Nhân viên quản lý";
  if (value === "Registration") return "Đăng ký";
  if (value === "Immediate") return "Vào học ngay";
  if (
    value ===
    "Class da bat dau. Hoc vien se tham gia theo tien do hien tai cua lop moi."
  ) {
    return "Lớp đã bắt đầu. Học viên sẽ tham gia theo tiến độ hiện tại của lớp mới.";
  }
  const formatter = HISTORY_VALUE_FORMATTERS[key];
  return formatter ? formatter(value) : value;
}

function shouldShowHistoryField(key: string, value?: string | null) {
  if (!value || value === "Không có") return false;
  if (HISTORY_HIDDEN_KEYS.has(key)) return false;
  return !key.toLowerCase().endsWith("id");
}

function parseHistoryJson(value?: string | null): Record<string, string> {
  if (!value) return {};
  try {
    const first = JSON.parse(value);
    const parsed = typeof first === "string" ? JSON.parse(first) : first;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, entryValue]) => [
          key,
          entryValue === null || entryValue === undefined
            ? "Không có"
            : typeof entryValue === "object"
              ? JSON.stringify(entryValue)
              : String(entryValue),
        ])
        .filter(([key, entryValue]) =>
          shouldShowHistoryField(String(key), String(entryValue)),
        ),
    );
  } catch {
    return {};
  }
}

function buildHistoryRows(source: Record<string, string>) {
  return Object.entries(source)
    .filter(([key, value]) => shouldShowHistoryField(key, value))
    .map(([key, value]) => ({
      key,
      label: historyFieldLabel(key),
      value: formatHistoryRawValue(key, value),
    }));
}

function pickHistoryValue(
  source: Record<string, string>,
  keys: string[],
  ...fallbacks: Array<string | null | undefined>
) {
  for (const value of fallbacks) {
    if (value && value !== "Không có") return value;
  }
  for (const key of keys) {
    const value = source[key];
    if (value && value !== "Không có") return value;
  }
  return "";
}

function HistoryFieldGrid({
  rows,
}: {
  rows: Array<{ key: string; label: string; value: string }>;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.key}
          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
        >
          <div className="text-xs font-semibold text-gray-500">
            {row.label}
          </div>
          <div className="mt-1 break-words text-sm font-medium text-gray-900">
            {row.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function statusBadgeClass(status: RegistrationStatus) {
  const classes: Record<RegistrationStatus, string> = {
    New: "bg-blue-100 text-blue-700 border border-blue-200",
    WaitingForClass: "bg-amber-100 text-amber-700 border border-amber-200",
    ClassAssigned: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    Studying: "bg-green-100 text-green-700 border border-green-200",
    Paused: "bg-orange-100 text-orange-700 border border-orange-200",
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Cancelled: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return classes[status];
}

function statusIcon(status: RegistrationStatus) {
  switch (status) {
    case "Studying":
    case "Completed":
      return <CheckCircle size={14} className="mr-1" />;
    case "Cancelled":
      return <AlertCircle size={14} className="mr-1" />;
    default:
      return <Clock size={14} className="mr-1" />;
  }
}

function ticketTransactionLabel(type?: string | null) {
  const normalized = String(type || "").trim();
  const labels: Record<string, string> = {
    Grant: "Cấp vé",
    Consume: "Trừ vé",
    Refund: "Hoàn vé",
    Void: "Huỷ vé",
    Adjustment: "Điều chỉnh",
  };
  return labels[normalized] || normalized || "Khác";
}

function ticketLedgerReasonLabel(reason?: string | null) {
  const raw = String(reason || "").trim();
  if (!raw) return "-";

  const purchaseMatch = raw.match(/^Purchase\s+(.+)$/i);
  if (purchaseMatch?.[1]) {
    return `Cấp vé từ gói học: ${purchaseMatch[1].trim()}`;
  }

  const normalized = raw.toLowerCase();
  const labels: Record<string, string> = {
    "void remaining tickets because registration was cancelled":
      "Hủy vé còn lại vì đăng ký đã bị hủy",
  };

  return labels[normalized] || raw;
}

function ticketTransactionBadgeClass(type?: string | null) {
  const normalized = String(type || "").trim();
  if (normalized === "Consume") return "bg-orange-100 text-orange-700 border border-orange-200";
  if (normalized === "Refund") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (normalized === "Void") return "bg-gray-100 text-gray-700 border border-gray-200";
  if (normalized === "Adjustment") return "bg-blue-100 text-blue-700 border border-blue-200";
  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}
function toDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function toDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

function toDateTimeOrRaw(value?: string | null) {
  const formatted = toDateTime(value);
  if (formatted !== "-") return formatted;
  const raw = String(value || "").trim();
  return raw || "-";
}

function toTrackLabel(track?: string | null) {
  const normalized = String(track || "").toLowerCase();
  if (normalized === "secondary") return "Chương trình song song";
  return "Chương trình chính";
}

function toStudyDayCodesLabel(codes?: string[]) {
  const map: Record<string, string> = {
    MO: "Thứ 2",
    TU: "Thứ 3",
    WE: "Thứ 4",
    TH: "Thứ 5",
    FR: "Thứ 6",
    SA: "Thứ 7",
    SU: "Chủ nhật",
  };
  if (!Array.isArray(codes) || codes.length === 0) return "";
  return codes
    .map((value) => map[String(value || "").toUpperCase()] || String(value))
    .filter(Boolean)
    .join(", ");
}

function toStudyDayCodeLabel(code?: string | null) {
  if (!code) return "";
  return toStudyDayCodesLabel([String(code)]);
}

function normalizeVietnameseScheduleText(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  return raw
    .replace(/\bthu\s*2\b/gi, "Thứ 2")
    .replace(/\bthu\s*3\b/gi, "Thứ 3")
    .replace(/\bthu\s*4\b/gi, "Thứ 4")
    .replace(/\bthu\s*5\b/gi, "Thứ 5")
    .replace(/\bthu\s*6\b/gi, "Thứ 6")
    .replace(/\bthu\s*7\b/gi, "Thứ 7")
    .replace(/\bchu\s*nhat\b/gi, "Chủ nhật")
    .replace(/\bhang\s*tuan\b/gi, "hàng tuần")
    .replace(/\bngay\s*hoc\b/gi, "Ngày học");
}

const DAY_CODE_TO_VN: Record<string, string> = {
  MO: "Thứ 2",
  TU: "Thứ 3",
  WE: "Thứ 4",
  TH: "Thứ 5",
  FR: "Thứ 6",
  SA: "Thứ 7",
  SU: "Chủ nhật",
};

function normalizeDayCode(value?: string | null): string {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  return DAY_CODE_TO_VN[raw] || raw;
}

function normalizeTime(value?: string | null): string {
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

function addMinutes(startTime: string, durationMinutes: number): string {
  const matched = startTime.match(/^(\d{2}):(\d{2})$/);
  if (!matched) return "";
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

  const total = hour * 60 + minute + Math.max(0, Number(durationMinutes) || 0);
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const endHour = Math.floor(wrapped / 60);
  const endMinute = wrapped % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

function getScheduleTimeRanges(schedule: any): string[] {
  const effectiveWeeklyPattern = Array.isArray(schedule?.effectiveWeeklyPattern)
    ? schedule.effectiveWeeklyPattern
    : [];

  const fromEffectivePattern = effectiveWeeklyPattern
    .flatMap((entry: any) => {
      const startTime = normalizeTime(entry?.startTime);
      const durationMinutes = Number(entry?.durationMinutes);
      const endTime = startTime
        ? addMinutes(
            startTime,
            Number.isFinite(durationMinutes) ? durationMinutes : 0,
          )
        : "";

      if (!startTime) return [];

      const days = Array.isArray(entry?.dayOfWeeks)
        ? entry.dayOfWeeks
            .map((day: string) => normalizeDayCode(day))
            .filter(Boolean)
        : [];

      if (days.length === 0) {
        return [endTime ? `${startTime}-${endTime}` : startTime];
      }

      const timePart = endTime ? `${startTime}-${endTime}` : startTime;
      return days.map((day: string) => `${day} ${timePart}`);
    })
    .filter(Boolean);

  if (fromEffectivePattern.length > 0) return fromEffectivePattern;

  const classSlots = Array.isArray(schedule?.classWeeklyScheduleSlots)
    ? schedule.classWeeklyScheduleSlots
    : [];

  return classSlots
    .map((slot: any) => {
      const day = normalizeDayCode(slot?.dayOfWeek || slot?.dayCode);
      const startTime = normalizeTime(slot?.startTime || slot?.startAt);
      const durationMinutes = Number(slot?.durationMinutes);
      const endTime = startTime
        ? addMinutes(
            startTime,
            Number.isFinite(durationMinutes) ? durationMinutes : 0,
          )
        : "";

      if (!day || !startTime) return "";
      return `${day} ${endTime ? `${startTime}-${endTime}` : startTime}`;
    })
    .filter(Boolean);
}

function extractPlacementTestId(note?: string | null): string {
  const raw = String(note || "");
  const matched = raw.match(/placementtest\s*[:=]\s*([0-9a-fA-F-]{32,36})/i);
  return matched?.[1] || "";
}

function InfoCard({
  icon,
  label,
  value,
  iconColor = "text-red-500",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        {icon && <div className={cn("shrink-0", iconColor)}>{icon}</div>}
        <div className="text-xs font-bold text-gray-500">{label}</div>
      </div>
      <div className="mt-1 break-all text-sm font-medium text-gray-900">
        {value || "-"}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  colorClass = "border-red-200 bg-red-50/40",
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <div className={cn("space-y-3 rounded-xl border p-4", colorClass)}>
      <div className="flex items-center gap-2">
        {icon && <div className="shrink-0">{icon}</div>}
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function RegistrationDetailModal({
  isOpen,
  item,
  isLoading,
  onClose,
}: RegistrationDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [ticketBalance, setTicketBalance] = useState<LearningTicketBalance | null>(null);
  const [ticketLedger, setTicketLedger] = useState<LearningTicketLedgerItem[]>([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [history, setHistory] = useState<RegistrationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const placementTestId = extractPlacementTestId(item?.note);

  const placementTestDetailPath = useMemo(() => {
    if (!placementTestId) return "";
    const segments = String(pathname || "")
      .split("/")
      .filter(Boolean);
    const hasLocalePrefix = segments.length >= 2 && segments[1] === "portal";
    const localePrefix = hasLocalePrefix ? `/${segments[0]}` : "";
    const isAdmin = String(pathname || "").includes("/portal/admin/");

    if (isAdmin) {
      return `${localePrefix}/portal/admin/placement-tests?placementTestId=${encodeURIComponent(placementTestId)}`;
    }

    return `${localePrefix}/portal/staff-management/leads?tab=placement_tests&placementTestId=${encodeURIComponent(
      placementTestId,
    )}`;
  }, [pathname, placementTestId]);

  const handleOpenPlacementTest = useCallback(() => {
    if (!placementTestId || !placementTestDetailPath) return;
    const separator = placementTestDetailPath.includes("?") ? "&" : "?";
    router.push(
      `${placementTestDetailPath}${separator}from=registration-detail&ts=${Date.now()}`,
    );
  }, [placementTestDetailPath, placementTestId, router]);

  const handleExportPdf = useCallback(async () => {
    if (!item?.id || isExportingPdf) return;

    try {
      setIsExportingPdf(true);
      const fileName = await exportRegistrationEnrollmentConfirmationPdf(
        item.id,
      );
      toast({
        title: "Thành công",
        description: `Đã xuất file PDF: ${fileName}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể xuất PDF xác nhận ghi danh.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, item?.id, toast]);

  useEffect(() => {
    let isActive = true;

    if (!isOpen || !item?.studentProfileId) {
      setTicketBalance(null);
      setTicketLedger([]);
      setTicketLoading(false);
      setTicketError(null);
      return () => {
        isActive = false;
      };
    }

    const loadTicketData = async () => {
      try {
        setTicketLoading(true);
        setTicketError(null);

        const [balance, ledger] = await Promise.all([
          getTicketBalance(item.studentProfileId),
          getTicketLedger(item.studentProfileId),
        ]);

        if (!isActive) return;
        setTicketBalance(balance ?? null);
        setTicketLedger(Array.isArray(ledger?.items) ? ledger.items : []);
      } catch (error: any) {
        if (!isActive) return;
        setTicketBalance(null);
        setTicketLedger([]);
        setTicketError(error?.message || "Không thể tải thông tin vé học.");
      } finally {
        if (isActive) {
          setTicketLoading(false);
        }
      }
    };

    loadTicketData();

    return () => {
      isActive = false;
    };
  }, [isOpen, item?.studentProfileId]);

  useEffect(() => {
    let isActive = true;

    if (!isOpen || !item?.id || activeTab !== "history") {
      return () => {
        isActive = false;
      };
    }

    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const nextHistory = await getRegistrationHistory(item.id, {
          pageNumber: 1,
          pageSize: 10,
        });
        if (isActive) {
          setHistory(nextHistory);
        }
      } catch (error) {
        console.error("Error fetching registration history:", error);
        if (isActive) {
          setHistory([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadHistory();

    return () => {
      isActive = false;
    };
  }, [activeTab, isOpen, item?.id]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("details");
      setHistory([]);
      setIsLoadingHistory(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (!item && !isLoading) return null;
  if (typeof window === "undefined") return null;

  const firstStudySession = item?.firstStudySession;
  const noteDisplay = String(item?.note || "")
    .replace(
      /\.?\s*Started\s+from\s+PlacementTest\s*[:=]\s*[0-9a-fA-F-]{32,36}\.?/gi,
      "",
    )
    .replace(/\s*\|\s*$/, "")
    .trim();

  return createPortal(
    <div
      className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Gradient đỏ như các modal khác */}
        <div className="sticky top-0 z-10 bg-linear-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Chi tiết đăng ký
                </h3>
                <p className="text-xs text-red-100">
                  Thông tin chi tiết về đăng ký học
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full  hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 flex-shrink-0">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={cn(
                "px-5 py-3 text-sm font-medium transition-all cursor-pointer",
                activeTab === "details"
                  ? "border-b-2 border-red-600 text-red-600 bg-white -mb-px rounded-t-lg"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} />
                Thông tin
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-5 py-3 text-sm font-medium transition-all cursor-pointer",
                activeTab === "history"
                  ? "border-b-2 border-red-600 text-red-600 bg-white -mb-px rounded-t-lg"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <div className="flex items-center gap-2">
                <History size={14} />
                Lịch sử
              </div>
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 text-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-600">
              <Loader2 size={20} className="animate-spin text-red-500" />
              <span>Đang tải chi tiết...</span>
            </div>
          ) : item ? activeTab === "details" ? (
            <div className="space-y-5">
              {/* Student Info Card */}
              <div className="rounded-xl border border-red-200 bg-linear-to-r from-red-50/50 to-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 shadow-md">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500">
                        Học viên
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {item.studentName || "Không có thông tin"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold",
                        statusBadgeClass(item.status),
                      )}
                    >
                      {statusIcon(item.status)}
                      {statusLabel(item.status)}
                    </span>
                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className="inline-flex items-center cursor-pointer gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isExportingPdf ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Xuất PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Program Information Section */}
              <Section
                title="Thông tin chương trình"
                icon={<GraduationCap size={16} className="text-blue-600" />}
                colorClass="border-blue-200 bg-blue-50/40"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard
                    icon={<BookOpen size={14} />}
                    label="Chương trình"
                    value={
                      item.secondaryProgramName
                        ? `${item.programName || "-"} • ${item.secondaryProgramName}`
                        : item.programName || "-"
                    }
                  />
                  <InfoCard
                    icon={<Layers size={14} />}
                    label="Trình độ"
                    value={
                      item.secondaryLevelName
                        ? `${item.levelName || "Chưa có"} • ${item.secondaryLevelName}`
                        : item.levelName || "Chưa có"
                    }
                  />
                  <InfoCard
                    icon={<Tag size={14} />}
                    label="Gói học"
                    value={item.tuitionPlanName || "-"}
                  />
                  <InfoCard
                    icon={<Users size={14} />}
                    label="Lớp"
                    value={
                      item.secondaryClassName
                        ? `${item.className || "Chưa xếp lớp"} • ${item.secondaryClassName}`
                        : item.className || "Chưa xếp lớp"
                    }
                  />
                  {(item.secondaryLevelId || item.secondaryProgramId) ? (
                    <InfoCard
                      icon={<BookOpen size={14} />}
                      label="Chú trọng kĩ năng"
                      value={item.secondaryLevelSkillFocus || item.secondaryProgramSkillFocus || "Chưa có"}
                    />
                  ) : null}
                  <InfoCard
                    icon={<Calendar size={14} />}
                    label="Tổng số buổi"
                    value={String(item.totalSessions ?? 0)}
                  />
                  <InfoCard
                    icon={<CheckCircle size={14} />}
                    label="Đã học"
                    value={String(item.usedSessions ?? 0)}
                  />
                  <InfoCard
                    icon={<Clock size={14} />}
                    label="Buổi còn lại"
                    value={String(item.remainingSessions ?? 0)}
                  />
                </div>
              </Section>

              {/* Schedule Information Section */}
              <Section
                title="Thông tin lịch học"
                icon={<CalendarClock size={16} className="text-emerald-600" />}
                colorClass="border-emerald-200 bg-emerald-50/40"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard
                    icon={<Calendar size={14} />}
                    label="Ngày dự kiến"
                    value={toDate(item.expectedStartDate)}
                  />
                  <InfoCard
                    icon={<Calendar size={14} />}
                    label="Ngày bắt đầu thực tế"
                    value={toDate(item.actualStartDate)}
                  />
                  <InfoCard
                    icon={<Clock size={14} />}
                    label="Lịch học mong muốn"
                    value={
                      normalizeVietnameseScheduleText(item.preferredSchedule) ||
                      "-"
                    }
                  />
                  <InfoCard
                    label="Buổi học đầu tiên"
                    value={
                      firstStudySession
                        ? [toDate(firstStudySession.studyDate)]
                            .filter((part) => part && part !== "-")
                            .join(" • ") || "-"
                        : "-"
                    }
                  />
                </div>

                {!!item.actualStudySchedules?.length && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Clock size={12} />
                      Lịch học thực tế theo tuần
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {item.actualStudySchedules.map((schedule, index) => {
                        const typedSchedule = schedule as any;
                        const studyDays =
                          normalizeVietnameseScheduleText(
                            schedule.studyDaysSummary,
                          ) ||
                          (Array.isArray(schedule.studyDayDisplayNames) &&
                          schedule.studyDayDisplayNames.length > 0
                            ? normalizeVietnameseScheduleText(
                                schedule.studyDayDisplayNames.join(", "),
                              )
                            : "") ||
                          (Array.isArray(schedule.studyDays) &&
                          schedule.studyDays.length > 0
                            ? normalizeVietnameseScheduleText(
                                schedule.studyDays.join(", "),
                              )
                            : toStudyDayCodesLabel(schedule.studyDayCodes) ||
                              "-");
                        const timeRanges = getScheduleTimeRanges(typedSchedule);
                        const timeRangesLabel =
                          timeRanges.length > 0
                            ? timeRanges.join(", ")
                            : "Chưa có dữ liệu";

                        return (
                          <div
                            key={`${schedule.track || "track"}-${schedule.classId || index}`}
                            className="rounded-xl border border-emerald-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-emerald-100">
                                {schedule.track === "secondary" ? (
                                  <BookOpen
                                    size={12}
                                    className="text-emerald-600"
                                  />
                                ) : (
                                  <GraduationCap
                                    size={12}
                                    className="text-emerald-600"
                                  />
                                )}
                              </div>
                              <div className="text-sm font-bold text-gray-900">
                                {toTrackLabel(schedule.track)}
                              </div>
                            </div>
                            <div className="mt-2 space-y-1.5 text-sm text-gray-700">
                              <div className="flex items-start gap-1">
                                <Users
                                  size={12}
                                  className="text-gray-400 mt-0.5 shrink-0"
                                />
                                <span>
                                  <span className="font-bold">Tên Lớp:</span>{" "}
                                  <span className="font-medium">
                                    {schedule.className || "Chưa xếp lớp"}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-start gap-1">
                                <Calendar
                                  size={12}
                                  className="text-gray-400 mt-0.5 shrink-0"
                                />
                                <span>
                                  <span className="font-bold">Ngày học:</span>{" "}
                                  <span className="font-medium">
                                    {studyDays} hàng tuần
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-start gap-1">
                                <Clock
                                  size={12}
                                  className="text-gray-400 mt-0.5 shrink-0"
                                />
                                <span>
                                  <span className="font-bold">Khung giờ:</span>{" "}
                                  <span className="font-medium">
                                    {timeRangesLabel}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Section>
               <Section
              title="Vé học"
              icon={<Wallet size={16} className="text-amber-600" />}
              colorClass="border-amber-200 bg-amber-50/40"
            >
              {ticketLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin text-amber-500" />
                  <span>Đang tải thông tin vé học...</span>
                </div>
              ) : ticketError ? (
                <div className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-amber-700">
                  {ticketError}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <InfoCard
                      icon={<Wallet size={14} />}
                      label="Vé còn lại"
                      value={String(ticketBalance?.available ?? item.remainingSessions ?? 0)}
                    />
                    <InfoCard
                      icon={<CheckCircle size={14} />}
                      label="Vé đã dùng"
                      value={String(ticketBalance?.consumed ?? item.usedSessions ?? 0)}
                    />
                    <InfoCard
                      icon={<Calendar size={14} />}
                      label="Tổng vé đã cấp"
                      value={String(ticketBalance?.totalGranted ?? item.totalSessions ?? 0)}
                    />
                  </div>

                  <div className="rounded-xl border border-white bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <History size={14} className="text-amber-600" />
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Lịch sử vé học
                      </div>
                    </div>

                    {ticketLedger.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">
                        Chưa có giao dịch vé học.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2">Loại</th>
                              <th className="px-3 py-2">Số lượng</th>
                              <th className="px-3 py-2">Nội dung</th>
                              <th className="px-3 py-2">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {ticketLedger.map((entry) => (
                              <tr key={entry.id} className="align-top">
                                <td className="px-3 py-2">
                                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", ticketTransactionBadgeClass(entry.transactionType))}>
                                    {ticketTransactionLabel(entry.transactionType)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-semibold text-gray-900">
                                  {entry.quantity}
                                </td>
                                <td className="px-3 py-2 text-gray-700">
                                  {ticketLedgerReasonLabel(entry.reason)}
                                </td>
                                <td className="px-3 py-2 text-gray-500">
                                  {toDateTimeOrRaw(entry.createdAt)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Section>

              {/* System Information Section */}
              <Section
                title="Thông tin hệ thống"
                icon={<FileText size={16} className="text-red-600" />}
                colorClass="border-red-200 bg-red-50/40"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InfoCard
                    icon={<Calendar size={14} />}
                    label="Ngày tạo"
                    value={toDateTime(item.createdAt)}
                  />
                  <InfoCard
                    icon={<Calendar size={14} />}
                    label="Cập nhật lần cuối"
                    value={toDateTime(item.updatedAt)}
                  />
                </div>

                <div className="rounded-xl bg-white p-3 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-red-500" />
                    <div className="text-xs font-bold text-gray-500">
                      Ghi chú
                    </div>
                  </div>
                  <div className="mt-1 break-all text-sm font-medium text-gray-900">
                    {noteDisplay || "-"}
                  </div>

                  {!!placementTestId && !!placementTestDetailPath && (
                    <button
                      type="button"
                      onClick={handleOpenPlacementTest}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors cursor-pointer"
                      title="Ấn vào để xem bài kiểm tra đầu vào của bé này"
                    >
                      <ExternalLink size={12} />
                      Xem bài kiểm tra đầu vào
                    </button>
                  )}
                </div>
              </Section>
            </div>
          ) : (
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center gap-2 py-12">
                  <Loader2 size={20} className="animate-spin text-red-500" />
                  <span className="text-sm text-gray-500">Đang tải lịch sử...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-r from-gray-100 to-gray-200">
                    <History size={24} className="text-gray-400" />
                  </div>
                  <div className="font-medium text-gray-600">Chưa có lịch sử đăng ký</div>
                  <div className="mt-1 text-sm text-gray-500">
                    Đăng ký này chưa có lịch sử thay đổi.
                  </div>
                </div>
              ) : (
                history.map((historyItem, index) => {
                  const actionText = historyActionLabel(
                    historyItem.title ||
                      historyItem.action ||
                      historyItem.eventType,
                  );
                  const parsedAfter = parseHistoryJson(historyItem.dataAfter);
                  const parsedDetails = parseHistoryJson(historyItem.details);
                  const changeData = {
                    ...parsedAfter,
                    ...parsedDetails,
                  };
                  const changedBy =
                    historyItem.actorUserName ||
                    historyItem.changedByName ||
                    historyItem.actorName ||
                    historyItem.user ||
                    "";
                  const changedAt =
                    historyItem.changedAt ||
                    historyItem.timestamp ||
                    historyItem.updatedAt ||
                    historyItem.createdAt;
                  const oldClassText = pickHistoryValue(
                    changeData,
                    [
                      "oldClassName",
                      "OldClassName",
                      "fromClassName",
                      "FromClassName",
                      "previousClassName",
                      "PreviousClassName",
                    ],
                    historyItem.oldClassName,
                  );
                  const newClassText = pickHistoryValue(
                    changeData,
                    [
                      "newClassName",
                      "NewClassName",
                      "className",
                      "ClassName",
                      "toClassName",
                      "ToClassName",
                    ],
                    historyItem.className,
                  );
                  const oldBranchText = pickHistoryValue(
                    changeData,
                    [
                      "oldBranchName",
                      "OldBranchName",
                      "fromBranchName",
                      "FromBranchName",
                      "previousBranchName",
                      "PreviousBranchName",
                    ],
                    historyItem.oldBranchName,
                  );
                  const newBranchText = pickHistoryValue(
                    changeData,
                    [
                      "newBranchName",
                      "NewBranchName",
                      "branchName",
                      "BranchName",
                      "toBranchName",
                      "ToBranchName",
                    ],
                    historyItem.newBranchName,
                    historyItem.branchName,
                  );
                  const contentText =
                    changeData.Reason ||
                    changeData.reason ||
                    historyItem.reason ||
                    historyItem.description ||
                    "";
                  const hiddenSummaryKeys = new Set([
                    "Reason",
                    "reason",
                    "OldClassName",
                    "oldClassName",
                    "FromClassName",
                    "fromClassName",
                    "PreviousClassName",
                    "previousClassName",
                    "NewClassName",
                    "newClassName",
                    "ClassName",
                    "className",
                    "ToClassName",
                    "toClassName",
                    "OldBranchName",
                    "oldBranchName",
                    "FromBranchName",
                    "fromBranchName",
                    "PreviousBranchName",
                    "previousBranchName",
                    "NewBranchName",
                    "newBranchName",
                    "BranchName",
                    "branchName",
                    "ToBranchName",
                    "toBranchName",
                    "OperationType",
                    "operationType",
                  ]);
                  const detailRows = buildHistoryRows(changeData).filter(
                    (row) => !hiddenSummaryKeys.has(row.key),
                  );

                  return (
                    <div
                      key={historyItem.id || index}
                      className="group rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-red-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 rounded-xl bg-red-50 p-2.5">
                          <History size={16} className="text-red-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className="text-base font-bold text-gray-900">
                              {actionText}
                            </h4>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-gray-400" />
                              <span>{toDateTimeOrRaw(changedAt)}</span>
                            </div>
                            {changedBy ? (
                              <div className="flex items-center gap-1.5">
                                <User size={12} className="text-gray-400" />
                                <span>Người cập nhật: {changedBy}</span>
                              </div>
                            ) : null}
                          </div>
                          {contentText ? (
                            <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                              {contentText}
                            </div>
                          ) : null}
                          {oldBranchText || newBranchText || oldClassText || newClassText ? (
                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                              {oldBranchText || newBranchText ? (
                                <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
                                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-700">
                                    <GraduationCap size={13} />
                                    Chuyển chi nhánh
                                  </div>
                                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                                    <div>
                                      <div className="text-xs text-gray-500">Từ</div>
                                      <div className="font-semibold text-gray-900">
                                        {oldBranchText || "Không có"}
                                      </div>
                                    </div>
                                    <div className="text-red-500">→</div>
                                    <div>
                                      <div className="text-xs text-gray-500">Sang</div>
                                      <div className="font-semibold text-gray-900">
                                        {newBranchText || "Không có"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              {oldClassText || newClassText ? (
                                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                                    <Users size={13} />
                                    Chuyển lớp
                                  </div>
                                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                                    <div>
                                      <div className="text-xs text-gray-500">Từ</div>
                                      <div className="font-semibold text-gray-900">
                                        {oldClassText || "Không có"}
                                      </div>
                                    </div>
                                    <div className="text-blue-500">→</div>
                                    <div>
                                      <div className="text-xs text-gray-500">Sang</div>
                                      <div className="font-semibold text-gray-900">
                                        {newClassText || "Không có"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                          {detailRows.length > 0 ? (
                            <div className="mt-4">
                              <HistoryFieldGrid rows={detailRows} />
                            </div>
                          ) : null}
                          
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

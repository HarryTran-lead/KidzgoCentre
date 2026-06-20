"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ArrowUpDown,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Loader2,
  MapPinned,
  Package,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  User,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import LeadPagination from "@/components/portal/leads/LeadPagination";
import RegistrationAssignModal from "@/components/portal/registrations/modals/RegistrationAssignModal";
import RegistrationBranchTransferModal from "@/components/portal/registrations/modals/RegistrationBranchTransferModal";
import RegistrationCompletionPdfModal from "@/components/portal/registrations/modals/RegistrationCompletionPdfModal";
import RegistrationDetailModal from "@/components/portal/registrations/modals/RegistrationDetailModal";
import RegistrationTransferModal from "@/components/portal/registrations/modals/RegistrationTransferModal";
import RegistrationUpgradeModal from "@/components/portal/registrations/modals/RegistrationUpgradeModal";
import { useToast } from "@/hooks/use-toast";
import {
  assignClassToRegistration,
  cancelRegistration,
  extractRegistrationIdFromAction,
  getRegistrationById,
  getRegistrations,
  suggestClassesForRegistration,
  transferRegistrationBranch,
  transferRegistrationClass,
  upgradeRegistration,
} from "@/lib/api/registrationService";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import { getAllClasses } from "@/lib/api/classService";
import { getTuitionPlans } from "@/lib/api/tuitionPlanService";
import {
  extractDomainErrorCode,
  getDomainErrorMessage,
} from "@/lib/api/domainErrorMessage";
import type { Branch } from "@/types/branch";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import type {
  EntryType,
  Registration,
  RegistrationStatus,
  RegistrationTrackType,
  SuggestedClassBucket,
  WeeklyPatternEntry,
} from "@/types/registration";
import RegistrationFilters from "./RegistrationFilters";

type Props = {
  branchId?: string;
  onTotalChange?: (total: number) => void;
};

type RegistrationSortKey =
  | "studentName"
  | "programName"
  | "tuitionPlanName"
  | "className"
  | "status"
  | "createdAt";

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

function statusClass(status: RegistrationStatus) {
  const classes: Record<RegistrationStatus, string> = {
    New: "border border-blue-200 bg-blue-50 text-blue-700",
    WaitingForClass: "border border-amber-200 bg-amber-50 text-amber-700",
    ClassAssigned: "border border-cyan-200 bg-cyan-50 text-cyan-700",
    Studying: "border border-green-200 bg-green-50 text-green-700",
    Paused: "border border-orange-200 bg-orange-50 text-orange-700",
    Completed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border border-red-200 bg-red-50 text-red-700",
  };
  return classes[status];
}

function toDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function formatSchedulePattern(value?: string | null) {
  if (!value) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";
  if (!raw.includes("RRULE")) return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;

  const normalized = raw.replace(/^RRULE:/i, "");
  const tokens = normalized.split(";").map((item) => item.trim());
  const map = new Map<string, string>();

  tokens.forEach((token) => {
    const [k, v] = token.split("=");
    if (!k || !v) return;
    map.set(k.toUpperCase(), v);
  });

  const dayMap: Record<string, string> = {
    MO: "T2",
    TU: "T3",
    WE: "T4",
    TH: "T5",
    FR: "T6",
    SA: "T7",
    SU: "CN",
  };

  const days = (map.get("BYDAY") || "")
    .split(",")
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean)
    .map((d) => dayMap[d] || d);
  const hour = map.get("BYHOUR");
  const minute = map.get("BYMINUTE") || "0";

  const pieces: string[] = [];
  if (days.length > 0) pieces.push(`Thứ: ${days.join(", ")}`);
  if (hour) pieces.push(`Lúc: ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);

  return pieces.length > 0 ? pieces.join(" • ") : raw;
}

function normalizeClassDay(value?: unknown): string {
  const raw = String(value || "").trim().toUpperCase();
  const map: Record<string, string> = {
    MO: "T2",
    MON: "T2",
    TU: "T3",
    TUE: "T3",
    WE: "T4",
    WED: "T4",
    TH: "T5",
    THU: "T5",
    FR: "T6",
    FRI: "T6",
    SA: "T7",
    SAT: "T7",
    SU: "CN",
    SUN: "CN",
    "2": "T2",
    "3": "T3",
    "4": "T4",
    "5": "T5",
    "6": "T6",
    "7": "T7",
    CN: "CN",
  };
  return map[raw] || raw;
}

function normalizeClassTime(value?: unknown): string {
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

function normalizeRRuleDay(value?: unknown): string {
  const raw = String(value || "").trim().toUpperCase();
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

function buildSessionPatternFromWeeklyPattern(
  weeklyPattern?: WeeklyPatternEntry[] | null,
): string {
  if (!Array.isArray(weeklyPattern) || weeklyPattern.length === 0) return "";

  const candidate = weeklyPattern
    .map((entry) => {
      const days = Array.isArray(entry?.dayOfWeeks)
        ? entry.dayOfWeeks
            .map((day) => normalizeRRuleDay(day))
            .filter(Boolean)
        : [];
      const startTime = normalizeClassTime(entry?.startTime);
      return {
        days,
        startTime,
      };
    })
    .filter((entry) => entry.days.length > 0 && Boolean(entry.startTime))
    .sort((a, b) => b.days.length - a.days.length)[0];

  if (!candidate) return "";
  const [hourRaw, minuteRaw] = candidate.startTime.split(":");
  return `FREQ=WEEKLY;BYDAY=${candidate.days.join(",")};BYHOUR=${Number(hourRaw)};BYMINUTE=${Number(minuteRaw)}`;
}

function buildSessionPatternFromSlots(slots: unknown): string {
  if (!Array.isArray(slots) || slots.length === 0) return "";

  const grouped = new Map<string, { startTime: string; days: string[] }>();
  slots.forEach((slot: any) => {
    const day = normalizeRRuleDay(slot?.dayOfWeek ?? slot?.dayCode);
    const startTime = normalizeClassTime(slot?.startTime);
    if (!day || !startTime) return;

    const key = startTime;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { startTime, days: [day] });
      return;
    }

    if (!existing.days.includes(day)) {
      existing.days.push(day);
    }
  });

  const candidate = Array.from(grouped.values())
    .filter((entry) => entry.days.length > 0)
    .sort((a, b) => b.days.length - a.days.length)[0];

  if (!candidate) return "";
  const [hourRaw, minuteRaw] = candidate.startTime.split(":");
  return `FREQ=WEEKLY;BYDAY=${candidate.days.join(",")};BYHOUR=${Number(hourRaw)};BYMINUTE=${Number(minuteRaw)}`;
}

function extractRRuleDayFromText(value: string): string {
  const raw = value.toUpperCase();
  if (/\bCN\b|CHU\s*NHAT|CHỦ\s*NHẬT/.test(raw)) return "SU";
  if (/\bT2\b|THU\s*2|THỨ\s*2/.test(raw)) return "MO";
  if (/\bT3\b|THU\s*3|THỨ\s*3/.test(raw)) return "TU";
  if (/\bT4\b|THU\s*4|THỨ\s*4/.test(raw)) return "WE";
  if (/\bT5\b|THU\s*5|THỨ\s*5/.test(raw)) return "TH";
  if (/\bT6\b|THU\s*6|THỨ\s*6/.test(raw)) return "FR";
  if (/\bT7\b|THU\s*7|THỨ\s*7/.test(raw)) return "SA";
  return "";
}

function buildSessionPatternFromScheduleText(value?: unknown): string {
  const text = String(value || "").trim();
  if (!text) return "";

  const chunks = text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const day = extractRRuleDayFromText(chunk);
      const timeMatch = chunk.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})?/);
      const startTime = normalizeClassTime(timeMatch?.[1]);
      return {
        day,
        startTime,
      };
    })
    .filter((item) => item.day && item.startTime);

  if (!chunks.length) return "";

  const grouped = new Map<string, string[]>();
  chunks.forEach((item) => {
    const existing = grouped.get(item.startTime);
    if (!existing) {
      grouped.set(item.startTime, [item.day]);
      return;
    }

    if (!existing.includes(item.day)) {
      existing.push(item.day);
    }
  });

  const [startTime, days] = Array.from(grouped.entries())
    .sort((a, b) => b[1].length - a[1].length)[0] || ["", [] as string[]];
  if (!startTime || !days.length) return "";

  const [hourRaw, minuteRaw] = startTime.split(":");
  return `FREQ=WEEKLY;BYDAY=${days.join(",")};BYHOUR=${Number(hourRaw)};BYMINUTE=${Number(minuteRaw)}`;
}

function buildWeeklyPatternFromScheduleText(value?: unknown): WeeklyPatternEntry[] {
  const text = String(value || "").trim();
  if (!text) return [];

  const chunks = text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const day = extractRRuleDayFromText(chunk);
      const timeMatch = chunk.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})?/);
      const startTime = normalizeClassTime(timeMatch?.[1]);
      return {
        day,
        startTime,
      };
    })
    .filter((item) => item.day && item.startTime);

  if (!chunks.length) return [];

  const grouped = new Map<string, string[]>();
  chunks.forEach((item) => {
    const existing = grouped.get(item.startTime);
    if (!existing) {
      grouped.set(item.startTime, [item.day]);
      return;
    }

    if (!existing.includes(item.day)) {
      existing.push(item.day);
    }
  });

  return Array.from(grouped.entries())
    .map(([startTime, dayOfWeeks]) => ({
      dayOfWeeks,
      startTime,
      durationMinutes: 90,
    }))
    .filter((entry) => entry.dayOfWeeks.length > 0 && Boolean(entry.startTime));
}

function buildWeeklyPatternFromSlots(slots: unknown): WeeklyPatternEntry[] {
  if (!Array.isArray(slots) || slots.length === 0) return [];

  const grouped = new Map<string, string[]>();
  slots.forEach((slot: any) => {
    const day = normalizeRRuleDay(slot?.dayOfWeek ?? slot?.dayCode);
    const startTime = normalizeClassTime(slot?.startTime);
    if (!day || !startTime) return;

    const existing = grouped.get(startTime);
    if (!existing) {
      grouped.set(startTime, [day]);
      return;
    }

    if (!existing.includes(day)) {
      existing.push(day);
    }
  });

  return Array.from(grouped.entries())
    .map(([startTime, dayOfWeeks]) => ({
      dayOfWeeks,
      startTime,
      durationMinutes: 90,
    }))
    .filter((entry) => entry.dayOfWeeks.length > 0 && Boolean(entry.startTime));
}

function buildWeeklyPatternFromRRule(value?: unknown): WeeklyPatternEntry[] {
  const normalized = normalizeRRulePattern(value);
  if (!normalized) return [];

  const parts = new Map<string, string>();
  normalized.split(";").forEach((token) => {
    const [key, val] = token.split("=");
    if (!key || !val) return;
    parts.set(key.toUpperCase(), val);
  });

  const dayOfWeeks = String(parts.get("BYDAY") || "")
    .split(",")
    .map((item) => normalizeRRuleDay(item))
    .filter(Boolean);
  const hour = Number(parts.get("BYHOUR") || "");
  const minute = Number(parts.get("BYMINUTE") || "");
  if (!dayOfWeeks.length || Number.isNaN(hour) || Number.isNaN(minute)) return [];

  const startTime = normalizeClassTime(
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  );
  if (!startTime) return [];

  return [
    {
      dayOfWeeks,
      startTime,
      durationMinutes: 90,
    },
  ];
}

function buildDefaultWeeklyPatternFromClass(cls: any): WeeklyPatternEntry[] {
  const weeklyPattern = Array.isArray(cls?.effectiveWeeklyPattern)
    ? cls.effectiveWeeklyPattern
    : Array.isArray(cls?.weeklyPattern)
      ? cls.weeklyPattern
      : null;

  if (Array.isArray(weeklyPattern) && weeklyPattern.length > 0) {
    const normalized = weeklyPattern
      .map((entry: any) => {
        const dayOfWeeks = Array.isArray(entry?.dayOfWeeks)
          ? entry.dayOfWeeks
              .map((day: unknown) => normalizeRRuleDay(day))
              .filter(Boolean)
          : [];
        const startTime = normalizeClassTime(entry?.startTime);
        const durationMinutes = Number(entry?.durationMinutes);
        return {
          dayOfWeeks,
          startTime,
          durationMinutes:
            Number.isFinite(durationMinutes) && durationMinutes > 0
              ? Math.floor(durationMinutes)
              : 90,
        } as WeeklyPatternEntry;
      })
      .filter((entry: WeeklyPatternEntry) => entry.dayOfWeeks.length > 0 && Boolean(entry.startTime));
    if (normalized.length > 0) return normalized;
  }

  const fromSlots = buildWeeklyPatternFromSlots(
    cls?.weeklyScheduleSlots || cls?.classWeeklyScheduleSlots,
  );
  if (fromSlots.length > 0) return fromSlots;

  const fromScheduleText = buildWeeklyPatternFromScheduleText(
    cls?.scheduleText || cls?.schedule || cls?.description,
  );
  if (fromScheduleText.length > 0) return fromScheduleText;

  return buildWeeklyPatternFromRRule(
    cls?.schedulePattern || cls?.classSchedulePattern || cls?.effectiveSchedulePattern,
  );
}

function normalizeRRulePattern(value?: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = raw.replace(/^RRULE:/i, "");
  if (!normalized.includes("BYDAY=") || !normalized.includes("BYHOUR=")) {
    return "";
  }
  if (normalized.includes("FREQ=")) return normalized;
  return `FREQ=WEEKLY;${normalized}`;
}

function buildDefaultSessionPatternFromClass(cls: any): string {
  const fromRRule = normalizeRRulePattern(
    cls?.schedulePattern || cls?.classSchedulePattern || cls?.effectiveSchedulePattern,
  );
  if (fromRRule) return fromRRule;

  const fromWeeklyPattern = buildSessionPatternFromWeeklyPattern(
    Array.isArray(cls?.effectiveWeeklyPattern)
      ? cls.effectiveWeeklyPattern
      : Array.isArray(cls?.weeklyPattern)
        ? cls.weeklyPattern
        : null,
  );
  if (fromWeeklyPattern) return fromWeeklyPattern;

  const fromScheduleText = buildSessionPatternFromScheduleText(
    cls?.scheduleText || cls?.schedule || cls?.description,
  );
  if (fromScheduleText) return fromScheduleText;

  return buildSessionPatternFromSlots(
    cls?.weeklyScheduleSlots || cls?.classWeeklyScheduleSlots,
  );
}

function formatScheduleFromWeeklySlots(slots: unknown): string {
  const list = Array.isArray(slots) ? slots : [];
  if (list.length === 0) return "";

  const chunks = list
    .map((slot: any) => {
      const day = normalizeClassDay(slot?.dayOfWeek ?? slot?.dayCode);
      const time = normalizeClassTime(slot?.startTime);
      if (!day || !time) return "";
      return `${day} ${time}`;
    })
    .filter(Boolean);

  return chunks.join(", ");
}

function getClassScheduleLabel(cls: any): string {
  const patternLabel = formatSchedulePattern(
    cls?.schedulePattern || cls?.classSchedulePattern || cls?.effectiveSchedulePattern,
  );
  if (patternLabel && patternLabel !== "-") return patternLabel;

  const textLabel = String(
    cls?.scheduleText || cls?.schedule || cls?.description || "",
  ).trim();
  if (textLabel) return textLabel;

  const slotLabel = formatScheduleFromWeeklySlots(cls?.weeklyScheduleSlots);
  if (slotLabel) return slotLabel;

  return "-";
}

function pickClassItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.page?.items)) return payload.data.page.items;
  if (Array.isArray(payload?.data?.classes?.items)) return payload.data.classes.items;
  if (Array.isArray(payload?.data?.classes)) return payload.data.classes;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function pickBranchItems(payload: unknown): Branch[] {
  const payloadRecord = toRecord(payload);
  const data = payloadRecord.data ?? payload;
  const dataRecord = toRecord(data);
  const items = Array.isArray(dataRecord.branches)
    ? dataRecord.branches
    : Array.isArray(dataRecord.items)
      ? dataRecord.items
      : Array.isArray(data)
        ? data
        : [];

  return items
    .map((item: unknown): Branch => {
      const record = toRecord(item);
      return {
        id: String(record.id ?? record.branchId ?? ""),
        code: String(record.code ?? record.branchCode ?? ""),
        name: String(record.name ?? record.branchName ?? ""),
        address: String(record.address ?? ""),
        contactPhone: String(record.contactPhone ?? ""),
        contactEmail: String(record.contactEmail ?? ""),
        description: typeof record.description === "string" ? record.description : undefined,
        isActive: typeof record.isActive === "boolean" ? record.isActive : true,
        createdAt: String(record.createdAt ?? ""),
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
        deletedAt: typeof record.deletedAt === "string" ? record.deletedAt : undefined,
        totalStudents: typeof record.totalStudents === "number" ? record.totalStudents : undefined,
        totalTeachers: typeof record.totalTeachers === "number" ? record.totalTeachers : undefined,
        totalClasses: typeof record.totalClasses === "number" ? record.totalClasses : undefined,
      };
    })
    .filter((item: Branch) => Boolean(item.id));
}

function getClassRemainingSlots(cls: any) {
  if (typeof cls?.remainingSlots === "number") return cls.remainingSlots;
  if (typeof cls?.capacity === "number" && typeof cls?.currentEnrollment === "number") {
    return cls.capacity - cls.currentEnrollment;
  }
  if (typeof cls?.capacity === "number" && typeof cls?.currentEnrollmentCount === "number") {
    return cls.capacity - cls.currentEnrollmentCount;
  }
  if (typeof cls?.maxStudents === "number" && typeof cls?.currentStudentCount === "number") {
    return cls.maxStudents - cls.currentStudentCount;
  }
  return null;
}

function getClassDisplayName(cls: any) {
  return String(cls?.className || cls?.title || cls?.name || cls?.code || cls?.id || "");
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function canOpenEnrollmentPdf(row: Registration) {
  const eligibleStatuses: RegistrationStatus[] = ["Studying", "Paused", "Completed"];
  return Boolean(row?.id && row?.classId && eligibleStatuses.includes(row.status));
}

function getStudentInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  return parts.map((p) => p.charAt(0).toUpperCase()).join("").slice(0, 2);
}

export default function StaffRegistrationOverview({
  branchId,
  onTotalChange,
}: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Registration[]>([]);
  const [summaryRows, setSummaryRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RegistrationStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Registration | null>(
    null,
  );
  const [isCompletionPdfOpen, setIsCompletionPdfOpen] = useState(false);
  const [completionPdfRegistration, setCompletionPdfRegistration] =
    useState<Registration | null>(null);
  const [sortKey, setSortKey] = useState<RegistrationSortKey | null>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selectedActionRegistration, setSelectedActionRegistration] =
    useState<Registration | null>(null);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTuitionPlanId, setUpgradeTuitionPlanId] = useState("");
  const [upgradeTuitionPlans, setUpgradeTuitionPlans] = useState<TuitionPlan[]>([]);
  const [isLoadingUpgradeOptions, setIsLoadingUpgradeOptions] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignViewMode, setAssignViewMode] = useState<"none" | "suggested" | "manual">("none");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedClasses, setSuggestedClasses] = useState<SuggestedClassBucket | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<RegistrationTrackType>("primary");
  const [assignEntryType, setAssignEntryType] = useState<EntryType>("immediate");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [manualClasses, setManualClasses] = useState<any[]>([]);
  const [manualPrimaryClassId, setManualPrimaryClassId] = useState("");
  const [manualSecondaryClassId, setManualSecondaryClassId] = useState("");
  const [manualPrimarySessionPattern, setManualPrimarySessionPattern] = useState("");
  const [manualSecondarySessionPattern, setManualSecondarySessionPattern] = useState("");
  const [isLoadingManualClasses, setIsLoadingManualClasses] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTrack, setTransferTrack] = useState<RegistrationTrackType>("primary");
  const [transferClassId, setTransferClassId] = useState("");
  const [transferEffectiveDate, setTransferEffectiveDate] = useState("");
  const [transferSessionPattern, setTransferSessionPattern] = useState("");
  const [transferWeeklyPattern, setTransferWeeklyPattern] = useState<WeeklyPatternEntry[]>([]);
  const [transferClasses, setTransferClasses] = useState<any[]>([]);
  const [isLoadingTransferClasses, setIsLoadingTransferClasses] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [branchTransferOpen, setBranchTransferOpen] = useState(false);
  const [branchTransferBranchId, setBranchTransferBranchId] = useState("");
  const [branchTransferClassId, setBranchTransferClassId] = useState("");
  const [branchTransferEffectiveDate, setBranchTransferEffectiveDate] = useState("");
  const [branchTransferReason, setBranchTransferReason] = useState("");
  const [branchTransferSessionPattern, setBranchTransferSessionPattern] = useState("");
  const [branchTransferWeeklyPattern, setBranchTransferWeeklyPattern] = useState<WeeklyPatternEntry[]>([]);
  const [branchTransferBranches, setBranchTransferBranches] = useState<Branch[]>([]);
  const [branchTransferClasses, setBranchTransferClasses] = useState<Record<string, unknown>[]>([]);
  const [isLoadingBranchTransferBranches, setIsLoadingBranchTransferBranches] = useState(false);
  const [isLoadingBranchTransferClasses, setIsLoadingBranchTransferClasses] = useState(false);
  const [isBranchTransferring, setIsBranchTransferring] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelTargetRegistration, setCancelTargetRegistration] = useState<Registration | null>(null);
  const [isCancellingRegistration, setIsCancellingRegistration] = useState(false);

  const filteredUpgradeTuitionPlans = useMemo(() => {
    const targetProgramId = selectedActionRegistration?.programId || "";
    const targetLevelId = selectedActionRegistration?.levelId || "";
    return upgradeTuitionPlans.filter((p) => {
      if (!p.isActive) return false;
      if (targetProgramId && p.programId !== targetProgramId) return false;
      if (targetLevelId && p.levelId !== targetLevelId) return false;
      return true;
    });
  }, [upgradeTuitionPlans, selectedActionRegistration?.programId, selectedActionRegistration?.levelId]);

  const hasSecondaryTrack = useMemo(
    () =>
      Boolean(
        selectedActionRegistration?.secondaryProgramId ||
          selectedActionRegistration?.secondaryLevelId ||
          suggestedClasses?.secondaryProgramId ||
          suggestedClasses?.secondaryLevelId,
      ),
    [
      selectedActionRegistration?.secondaryProgramId,
      selectedActionRegistration?.secondaryLevelId,
      suggestedClasses?.secondaryProgramId,
      suggestedClasses?.secondaryLevelId,
    ],
  );

  const activeSuggestedClasses =
    selectedTrack === "secondary" && hasSecondaryTrack
      ? (suggestedClasses?.secondarySuggestedClasses ?? [])
      : (suggestedClasses?.suggestedClasses ?? []);

  const activeAlternativeClasses =
    selectedTrack === "secondary" && hasSecondaryTrack
      ? (suggestedClasses?.secondaryAlternativeClasses ?? [])
      : (suggestedClasses?.alternativeClasses ?? []);

  useEffect(() => {
    if (hasSecondaryTrack || selectedTrack !== "secondary") return;
    setSelectedTrack("primary");
    setSelectedClassId("");
  }, [hasSecondaryTrack, selectedTrack]);

  const manualClassOptions = useMemo(
    () =>
      manualClasses.map((cls) => {
        const classId = String(cls?.id || "");
        const remainingSlots = getClassRemainingSlots(cls);
        const scheduleLabel = getClassScheduleLabel(cls);
        const className = getClassDisplayName(cls);
        const programId = String(cls?.programId || cls?.program?.id || "");
        const programName = String(
          cls?.programName || cls?.program?.name || "",
        );
        const levelName = String(cls?.levelName || cls?.courseLevel || cls?.level?.name || "");
        const moduleName = String(cls?.currentModuleName || cls?.startModuleName || "").trim();
        const moduleLabel = moduleName ? `Module: ${moduleName}` : "";
        const safeRemaining =
          typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : null;
        return {
          id: classId,
          programId,
          programName,
          levelId: String(cls?.levelId || cls?.level?.id || ""),
          levelName,
          remainingSlots: safeRemaining,
          disabled: safeRemaining !== null && safeRemaining <= 0,
          label: [
            className,
            levelName || "Chưa rõ trình độ",
            moduleLabel,
            `Còn chỗ: ${safeRemaining ?? "-"}`,
            `Lịch: ${scheduleLabel}`,
          ]
            .filter(Boolean)
            .join(" • "),
        };
      }),
    [manualClasses],
  );

  const transferClassOptions = useMemo(
    () =>
      transferClasses
        .map((cls) => {
          const startModule = toRecord(cls?.startModule);
          const id = String(cls?.id || "");
          const remainingSlots = getClassRemainingSlots(cls);
          const status = String(cls?.status || "").trim();
          const statusValue = status.toLowerCase();
          const safeRemaining =
            typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : null;

          const isCancelled = statusValue === "cancelled";
          const isFull = safeRemaining !== null && safeRemaining <= 0;

          let disabledReason = "";
          if (isCancelled) disabledReason = "Lớp đã hủy";
          else if (isFull) disabledReason = "Lớp đã hết chỗ";

          return {
            id,
            name: getClassDisplayName(cls),
            schedule: getClassScheduleLabel(cls),
            status,
            remainingSlots: safeRemaining,
            disabled: Boolean(disabledReason),
            disabledReason,
            defaultSessionPattern: buildDefaultSessionPatternFromClass(cls),
            defaultWeeklyPattern: buildDefaultWeeklyPatternFromClass(cls),
            programId: String(cls?.programId || cls?.program?.id || ""),
            programName: String(cls?.programName || cls?.program?.name || ""),
            levelId: String(cls?.levelId || cls?.level?.id || ""),
            levelName: String(cls?.levelName || cls?.courseLevel || cls?.level?.name || ""),
            startModuleId: String(cls?.startModuleId || startModule.id || ""),
            startModuleName: String(cls?.startModuleName || startModule.name || ""),
          };
        })
        .filter((item) => {
          if (!item.id) return false;

          const targetProgramId =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryProgramId || selectedActionRegistration?.programId || "")
              : String(selectedActionRegistration?.programId || "");
          const targetProgramName =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryProgramName || selectedActionRegistration?.programName || "")
              : String(selectedActionRegistration?.programName || "");
          const targetLevelId =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryLevelId || "")
              : String(selectedActionRegistration?.levelId || "");
          const targetLevelName =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryLevelName || "")
              : String(selectedActionRegistration?.levelName || "");

          const sameProgramById = targetProgramId
            ? item.programId === targetProgramId
            : true;
          const sameProgramByName = !targetProgramId && targetProgramName
            ? normalizeText(item.programName) === normalizeText(targetProgramName)
            : true;

          if (!sameProgramById || !sameProgramByName) return false;

          const sameLevelById = targetLevelId ? item.levelId === targetLevelId : true;
          const sameLevelByName = !targetLevelId && targetLevelName
            ? normalizeText(item.levelName) === normalizeText(targetLevelName)
            : true;

          if (!sameLevelById || !sameLevelByName) return false;

          const currentClassId =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryClassId || "")
              : String(selectedActionRegistration?.classId || "");
          if (currentClassId && item.id === currentClassId) return false;

          return String(item.status || "").toLowerCase() !== "cancelled";
        }),
    [
      transferClasses,
      transferTrack,
      selectedActionRegistration?.classId,
      selectedActionRegistration?.secondaryClassId,
      selectedActionRegistration?.programId,
      selectedActionRegistration?.programName,
      selectedActionRegistration?.levelId,
      selectedActionRegistration?.levelName,
      selectedActionRegistration?.secondaryProgramId,
      selectedActionRegistration?.secondaryProgramName,
      selectedActionRegistration?.secondaryLevelId,
      selectedActionRegistration?.secondaryLevelName,
    ],
  );

  const branchTransferBranchOptions = useMemo(() => {
    const currentBranchId = String(selectedActionRegistration?.branchId || branchId || "");
    return branchTransferBranches
      .map((item) => ({
        id: String(item.id || ""),
        name: item.name || item.code || "Chi nhánh",
        code: item.code || null,
        isActive: item.isActive,
      }))
      .filter((item) => item.id && item.id !== currentBranchId && item.isActive !== false);
  }, [branchTransferBranches, branchId, selectedActionRegistration?.branchId]);

  const branchTransferClassOptions = useMemo(
    () =>
      branchTransferClasses
        .map((cls) => {
          const program = toRecord(cls.program);
          const level = toRecord(cls.level);
          const startModule = toRecord(cls.startModule);
          const id = String(cls.id ?? "");
          const remainingSlots = getClassRemainingSlots(cls);
          const status = String(cls.status ?? "").trim();
          const statusValue = status.toLowerCase();
          const safeRemaining =
            typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : null;

          const isCancelled = statusValue === "cancelled";
          const isFull = safeRemaining !== null && safeRemaining <= 0;

          let disabledReason = "";
          if (isCancelled) disabledReason = "Lớp đã hủy";
          else if (isFull) disabledReason = "Lớp đã hết chỗ";

          return {
            id,
            name: getClassDisplayName(cls),
            schedule: getClassScheduleLabel(cls),
            status,
            remainingSlots: safeRemaining,
            disabled: Boolean(disabledReason),
            disabledReason,
            defaultSessionPattern: buildDefaultSessionPatternFromClass(cls),
            defaultWeeklyPattern: buildDefaultWeeklyPatternFromClass(cls),
            programId: String(cls.programId ?? program.id ?? ""),
            programName: String(cls.programName ?? program.name ?? ""),
            levelId: String(cls.levelId ?? level.id ?? ""),
            levelName: String(cls.levelName ?? cls.courseLevel ?? level.name ?? ""),
            startModuleId: String(cls.startModuleId ?? startModule.id ?? ""),
            startModuleName: String(cls.startModuleName ?? startModule.name ?? ""),
          };
        })
        .filter((item) => {
          if (!item.id) return false;

          const targetProgramId = String(selectedActionRegistration?.programId || "");
          const targetProgramName = String(selectedActionRegistration?.programName || "");
          const targetLevelId = String(selectedActionRegistration?.levelId || "");
          const targetLevelName = String(selectedActionRegistration?.levelName || "");

          const sameProgramById = targetProgramId
            ? item.programId === targetProgramId
            : true;
          const sameProgramByName = !targetProgramId && targetProgramName
            ? normalizeText(item.programName) === normalizeText(targetProgramName)
            : true;

          if (!sameProgramById || !sameProgramByName) return false;

          const sameLevelById = targetLevelId ? item.levelId === targetLevelId : true;
          const sameLevelByName = !targetLevelId && targetLevelName
            ? normalizeText(item.levelName) === normalizeText(targetLevelName)
            : true;

          if (!sameLevelById || !sameLevelByName) return false;

          const currentClassId = String(selectedActionRegistration?.classId || "");
          if (currentClassId && item.id === currentClassId) return false;

          return String(item.status || "").toLowerCase() !== "cancelled";
        }),
    [
      branchTransferClasses,
      selectedActionRegistration?.classId,
      selectedActionRegistration?.programId,
      selectedActionRegistration?.programName,
      selectedActionRegistration?.levelId,
      selectedActionRegistration?.levelName,
    ],
  );

  const registrationStatusCounts = useMemo(() => {
    const counts: Record<"ALL" | RegistrationStatus, number> = {
      ALL: summaryRows.length,
      New: summaryRows.filter((r) => r.status === "New").length,
      WaitingForClass: summaryRows.filter((r) => r.status === "WaitingForClass")
        .length,
      ClassAssigned: summaryRows.filter((r) => r.status === "ClassAssigned").length,
      Studying: summaryRows.filter((r) => r.status === "Studying").length,
      Completed: summaryRows.filter((r) => r.status === "Completed").length,
      Paused: summaryRows.filter((r) => r.status === "Paused").length,
      Cancelled: summaryRows.filter((r) => r.status === "Cancelled").length,
    };
    return counts;
  }, [summaryRows]);

  const fetchSummary = useCallback(async () => {
    if (!branchId) {
      setSummaryRows([]);
      onTotalChange?.(0);
      return;
    }

    try {
      const response = await getRegistrations({
        branchId,
        pageNumber: 1,
        pageSize: 1000,
      });
      const items = response.items || [];
      const nextTotal = Math.max(
        Number(response.totalCount || 0),
        items.length,
      );
      setSummaryRows(items);
      onTotalChange?.(nextTotal);
    } catch (error: any) {
      setSummaryRows([]);
      onTotalChange?.(0);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải thống kê đăng ký.",
        variant: "destructive",
      });
    }
  }, [branchId, onTotalChange, toast]);

  const fetchRows = useCallback(async () => {
    if (!branchId) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }

    try {
      setLoading(true);
      const response = await getRegistrations({
        branchId,
        status: status === "ALL" ? undefined : status,
        pageNumber: currentPage,
        pageSize,
      });
      setRows(response.items || []);
      const nextTotal = Math.max(
        Number(response.totalCount || 0),
        (response.items || []).length,
      );
      setTotalCount(nextTotal);
      setTotalPages(response.totalPages || 1);
      if (status === "ALL") {
        onTotalChange?.(nextTotal);
      }
    } catch (error: any) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách đăng ký.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, currentPage, pageSize, status, toast, onTotalChange]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, query]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const qMatched =
        !q ||
        [
          r.id,
          r.studentName || "",
          r.programName || "",
          r.tuitionPlanName || "",
          r.className || "",
          r.note || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return qMatched;
    });
  }, [rows, query, status]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    const copy = [...filteredRows];
    copy.sort((a, b) => {
      if (sortKey === "createdAt") {
        const av = new Date(a.createdAt || "").getTime();
        const bv = new Date(b.createdAt || "").getTime();
        const an = Number.isNaN(av) ? 0 : av;
        const bn = Number.isNaN(bv) ? 0 : bv;
        return sortDir === "asc" ? an - bn : bn - an;
      }

      const getValue = (row: Registration) => {
        switch (sortKey) {
          case "studentName":
            return row.studentName || "";
          case "programName":
            return row.programName || "";
          case "tuitionPlanName":
            return row.tuitionPlanName || "";
          case "className":
            return row.className || "";
          case "status":
            return statusLabel(row.status);
          default:
            return "";
        }
      };

      const av = getValue(a);
      const bv = getValue(b);
      const compared = av.localeCompare(bv, "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? compared : -compared;
    });

    return copy;
  }, [filteredRows, sortKey, sortDir]);

  const handleSort = (key: RegistrationSortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
      return;
    }

    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }

    setSortKey(null);
    setSortDir("asc");
  };

  const SortHeader = ({
    label,
    keyName,
    icon: Icon,
  }: {
    label: string;
    keyName: RegistrationSortKey;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
  }) => (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => handleSort(keyName)}
        className="inline-flex items-center gap-1.5 text-sm tracking-wide font-semibold text-gray-600 hover:text-red-700 cursor-pointer"
      >
        {Icon && <Icon size={14} className="text-red-600" />}
        {label}
        <ArrowUpDown
          size={12}
          className={sortKey === keyName ? "text-red-600" : "text-gray-400"}
        />
      </button>
    </th>
  );

  const statCards = useMemo(() => {
    const waiting = summaryRows.filter(
      (r) => r.status === "WaitingForClass",
    ).length;
    const studying = summaryRows.filter((r) => r.status === "Studying").length;
    const completed = summaryRows.filter(
      (r) => r.status === "Completed",
    ).length;
    return [
      {
        title: "Đăng ký mới",
        value: summaryRows.length,
        subtitle: "Tổng hồ sơ đăng ký",
        icon: Sparkles,
        color: "from-red-600 to-red-700",
      },
      {
        title: "Chờ xếp lớp",
        value: waiting,
        subtitle: "Đang chờ phân lớp",
        icon: Clock3,
        color: "from-blue-600 to-cyan-600",
      },
      {
        title: "Đang học",
        value: studying,
        subtitle: "Đang theo lớp",
        icon: BookOpen,
        color: "from-emerald-600 to-teal-600",
      },
      {
        title: "Hoàn thành",
        value: completed,
        subtitle: "Đã kết thúc chương trình",
        icon: CheckCircle2,
        color: "from-amber-600 to-orange-600",
      },
    ];
  }, [summaryRows]);

  const openDetail = async (id: string) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedDetail(null);
      const detail = await getRegistrationById(id);
      setSelectedDetail(detail);
    } catch (error: any) {
      setDetailOpen(false);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải chi tiết đăng ký.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openCompletionPdf = (row: Registration) => {
    setCompletionPdfRegistration(row);
    setIsCompletionPdfOpen(true);
  };

  const getErrorMessage = (error: any, fallback: string) => {
    const status = Number(error?.response?.status || error?.status || 0);
    const code = extractDomainErrorCode(error);

    if (status === 409 && (code === "Enrollment.StudentScheduleConflict" || code === "Registration.StudentScheduleConflict" || code === "StudentScheduleConflict")) {
      return "Học viên bị trùng lịch học ở thời gian đã chọn. Vui lòng chọn lớp/track hoặc mẫu buổi học khác.";
    }

    return getDomainErrorMessage(error, fallback);
  };

  const getErrorTitle = (error: any) => {
    const status = Number(error?.response?.status || error?.status || 0);
    const code = extractDomainErrorCode(error);

    if (code === "Enrollment.StudentScheduleConflict" || code === "Registration.StudentScheduleConflict" || code === "StudentScheduleConflict") {
      return "Trùng lịch học";
    }

    if (code === "Registration.ClassFull" || code === "ClassFull") {
      return "Lớp đã đủ sĩ số";
    }

    if (code === "Registration.ClassAlreadyAssigned" || code === "ClassAlreadyAssigned") {
      return "Đã xếp lớp";
    }

    if (status === 409) {
      return "Xung đột dữ liệu";
    }

    return "Lỗi";
  };

  const refreshRegistrationData = async () => {
    await Promise.all([fetchRows(), fetchSummary()]);
  };

  const openUpgradeModal = async (row: Registration) => {
    const targetBranchId = String(row.branchId || branchId || "");
    if (!targetBranchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được chi nhánh để tải danh sách gói học.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedActionRegistration(row);
      setUpgradeOpen(true);
      setUpgradeTuitionPlanId("");
      setIsLoadingUpgradeOptions(true);
      const plans = await getTuitionPlans({
        pageNumber: 1,
        pageSize: 500,
        branchId: targetBranchId,
      });
      setUpgradeTuitionPlans(plans || []);
    } catch (error: any) {
      setUpgradeOpen(false);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể tải danh sách gói học."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingUpgradeOptions(false);
    }
  };

  const handleUpgradeRegistration = async () => {
    if (!selectedActionRegistration?.id || !upgradeTuitionPlanId) return;

    try {
      setIsUpgrading(true);
      await upgradeRegistration(selectedActionRegistration.id, upgradeTuitionPlanId);
      toast({
        title: "Thành công",
        description: "Đã cập nhật gói học trên cùng đăng ký hiện tại.",
        variant: "success",
      });
      setUpgradeOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể cập nhật gói học cho đăng ký."),
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const openAssignModal = (row: Registration) => {
    setSelectedActionRegistration(row);
    setAssignOpen(true);
    setAssignViewMode("none");
    setSuggestedClasses(null);
    setSelectedTrack("primary");
    setAssignEntryType("immediate");
    setSelectedClassId("");
    setManualClasses([]);
    setManualPrimaryClassId("");
    setManualSecondaryClassId("");
    setManualPrimarySessionPattern("");
    setManualSecondarySessionPattern("");
  };

  const ensureSelectedActionRegistrationForAssignment = async () => {
    const current = selectedActionRegistration;
    if (!current?.id) return current;

    try {
      const detail = await getRegistrationById(current.id);
      const merged = { ...current, ...detail };
      setSelectedActionRegistration((prev) =>
        prev?.id === current.id ? { ...prev, ...detail } : prev,
      );
      return merged;
    } catch {
      return current;
    }
  };

  const handleSuggestClasses = async () => {
    const actionRegistration = await ensureSelectedActionRegistrationForAssignment();
    if (!actionRegistration?.id) return;

    try {
      setIsSuggesting(true);
      setAssignViewMode("suggested");
      const visibleSuggestions = await suggestClassesForRegistration(actionRegistration.id);
      setSuggestedClasses(visibleSuggestions);

      const primaryCount = visibleSuggestions?.suggestedClasses?.length ?? 0;
      const secondaryCount = visibleSuggestions?.secondarySuggestedClasses?.length ?? 0;
      const defaultTrack: RegistrationTrackType =
        primaryCount > 0 ? "primary" : secondaryCount > 0 ? "secondary" : "primary";
      const defaultClass =
        defaultTrack === "secondary"
          ? visibleSuggestions?.secondarySuggestedClasses?.[0]
          : visibleSuggestions?.suggestedClasses?.[0];

      setSelectedTrack(defaultTrack);
      setSelectedClassId(defaultClass?.id ? String(defaultClass.id) : "");

      toast({
        title: "Thành công",
        description:
          defaultClass?.id
            ? `Đã gợi ý ${visibleSuggestions.length || 0} lớp phù hợp cho đăng ký.`
            : "Hiện chưa có lớp gợi ý phù hợp.",
        variant: defaultClass?.id ? "success" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể lấy danh sách lớp gợi ý."),
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleLoadManualClasses = async () => {
    const actionRegistration = await ensureSelectedActionRegistrationForAssignment();
    const canUseSecondaryForAssignment = Boolean(
      actionRegistration?.secondaryProgramId || actionRegistration?.secondaryLevelId,
    );
    const targetBranchId = String(actionRegistration?.branchId || branchId || "");
    if (!targetBranchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được chi nhánh để tải lớp.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingManualClasses(true);
      setAssignViewMode("manual");

      const response = await getAllClasses({
        pageNumber: 1,
        pageSize: 1000,
        branchId: targetBranchId,
      });

      const allItems = pickClassItems(response)
        .filter((item) => item?.id)
        .filter((item) => {
          const statusValue = String(item?.status || "").toLowerCase();
          return statusValue !== "cancelled" && statusValue !== "completed";
        });
      const items = allItems;

      const countClassesByProgramAndLevel = (
        targetProgramId?: string | null,
        targetProgramName?: string | null,
        targetLevelId?: string | null,
        targetLevelName?: string | null,
      ) => {
        const normalizedTargetProgramId = String(targetProgramId || "").trim();
        const normalizedTargetProgramName = normalizeText(targetProgramName);
        const normalizedTargetLevelId = String(targetLevelId || "").trim();
        const normalizedTargetLevelName = normalizeText(targetLevelName);

        return items.filter((item) => {
          const itemProgramId = String(item?.programId || item?.program?.id || "").trim();
          const itemProgramName = normalizeText(
            String(item?.programName || item?.program?.name || ""),
          );
          const itemLevelId = String(item?.levelId || item?.level?.id || "").trim();
          const itemLevelName = normalizeText(
            String(item?.levelName || item?.courseLevel || item?.level?.name || ""),
          );

          const sameProgramById = normalizedTargetProgramId
            ? itemProgramId === normalizedTargetProgramId
            : true;
          const sameProgramByName =
            !normalizedTargetProgramId && normalizedTargetProgramName
              ? itemProgramName === normalizedTargetProgramName
              : true;
          const sameLevelById = normalizedTargetLevelId
            ? itemLevelId === normalizedTargetLevelId
            : true;
          const sameLevelByName =
            !normalizedTargetLevelId && normalizedTargetLevelName
              ? itemLevelName === normalizedTargetLevelName
              : true;

          return sameProgramById && sameProgramByName && sameLevelById && sameLevelByName;
        }).length;
      };

      const primaryFilteredCount = countClassesByProgramAndLevel(
        actionRegistration?.programId ?? undefined,
        actionRegistration?.programName ?? undefined,
        actionRegistration?.levelId ?? undefined,
        actionRegistration?.levelName ?? undefined,
      );
      const secondaryFilteredCount =
        hasSecondaryTrack && canUseSecondaryForAssignment
          ? countClassesByProgramAndLevel(
              (actionRegistration?.secondaryProgramId || actionRegistration?.programId) ?? undefined,
              (actionRegistration?.secondaryProgramName || actionRegistration?.programName) ?? undefined,
              actionRegistration?.secondaryLevelId ?? undefined,
              actionRegistration?.secondaryLevelName ?? undefined,
            )
          : 0;

      setManualClasses(items);

      if (items.length > 0) {
        const selectable = items.filter((item) => {
          const remaining = getClassRemainingSlots(item);
          return typeof remaining !== "number" || remaining > 0;
        });
        const fallback = items[0];
        const firstClass = selectable[0] || fallback;
        const secondClass = selectable[1] || selectable[0] || fallback;
        setManualPrimaryClassId(String(firstClass?.id || ""));
        setManualSecondaryClassId(
          hasSecondaryTrack && canUseSecondaryForAssignment
            ? String(secondClass?.id || firstClass?.id || "")
            : "",
        );
        toast({
          title: "Thành công",
          description:
            hasSecondaryTrack && canUseSecondaryForAssignment
              ? `Đã tải ${primaryFilteredCount} lớp cho chương trình chính và ${secondaryFilteredCount} lớp cho chương trình song song để xếp lớp thủ công.`
              : `Đã tải ${primaryFilteredCount} lớp để xếp lớp thủ công.`,
          variant: "success",
        });
      } else {
        setManualPrimaryClassId("");
        setManualSecondaryClassId("");
        toast({
          title: "Thông báo",
          description: "Không có lớp phù hợp trong chi nhánh hiện tại.",
          variant: "default",
        });
      }

      setManualPrimarySessionPattern("");
      setManualSecondarySessionPattern("");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể tải danh sách lớp thủ công."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingManualClasses(false);
    }
  };

  const handleAssignClass = async (
    sessionSelectionPattern?: string,
    entryType: EntryType = "immediate",
    firstStudyDate?: string,
    _weeklyPattern?: WeeklyPatternEntry[] | null,
  ) => {
    if (!selectedActionRegistration?.id || !selectedClassId) return;
    if (selectedTrack === "secondary" && !hasSecondaryTrack) {
      toast({
        title: "Không hợp lệ",
        description: "Gói học hiện tại không hỗ trợ xếp lớp song song.",
        variant: "destructive",
      });
      setSelectedTrack("primary");
      return;
    }

    try {
      setIsAssigning(true);
      const response = await assignClassToRegistration(selectedActionRegistration.id, {
        classId: selectedClassId,
        entryType,
        track: selectedTrack,
        firstStudyDate: firstStudyDate?.trim() || undefined,
        sessionSelectionPattern: sessionSelectionPattern || undefined,
      });

      const nextRegistrationId =
        extractRegistrationIdFromAction(response) || selectedActionRegistration.id;
      const isRetakeNewRegistration = nextRegistrationId !== selectedActionRegistration.id;

      if (isRetakeNewRegistration) {
        setSelectedActionRegistration((prev) =>
          prev ? { ...prev, id: nextRegistrationId } : prev,
        );
      }

      toast({
        title: "Thành công",
        description: isRetakeNewRegistration
          ? `Đã xếp lớp và tạo đăng ký mới (${nextRegistrationId}).`
          : "Đã xếp lớp cho đăng ký.",
        variant: "success",
      });
      setAssignOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error, "Không thể xếp lớp đã chọn."),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignSuggestedClasses = async (payload: {
    primaryClassId: string;
    primarySessionSelectionPattern?: string;
    primaryWeeklyPattern?: WeeklyPatternEntry[] | null;
    primaryFirstStudyDate?: string;
    secondaryClassId?: string;
    secondarySessionSelectionPattern?: string;
    secondaryWeeklyPattern?: WeeklyPatternEntry[] | null;
    secondaryFirstStudyDate?: string;
    entryType?: EntryType;
    firstStudyDate?: string;
  }) => {
    if (!selectedActionRegistration?.id || !payload.primaryClassId) return;

    try {
      setIsAssigning(true);
      const selectedEntryType = payload.entryType || "immediate";
      const normalizedFirstStudyDate = payload.firstStudyDate?.trim() || undefined;
      const normalizedPrimaryFirstStudyDate =
        payload.primaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      const normalizedSecondaryFirstStudyDate =
        payload.secondaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      let targetRegistrationId = selectedActionRegistration.id;

      const primaryResponse = await assignClassToRegistration(targetRegistrationId, {
        classId: payload.primaryClassId,
        entryType: selectedEntryType,
        track: "primary",
        firstStudyDate: normalizedPrimaryFirstStudyDate,
        sessionSelectionPattern:
          payload.primarySessionSelectionPattern || undefined,
      });

      targetRegistrationId = extractRegistrationIdFromAction(primaryResponse) || targetRegistrationId;

      if (hasSecondaryTrack && payload.secondaryClassId) {
        const secondaryResponse = await assignClassToRegistration(targetRegistrationId, {
          classId: payload.secondaryClassId,
          entryType: selectedEntryType,
          track: "secondary",
          firstStudyDate: normalizedSecondaryFirstStudyDate,
          sessionSelectionPattern:
            payload.secondarySessionSelectionPattern || undefined,
        });
        targetRegistrationId = extractRegistrationIdFromAction(secondaryResponse) || targetRegistrationId;
      }

      const isRetakeNewRegistration = targetRegistrationId !== selectedActionRegistration.id;
      if (isRetakeNewRegistration) {
        setSelectedActionRegistration((prev) =>
          prev ? { ...prev, id: targetRegistrationId } : prev,
        );
      }

      toast({
        title: "Thành công",
        description: isRetakeNewRegistration
          ? `Đã xếp lớp và tạo đăng ký mới (${targetRegistrationId}).`
          : hasSecondaryTrack && payload.secondaryClassId
            ? "Đã xếp lớp gợi ý cho cả chương trình chính và chương trình song song."
            : "Đã xếp lớp gợi ý cho đăng ký.",
        variant: "success",
      });
      setAssignOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error, "Không thể xếp lớp gợi ý."),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignManualClasses = async (
    entryType: EntryType = "immediate",
    firstStudyDate?: string,
    primaryWeeklyPattern?: WeeklyPatternEntry[] | null,
    secondaryWeeklyPattern?: WeeklyPatternEntry[] | null,
    primaryFirstStudyDate?: string,
    secondaryFirstStudyDate?: string,
  ) => {
    if (!selectedActionRegistration?.id || !manualPrimaryClassId) return;

    if (hasSecondaryTrack && !manualSecondaryClassId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn lớp cho chương trình song song.",
        variant: "destructive",
      });
      return;
    }

    if (hasSecondaryTrack && manualPrimaryClassId === manualSecondaryClassId) {
      toast({
        title: "Không hợp lệ",
        description: "Lớp cho chương trình chính và chương trình song song phải khác nhau.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAssigning(true);
      const normalizedFirstStudyDate = firstStudyDate?.trim() || undefined;
      const normalizedPrimaryFirstStudyDate =
        primaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      const normalizedSecondaryFirstStudyDate =
        secondaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      let targetRegistrationId = selectedActionRegistration.id;

      const primaryResponse = await assignClassToRegistration(targetRegistrationId, {
        classId: manualPrimaryClassId,
        entryType,
        track: "primary",
        firstStudyDate: normalizedPrimaryFirstStudyDate,
        sessionSelectionPattern: manualPrimarySessionPattern || undefined,
        weeklyPattern: primaryWeeklyPattern || undefined,
      });

      targetRegistrationId = extractRegistrationIdFromAction(primaryResponse) || targetRegistrationId;

      if (hasSecondaryTrack && manualSecondaryClassId) {
        const secondaryResponse = await assignClassToRegistration(targetRegistrationId, {
          classId: manualSecondaryClassId,
          entryType,
          track: "secondary",
          firstStudyDate: normalizedSecondaryFirstStudyDate,
          sessionSelectionPattern: manualSecondarySessionPattern || undefined,
          weeklyPattern: secondaryWeeklyPattern || undefined,
        });
        targetRegistrationId = extractRegistrationIdFromAction(secondaryResponse) || targetRegistrationId;
      }

      const isRetakeNewRegistration = targetRegistrationId !== selectedActionRegistration.id;
      if (isRetakeNewRegistration) {
        setSelectedActionRegistration((prev) =>
          prev ? { ...prev, id: targetRegistrationId } : prev,
        );
      }

      toast({
        title: "Thành công",
        description: isRetakeNewRegistration
          ? `Đã xếp lớp và tạo đăng ký mới (${targetRegistrationId}).`
          : "Đã xếp lớp thủ công cho đăng ký.",
        variant: "success",
      });
      setAssignOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error, "Không thể xếp lớp thủ công."),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleMoveToWaitingList = async () => {
    if (!selectedActionRegistration?.id) return;

    try {
      setIsWaiting(true);
      await assignClassToRegistration(selectedActionRegistration.id, {
        entryType: "wait",
        track: selectedTrack,
      });
      toast({
        title: "Thành công",
        description: "Đã chuyển đăng ký vào danh sách chờ xếp lớp.",
        variant: "success",
      });
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể chuyển vào danh sách chờ."),
        variant: "destructive",
      });
    } finally {
      setIsWaiting(false);
    }
  };

  const openTransferModal = async (row: Registration) => {
    const targetBranchId = String(row.branchId || branchId || "");
    if (!targetBranchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được chi nhánh để tải lớp chuyển.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedActionRegistration(row);
      setTransferOpen(true);
      setTransferTrack(row.classId ? "primary" : "secondary");
      setTransferClassId("");
      setTransferEffectiveDate("");
      setTransferSessionPattern("");
      setTransferWeeklyPattern([]);
      setTransferClasses([]);
      setIsLoadingTransferClasses(true);

      const response = await getAllClasses({
        pageNumber: 1,
        pageSize: 1000,
        branchId: targetBranchId,
      });
      const items = pickClassItems(response).filter((item) => item?.id);

      setTransferClasses(items);
    } catch (error: any) {
      setTransferOpen(false);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể tải danh sách lớp để chuyển."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransferClasses(false);
    }
  };

  const handleTransferClass = async () => {
    if (!selectedActionRegistration?.id || !transferClassId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn lớp mới để chuyển.",
        variant: "destructive",
      });
      return;
    }

    if (!Array.isArray(transferWeeklyPattern) || transferWeeklyPattern.length === 0) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn ít nhất một buổi học trong lịch lớp.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTransferring(true);
      await transferRegistrationClass(
        selectedActionRegistration.id,
        transferClassId,
        transferEffectiveDate || undefined,
        {
          track: transferTrack,
          sessionSelectionPattern: transferSessionPattern || undefined,
          weeklyPattern: transferWeeklyPattern,
        },
      );

      toast({
        title: "Thành công",
        description: "Đã chuyển lớp cho đăng ký.",
        variant: "success",
      });
      setTransferOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error, "Không thể chuyển lớp."),
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const openBranchTransferModal = async (row: Registration) => {
    if (!row?.id || !row.classId) return;

    try {
      setSelectedActionRegistration(row);
      setBranchTransferOpen(true);
      setBranchTransferBranchId("");
      setBranchTransferClassId("");
      setBranchTransferEffectiveDate("");
      setBranchTransferReason("");
      setBranchTransferSessionPattern("");
      setBranchTransferWeeklyPattern([]);
      setBranchTransferClasses([]);
      setIsLoadingBranchTransferBranches(true);

      const response = await getAllBranchesPublic({
        page: 1,
        limit: 500,
        isActive: true,
      });
      setBranchTransferBranches(pickBranchItems(response));
    } catch (error) {
      setBranchTransferOpen(false);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể tải danh sách chi nhánh."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingBranchTransferBranches(false);
    }
  };

  const handleBranchTransfer = async () => {
    if (!selectedActionRegistration?.id || !branchTransferBranchId || !branchTransferClassId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn chi nhánh và lớp mới để chuyển.",
        variant: "destructive",
      });
      return;
    }

    if (!branchTransferEffectiveDate) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn ngày hiệu lực chuyển chi nhánh.",
        variant: "destructive",
      });
      return;
    }

    if (!branchTransferReason.trim()) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng nhập lý do chuyển chi nhánh.",
        variant: "destructive",
      });
      return;
    }

    if (!Array.isArray(branchTransferWeeklyPattern) || branchTransferWeeklyPattern.length === 0) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn ít nhất một buổi học trong lịch lớp.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBranchTransferring(true);
      await transferRegistrationBranch(selectedActionRegistration.id, {
        newBranchId: branchTransferBranchId,
        newClassId: branchTransferClassId,
        effectiveDate: branchTransferEffectiveDate,
        reason: branchTransferReason.trim(),
        weeklyPattern: branchTransferWeeklyPattern,
      });

      toast({
        title: "Thành công",
        description: "Đã chuyển chi nhánh cho đăng ký.",
        variant: "success",
      });
      setBranchTransferOpen(false);
      await refreshRegistrationData();
    } catch (error) {
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error, "Không thể chuyển chi nhánh."),
        variant: "destructive",
      });
    } finally {
      setIsBranchTransferring(false);
    }
  };

  const handleCancelRegistration = async (row: Registration) => {
    if (!row?.id) return;

    setCancelTargetRegistration(row);
    setCancelConfirmOpen(true);
  };

  const confirmCancelRegistration = async () => {
    if (!cancelTargetRegistration?.id) return;

    try {
      setIsCancellingRegistration(true);
      await cancelRegistration(cancelTargetRegistration.id);
      toast({
        title: "Thành công",
        description: "Đã hủy đăng ký thành công.",
        variant: "success",
      });
      setCancelConfirmOpen(false);
      setCancelTargetRegistration(null);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: getErrorTitle(error),
        description: getErrorMessage(error, "Không thể hủy đăng ký."),
        variant: "destructive",
      });
    } finally {
      setIsCancellingRegistration(false);
    }
  };

  useEffect(() => {
    if (!transferOpen) return;
    setTransferClassId("");
  }, [transferTrack, transferOpen]);

  useEffect(() => {
    if (!branchTransferOpen) return;
    setBranchTransferClassId("");
    setBranchTransferSessionPattern("");
    setBranchTransferWeeklyPattern([]);

    if (!branchTransferBranchId) {
      setBranchTransferClasses([]);
      return;
    }

    let isActive = true;
    setIsLoadingBranchTransferClasses(true);
    getAllClasses({
      pageNumber: 1,
      pageSize: 1000,
      branchId: branchTransferBranchId,
      programId: selectedActionRegistration?.programId || undefined,
      levelId: selectedActionRegistration?.levelId || undefined,
    })
      .then((response) => {
        if (!isActive) return;
        const items = pickClassItems(response)
          .map((item) => toRecord(item))
          .filter((item) => item.id);
        setBranchTransferClasses(items);
      })
      .catch((error) => {
        if (!isActive) return;
        setBranchTransferClasses([]);
        toast({
          title: "Lỗi",
          description: getErrorMessage(error, "Không thể tải danh sách lớp của chi nhánh."),
          variant: "destructive",
        });
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingBranchTransferClasses(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    branchTransferOpen,
    branchTransferBranchId,
    selectedActionRegistration?.programId,
    selectedActionRegistration?.levelId,
    toast,
  ]);

  return (
    <div className="space-y-4">
      {!branchId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chưa xác định được chi nhánh của staff. Không thể tải dữ liệu đăng ký.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102"
            >
              <div className={`absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700`} />
              <div className="relative flex items-center gap-3">
                <div
                  className={`rounded-xl bg-gradient-to-br ${item.color} p-2 text-white shadow-sm flex-shrink-0`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-600">
                    {item.title}
                  </div>
                  <div className="leading-tight text-2xl font-bold text-gray-900">
                    {item.value}
                  </div>
                  <div className="truncate text-[11px] text-gray-500">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <RegistrationFilters
        searchQuery={query}
        selectedStatus={status}
        // pageSize={pageSize}
        statusCounts={registrationStatusCounts}
        onSearchChange={setQuery}
        onStatusChange={setStatus}
        // onPageSizeChange={(size) => {
        //   setPageSize(size);
        //   setCurrentPage(1);
        // }}
      />

      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text font-semibold text-gray-900">
              Danh sách Đăng ký
            </h3>
            <button
              type="button"
              onClick={() => {
                fetchRows();
                fetchSummary();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-220">
            <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200 text-left text-xs  tracking-wide text-gray-600">
              <tr>
                <SortHeader label="Học viên" keyName="studentName"  />
                <SortHeader label="Chương trình" keyName="programName"  />
                <SortHeader label="Gói học" keyName="tuitionPlanName"  />
                <SortHeader label="Lớp" keyName="className" />
                <SortHeader label="Trạng thái" keyName="status"  />
                <SortHeader label="Ngày tạo" keyName="createdAt"  />
                <th className="text-center px-4 py-3">
                  <div className="inline-flex items-center gap-1.5 text-sm tracking-wide font-semibold text-gray-600">
                    Thao tác
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-600"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Đang tải
                      danh sách đăng ký...
                    </span>
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Không có đăng ký nào phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-red-100 text-sm text-gray-800 hover:bg-red-50/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-sm justify-center h-8 w-8 rounded-xl bg-red-600 text-white  font-semibold flex-shrink-0">
                          {getStudentInitials(row.studentName)}
                        </div>
                        <span className="font-medium text-gray-900">
                          {row.studentName || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={14} className="text-red-600 flex-shrink-0" />
                        {row.secondaryProgramName
                          ? `${row.programName || "-"} • ${row.secondaryProgramName}`
                          : row.programName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Package size={14} className="text-red-600 flex-shrink-0" />
                        {row.tuitionPlanName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-red-600 flex-shrink-0" />
                        {row.secondaryClassName
                          ? `${row.className || "Chưa xếp lớp"} • ${row.secondaryClassName}`
                          : row.className || "Chưa xếp lớp"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-red-600 flex-shrink-0" />
                        {toDate(row.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(row.id)}
                          title="Xem chi tiết"
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openCompletionPdf(row)}
                          title="Xem/In phiếu đăng ký"
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          hidden={!canOpenEnrollmentPdf(row)}
                          aria-hidden={!canOpenEnrollmentPdf(row)}
                        >
                          <FileText size={14} />
                        </button>
                        {(!row.classId || row.status === "WaitingForClass" || row.status === "New") && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(row)}
                            title="Gợi ý và xếp lớp"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <Users size={14} />
                          </button>
                        )}
                        {row.status !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => openUpgradeModal(row)}
                            title="Cập nhật gói học"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <Rocket size={14} />
                          </button>
                        )}

                        {(row.classId || row.secondaryClassId) && row.status !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => openTransferModal(row)}
                            title="Chuyển lớp"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                        )}

                        {row.classId && row.status === "Studying" && (
                          <button
                            type="button"
                            onClick={() => openBranchTransferModal(row)}
                            title="Chuyển chi nhánh"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <MapPinned size={14} />
                          </button>
                        )}

                        {row.status !== "Cancelled" && row.status !== "Completed" && (
                          <button
                            type="button"
                            onClick={() => handleCancelRegistration(row)}
                            title="Hủy đăng ký"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <LeadPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemLabel="đăng ký"
          />
        )}
      </div>

      <RegistrationDetailModal
        isOpen={detailOpen}
        item={selectedDetail}
        isLoading={detailLoading}
        onClose={() => {
          setDetailOpen(false);
          setSelectedDetail(null);
        }}
      />

      <RegistrationCompletionPdfModal
        isOpen={isCompletionPdfOpen}
        registrationId={String(completionPdfRegistration?.id || "")}
        studentName={completionPdfRegistration?.studentName || ""}
        onClose={() => {
          setIsCompletionPdfOpen(false);
          setCompletionPdfRegistration(null);
        }}
      />

      <RegistrationUpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        isLoadingOptions={isLoadingUpgradeOptions}
        upgradeTuitionPlanId={upgradeTuitionPlanId}
        setUpgradeTuitionPlanId={setUpgradeTuitionPlanId}
        filteredTuitionPlans={filteredUpgradeTuitionPlans}
        selectedRegistration={selectedActionRegistration}
        handleUpgrade={handleUpgradeRegistration}
        isUpgrading={isUpgrading}
      />

      <RegistrationAssignModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        selectedRegistration={selectedActionRegistration}
        branchId={branchId}
        isSuggesting={isSuggesting}
        assignViewMode={assignViewMode}
        handleSuggestClasses={handleSuggestClasses}
        handleLoadManualClasses={handleLoadManualClasses}
        isLoadingManualClasses={isLoadingManualClasses}
        handleMoveToWaitingList={handleMoveToWaitingList}
        isWaiting={isWaiting}
        suggestedClasses={suggestedClasses}
        hasSecondaryTrack={hasSecondaryTrack}
        showEntryTypeSelector={false}
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
        selectedEntryType={assignEntryType}
        setSelectedEntryType={setAssignEntryType}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        activeSuggestedClasses={activeSuggestedClasses}
        activeAlternativeClasses={activeAlternativeClasses}
        formatSchedulePattern={formatSchedulePattern}
        handleAssignClass={handleAssignClass}
        handleAssignSuggestedClasses={handleAssignSuggestedClasses}
        isAssigning={isAssigning}
        manualClasses={manualClasses}
        manualClassOptions={manualClassOptions}
        manualPrimaryClassId={manualPrimaryClassId}
        setManualPrimaryClassId={setManualPrimaryClassId}
        manualSecondaryClassId={manualSecondaryClassId}
        setManualSecondaryClassId={setManualSecondaryClassId}
        manualPrimarySessionPattern={manualPrimarySessionPattern}
        setManualPrimarySessionPattern={setManualPrimarySessionPattern}
        manualSecondarySessionPattern={manualSecondarySessionPattern}
        setManualSecondarySessionPattern={setManualSecondarySessionPattern}
        manualPrimaryProgramId={selectedActionRegistration?.programId || ""}
        manualPrimaryProgramName={selectedActionRegistration?.programName || ""}
        manualPrimaryLevelId={selectedActionRegistration?.levelId || ""}
        manualPrimaryLevelName={selectedActionRegistration?.levelName || ""}
        manualSecondaryProgramId={
          selectedActionRegistration?.secondaryProgramId ||
          selectedActionRegistration?.programId ||
          ""
        }
        manualSecondaryProgramName={selectedActionRegistration?.secondaryProgramName || ""}
        manualSecondaryLevelId={selectedActionRegistration?.secondaryLevelId || ""}
        manualSecondaryLevelName={selectedActionRegistration?.secondaryLevelName || ""}
        handleAssignManualClasses={handleAssignManualClasses}
      />

      <RegistrationTransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        selectedRegistration={selectedActionRegistration}
        transferTrack={transferTrack}
        setTransferTrack={setTransferTrack}
        transferClassId={transferClassId}
        setTransferClassId={setTransferClassId}
        transferEffectiveDate={transferEffectiveDate}
        setTransferEffectiveDate={setTransferEffectiveDate}
        transferSessionPattern={transferSessionPattern}
        setTransferSessionPattern={setTransferSessionPattern}
        transferWeeklyPattern={transferWeeklyPattern}
        setTransferWeeklyPattern={setTransferWeeklyPattern}
        transferClassOptions={transferClassOptions}
        isLoadingTransferClasses={isLoadingTransferClasses}
        isTransferring={isTransferring}
        onConfirmTransfer={handleTransferClass}
      />

      <RegistrationBranchTransferModal
        isOpen={branchTransferOpen}
        onClose={() => setBranchTransferOpen(false)}
        selectedRegistration={selectedActionRegistration}
        transferBranchId={branchTransferBranchId}
        setTransferBranchId={setBranchTransferBranchId}
        transferClassId={branchTransferClassId}
        setTransferClassId={setBranchTransferClassId}
        transferEffectiveDate={branchTransferEffectiveDate}
        setTransferEffectiveDate={setBranchTransferEffectiveDate}
        transferReason={branchTransferReason}
        setTransferReason={setBranchTransferReason}
        transferSessionPattern={branchTransferSessionPattern}
        setTransferSessionPattern={setBranchTransferSessionPattern}
        transferWeeklyPattern={branchTransferWeeklyPattern}
        setTransferWeeklyPattern={setBranchTransferWeeklyPattern}
        branchOptions={branchTransferBranchOptions}
        classOptions={branchTransferClassOptions}
        isLoadingBranches={isLoadingBranchTransferBranches}
        isLoadingClasses={isLoadingBranchTransferClasses}
        isTransferring={isBranchTransferring}
        onConfirmTransfer={handleBranchTransfer}
      />

      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onClose={() => {
          if (isCancellingRegistration) return;
          setCancelConfirmOpen(false);
          setCancelTargetRegistration(null);
        }}
        onConfirm={confirmCancelRegistration}
        title="Xác nhận hủy đăng ký"
        message={`Bạn có chắc chắn muốn hủy đăng ký của học viên ${cancelTargetRegistration?.studentName || "này"}? Hành động này không thể hoàn tác.`}
        confirmText="Hủy đăng ký"
        cancelText="Đóng"
        variant="danger"
        isLoading={isCancellingRegistration}
      />
    </div>
  );
}

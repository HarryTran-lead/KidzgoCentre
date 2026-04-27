import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, School } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type {
  EntryType,
  RegistrationTrackType,
  SuggestedClassBucket,
  WeeklyPatternEntry,
} from "@/types/registration";

const WEEK_DAYS = [
  { value: "2", shortLabel: "T2", label: "Thứ 2", rrule: "MO" },
  { value: "3", shortLabel: "T3", label: "Thứ 3", rrule: "TU" },
  { value: "4", shortLabel: "T4", label: "Thứ 4", rrule: "WE" },
  { value: "5", shortLabel: "T5", label: "Thứ 5", rrule: "TH" },
  { value: "6", shortLabel: "T6", label: "Thứ 6", rrule: "FR" },
  { value: "7", shortLabel: "T7", label: "Thứ 7", rrule: "SA" },
  { value: "CN", shortLabel: "CN", label: "Chủ nhật", rrule: "SU" },
] as const;

const RRULE_TO_DAY: Record<string, string> = {
  MO: "2",
  TU: "3",
  WE: "4",
  TH: "5",
  FR: "6",
  SA: "7",
  SU: "CN",
};

const SLOT_DAY_TO_DAY_VALUE: Record<string, string> = {
  MO: "2",
  MON: "2",
  TU: "3",
  TUE: "3",
  WE: "4",
  WED: "4",
  TH: "5",
  THU: "5",
  FR: "6",
  FRI: "6",
  SA: "7",
  SAT: "7",
  SU: "CN",
  SUN: "CN",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  CN: "CN",
};

function normalizeSlotDayToDayValue(value?: unknown): string | null {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return null;
  return SLOT_DAY_TO_DAY_VALUE[raw] || null;
}

function normalizeTimeHHmm(value?: unknown): string {
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

type DaySlot = {
  dayValue: string;
  startTime: string;
  durationMinutes: number;
};

type ClassScheduleMeta = {
  availableDays: string[];
  defaultTime: string;
  duration: string;
  daySlots: DaySlot[];
};

const DAY_ORDER = ["2", "3", "4", "5", "6", "7", "CN"];
const MIN_BETWEEN_TRACKS_MINUTES = 15;

function sortDays(days: string[]): string[] {
  return [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
}

function hhmmToMinutes(value?: string): number | null {
  const raw = String(value || "").trim();
  const matched = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!matched) return null;

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
    return null;
  }

  return hour * 60 + minute;
}

function hasTrackScheduleConflict(
  first: ClassScheduleMeta,
  second: ClassScheduleMeta,
  minGapMinutes = MIN_BETWEEN_TRACKS_MINUTES,
): boolean {
  if (!first.daySlots.length || !second.daySlots.length) return false;

  const firstByDay = new Map<string, DaySlot[]>();
  first.daySlots.forEach((slot) => {
    const current = firstByDay.get(slot.dayValue) || [];
    current.push(slot);
    firstByDay.set(slot.dayValue, current);
  });

  const secondByDay = new Map<string, DaySlot[]>();
  second.daySlots.forEach((slot) => {
    const current = secondByDay.get(slot.dayValue) || [];
    current.push(slot);
    secondByDay.set(slot.dayValue, current);
  });

  for (const [dayValue, firstSlots] of firstByDay.entries()) {
    const secondSlots = secondByDay.get(dayValue);
    if (!secondSlots || secondSlots.length === 0) continue;

    for (const firstSlot of firstSlots) {
      const firstStart = hhmmToMinutes(firstSlot.startTime);
      if (firstStart === null) continue;
      const firstEnd = firstStart + Math.max(1, Number(firstSlot.durationMinutes) || 90);

      for (const secondSlot of secondSlots) {
        const secondStart = hhmmToMinutes(secondSlot.startTime);
        if (secondStart === null) continue;
        const secondEnd = secondStart + Math.max(1, Number(secondSlot.durationMinutes) || 90);

        if (firstEnd <= secondStart) {
          if (secondStart - firstEnd < minGapMinutes) return true;
          continue;
        }

        if (secondEnd <= firstStart) {
          if (firstStart - secondEnd < minGapMinutes) return true;
          continue;
        }

        return true;
      }
    }
  }

  return false;
}

function parseMetaFromWeeklyScheduleSlots(slots: unknown): ClassScheduleMeta {
  const list = Array.isArray(slots) ? slots : [];
  if (list.length === 0) {
    return { availableDays: [], defaultTime: "", duration: "", daySlots: [] };
  }

  const normalizedSlots = list
    .map((slot: any) => ({
      dayValue: normalizeSlotDayToDayValue(slot?.dayOfWeek ?? slot?.dayCode),
      startTime: normalizeTimeHHmm(slot?.startTime),
      durationMinutes: Math.max(1, Number(slot?.durationMinutes ?? 90) || 90),
    }))
    .filter((slot) => Boolean(slot.dayValue && slot.startTime));

  const slotByDay = new Map<string, DaySlot>();
  normalizedSlots.forEach((slot) => {
    const dayValue = String(slot.dayValue);
    if (!slotByDay.has(dayValue)) {
      slotByDay.set(dayValue, {
        dayValue,
        startTime: slot.startTime,
        durationMinutes: slot.durationMinutes,
      });
      return;
    }
    const prev = slotByDay.get(dayValue)!;
    if (slot.startTime < prev.startTime) {
      slotByDay.set(dayValue, {
        dayValue,
        startTime: slot.startTime,
        durationMinutes: slot.durationMinutes,
      });
    }
  });

  const availableDays = sortDays(Array.from(slotByDay.keys()));
  const daySlots = availableDays
    .map((day) => slotByDay.get(day))
    .filter(Boolean) as DaySlot[];
  const defaultSlot = daySlots[0];

  return {
    availableDays,
    defaultTime: defaultSlot?.startTime || "",
    duration: defaultSlot ? String(defaultSlot.durationMinutes) : "",
    daySlots,
  };
}

function parseClassScheduleMeta(
  pattern?: string | null,
  weeklyScheduleSlots?: unknown,
): ClassScheduleMeta {
  const raw = String(pattern || "").trim();
  if (!raw) {
    return parseMetaFromWeeklyScheduleSlots(weeklyScheduleSlots);
  }

  const normalized = raw.replace(/^RRULE:/i, "");
  const tokens = normalized.split(";").map((item) => item.trim());
  const map = new Map<string, string>();

  tokens.forEach((token) => {
    const [k, v] = token.split("=");
    if (!k || !v) return;
    map.set(k.toUpperCase(), v);
  });

  const availableDays = (map.get("BYDAY") || "")
    .split(",")
    .map(
      (value) =>
        RRULE_TO_DAY[
          String(value || "")
            .trim()
            .toUpperCase()
        ],
    )
    .filter(Boolean)
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

  const hourRaw = map.get("BYHOUR");
  const minuteRaw = map.get("BYMINUTE") || "0";
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const defaultTime =
    Number.isFinite(hour) && Number.isFinite(minute)
      ? `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      : "";
  const duration = String(map.get("DURATION") || "").trim();

  if (availableDays.length === 0) {
    return parseMetaFromWeeklyScheduleSlots(weeklyScheduleSlots);
  }

  const durationMinutes = Math.max(1, Number(duration || 90) || 90);
  const daySlots = availableDays.map((dayValue) => ({
    dayValue,
    startTime: defaultTime,
    durationMinutes,
  }));

  return { availableDays, defaultTime, duration, daySlots };
}

function formatScheduleFromWeeklySlots(slots: unknown): string {
  const list = Array.isArray(slots) ? slots : [];
  if (list.length === 0) return "";

  const dayLabelByValue = WEEK_DAYS.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.shortLabel;
    return acc;
  }, {});

  return list
    .map((slot: any) => {
      const dayValue = normalizeSlotDayToDayValue(slot?.dayOfWeek ?? slot?.dayCode);
      const time = normalizeTimeHHmm(slot?.startTime);
      if (!dayValue || !time) return "";
      return `${dayLabelByValue[dayValue] || dayValue} ${time}`;
    })
    .filter(Boolean)
    .join(", ");
}

function buildSessionSelectionPattern(
  days: string[],
  startTime: string,
  duration?: string,
): string {
  if (!startTime || days.length === 0) return "";

  const dayOrder = ["2", "3", "4", "5", "6", "7", "CN"];
  const byDay = [...new Set(days)]
    .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
    .map((dayValue) => WEEK_DAYS.find((day) => day.value === dayValue)?.rrule)
    .filter(Boolean)
    .join(",");

  if (!byDay) return "";

  const [hourRaw, minuteRaw] = String(startTime).split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

  const durationToken = duration ? `;DURATION=${duration}` : "";
  return `FREQ=WEEKLY;BYDAY=${byDay};BYHOUR=${hour};BYMINUTE=${minute}${durationToken}`;
}

function getRRuleByDayValue(dayValue: string): string | null {
  return WEEK_DAYS.find((day) => day.value === dayValue)?.rrule || null;
}

function getSlotByDay(meta: ClassScheduleMeta, dayValue: string): DaySlot | null {
  return meta.daySlots.find((slot) => slot.dayValue === dayValue) || null;
}

function buildWeeklyPatternFromSelection(
  selectedDays: string[],
  meta: ClassScheduleMeta,
): WeeklyPatternEntry[] | null {
  const days = sortDays([...new Set(selectedDays)]);
  if (days.length === 0) return null;

  const grouped = new Map<string, WeeklyPatternEntry>();

  days.forEach((dayValue) => {
    const slot = getSlotByDay(meta, dayValue);
    if (!slot) return;
    const rruleDay = getRRuleByDayValue(dayValue);
    if (!rruleDay) return;

    const key = `${slot.startTime}|${slot.durationMinutes}`;
    const existing = grouped.get(key);
    if (existing) {
      if (!existing.dayOfWeeks.includes(rruleDay)) {
        existing.dayOfWeeks.push(rruleDay);
      }
      return;
    }

    grouped.set(key, {
      dayOfWeeks: [rruleDay],
      startTime: slot.startTime,
      durationMinutes: slot.durationMinutes,
    });
  });

  const result = Array.from(grouped.values()).map((entry) => ({
    ...entry,
    dayOfWeeks: sortDays(
      entry.dayOfWeeks
        .map((rr) => RRULE_TO_DAY[rr])
        .filter(Boolean),
    )
      .map((dayValue) => getRRuleByDayValue(dayValue))
      .filter(Boolean) as string[],
  }));

  return result.length > 0 ? result : null;
}

function buildSessionPatternFromSelection(
  selectedDays: string[],
  meta: ClassScheduleMeta,
): string {
  const weeklyPattern = buildWeeklyPatternFromSelection(selectedDays, meta);
  if (!weeklyPattern || weeklyPattern.length === 0) return "";
  if (weeklyPattern.length > 1) return "";

  const [entry] = weeklyPattern;
  if (!entry || entry.dayOfWeeks.length === 0) return "";

  const dayValues = entry.dayOfWeeks
    .map((rr) => RRULE_TO_DAY[rr])
    .filter(Boolean);

  return buildSessionSelectionPattern(
    dayValues,
    entry.startTime,
    String(entry.durationMinutes),
  );
}

function parsePreferredScheduleDays(schedule?: string | null): string[] {
  const raw = String(schedule || "").toUpperCase();
  if (!raw) return [];

  const result = new Set<string>();
  if (raw.includes("CN")) result.add("CN");

  const thuMatches = raw.matchAll(/(?:THỨ\s*|T)([2-7])/g);
  for (const match of thuMatches) {
    if (match[1]) result.add(match[1]);
  }

  const order = ["2", "3", "4", "5", "6", "7", "CN"];
  return Array.from(result).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function toTrackLabel(track?: RegistrationTrackType | string | null): string {
  return String(track || "").toLowerCase() === "secondary"
    ? "chương trình song song"
    : "chương trình chính";
}

function toEntryTypeLabel(entryType: EntryType): string {
  const normalized = String(entryType || "").trim().toLowerCase();
  if (normalized === "wait") return "Chờ xếp lớp";
  if (normalized === "retake" || normalized === "makeup") return "Học lại";
  return "Vào học ngay";
}

const DAY_FULL_NAMES: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

const DAY_VALUE_TO_JS: Record<string, number> = {
  "2": 1,
  "3": 2,
  "4": 3,
  "5": 4,
  "6": 5,
  "7": 6,
  CN: 0,
};

function generateUpcomingSessionDates(
  scheduleMetaOrPattern?:
    | ClassScheduleMeta
    | string
    | null,
  maxOptions = 12,
): Array<{ value: string; label: string }> {
  const meta =
    typeof scheduleMetaOrPattern === "string" ||
    scheduleMetaOrPattern == null
      ? parseClassScheduleMeta(scheduleMetaOrPattern)
      : scheduleMetaOrPattern;
  if (!meta.availableDays.length) return [];

  const jsDays = meta.availableDays
    .map((d) => DAY_VALUE_TO_JS[d])
    .filter((d) => d !== undefined) as number[];

  if (!jsDays.length) return [];

  const result: Array<{ value: string; label: string }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 84 && result.length < maxOptions; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);

    if (jsDays.includes(day.getDay())) {
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, "0");
      const dd = String(day.getDate()).padStart(2, "0");
      const value = `${yyyy}-${mm}-${dd}`;
      const dayValue = Object.entries(DAY_VALUE_TO_JS).find(([, js]) => js === day.getDay())?.[0];
      const slotTime =
        dayValue
          ? meta.daySlots.find((slot) => slot.dayValue === dayValue)?.startTime || ""
          : "";
      const timeLabel = (slotTime || meta.defaultTime)
        ? ` • ${slotTime || meta.defaultTime}`
        : "";
      const label = `${DAY_FULL_NAMES[day.getDay()]}, ${dd}/${mm}/${yyyy}${timeLabel}`;
      result.push({ value, label });
    }
  }

  return result;
}

interface SuggestAssignStepProps {
  mode?: "full" | "suggested-only" | "manual-wait-only";
  registrationId: string;
  isSuggesting: boolean;
  assignViewMode: "none" | "suggested" | "manual";
  handleSuggestClasses: () => void;
  allowManualAssign: boolean;
  handleLoadManualClasses: () => void;
  isLoadingManualClasses: boolean;
  branchId?: string;
  handleMoveToWaitingList: () => void;
  isWaiting: boolean;
  suggestedClasses: SuggestedClassBucket | null;
  hasSecondaryTrack: boolean;
  selectedTrack: RegistrationTrackType;
  setSelectedTrack: (value: RegistrationTrackType) => void;
  selectedEntryType: EntryType;
  setSelectedEntryType: (value: EntryType) => void;
  showEntryTypeSelector?: boolean;
  selectedClassId: string;
  setSelectedClassId: (value: string) => void;
  activeSuggestedClasses: any[];
  activeAlternativeClasses: any[];
  formatSchedulePattern: (value?: string | null) => string;
  handleAssignClass: (
    sessionSelectionPattern?: string,
    entryType?: EntryType,
    firstStudyDate?: string,
    weeklyPattern?: WeeklyPatternEntry[] | null,
  ) => void;
  handleAssignSuggestedClasses: (payload: {
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
  }) => void;
  isAssigning: boolean;
  manualClasses: any[];
  manualClassOptions: Array<{
    id: string;
    label: string;
    remainingSlots: number | null;
    disabled: boolean;
  }>;
  manualPrimaryClassId: string;
  setManualPrimaryClassId: (value: string) => void;
  manualSecondaryClassId: string;
  setManualSecondaryClassId: (value: string) => void;
  manualPrimaryProgramId?: string;
  manualPrimaryProgramName?: string;
  manualSecondaryProgramId?: string;
  manualSecondaryProgramName?: string;
  preferredSchedule?: string | null;
  manualPrimarySessionPattern: string;
  setManualPrimarySessionPattern: (value: string) => void;
  manualSecondarySessionPattern: string;
  setManualSecondarySessionPattern: (value: string) => void;
  handleAssignManualClasses: (
    entryType?: EntryType,
    firstStudyDate?: string,
    primaryWeeklyPattern?: WeeklyPatternEntry[] | null,
    secondaryWeeklyPattern?: WeeklyPatternEntry[] | null,
    primaryFirstStudyDate?: string,
    secondaryFirstStudyDate?: string,
  ) => void;
}

export default function SuggestAssignStep({
  mode = "full",
  registrationId,
  isSuggesting,
  assignViewMode,
  handleSuggestClasses,
  allowManualAssign,
  handleLoadManualClasses,
  isLoadingManualClasses,
  branchId,
  handleMoveToWaitingList,
  isWaiting,
  suggestedClasses,
  hasSecondaryTrack,
  selectedTrack,
  setSelectedTrack,
  selectedEntryType,
  setSelectedEntryType,
  showEntryTypeSelector = true,
  selectedClassId,
  setSelectedClassId,
  activeSuggestedClasses,
  activeAlternativeClasses,
  formatSchedulePattern,
  handleAssignClass,
  handleAssignSuggestedClasses,
  isAssigning,
  manualClasses,
  manualClassOptions,
  manualPrimaryClassId,
  setManualPrimaryClassId,
  manualSecondaryClassId,
  setManualSecondaryClassId,
  manualPrimaryProgramId,
  manualPrimaryProgramName,
  manualSecondaryProgramId,
  manualSecondaryProgramName,
  preferredSchedule,
  manualPrimarySessionPattern,
  setManualPrimarySessionPattern,
  manualSecondarySessionPattern,
  setManualSecondarySessionPattern,
  handleAssignManualClasses,
}: SuggestAssignStepProps) {
  const showSuggestedActions = mode !== "manual-wait-only";
  const showManualActions = mode !== "suggested-only";
  const isSuggestedMode = assignViewMode === "suggested";
  const isManualMode = assignViewMode === "manual";
  const effectiveEntryType: EntryType = showEntryTypeSelector
    ? selectedEntryType
    : "immediate";
  const classMap = useMemo(
    () =>
      new Map<string, any>(
        manualClasses
          .map((cls) => [String(cls?.id || ""), cls] as const)
          .filter(([id]) => Boolean(id)),
      ),
    [manualClasses],
  );

  const primaryScheduleMeta = useMemo(
    () =>
      parseClassScheduleMeta(
        classMap.get(manualPrimaryClassId)?.schedulePattern,
        classMap.get(manualPrimaryClassId)?.weeklyScheduleSlots,
      ),
    [classMap, manualPrimaryClassId],
  );
  const secondaryScheduleMeta = useMemo(
    () =>
      parseClassScheduleMeta(
        classMap.get(manualSecondaryClassId)?.schedulePattern,
        classMap.get(manualSecondaryClassId)?.weeklyScheduleSlots,
      ),
    [classMap, manualSecondaryClassId],
  );

  const [manualPrimaryDays, setManualPrimaryDays] = useState<string[]>([]);
  const [manualPrimaryTime, setManualPrimaryTime] = useState("");
  const [manualSecondaryDays, setManualSecondaryDays] = useState<string[]>([]);
  const [manualSecondaryTime, setManualSecondaryTime] = useState("");
  const [suggestedPrimaryDays, setSuggestedPrimaryDays] = useState<string[]>(
    [],
  );
  const [suggestedPrimaryTime, setSuggestedPrimaryTime] = useState("");
  const [suggestedSecondaryDays, setSuggestedSecondaryDays] = useState<
    string[]
  >([]);
  const [suggestedSecondaryTime, setSuggestedSecondaryTime] = useState("");
  const [selectedPrimarySuggestedClassId, setSelectedPrimarySuggestedClassId] =
    useState("");
  const [selectedSecondarySuggestedClassId, setSelectedSecondarySuggestedClassId] =
    useState("");
  const [firstStudyDate, setFirstStudyDate] = useState("");
  const [primaryFirstStudyDate, setPrimaryFirstStudyDate] = useState("");
  const [secondaryFirstStudyDate, setSecondaryFirstStudyDate] = useState("");
  const [manualPrimaryScheduleEnabled, setManualPrimaryScheduleEnabled] = useState(false);
  const [manualSecondaryScheduleEnabled, setManualSecondaryScheduleEnabled] = useState(false);
  const [suggestedPrimaryScheduleEnabled, setSuggestedPrimaryScheduleEnabled] = useState(false);
  const [suggestedSecondaryScheduleEnabled, setSuggestedSecondaryScheduleEnabled] = useState(false);

  const preferredDays = useMemo(
    () => parsePreferredScheduleDays(preferredSchedule),
    [preferredSchedule],
  );

  const selectedSuggestedClass = useMemo(
    () =>
      activeSuggestedClasses.find(
        (cls: any) => String(cls?.id || "") === String(selectedClassId || ""),
      ),
    [activeSuggestedClasses, selectedClassId],
  );

  const selectedPrimarySuggestedClass = useMemo(
    () =>
      suggestedClasses?.suggestedClasses?.find(
        (cls: any) =>
          String(cls?.id || "") === String(selectedPrimarySuggestedClassId || ""),
      ),
    [suggestedClasses?.suggestedClasses, selectedPrimarySuggestedClassId],
  );

  const selectedSecondarySuggestedClass = useMemo(
    () =>
      suggestedClasses?.secondarySuggestedClasses?.find(
        (cls: any) =>
          String(cls?.id || "") === String(selectedSecondarySuggestedClassId || ""),
      ),
    [
      suggestedClasses?.secondarySuggestedClasses,
      selectedSecondarySuggestedClassId,
    ],
  );

  const selectedSuggestedScheduleMeta = useMemo(
    () =>
      parseClassScheduleMeta(
        selectedSuggestedClass?.schedulePattern,
        selectedSuggestedClass?.weeklyScheduleSlots,
      ),
    [selectedSuggestedClass],
  );

  const selectedPrimarySuggestedScheduleMeta = useMemo(
    () =>
      parseClassScheduleMeta(
        selectedPrimarySuggestedClass?.schedulePattern,
        selectedPrimarySuggestedClass?.weeklyScheduleSlots,
      ),
    [selectedPrimarySuggestedClass],
  );

  const selectedSecondarySuggestedScheduleMeta = useMemo(
    () =>
      parseClassScheduleMeta(
        selectedSecondarySuggestedClass?.schedulePattern,
        selectedSecondarySuggestedClass?.weeklyScheduleSlots,
      ),
    [selectedSecondarySuggestedClass],
  );

  const activeClassScheduleMeta = useMemo(() => {
    if (isSuggestedMode) {
      if (hasSecondaryTrack) {
        return parseClassScheduleMeta(
          selectedPrimarySuggestedClass?.schedulePattern,
          selectedPrimarySuggestedClass?.weeklyScheduleSlots,
        );
      }
      return parseClassScheduleMeta(
        selectedSuggestedClass?.schedulePattern,
        selectedSuggestedClass?.weeklyScheduleSlots,
      );
    }
    if (isManualMode) {
      return parseClassScheduleMeta(
        classMap.get(manualPrimaryClassId)?.schedulePattern,
        classMap.get(manualPrimaryClassId)?.weeklyScheduleSlots,
      );
    }
    return { availableDays: [] as string[], defaultTime: "", duration: "", daySlots: [] };
  }, [
    isSuggestedMode,
    isManualMode,
    hasSecondaryTrack,
    selectedPrimarySuggestedClass,
    selectedSuggestedClass,
    classMap,
    manualPrimaryClassId,
  ]);

  const firstStudyDateOptions = useMemo(
    () => generateUpcomingSessionDates(activeClassScheduleMeta),
    [activeClassScheduleMeta],
  );

  const primaryFirstStudyDateMeta = useMemo(() => {
    if (!hasSecondaryTrack) return activeClassScheduleMeta;

    if (isSuggestedMode) {
      return parseClassScheduleMeta(
        selectedPrimarySuggestedClass?.schedulePattern,
        selectedPrimarySuggestedClass?.weeklyScheduleSlots,
      );
    }

    if (isManualMode) {
      return parseClassScheduleMeta(
        classMap.get(manualPrimaryClassId)?.schedulePattern,
        classMap.get(manualPrimaryClassId)?.weeklyScheduleSlots,
      );
    }

    return { availableDays: [] as string[], defaultTime: "", duration: "", daySlots: [] };
  }, [
    hasSecondaryTrack,
    activeClassScheduleMeta,
    isSuggestedMode,
    isManualMode,
    selectedPrimarySuggestedClass,
    classMap,
    manualPrimaryClassId,
  ]);

  const secondaryFirstStudyDateMeta = useMemo(() => {
    if (!hasSecondaryTrack) {
      return { availableDays: [] as string[], defaultTime: "", duration: "", daySlots: [] };
    }

    if (isSuggestedMode) {
      return parseClassScheduleMeta(
        selectedSecondarySuggestedClass?.schedulePattern,
        selectedSecondarySuggestedClass?.weeklyScheduleSlots,
      );
    }

    if (isManualMode) {
      return parseClassScheduleMeta(
        classMap.get(manualSecondaryClassId)?.schedulePattern,
        classMap.get(manualSecondaryClassId)?.weeklyScheduleSlots,
      );
    }

    return { availableDays: [] as string[], defaultTime: "", duration: "", daySlots: [] };
  }, [
    hasSecondaryTrack,
    isSuggestedMode,
    isManualMode,
    selectedSecondarySuggestedClass,
    classMap,
    manualSecondaryClassId,
  ]);

  const primaryFirstStudyDateOptions = useMemo(
    () => generateUpcomingSessionDates(primaryFirstStudyDateMeta),
    [primaryFirstStudyDateMeta],
  );

  const secondaryFirstStudyDateOptions = useMemo(
    () => generateUpcomingSessionDates(secondaryFirstStudyDateMeta),
    [secondaryFirstStudyDateMeta],
  );

  const getClassScheduleLabel = (cls: any): string => {
    const rrulePattern =
      cls?.schedulePattern || cls?.classSchedulePattern || cls?.effectiveSchedulePattern;
    if (rrulePattern) {
      const mapped = formatSchedulePattern(rrulePattern);
      if (mapped && mapped !== "-") return mapped;
    }

    const fromText = String(cls?.scheduleText || cls?.description || "").trim();
    if (fromText) return fromText;

    const fromSlots = formatScheduleFromWeeklySlots(cls?.weeklyScheduleSlots);
    return fromSlots || "-";
  };

  const normalizeText = (value?: string | null) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const filterOptionsByProgram = (
    options: Array<{
      id: string;
      label: string;
      remainingSlots: number | null;
      disabled: boolean;
      programId?: string;
      programName?: string;
    }>,
    targetProgramId?: string,
    targetProgramName?: string,
  ) => {
    const normalizedTargetProgramId = String(targetProgramId || "").trim();
    const normalizedTargetProgramName = normalizeText(targetProgramName);

    return options.filter((option) => {
      const optionProgramId = String(option.programId || "").trim();
      const optionProgramName = normalizeText(option.programName);

      const sameProgramById = normalizedTargetProgramId
        ? optionProgramId === normalizedTargetProgramId
        : true;
      const sameProgramByName =
        !normalizedTargetProgramId && normalizedTargetProgramName
          ? optionProgramName === normalizedTargetProgramName
          : true;

      return sameProgramById && sameProgramByName;
    });
  };

  const primaryManualClassOptions = useMemo(
    () =>
      filterOptionsByProgram(
        manualClassOptions,
        manualPrimaryProgramId,
        manualPrimaryProgramName,
      ),
    [manualClassOptions, manualPrimaryProgramId, manualPrimaryProgramName],
  );

  const secondaryManualClassOptions = useMemo(
    () =>
      filterOptionsByProgram(
        manualClassOptions,
        manualSecondaryProgramId,
        manualSecondaryProgramName,
      ),
    [manualClassOptions, manualSecondaryProgramId, manualSecondaryProgramName],
  );

  const secondaryManualConflictClassIds = useMemo(() => {
    if (!hasSecondaryTrack || !manualPrimaryClassId) return new Set<string>();

    const primaryMeta = parseClassScheduleMeta(
      classMap.get(manualPrimaryClassId)?.schedulePattern,
      classMap.get(manualPrimaryClassId)?.weeklyScheduleSlots,
    );
    if (!primaryMeta.daySlots.length) return new Set<string>();

    return new Set(
      secondaryManualClassOptions
        .map((option) => {
          const secondaryMeta = parseClassScheduleMeta(
            classMap.get(option.id)?.schedulePattern,
            classMap.get(option.id)?.weeklyScheduleSlots,
          );
          return hasTrackScheduleConflict(primaryMeta, secondaryMeta)
            ? option.id
            : "";
        })
        .filter(Boolean),
    );
  }, [
    hasSecondaryTrack,
    manualPrimaryClassId,
    classMap,
    secondaryManualClassOptions,
  ]);

  const compatibleSecondaryManualClassOptions = useMemo(
    () =>
      secondaryManualClassOptions.filter(
        (option) => !secondaryManualConflictClassIds.has(option.id),
      ),
    [secondaryManualClassOptions, secondaryManualConflictClassIds],
  );

  const manualTrackConflict = useMemo(() => {
    if (!hasSecondaryTrack || !manualPrimaryClassId || !manualSecondaryClassId) {
      return false;
    }

    return hasTrackScheduleConflict(primaryScheduleMeta, secondaryScheduleMeta);
  }, [
    hasSecondaryTrack,
    manualPrimaryClassId,
    manualSecondaryClassId,
    primaryScheduleMeta,
    secondaryScheduleMeta,
  ]);

  const compatibleSecondarySuggestedClasses = useMemo(() => {
    const secondaryList = suggestedClasses?.secondarySuggestedClasses || [];
    if (!hasSecondaryTrack || !selectedPrimarySuggestedClassId) return secondaryList;

    const primaryMeta = parseClassScheduleMeta(
      selectedPrimarySuggestedClass?.schedulePattern,
      selectedPrimarySuggestedClass?.weeklyScheduleSlots,
    );
    if (!primaryMeta.daySlots.length) return secondaryList;

    return secondaryList.filter((cls: any) => {
      const secondaryMeta = parseClassScheduleMeta(
        cls?.schedulePattern,
        cls?.weeklyScheduleSlots,
      );
      return !hasTrackScheduleConflict(primaryMeta, secondaryMeta);
    });
  }, [
    suggestedClasses?.secondarySuggestedClasses,
    hasSecondaryTrack,
    selectedPrimarySuggestedClassId,
    selectedPrimarySuggestedClass,
  ]);

  const suggestedTrackConflict = useMemo(() => {
    if (!hasSecondaryTrack || !selectedPrimarySuggestedClassId || !selectedSecondarySuggestedClassId) {
      return false;
    }

    return hasTrackScheduleConflict(
      selectedPrimarySuggestedScheduleMeta,
      selectedSecondarySuggestedScheduleMeta,
    );
  }, [
    hasSecondaryTrack,
    selectedPrimarySuggestedClassId,
    selectedSecondarySuggestedClassId,
    selectedPrimarySuggestedScheduleMeta,
    selectedSecondarySuggestedScheduleMeta,
  ]);

  const selectedTotalDays = useMemo(() => {
    const merged = new Set<string>([
      ...manualPrimaryDays,
      ...manualSecondaryDays,
    ]);
    return merged.size;
  }, [manualPrimaryDays, manualSecondaryDays]);

  // Reset firstStudyDate when the active class changes so stale dates don't persist
  useEffect(() => {
    setFirstStudyDate("");
  }, [activeClassScheduleMeta]);

  useEffect(() => {
    setPrimaryFirstStudyDate("");
  }, [primaryFirstStudyDateMeta]);

  useEffect(() => {
    setSecondaryFirstStudyDate("");
  }, [secondaryFirstStudyDateMeta]);

  useEffect(() => {
    if (assignViewMode !== "manual") return;
    setManualPrimaryDays((prev) => {
      const kept = prev.filter((day) =>
        primaryScheduleMeta.availableDays.includes(day),
      );
      return kept;
    });
    setManualPrimaryTime(primaryScheduleMeta.defaultTime || "");
  }, [
    assignViewMode,
    primaryScheduleMeta.availableDays,
    primaryScheduleMeta.defaultTime,
  ]);

  useEffect(() => {
    if (assignViewMode !== "manual") return;
    setManualPrimaryScheduleEnabled(false);
    setManualPrimaryDays([]);
  }, [assignViewMode, manualPrimaryClassId]);

  useEffect(() => {
    if (assignViewMode !== "manual") return;
    setManualSecondaryDays((prev) => {
      const kept = prev.filter((day) =>
        secondaryScheduleMeta.availableDays.includes(day),
      );
      return kept;
    });
    setManualSecondaryTime(secondaryScheduleMeta.defaultTime || "");
  }, [
    assignViewMode,
    secondaryScheduleMeta.availableDays,
    secondaryScheduleMeta.defaultTime,
  ]);

  useEffect(() => {
    if (assignViewMode !== "manual") return;
    setManualSecondaryScheduleEnabled(false);
    setManualSecondaryDays([]);
  }, [assignViewMode, manualSecondaryClassId]);

  useEffect(() => {
    setManualPrimarySessionPattern(
      buildSessionPatternFromSelection(manualPrimaryDays, primaryScheduleMeta),
    );
  }, [
    manualPrimaryDays,
    primaryScheduleMeta,
    setManualPrimarySessionPattern,
  ]);

  useEffect(() => {
    if (!hasSecondaryTrack) {
      setManualSecondarySessionPattern("");
      return;
    }

    setManualSecondarySessionPattern(
      buildSessionPatternFromSelection(manualSecondaryDays, secondaryScheduleMeta),
    );
  }, [
    hasSecondaryTrack,
    manualSecondaryDays,
    secondaryScheduleMeta,
    setManualSecondarySessionPattern,
  ]);

  useEffect(() => {
    if (assignViewMode !== "suggested") return;
    const nextPrimaryId = String(suggestedClasses?.suggestedClasses?.[0]?.id || "");
    const nextSecondaryId = String(
      suggestedClasses?.secondarySuggestedClasses?.[0]?.id || "",
    );

    setSelectedPrimarySuggestedClassId((prev) => prev || nextPrimaryId);
    setSelectedSecondarySuggestedClassId((prev) => prev || nextSecondaryId);
  }, [
    assignViewMode,
    suggestedClasses?.suggestedClasses,
    suggestedClasses?.secondarySuggestedClasses,
  ]);

  useEffect(() => {
    if (assignViewMode !== "suggested") return;
    setSuggestedPrimaryScheduleEnabled(false);
    setSuggestedPrimaryDays([]);
  }, [assignViewMode, selectedPrimarySuggestedClassId]);

  useEffect(() => {
    if (assignViewMode !== "suggested") return;
    setSuggestedSecondaryScheduleEnabled(false);
    setSuggestedSecondaryDays([]);
  }, [assignViewMode, selectedSecondarySuggestedClassId]);

  useEffect(() => {
    if (assignViewMode !== "suggested" || hasSecondaryTrack) return;
    if (selectedTrack === "secondary") {
      setSuggestedSecondaryScheduleEnabled(false);
      setSuggestedSecondaryDays([]);
      return;
    }
    setSuggestedPrimaryScheduleEnabled(false);
    setSuggestedPrimaryDays([]);
  }, [assignViewMode, hasSecondaryTrack, selectedTrack, selectedClassId]);

  useEffect(() => {
    if (assignViewMode !== "suggested" || !hasSecondaryTrack) return;
    setSuggestedPrimaryDays((prev) => {
      const kept = prev.filter((day) =>
        selectedPrimarySuggestedScheduleMeta.availableDays.includes(day),
      );
      return kept;
    });
    setSuggestedPrimaryTime(
      selectedPrimarySuggestedScheduleMeta.defaultTime || "",
    );
  }, [
    assignViewMode,
    hasSecondaryTrack,
    selectedPrimarySuggestedScheduleMeta.availableDays,
    selectedPrimarySuggestedScheduleMeta.defaultTime,
  ]);

  useEffect(() => {
    if (assignViewMode !== "suggested" || !hasSecondaryTrack) return;
    setSuggestedSecondaryDays((prev) => {
      const kept = prev.filter((day) =>
        selectedSecondarySuggestedScheduleMeta.availableDays.includes(day),
      );
      return kept;
    });
    setSuggestedSecondaryTime(
      selectedSecondarySuggestedScheduleMeta.defaultTime || "",
    );
  }, [
    assignViewMode,
    hasSecondaryTrack,
    selectedSecondarySuggestedScheduleMeta.availableDays,
    selectedSecondarySuggestedScheduleMeta.defaultTime,
  ]);

  useEffect(() => {
    if (assignViewMode !== "suggested") return;

    if (selectedTrack === "secondary") {
      setSuggestedSecondaryDays((prev) => {
        const kept = prev.filter((day) =>
          selectedSuggestedScheduleMeta.availableDays.includes(day),
        );
        return kept;
      });
      setSuggestedSecondaryTime(
        selectedSuggestedScheduleMeta.defaultTime || "",
      );
      return;
    }

    setSuggestedPrimaryDays((prev) => {
      const kept = prev.filter((day) =>
        selectedSuggestedScheduleMeta.availableDays.includes(day),
      );
      return kept;
    });
    setSuggestedPrimaryTime(
      selectedSuggestedScheduleMeta.defaultTime || "",
    );
  }, [
    assignViewMode,
    selectedTrack,
    selectedSuggestedScheduleMeta.availableDays,
    selectedSuggestedScheduleMeta.defaultTime,
  ]);

  const suggestedPrimarySessionPattern = useMemo(
    () => buildSessionPatternFromSelection(suggestedPrimaryDays, selectedPrimarySuggestedScheduleMeta),
    [suggestedPrimaryDays, selectedPrimarySuggestedScheduleMeta],
  );

  const suggestedSecondarySessionPattern = useMemo(
    () => buildSessionPatternFromSelection(suggestedSecondaryDays, selectedSecondarySuggestedScheduleMeta),
    [suggestedSecondaryDays, selectedSecondarySuggestedScheduleMeta],
  );

  useEffect(() => {
    if (assignViewMode !== "manual") return;

    const hasSelected = primaryManualClassOptions.some(
      (option) => option.id === manualPrimaryClassId,
    );
    if (hasSelected) return;

    setManualPrimaryClassId(primaryManualClassOptions[0]?.id || "");
  }, [
    assignViewMode,
    manualPrimaryClassId,
    primaryManualClassOptions,
    setManualPrimaryClassId,
  ]);

  useEffect(() => {
    if (assignViewMode !== "manual") return;

    if (!hasSecondaryTrack) {
      setManualSecondaryClassId("");
      return;
    }

    const hasSelected = secondaryManualClassOptions.some(
      (option) => option.id === manualSecondaryClassId,
    );
    if (hasSelected) return;

    setManualSecondaryClassId(compatibleSecondaryManualClassOptions[0]?.id || "");
  }, [
    assignViewMode,
    hasSecondaryTrack,
    manualSecondaryClassId,
    compatibleSecondaryManualClassOptions,
    setManualSecondaryClassId,
  ]);

  useEffect(() => {
    if (assignViewMode !== "suggested" || !hasSecondaryTrack) return;

    const hasSelected = compatibleSecondarySuggestedClasses.some(
      (cls: any) => String(cls?.id || "") === String(selectedSecondarySuggestedClassId || ""),
    );
    if (hasSelected) return;

    setSelectedSecondarySuggestedClassId(
      String(compatibleSecondarySuggestedClasses[0]?.id || ""),
    );
  }, [
    assignViewMode,
    hasSecondaryTrack,
    compatibleSecondarySuggestedClasses,
    selectedSecondarySuggestedClassId,
  ]);

  const toggleTrackDay = (
    value: string,
    selectedDays: string[],
    availableDays: string[],
    setter: (next: string[]) => void,
  ) => {
    if (!availableDays.includes(value)) return;
    if (selectedDays.includes(value)) {
      setter(selectedDays.filter((day) => day !== value));
      return;
    }
    setter([...selectedDays, value]);
  };

  const handleAssignSuggestedClass = () => {
    const normalizedFirstStudyDate = firstStudyDate.trim() || undefined;
    const normalizedPrimaryFirstStudyDate =
      primaryFirstStudyDate.trim() || normalizedFirstStudyDate;
    const normalizedSecondaryFirstStudyDate =
      secondaryFirstStudyDate.trim() || normalizedFirstStudyDate;

    if (hasSecondaryTrack) {
      const primarySessionSelectionPattern = suggestedPrimaryScheduleEnabled
        ? suggestedPrimarySessionPattern || undefined
        : undefined;
      const secondarySessionSelectionPattern = suggestedSecondaryScheduleEnabled
        ? suggestedSecondarySessionPattern || undefined
        : undefined;
      const primaryWeeklyPattern = suggestedPrimaryScheduleEnabled
        ? buildWeeklyPatternFromSelection(
            suggestedPrimaryDays,
            selectedPrimarySuggestedScheduleMeta,
          )
        : null;
      const secondaryWeeklyPattern = suggestedSecondaryScheduleEnabled
        ? buildWeeklyPatternFromSelection(
            suggestedSecondaryDays,
            selectedSecondarySuggestedScheduleMeta,
          )
        : null;

      handleAssignSuggestedClasses({
        primaryClassId: selectedPrimarySuggestedClassId,
        primarySessionSelectionPattern,
        primaryWeeklyPattern,
        primaryFirstStudyDate: normalizedPrimaryFirstStudyDate,
        secondaryClassId: selectedSecondarySuggestedClassId || undefined,
        secondarySessionSelectionPattern,
        secondaryWeeklyPattern,
        secondaryFirstStudyDate: normalizedSecondaryFirstStudyDate,
        entryType: effectiveEntryType,
        firstStudyDate: normalizedFirstStudyDate,
      });
      return;
    }

    const currentPattern =
      selectedTrack === "secondary"
        ? suggestedSecondarySessionPattern
        : suggestedPrimarySessionPattern;
    const currentMeta =
      selectedTrack === "secondary"
        ? selectedSecondarySuggestedScheduleMeta
        : selectedPrimarySuggestedScheduleMeta;
    const currentDays =
      selectedTrack === "secondary"
        ? suggestedSecondaryDays
        : suggestedPrimaryDays;
    const currentScheduleEnabled =
      selectedTrack === "secondary"
        ? suggestedSecondaryScheduleEnabled
        : suggestedPrimaryScheduleEnabled;
    const currentWeeklyPattern = currentScheduleEnabled
      ? buildWeeklyPatternFromSelection(currentDays, currentMeta)
      : null;

    handleAssignClass(
      currentScheduleEnabled ? currentPattern || undefined : undefined,
      effectiveEntryType,
      normalizedFirstStudyDate,
      currentWeeklyPattern,
    );
  };

  const renderTrackSessionSelector = ({
    title,
    selectedClassId,
    selectedDays,
    setSelectedDays,
    selectedTime,
    setSelectedTime,
    scheduleMeta,
    pattern,
    showControls = true,
    onToggleControls,
  }: {
    title: string;
    selectedClassId: string;
    selectedDays: string[];
    setSelectedDays: (value: string[]) => void;
    selectedTime: string;
    setSelectedTime: (value: string) => void;
    scheduleMeta: ClassScheduleMeta;
    pattern: string;
    showControls?: boolean;
    onToggleControls?: (next: boolean) => void;
  }) => {
    if (!selectedClassId) return null;

    return (
      <div className="space-y-3 bg-transparent w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          {onToggleControls ? (
            <button
              type="button"
              onClick={() => onToggleControls(!showControls)}
              className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              {showControls ? "Ẩn tùy chỉnh lịch" : "Tùy chỉnh lịch học"}
            </button>
          ) : null}
        </div>

        {!showControls ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Đang dùng lịch mặc định của lớp. Nếu cần chọn buổi cụ thể, nhấn "Tùy chỉnh lịch học".
          </div>
        ) : null}

        {!showControls ? null : (
          <>
        <div className="space-y-1.5">
          <div className="text-[11px] text-gray-500">
            Chọn ngày học thuộc lịch của lớp đã chọn
          </div>
          <div className="grid grid-cols-4 gap-1.5 md:grid-cols-7">
            {WEEK_DAYS.map((day) => {
              const available = scheduleMeta.availableDays.includes(day.value);
              const active = selectedDays.includes(day.value);
              const slot = getSlotByDay(scheduleMeta, day.value);
              const timeLabel = slot?.startTime || "--:--";
              return (
                <button
                  key={`${title}-${day.value}`}
                  type="button"
                  onClick={() =>
                    toggleTrackDay(
                      day.value,
                      selectedDays,
                      scheduleMeta.availableDays,
                      setSelectedDays,
                    )
                  }
                  disabled={!available}
                  className={`rounded-lg border px-1.5 py-1.5 text-center text-xs transition-colors cursor-pointer ${
                    active
                      ? "border-red-500 bg-red-50 text-red-700 font-medium"
                      : available
                        ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  }`}
                >
                  <div className="leading-none">{day.shortLabel}</div>
                  <div className="mt-0.5 text-[10px] leading-none opacity-80">{timeLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] text-gray-500">
            Giờ theo ngày đã chọn
          </label>
          <div className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700">
            {selectedDays.length > 0
              ? sortDays(selectedDays)
                  .map((dayValue) => {
                    const day = WEEK_DAYS.find((item) => item.value === dayValue);
                    const slot = getSlotByDay(scheduleMeta, dayValue);
                    return `${day?.shortLabel || dayValue} ${slot?.startTime || "--:--"}`;
                  })
                  .join(", ")
              : "Chưa chọn ngày học"}
          </div>
        </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
        <ArrowRight size={18} className="text-red-600" />
        {mode === "suggested-only" ? "Gợi ý lớp phù hợp" : "Gợi ý lớp phù hợp và xếp lớp"}
      </div>

      <div className="space-y-3">
        <div className={`grid grid-cols-1 gap-2 ${showSuggestedActions && showManualActions ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {showSuggestedActions && (
            <button
            type="button"
            onClick={() => {
              void handleSuggestClasses();
            }}
            disabled={!registrationId || isSuggesting}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed cursor-pointer disabled:opacity-60 ${
              isSuggestedMode
                ? "border-red-600 bg-red-600 text-white"
                : "border-red-300 bg-white text-red-700"
            }`}
          >
            {isSuggesting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <School size={14} />
            )}
            Gợi ý lớp phù hợp
            </button>
          )}

          {showManualActions && (
            <button
            type="button"
            onClick={handleLoadManualClasses}
            disabled={
              !allowManualAssign ||
              !registrationId ||
              isLoadingManualClasses ||
              !branchId
            }
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
              assignViewMode === "manual"
                ? "border-red-600 bg-red-600 text-white"
                : "border-red-300 bg-white text-red-700"
            }`}
          >
            {isLoadingManualClasses ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <School size={14} />
            )}
            Xếp lớp thủ công
            </button>
          )}

          {showManualActions && (
            <button
            type="button"
            onClick={handleMoveToWaitingList}
            disabled={!registrationId || isWaiting}
            className="w-full rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWaiting ? "Đang xử lý..." : "Đưa vào danh sách chờ"}
            </button>
          )}

        </div>

        <div className="rounded-xl border border-red-100 bg-white/80 p-3">
          {(isSuggestedMode || isManualMode) && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50/50 p-3">
              {/* {showEntryTypeSelector && (
                <>
                  <label className="text-xs font-semibold text-gray-700">
                    Hình thức vào lớp
                  </label>
                  <div className="mt-1.5">
                    <Select
                      value={selectedEntryType}
                      onValueChange={(value) => setSelectedEntryType(value as EntryType)}
                    >
                      <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                        <SelectValue placeholder="Chọn hình thức vào lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Vào học ngay</SelectItem>
                        <SelectItem value="retake">Học lại</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )} */}
              <div className="mt-3 space-y-1.5">
                {hasSecondaryTrack ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Ngày bắt đầu học chương trình chính (tùy chọn)
                      </label>
                      {primaryFirstStudyDateOptions.length > 0 ? (
                        <Select
                          value={primaryFirstStudyDate}
                          onValueChange={(value) =>
                            setPrimaryFirstStudyDate(value === "__none__" ? "" : value)
                          }
                        >
                          <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                            <SelectValue placeholder="Không chọn (để trống)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Không chọn (để trống)</SelectItem>
                            {primaryFirstStudyDateOptions.map((opt) => (
                              <SelectItem key={`primary-date-${opt.value}`} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select disabled>
                          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                            <SelectValue placeholder="Chọn lớp chính để xem lịch buổi học" />
                          </SelectTrigger>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Ngày bắt đầu học chương trình song song (tùy chọn)
                      </label>
                      {secondaryFirstStudyDateOptions.length > 0 ? (
                        <Select
                          value={secondaryFirstStudyDate}
                          onValueChange={(value) =>
                            setSecondaryFirstStudyDate(value === "__none__" ? "" : value)
                          }
                        >
                          <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                            <SelectValue placeholder="Không chọn (để trống)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Không chọn (để trống)</SelectItem>
                            {secondaryFirstStudyDateOptions.map((opt) => (
                              <SelectItem key={`secondary-date-${opt.value}`} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select disabled>
                          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                            <SelectValue placeholder="Chọn lớp song song để xem lịch buổi học" />
                          </SelectTrigger>
                        </Select>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="text-xs font-semibold text-gray-700">
                      Ngày bắt đầu học (tùy chọn)
                    </label>
                    {firstStudyDateOptions.length > 0 ? (
                      <Select
                        value={firstStudyDate}
                        onValueChange={(value) => setFirstStudyDate(value === "__none__" ? "" : value)}
                      >
                        <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                          <SelectValue placeholder="Không chọn (để trống)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Không chọn (để trống)</SelectItem>
                          {firstStudyDateOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select disabled>
                        <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                          <SelectValue placeholder="Chọn lớp để xem lịch buổi học" />
                        </SelectTrigger>
                      </Select>
                    )}
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Nếu để trống, hệ thống sẽ sử dụng lịch mặc định khi xếp lớp. Nếu muốn chuyển trạng thái chờ lớp, dùng nút "Đưa vào danh sách chờ".
              </p>
            </div>
          )}

          {showSuggestedActions && isSuggestedMode && suggestedClasses && (
            <div className="space-y-3">
              

             {hasSecondaryTrack ? (
                <div className="rounded-xl border border-red-200 bg-white p-4">
                  {/* SỬ DỤNG FLEXBOX TƯƠNG TỰ BÊN THỦ CÔNG */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    
                    {/* CỘT 1: LỚP GỢI Ý PRIMARY */}
                    <div className="flex-1 w-full space-y-3">
                      <label className="text-xs font-semibold text-gray-700">
                        Lớp gợi ý cho chương trình chính
                      </label>
                      {suggestedClasses.suggestedClasses?.length ? (
                        <div className="grid grid-cols-1 gap-2">
                          {suggestedClasses.suggestedClasses.map((cls: any) => {
                            const isSelected = selectedPrimarySuggestedClassId === String(cls.id);
                            const remainingSlots =
                              typeof cls.remainingSlots === "number"
                                ? cls.remainingSlots
                                : typeof cls.capacity === "number" &&
                                    typeof cls.currentEnrollment === "number"
                                  ? cls.capacity - cls.currentEnrollment
                                  : null;
                            return (
                              <button
                                key={`suggested-primary-${cls.id}`}
                                type="button"
                                onClick={() =>
                                  setSelectedPrimarySuggestedClassId(String(cls.id))
                                }
                                className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                                  isSelected
                                    ? "border-red-500 bg-red-100"
                                    : "border-red-200 bg-white hover:bg-red-50"
                                }`}
                              >
                                <div className="text-sm font-semibold text-gray-900">
                                  {cls.code}
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                  Còn chỗ: {typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : "-"}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-600" title={getClassScheduleLabel(cls)}>
                                  Lịch: {getClassScheduleLabel(cls)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                          Chưa có lớp gợi ý cho chương trình chính.
                        </div>
                      )}

                      {renderTrackSessionSelector({
                        title: "Chương trình chính - chọn ngày/giờ học",
                        selectedClassId: selectedPrimarySuggestedClassId,
                        selectedDays: suggestedPrimaryDays,
                        setSelectedDays: setSuggestedPrimaryDays,
                        selectedTime: suggestedPrimaryTime,
                        setSelectedTime: setSuggestedPrimaryTime,
                        scheduleMeta: selectedPrimarySuggestedScheduleMeta,
                        pattern: suggestedPrimarySessionPattern,
                        showControls: suggestedPrimaryScheduleEnabled,
                        onToggleControls: (next) => {
                          setSuggestedPrimaryScheduleEnabled(next);
                          if (!next) setSuggestedPrimaryDays([]);
                        },
                      })}
                    </div>

                    {/* THANH DỌC XÁM NGĂN CÁCH */}
                    <div className="hidden md:block self-stretch w-px shrink-0 bg-gray-200 mx-2"></div>

                    {/* CỘT 2: LỚP GỢI Ý SECONDARY */}
                    <div className="flex-1 w-full space-y-3">
                      <label className="text-xs font-semibold text-gray-700">
                        Lớp gợi ý cho chương trình song song
                      </label>
                      {compatibleSecondarySuggestedClasses.length ? (
                        <div className="grid grid-cols-1 gap-2">
                          {compatibleSecondarySuggestedClasses.map((cls: any) => {
                            const isSelected = selectedSecondarySuggestedClassId === String(cls.id);
                            const remainingSlots =
                              typeof cls.remainingSlots === "number"
                                ? cls.remainingSlots
                                : typeof cls.capacity === "number" &&
                                    typeof cls.currentEnrollment === "number"
                                  ? cls.capacity - cls.currentEnrollment
                                  : null;
                            return (
                              <button
                                key={`suggested-secondary-${cls.id}`}
                                type="button"
                                onClick={() =>
                                  setSelectedSecondarySuggestedClassId(String(cls.id))
                                }
                                className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                                  isSelected
                                    ? "border-red-500 bg-red-100"
                                    : "border-red-200 bg-white hover:bg-red-50"
                                }`}
                              >
                                <div className="text-sm font-semibold text-gray-900">
                                  {cls.code}
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                  Còn chỗ: {typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : "-"}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-600" title={getClassScheduleLabel(cls)}>
                                  Lịch: {getClassScheduleLabel(cls)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                          Không có lớp chương trình song song phù hợp do trùng hoặc sát giờ với chương trình chính.
                        </div>
                      )}

                      {renderTrackSessionSelector({
                        title: "Chương trình song song - chọn ngày/giờ học",
                        selectedClassId: selectedSecondarySuggestedClassId,
                        selectedDays: suggestedSecondaryDays,
                        setSelectedDays: setSuggestedSecondaryDays,
                        selectedTime: suggestedSecondaryTime,
                        setSelectedTime: setSuggestedSecondaryTime,
                        scheduleMeta: selectedSecondarySuggestedScheduleMeta,
                        pattern: suggestedSecondarySessionPattern,
                        showControls: suggestedSecondaryScheduleEnabled,
                        onToggleControls: (next) => {
                          setSuggestedSecondaryScheduleEnabled(next);
                          if (!next) setSuggestedSecondaryDays([]);
                        },
                      })}
                    </div>

                  </div>
                </div>
              ) : activeSuggestedClasses.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {activeSuggestedClasses.map((cls: any) => {
                    const isSelected = selectedClassId === cls.id;
                    const remainingSlots =
                      typeof cls.remainingSlots === "number"
                        ? cls.remainingSlots
                        : typeof cls.capacity === "number" &&
                            typeof cls.currentEnrollment === "number"
                          ? cls.capacity - cls.currentEnrollment
                          : typeof cls.capacity === "number" &&
                              typeof cls.currentEnrollmentCount === "number"
                            ? cls.capacity - cls.currentEnrollmentCount
                            : null;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClassId(String(cls.id))}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "border-red-500 bg-red-100"
                            : "border-red-200 bg-white hover:bg-red-50"
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {cls.code}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          Còn chỗ:{" "}
                          {typeof remainingSlots === "number"
                            ? Math.max(0, remainingSlots)
                            : "-"}
                        </div>
                        <div
                          className="mt-0.5 text-xs text-gray-600"
                          title={getClassScheduleLabel(cls)}
                        >
                          Lịch: {getClassScheduleLabel(cls)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                  Chưa có lớp gợi ý cho {toTrackLabel(selectedTrack)}.
                </div>
              )}

              {activeAlternativeClasses.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="text-sm font-semibold text-amber-900">
                    Lớp thay thế
                  </div>
                  <div className="mt-2 text-xs text-amber-800">
                    Có {activeAlternativeClasses.length} lớp thay thế cho{" "}
                    {toTrackLabel(selectedTrack)}.
                  </div>
                </div>
              )}

              {!hasSecondaryTrack && selectedClassId
                ? renderTrackSessionSelector({
                    title:
                      selectedTrack === "secondary"
                        ? "Chương trình song song - chọn ngày/giờ học"
                        : "Chương trình chính - chọn ngày/giờ học",
                    selectedClassId,
                    selectedDays:
                      selectedTrack === "secondary"
                        ? suggestedSecondaryDays
                        : suggestedPrimaryDays,
                    setSelectedDays:
                      selectedTrack === "secondary"
                        ? setSuggestedSecondaryDays
                        : setSuggestedPrimaryDays,
                    selectedTime:
                      selectedTrack === "secondary"
                        ? suggestedSecondaryTime
                        : suggestedPrimaryTime,
                    setSelectedTime:
                      selectedTrack === "secondary"
                        ? setSuggestedSecondaryTime
                        : setSuggestedPrimaryTime,
                    scheduleMeta: selectedSuggestedScheduleMeta,
                    pattern:
                      selectedTrack === "secondary"
                        ? suggestedSecondarySessionPattern
                        : suggestedPrimarySessionPattern,
                    showControls:
                      selectedTrack === "secondary"
                        ? suggestedSecondaryScheduleEnabled
                        : suggestedPrimaryScheduleEnabled,
                    onToggleControls: (next) => {
                      if (selectedTrack === "secondary") {
                        setSuggestedSecondaryScheduleEnabled(next);
                        if (!next) setSuggestedSecondaryDays([]);
                        return;
                      }
                      setSuggestedPrimaryScheduleEnabled(next);
                      if (!next) setSuggestedPrimaryDays([]);
                    },
                  })
                : null}

              <button
                type="button"
                onClick={handleAssignSuggestedClass}
                disabled={
                  hasSecondaryTrack
                    ? !selectedPrimarySuggestedClassId ||
                      !selectedSecondarySuggestedClassId ||
                      suggestedTrackConflict ||
                      isAssigning
                    : !selectedClassId || isAssigning
                }
                className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold cursor-pointer text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning
                  ? "Đang xếp lớp..."
                  : hasSecondaryTrack
                    ? showEntryTypeSelector
                      ? `Xếp lớp gợi ý (${toEntryTypeLabel(effectiveEntryType)})`
                      : "Xếp lớp gợi ý"
                    : showEntryTypeSelector
                      ? `Xếp vào lớp đã chọn (${toEntryTypeLabel(effectiveEntryType)})`
                      : "Xếp vào lớp đã chọn"}
              </button>

              {hasSecondaryTrack && suggestedTrackConflict && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Hai lớp được chọn đang trùng hoặc sát giờ nhau. Vui lòng chọn lớp khác để đảm bảo hai buổi cách nhau ít nhất {MIN_BETWEEN_TRACKS_MINUTES} phút.
                </div>
              )}
            </div>
          )}

          {showManualActions && allowManualAssign && isManualMode && (
            <div className="space-y-3 rounded-xl border border-red-200 bg-white p-3">
              <div className="text-sm font-semibold text-gray-900">
                Xếp lớp thủ công theo chương trình
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 text-sm text-gray-700">
                <div>
                  Lịch mong muốn của học viên:{" "}
                  <span className="font-semibold">
                    {preferredSchedule || "Chưa có"}
                  </span>
                </div>
              </div>

              {manualClasses.length === 0 && !isLoadingManualClasses ? (
                <div className="text-xs text-gray-600">
                  Không có lớp để xếp thủ công trong phạm vi chi nhánh hiện tại.
                </div>
              ) : (
                // DÙNG FLEXBOX THAY VÌ GRID
                <div className={`flex flex-col gap-4 ${hasSecondaryTrack ? "md:flex-row md:items-start" : ""}`}>
                  
                  {/* CỘT 1: PRIMARY */}
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-xs font-semibold text-gray-700">
                      Lớp cho chương trình chính
                    </label>
                    <Select
                      value={manualPrimaryClassId || "__none__"}
                      onValueChange={(value) =>
                        setManualPrimaryClassId(value === "__none__" ? "" : value)
                      }
                    >
                      <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                        <SelectValue placeholder="Chọn lớp chương trình chính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Chọn lớp chương trình chính</SelectItem>
                        {primaryManualClassOptions.map((option) => (
                          <SelectItem
                            key={`manual-primary-${option.id}`}
                            value={option.id}
                            disabled={option.disabled}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {renderTrackSessionSelector({
                      title: "Chương trình chính - chọn ngày/giờ học",
                      selectedClassId: manualPrimaryClassId,
                      selectedDays: manualPrimaryDays,
                      setSelectedDays: setManualPrimaryDays,
                      selectedTime: manualPrimaryTime,
                      setSelectedTime: setManualPrimaryTime,
                      scheduleMeta: primaryScheduleMeta,
                      pattern: manualPrimarySessionPattern,
                      showControls: manualPrimaryScheduleEnabled,
                      onToggleControls: (next) => {
                        setManualPrimaryScheduleEnabled(next);
                        if (!next) setManualPrimaryDays([]);
                      },
                    })}
                  </div>

                  {/* THANH DỌC XÁM NGĂN CÁCH */}
                  {hasSecondaryTrack && (
                    <div className="hidden md:block self-stretch w-px bg-gray-200 mx-2 shrink-0"></div>
                  )}

                  {/* CỘT 3: SECONDARY */}
                  {hasSecondaryTrack && (
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-xs font-semibold text-gray-700">
                        Lớp cho chương trình song song
                      </label>
                      <Select
                        value={manualSecondaryClassId || "__none__"}
                        onValueChange={(value) =>
                          setManualSecondaryClassId(value === "__none__" ? "" : value)
                        }
                      >
                        <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                          <SelectValue placeholder="Chọn lớp chương trình song song" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Chọn lớp chương trình song song</SelectItem>
                            {compatibleSecondaryManualClassOptions.map((option) => (
                            <SelectItem
                              key={`manual-secondary-${option.id}`}
                              value={option.id}
                              disabled={option.disabled}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                        {manualPrimaryClassId && secondaryManualClassOptions.length > 0 && compatibleSecondaryManualClassOptions.length === 0 && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                            Không có lớp chương trình song song hợp lệ vì trùng hoặc sát giờ với lớp chương trình chính đã chọn.
                          </div>
                        )}

                      {renderTrackSessionSelector({
                        title: "Chương trình song song - chọn ngày/giờ học",
                        selectedClassId: manualSecondaryClassId,
                        selectedDays: manualSecondaryDays,
                        setSelectedDays: setManualSecondaryDays,
                        selectedTime: manualSecondaryTime,
                        setSelectedTime: setManualSecondaryTime,
                        scheduleMeta: secondaryScheduleMeta,
                        pattern: manualSecondarySessionPattern,
                        showControls: manualSecondaryScheduleEnabled,
                        onToggleControls: (next) => {
                          setManualSecondaryScheduleEnabled(next);
                          if (!next) setManualSecondaryDays([]);
                        },
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  handleAssignManualClasses(
                    effectiveEntryType,
                    hasSecondaryTrack ? undefined : firstStudyDate.trim() || undefined,
                    buildWeeklyPatternFromSelection(
                      manualPrimaryDays,
                      primaryScheduleMeta,
                    ),
                    hasSecondaryTrack
                      ? buildWeeklyPatternFromSelection(
                          manualSecondaryDays,
                          secondaryScheduleMeta,
                        )
                      : null,
                    hasSecondaryTrack ? primaryFirstStudyDate.trim() || undefined : undefined,
                    hasSecondaryTrack ? secondaryFirstStudyDate.trim() || undefined : undefined,
                  )
                }
                disabled={
                  !manualPrimaryClassId ||
                  isAssigning ||
                  primaryManualClassOptions.length === 0 ||
                  (hasSecondaryTrack &&
                    compatibleSecondaryManualClassOptions.length === 0) ||
                  (hasSecondaryTrack && !manualSecondaryClassId) ||
                  (hasSecondaryTrack && manualTrackConflict)
                }
                className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning
                  ? "Đang xếp lớp..."
                  : showEntryTypeSelector
                    ? `Xếp lớp thủ công (${toEntryTypeLabel(effectiveEntryType)})`
                    : "Xếp lớp thủ công"}
              </button>

                {hasSecondaryTrack && manualTrackConflict && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Hai lớp thủ công đang trùng hoặc sát giờ nhau. Vui lòng chọn lại lớp để đảm bảo hai buổi cách nhau ít nhất {MIN_BETWEEN_TRACKS_MINUTES} phút.
                  </div>
                )}
            </div>
          )}

          {assignViewMode === "none" && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
              {mode === "suggested-only"
                ? "Nhấn 'Gợi ý lớp phù hợp' để xem danh sách lớp phù hợp ngay tại bước tạo đăng ký."
                : "Chọn 'Xếp lớp thủ công' để bắt đầu thao tác xếp lớp."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

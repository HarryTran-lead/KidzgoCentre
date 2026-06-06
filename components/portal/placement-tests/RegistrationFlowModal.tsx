"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dateOnlyVN } from "@/lib/datetime";
import type { PlacementTest } from "@/types/placement-test";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import {
  assignClassToRegistration,
  createRegistrationFromPlacementTest,
  extractRegistrationIdFromAction,
  suggestClassesForRegistration,
  getRegistrations,
} from "@/lib/api/registrationService";
import { getLevels } from "@/lib/api/academicProgressionService";
import type { LevelDto } from "@/types/academic-progression";
import { getAllClasses } from "@/lib/api/classService";
import { getTuitionPlans } from "@/lib/api/tuitionPlanService";
import { getActiveProgramsForDropdown } from "@/lib/api/programService";
import { getAllPlacementTests } from "@/lib/api/placementTestService";
import {
  extractDomainErrorCode,
  getDomainErrorMessage,
} from "@/lib/api/domainErrorMessage";
import type {
  EntryType,
  RegistrationTrackType,
  SuggestedClassBucket,
  WeeklyPatternEntry,
} from "@/types/registration";
import type { Program } from "@/types/admin/programs";
import CreateRegistrationStep from "@/components/portal/placement-tests/registration-flow/CreateRegistrationStep";
import SuggestAssignStep from "@/components/portal/placement-tests/registration-flow/SuggestAssignStep";
import RegistrationFlowHeader from "@/components/portal/placement-tests/registration-flow/RegistrationFlowHeader";
import RegistrationFlowStepTabs from "@/components/portal/placement-tests/registration-flow/RegistrationFlowStepTabs";
import RegistrationSelectorCard from "@/components/portal/placement-tests/registration-flow/RegistrationSelectorCard";
import RegistrationCompletionPdfModal from "@/components/portal/registrations/modals/RegistrationCompletionPdfModal";
import {
  filterClassesByLearningTicketType,
  filterSuggestedClassBucketByLearningTicketType,
  getClassSlotTypeLabel,
  getLearningTicketTypeLabel,
  isKnownNonStandardLearningTicketType,
  supportsParallelLevels,
} from "@/lib/tuitionPlanTicketType";
import {
  filterClassesByTuitionPlanEligibility,
  filterSuggestedClassBucketByTuitionPlanEligibility,
} from "@/lib/tuitionPlanClassEligibility";

interface RegistrationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTest | null;
  branchId?: string;
  allowManualAssign?: boolean;
  showEntryTypeSelector?: boolean;
  onSuccess?: () => void;
}

type AssignViewMode = "none" | "suggested" | "manual";
type ScheduleMode = "single" | "manual";
type StepKey = "create" | "assign";

type ProgramOption = {
  id: string;
  name: string;
  isMakeup?: boolean | null;
  isSupplementary?: boolean | null;
};

function stripSecondarySuggestions(bucket: SuggestedClassBucket): SuggestedClassBucket {
  const suggestedClasses = bucket.suggestedClasses || [];
  const alternativeClasses = bucket.alternativeClasses || [];

  return {
    ...bucket,
    length: suggestedClasses.length + alternativeClasses.length,
    secondaryProgramId: null,
    secondaryProgramName: null,
    secondaryProgramSkillFocus: null,
    secondaryLevelId: null,
    secondaryLevelName: null,
    secondaryLevelSkillFocus: null,
    secondarySuggestedClasses: [],
    secondaryAlternativeClasses: [],
  };
}

const WEEK_DAYS = [
  { value: "2", shortLabel: "T2", label: "Thứ 2" },
  { value: "3", shortLabel: "T3", label: "Thứ 3" },
  { value: "4", shortLabel: "T4", label: "Thứ 4" },
  { value: "5", shortLabel: "T5", label: "Thứ 5" },
  { value: "6", shortLabel: "T6", label: "Thứ 6" },
  { value: "7", shortLabel: "T7", label: "Thứ 7" },
  { value: "CN", shortLabel: "CN", label: "Chủ nhật" },
];

const TIME_SLOTS = [
  { value: "morning", label: "Sáng", timeRange: "08:00 - 10:00" },
  { value: "late-morning", label: "Trưa", timeRange: "10:00 - 12:00" },
  { value: "afternoon", label: "Chiều", timeRange: "14:00 - 16:00" },
  { value: "late-afternoon", label: "Chiều", timeRange: "16:00 - 18:00" },
  { value: "evening", label: "Tối", timeRange: "18:00 - 20:00" },
  { value: "late-evening", label: "Tối", timeRange: "19:30 - 21:30" },
];

function toInputDateValue(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return dateOnlyVN(d);
}

function formatSchedulePattern(value?: string | null) {
  if (!value) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";

  if (!raw.includes("RRULE")) {
    return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
  }

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
  const duration = map.get("DURATION");

  const pieces: string[] = [];
  if (days.length > 0) pieces.push(`Thứ: ${days.join(", ")}`);
  if (hour)
    pieces.push(`Lúc: ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  if (duration) pieces.push(`Thời lượng: ${duration} phút`);

  if (pieces.length === 0) {
    return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
  }

  return pieces.join(" • ");
}

function formatScheduleFromWeeklySlots(slots?: unknown) {
  if (!Array.isArray(slots) || slots.length === 0) return "-";

  const dayMap: Record<string, string> = {
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

  const normalizeTime = (value: unknown) => {
    const raw = String(value || "").trim();
    const matched = raw.match(/^(\d{1,2}):(\d{1,2})/);
    if (!matched) return "";
    return `${String(Number(matched[1])).padStart(2, "0")}:${String(Number(matched[2])).padStart(2, "0")}`;
  };

  return slots
    .map((slot: any) => {
      const dayRaw = String(slot?.dayOfWeek ?? slot?.dayCode ?? "")
        .trim()
        .toUpperCase();
      const dayLabel = dayMap[dayRaw] || dayRaw;
      const timeLabel = normalizeTime(slot?.startTime ?? slot?.startAt);
      if (!dayLabel || !timeLabel) return "";
      return `${dayLabel} ${timeLabel}`;
    })
    .filter(Boolean)
    .join(" • ") || "-";
}

export default function RegistrationFlowModal({
  isOpen,
  onClose,
  test,
  branchId,
  allowManualAssign = false,
  showEntryTypeSelector = true,
  onSuccess,
}: RegistrationFlowModalProps) {
  const { toast } = useToast();
  const studentName = (test?.studentName || test?.childName || "").trim();
  const modalRef = useRef<HTMLDivElement>(null);
  const lastAutoSuggestRegistrationIdRef = useRef<string>("");

  const toVietnameseError = (error: unknown, fallback: string) =>
    getDomainErrorMessage(error, fallback);

  const getErrorStatus = (error: unknown) =>
    Number((error as any)?.response?.status || (error as any)?.status || 0);

  const showDomainErrorToast = (error: unknown, fallback: string) => {
    const status = getErrorStatus(error);
    const code = extractDomainErrorCode(error);
    const isWarning =
      status === 409 ||
      code === "Registration.AlreadyExists" ||
      code === "AlreadyEnrolled";

    const isScheduleConflict =
      code === "Enrollment.StudentScheduleConflict" ||
      code === "Registration.StudentScheduleConflict" ||
      code === "StudentScheduleConflict";

    const message =
      status === 409 && isScheduleConflict
        ? "Học viên bị trùng lịch học với lớp khác ở khung giờ đã chọn. Vui lòng chọn lớp/track hoặc mẫu buổi học khác."
        : toVietnameseError(error, fallback);

    toast({
      title: isWarning ? "Cảnh báo" : "Lỗi",
      description: message,
      variant: isWarning ? "warning" : "destructive",
    });
  };

  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>([]);
  const [activePrograms, setActivePrograms] = useState<Program[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>("create");
  const [programId, setProgramId] = useState("");
    const [levels, setLevels] = useState<LevelDto[]>([]);
    const [levelId, setLevelId] = useState("");
  const [tuitionPlanId, setTuitionPlanId] = useState("");
  const [isSecondaryEnabled, setIsSecondaryEnabled] = useState(false);
  const [secondaryProgramId, setSecondaryProgramId] = useState("");
  const [secondaryProgramSkillFocus, setSecondaryProgramSkillFocus] =
    useState("");
  const [secondaryLevelId, setSecondaryLevelId] = useState("");
  const [expectedStartDate, setExpectedStartDate] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("single");
  const [manualSessionsInput, setManualSessionsInput] = useState("1");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [note, setNote] = useState("");

  const [registrationId, setRegistrationId] = useState("");
  const [registrationOptions, setRegistrationOptions] = useState<
    Array<{
      id: string;
      label: string;
      studentProfileId: string;
      preferredSchedule?: string;
      programId: string;
      programName: string;
      levelId?: string;
      levelName?: string;
      secondaryProgramId?: string;
      secondaryProgramName?: string;
      secondaryLevelId?: string;
      secondaryLevelName?: string;
      tuitionPlanId: string;
      tuitionPlanName: string;
      learningTicketTypeCode?: string | null;
      learningTicketTypeName?: string | null;
      className?: string;
      secondaryClassName?: string;
      totalSessions: number;
      usedSessions: number;
      remainingSessions: number;
    }>
  >([]);
  const [resolvedStudentProfileId, setResolvedStudentProfileId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const removeDiacritics = (value?: string | null) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");

  const normalizeName = (value?: string | null) =>
    removeDiacritics(value)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const normalizeText = (value?: string | null) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  function toDisplayDate(value?: string) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("vi-VN");
  }

  function toVietnameseStatus(status?: string) {
    const map: Record<string, string> = {
      New: "Mới",
      WaitingForClass: "Chờ xếp lớp",
      ClassAssigned: "Đã xếp lớp",
      Studying: "Đang học",
      Paused: "Tạm dừng",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
    };
    return map[String(status || "")] || status || "Không xác định";
  }
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isLoadingManualClasses, setIsLoadingManualClasses] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const [suggestedClasses, setSuggestedClasses] =
    useState<SuggestedClassBucket | null>(null);
  const [manualClasses, setManualClasses] = useState<any[]>([]);
  const [assignViewMode, setAssignViewMode] = useState<AssignViewMode>("none");
  const [selectedTrack, setSelectedTrack] =
    useState<RegistrationTrackType>("primary");
  const [assignEntryType, setAssignEntryType] = useState<EntryType>("immediate");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [manualPrimaryClassId, setManualPrimaryClassId] = useState("");
  const [manualSecondaryClassId, setManualSecondaryClassId] = useState("");
  const [manualPrimarySessionPattern, setManualPrimarySessionPattern] =
    useState("");
  const [manualSecondarySessionPattern, setManualSecondarySessionPattern] =
    useState("");
  const [isCompletionPdfOpen, setIsCompletionPdfOpen] = useState(false);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const pickClassItems = (payload: any): any[] => {
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.page?.items))
      return payload.data.page.items;
    if (Array.isArray(payload?.data?.classes?.items))
      return payload.data.classes.items;
    if (Array.isArray(payload?.data?.classes)) return payload.data.classes;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  const getClassDisplayName = (cls: any) =>
    String(
      cls?.className || cls?.title || cls?.name || cls?.code || cls?.id || "",
    );

  const getClassRemainingSlots = (cls: any) => {
    if (typeof cls?.remainingSlots === "number") return cls.remainingSlots;
    if (
      typeof cls?.capacity === "number" &&
      typeof cls?.currentEnrollment === "number"
    ) {
      return cls.capacity - cls.currentEnrollment;
    }
    if (
      typeof cls?.capacity === "number" &&
      typeof cls?.currentEnrollmentCount === "number"
    ) {
      return cls.capacity - cls.currentEnrollmentCount;
    }
    if (
      typeof cls?.maxStudents === "number" &&
      typeof cls?.currentStudentCount === "number"
    ) {
      return cls.maxStudents - cls.currentStudentCount;
    }
    return null;
  };

  const effectiveStudentProfileId = String(
    test?.studentProfileId || resolvedStudentProfileId || "",
  ).trim();

  const selectedTuitionPlan = useMemo(
    () => tuitionPlans.find((plan) => plan.id === tuitionPlanId) || null,
    [tuitionPlans, tuitionPlanId],
  );

  const manualClassOptions = useMemo(
    () =>
      manualClasses.map((cls) => {
        const classId = String(cls?.id || "");
        const remainingSlots = getClassRemainingSlots(cls);
        const scheduleLabel =
          formatSchedulePattern(
            cls?.schedulePattern || cls?.classSchedulePattern || cls?.effectiveSchedulePattern,
          ) !== "-"
            ? formatSchedulePattern(
                cls?.schedulePattern || cls?.classSchedulePattern || cls?.effectiveSchedulePattern,
              )
            : String(cls?.scheduleText || cls?.description || "").trim() ||
              formatScheduleFromWeeklySlots(cls?.weeklyScheduleSlots);
        const className = getClassDisplayName(cls);
        const slotTypeLabel = getClassSlotTypeLabel(cls);
        const moduleName = String(cls?.currentModuleName || cls?.startModuleName || "").trim();
        const moduleLabel = moduleName ? `Module: ${moduleName}` : "";
        const safeRemaining =
          typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : null;
        return {
          id: classId,
          remainingSlots: safeRemaining,
          disabled: safeRemaining !== null && safeRemaining <= 0,
          programId: String(cls?.programId || cls?.program?.id || ""),
          programName: String(cls?.programName || cls?.program?.name || ""),
          levelId: String(cls?.levelId || cls?.level?.id || ""),
          levelName: String(cls?.levelName || cls?.courseLevel || cls?.level?.name || ""),
          label: [
            className,
            String(cls?.levelName || cls?.courseLevel || cls?.level?.name || "Chưa rõ trình độ"),
            moduleLabel,
            slotTypeLabel ? `Loại: ${slotTypeLabel}` : "",
            `Còn chỗ: ${safeRemaining ?? "-"}`,
            `Lịch: ${scheduleLabel}`,
          ]
            .filter(Boolean)
            .join(" • "),
        };
      }),
    [manualClasses],
  );
  const formatDaysString = (days: string[]) => {
    const dayOrder = ["2", "3", "4", "5", "6", "7", "CN"];
    const sortedDays = [...days].sort(
      (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b),
    );

    const thuDays = sortedDays.filter((d) => d !== "CN");
    const hasSunday = sortedDays.includes("CN");

    if (thuDays.length > 0) {
      return `Thứ ${thuDays.join(",")}${hasSunday ? " & CN" : ""}`;
    }
    if (hasSunday) {
      return "CN";
    }
    return "";
  };

  const toggleDay = (dayValue: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue);
      }
      if (prev.length >= sessionsPerWeek) {
        return prev;
      }
      return [...prev, dayValue];
    });
  };

  const handleSessionsPerWeekChange = (value: number) => {
    setSessionsPerWeek(value);
    setManualSessionsInput(String(value));
    if (selectedDays.length > value) {
      setSelectedDays((prev) => prev.slice(0, value));
    }
  };

  const handleScheduleModeChange = (mode: ScheduleMode) => {
    setScheduleMode(mode);
    if (mode === "single") {
      setSessionsPerWeek(1);
      setManualSessionsInput("1");
      if (selectedDays.length > 1) {
        setSelectedDays((prev) => prev.slice(0, 1));
      }
      return;
    }

    if (sessionsPerWeek < 2) {
      setSessionsPerWeek(2);
      setManualSessionsInput("2");
    }
  };

  const handleManualSessionsInputChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    setManualSessionsInput(value);

    if (!value) return;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const normalized = Math.max(1, Math.min(7, parsed));
    setSessionsPerWeek(normalized);
    if (selectedDays.length > normalized) {
      setSelectedDays((prev) => prev.slice(0, normalized));
    }
  };

  const handleManualSessionsInputBlur = () => {
    if (!manualSessionsInput) {
      setManualSessionsInput(String(sessionsPerWeek));
      return;
    }

    const parsed = Number(manualSessionsInput);
    if (Number.isNaN(parsed)) {
      setManualSessionsInput(String(sessionsPerWeek));
      return;
    }

    const normalized = Math.max(1, Math.min(7, parsed));
    setSessionsPerWeek(normalized);
    setManualSessionsInput(String(normalized));
    if (selectedDays.length > normalized) {
      setSelectedDays((prev) => prev.slice(0, normalized));
    }
  };

  const activeProgramMap = useMemo(
    () =>
      new Map<string, Program>(
        activePrograms
          .filter((program) => Boolean(program?.id))
          .map((program) => [String(program.id), program]),
      ),
    [activePrograms],
  );

  const programs = useMemo<ProgramOption[]>(() => {
    const byProgram = new Map<string, string>();
    tuitionPlans.forEach((plan) => {
      if (!plan.isActive) return;
      if (!plan.programId) return;
      if (!byProgram.has(plan.programId)) {
        byProgram.set(plan.programId, plan.programName || "Chương trình");
      }
    });
    return Array.from(byProgram.entries()).map(([id, name]) => {
      const matchedProgram = activeProgramMap.get(id);
      return {
        id,
        name,
        isMakeup: matchedProgram?.isMakeup ?? null,
        isSupplementary: matchedProgram?.isSupplementary ?? null,
      };
    });
  }, [tuitionPlans, activeProgramMap]);

  const requiresStandardTuitionPlan = isSecondaryEnabled || Boolean(secondaryLevelId);

  const filteredTuitionPlans = useMemo(() => {
    return tuitionPlans.filter((p) => {
      if (!p.isActive) return false;
      if (!programId || !levelId) return false;
      if (p.programId !== programId || p.levelId !== levelId) return false;
      if (requiresStandardTuitionPlan && isKnownNonStandardLearningTicketType(p)) {
        return false;
      }
      return true;
    });
  }, [tuitionPlans, programId, levelId, requiresStandardTuitionPlan]);

  const selectedRegistration = useMemo(
    () => registrationOptions.find((item) => item.id === registrationId),
    [registrationId, registrationOptions],
  );
  const selectedRegistrationTuitionPlan = useMemo(
    () =>
      selectedRegistration?.tuitionPlanId
        ? tuitionPlans.find((plan) => plan.id === selectedRegistration.tuitionPlanId) ||
          null
        : null,
    [selectedRegistration?.tuitionPlanId, tuitionPlans],
  );
  const selectedRegistrationLearningTicketType = useMemo(
    () => ({
      learningTicketTypeCode:
        selectedRegistration?.learningTicketTypeCode ||
        selectedRegistrationTuitionPlan?.learningTicketTypeCode ||
        selectedTuitionPlan?.learningTicketTypeCode ||
        "",
      learningTicketTypeName:
        selectedRegistration?.learningTicketTypeName ||
        selectedRegistrationTuitionPlan?.learningTicketTypeName ||
        selectedTuitionPlan?.learningTicketTypeName ||
        "",
    }),
    [
      selectedRegistration?.learningTicketTypeCode,
      selectedRegistration?.learningTicketTypeName,
      selectedRegistrationTuitionPlan?.learningTicketTypeCode,
      selectedRegistrationTuitionPlan?.learningTicketTypeName,
      selectedTuitionPlan?.learningTicketTypeCode,
      selectedTuitionPlan?.learningTicketTypeName,
    ],
  );
  const selectedRegistrationTuitionPlanForClassEligibility =
    selectedRegistrationTuitionPlan || selectedTuitionPlan;
  const selectedLearningTicketBlocksSecondary =
    isKnownNonStandardLearningTicketType(selectedRegistrationLearningTicketType);
  const selectedRegistrationPreferredSchedule =
    selectedRegistration?.preferredSchedule || "";

  useEffect(() => {
    setSuggestedClasses((prev) => {
      if (!prev) return prev;
      const ticketFiltered = filterSuggestedClassBucketByLearningTicketType(
        prev,
        selectedRegistrationLearningTicketType,
      );
      return filterSuggestedClassBucketByTuitionPlanEligibility(
        ticketFiltered,
        selectedRegistrationTuitionPlanForClassEligibility,
      );
    });
    setManualClasses((prev) => {
      if (!prev.length) return prev;
      const ticketFiltered = filterClassesByLearningTicketType(
        prev,
        selectedRegistrationLearningTicketType,
      );
      return filterClassesByTuitionPlanEligibility(
        ticketFiltered,
        selectedRegistrationTuitionPlanForClassEligibility,
      );
    });
    setSelectedClassId("");
    setManualPrimaryClassId("");
    setManualSecondaryClassId("");
  }, [
    selectedRegistrationLearningTicketType,
    selectedRegistrationTuitionPlanForClassEligibility,
  ]);

  const selectedRegistrationProgramId = selectedRegistration?.programId || "";
  const selectedRegistrationProgramName = selectedRegistration?.programName || "";
  const selectedRegistrationLevelId = selectedRegistration?.levelId || "";
  const selectedRegistrationLevelName = selectedRegistration?.levelName || "";
  const selectedRegistrationSecondaryProgramId =
    selectedRegistration?.secondaryProgramId || "";
  const selectedRegistrationSecondaryProgramName =
    selectedRegistration?.secondaryProgramName || "";
  const selectedRegistrationSecondaryLevelId =
    selectedRegistration?.secondaryLevelId || "";
  const selectedRegistrationSecondaryLevelName =
    selectedRegistration?.secondaryLevelName || "";

  const selectedPrimaryProgram = useMemo(
    () => programs.find((program) => program.id === programId),
    [programId, programs],
  );
  const isPrimaryMainProgram = selectedPrimaryProgram
    ? !selectedPrimaryProgram.isMakeup && !selectedPrimaryProgram.isSupplementary
    : true;
  const canUseSecondaryProgram =
    isPrimaryMainProgram && !selectedLearningTicketBlocksSecondary;
  const hasSecondaryTrack = Boolean(
    canUseSecondaryProgram &&
      (secondaryProgramId ||
        secondaryLevelId ||
        suggestedClasses?.secondaryProgramId ||
        suggestedClasses?.secondaryLevelId),
  );
  const secondaryBlockedReason =
    isPrimaryMainProgram && selectedLearningTicketBlocksSecondary
      ? `Gói vé ${getLearningTicketTypeLabel(selectedRegistrationLearningTicketType)} chỉ áp dụng cho một trình độ, phần song song đã được ẩn.`
      : "";
  const canCreate =
    Boolean(effectiveStudentProfileId) &&
    Boolean(branchId) &&
    Boolean(programId) &&
    Boolean(levelId) &&
    Boolean(tuitionPlanId) &&
    Boolean(preferredSchedule.trim()) &&
    (!isSecondaryEnabled || canUseSecondaryProgram);
  const activeSuggestedClasses =
    selectedTrack === "secondary" && hasSecondaryTrack
      ? (suggestedClasses?.secondarySuggestedClasses ?? [])
      : (suggestedClasses?.suggestedClasses ?? []);
  const activeAlternativeClasses =
    selectedTrack === "secondary" && hasSecondaryTrack
      ? (suggestedClasses?.secondaryAlternativeClasses ?? [])
      : (suggestedClasses?.alternativeClasses ?? []);

  useEffect(() => {
    if (isPrimaryMainProgram) return;
    if (
      !isSecondaryEnabled &&
      !secondaryProgramId &&
      !secondaryLevelId &&
      !secondaryProgramSkillFocus
    ) {
      return;
    }
    setIsSecondaryEnabled(false);
    setSecondaryProgramId("");
    setSecondaryLevelId("");
    setSecondaryProgramSkillFocus("");
  }, [
    isPrimaryMainProgram,
    isSecondaryEnabled,
    secondaryProgramId,
    secondaryLevelId,
    secondaryProgramSkillFocus,
  ]);

  useEffect(() => {
    if (!selectedLearningTicketBlocksSecondary) return;
    if (
      !isSecondaryEnabled &&
      !secondaryProgramId &&
      !secondaryLevelId &&
      !secondaryProgramSkillFocus &&
      selectedTrack !== "secondary"
    ) {
      return;
    }

    setIsSecondaryEnabled(false);
    setSecondaryProgramId("");
    setSecondaryLevelId("");
    setSecondaryProgramSkillFocus("");
    setSelectedTrack("primary");
    setManualSecondaryClassId("");
    setManualSecondarySessionPattern("");
    setSuggestedClasses((prev) => (prev ? stripSecondarySuggestions(prev) : prev));
  }, [
    selectedLearningTicketBlocksSecondary,
    isSecondaryEnabled,
    secondaryProgramId,
    secondaryLevelId,
    secondaryProgramSkillFocus,
    selectedTrack,
  ]);

  useEffect(() => {
    if (hasSecondaryTrack || selectedTrack !== "secondary") return;
    setSelectedTrack("primary");
    setSelectedClassId("");
  }, [hasSecondaryTrack, selectedTrack]);

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        setIsBootstrapping(true);
        if (!branchId) {
          setTuitionPlans([]);
          setActivePrograms([]);
          setProgramId("");
          setTuitionPlanId("");
          return;
        }

        const [planItems, activeProgramItems] = await Promise.all([
          getTuitionPlans({
            pageNumber: 1,
            pageSize: 500,
            branchId,
          }),
          getActiveProgramsForDropdown(branchId),
        ]);

        setTuitionPlans(planItems || []);
        setActivePrograms(activeProgramItems || []);

        const normalizedRecommendation = (test?.programRecommendationName || "")
          .trim()
          .toLowerCase();
        const recommendedProgramId = String(
          test?.programRecommendationId || "",
        ).trim();
        const recommendedProgram = (planItems || []).find((p) => {
          const planProgramId = String(p.programId || "").trim();
          if (recommendedProgramId && planProgramId === recommendedProgramId) {
            return true;
          }
          if (!normalizedRecommendation) return false;
          return (p.programName || "").trim().toLowerCase() === normalizedRecommendation;
        });

        const firstProgramId =
          (planItems || []).find((p) => p.isActive)?.programId || "";
        const nextProgramId = recommendedProgram?.programId || firstProgramId;
        setProgramId(nextProgramId);
        setTuitionPlanId("");
        setIsSecondaryEnabled(Boolean(test?.secondaryLevelRecommendationId));
        setSecondaryProgramId("");
        setSecondaryLevelId(String(test?.secondaryLevelRecommendationId || ""));
        setSecondaryProgramSkillFocus(test?.secondaryLevelSkillFocus || "");

        setExpectedStartDate(toInputDateValue(test?.scheduledAt));
        setPreferredSchedule("");
        setSessionsPerWeek(1);
        setScheduleMode("single");
        setManualSessionsInput("1");
        setSelectedDays([]);
        setSelectedTimeSlot("");
        setUseCustomTime(false);
        setStartTime("18:00");
        setEndTime("20:00");
        setNote(studentName);
        setResolvedStudentProfileId("");

        let inferredStudentProfileId = String(test?.studentProfileId || "").trim();
        if (!inferredStudentProfileId && branchId && (test?.leadChildId || test?.leadId || studentName)) {
          try {
            const historyResponse = await getAllPlacementTests({
              page: 1,
              pageSize: 500,
              branchId,
              searchTerm: studentName || undefined,
            });

            const historyItems = Array.isArray(historyResponse?.data?.items)
              ? historyResponse.data.items
              : [];
            const targetLeadChildId = String(test?.leadChildId || "").trim();
            const targetLeadId = String(test?.leadId || "").trim();
            const targetName = normalizeName(studentName || test?.childName || test?.studentName || "");

            const matchedHistory = historyItems
              .filter((item: PlacementTest) => {
                if (!item) return false;
                if (String(item.id || "") === String(test?.id || "")) return false;

                const profileId = String(item.studentProfileId || "").trim();
                if (!profileId) return false;

                const itemLeadChildId = String(item.leadChildId || "").trim();
                const itemLeadId = String(item.leadId || "").trim();
                const itemName = normalizeName(item.studentName || item.childName || "");

                if (targetLeadChildId && itemLeadChildId && targetLeadChildId === itemLeadChildId) {
                  return true;
                }

                if (targetLeadId && itemLeadId && targetLeadId === itemLeadId && targetName && itemName) {
                  return targetName === itemName;
                }

                return false;
              })
              .sort((a: PlacementTest, b: PlacementTest) => {
                const bt = new Date(b.updatedAt || b.createdAt || b.scheduledAt || "").getTime();
                const at = new Date(a.updatedAt || a.createdAt || a.scheduledAt || "").getTime();
                return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
              });

            inferredStudentProfileId = String(matchedHistory[0]?.studentProfileId || "").trim();
          } catch (error) {
            console.warn("Failed to infer student profile from placement test history", error);
          }
        }

        if (inferredStudentProfileId || studentName) {
          const registrationsResponse = await getRegistrations({
            branchId,
            pageNumber: 1,
            pageSize: 500,
            studentProfileId: inferredStudentProfileId || undefined,
          });

          const normalizedStudentName = normalizeName(studentName);
          const filteredRegistrations = (
            registrationsResponse.items || []
          ).filter((r) => {
            if (inferredStudentProfileId) {
              return (
                String(r.studentProfileId || "") ===
                String(inferredStudentProfileId)
              );
            }
            if (!normalizedStudentName) {
              return false;
            }
            return normalizeName(r.studentName) === normalizedStudentName;
          });

          const sortedRegistrations = [...filteredRegistrations].sort(
            (a, b) => {
              const bt = new Date(
                b.createdAt || b.registrationDate || "",
              ).getTime();
              const at = new Date(
                a.createdAt || a.registrationDate || "",
              ).getTime();
              return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
            },
          );

          const options = sortedRegistrations.map((r) => {
            const classNames = [
              String(r.className || "").trim(),
              String(r.secondaryClassName || "").trim(),
            ].filter(Boolean);

            return {
              id: r.id,
              studentProfileId: String(r.studentProfileId || ""),
              preferredSchedule: String(r.preferredSchedule || ""),
              programId: String(r.programId || ""),
              programName: String(r.programName || ""),
              levelId: String(r.levelId || ""),
              levelName: String(r.levelName || ""),
              secondaryProgramId: String(r.secondaryProgramId || ""),
              secondaryProgramName: String(r.secondaryProgramName || ""),
              secondaryLevelId: String(r.secondaryLevelId || ""),
              secondaryLevelName: String(r.secondaryLevelName || ""),
              tuitionPlanId: String(r.tuitionPlanId || ""),
              tuitionPlanName: String(r.tuitionPlanName || ""),
              learningTicketTypeCode: String(r.learningTicketTypeCode || ""),
              learningTicketTypeName: String(r.learningTicketTypeName || ""),
              className: String(r.className || ""),
              secondaryClassName: String(r.secondaryClassName || ""),
              totalSessions: Number(r.totalSessions ?? 0),
              usedSessions: Number(r.usedSessions ?? 0),
              remainingSessions: Number(r.remainingSessions ?? 0),
              label: `${r.studentName} • ${toVietnameseStatus(r.status)} • ${toDisplayDate(r.createdAt)} • ${r.programName}${r.secondaryLevelName ? ` • ${r.secondaryLevelName}` : ""}${classNames.length > 0 ? ` • Lớp: ${classNames.join(" + ")}` : ""}`,
            };
          });
          setRegistrationOptions(options);

          const placementLinked = test?.id
            ? sortedRegistrations.find((r) =>
                String(r.note || "").includes(`PlacementTest:${test.id}`),
              )
            : undefined;
          const defaultRegistration = placementLinked || sortedRegistrations[0];
          // Keep registration unselected by default so staff can create a fresh registration.
          setRegistrationId("");
          if (!test?.studentProfileId) {
            setResolvedStudentProfileId(
              String(defaultRegistration?.studentProfileId || inferredStudentProfileId || ""),
            );
          }
        } else {
          setRegistrationOptions([]);
          setRegistrationId("");
          setResolvedStudentProfileId("");
        }

        setSuggestedClasses(null);
        setManualClasses([]);
        setAssignViewMode("none");
        setSelectedTrack("primary");
        setAssignEntryType("immediate");
        setSelectedClassId("");
        setManualPrimaryClassId("");
        setManualSecondaryClassId("");
        setManualPrimarySessionPattern("");
        setManualSecondarySessionPattern("");
        setActiveStep("create");
      } catch (error) {
        console.error("Error loading registration options:", error);
        toast({
          title: "Lỗi",
          description: toVietnameseError(
            error,
            "Không thể tải dữ liệu đăng ký. Vui lòng thử lại.",
          ),
          variant: "destructive",
        });
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadOptions();
  }, [
    isOpen,
    branchId,
    studentName,
    test?.id,
    test?.programRecommendationId,
    test?.programRecommendationName,
    test?.secondaryLevelRecommendationId,
    test?.secondaryLevelRecommendationName,
    test?.secondaryLevelSkillFocus,
    test?.scheduledAt,
    toast,
  ]);

    // Load levels for selected program
    useEffect(() => {
      let cancelled = false;
      if (!programId) {
        setLevels([]);
        setLevelId("");
        return;
      }

      const loadLevels = async () => {
        try {
          const res = await getLevels({ programId, isActive: true });
          const items = res?.data?.items || [];
          if (cancelled) return;
          setLevels(items as LevelDto[]);
          const suggestedPrimaryLevelId = String(
            test?.primaryLevelRecommendationId || "",
          ).trim();
          const hasSuggestedPrimaryLevel = suggestedPrimaryLevelId
            ? items.some((item) => String(item?.id || "") === suggestedPrimaryLevelId)
            : false;
          const fallbackLevelId = items.length ? String(items[0].id || "") : "";

          if (hasSuggestedPrimaryLevel) {
            setLevelId(suggestedPrimaryLevelId);
          } else {
            setLevelId(fallbackLevelId);
          }
        } catch (e) {
          if (cancelled) return;
          setLevels([]);
        }
      };

      void loadLevels();

      return () => {
        cancelled = true;
      };
    }, [programId, test?.primaryLevelRecommendationId]);

  useEffect(() => {
    if (test?.studentProfileId) {
      setResolvedStudentProfileId("");
      return;
    }

    if (!registrationId) {
      return;
    }

    const selectedRegistration = registrationOptions.find(
      (item) => item.id === registrationId,
    );
    setResolvedStudentProfileId(
      String(selectedRegistration?.studentProfileId || ""),
    );
  }, [test?.studentProfileId, registrationId, registrationOptions]);

  useEffect(() => {
    if (!programId || !levelId) {
      setTuitionPlanId("");
      return;
    }

    const match = filteredTuitionPlans.find((p) => p.id === tuitionPlanId);
    if (!match) {
      const first = filteredTuitionPlans[0];
      setTuitionPlanId(first?.id || "");
    }
  }, [programId, levelId, tuitionPlanId, filteredTuitionPlans]);

  useEffect(() => {
    if (selectedDays.length === 0) {
      setPreferredSchedule("");
      return;
    }

    const dayString = formatDaysString(selectedDays);
    if (!dayString) {
      setPreferredSchedule("");
      return;
    }

    if (!useCustomTime) {
      const selectedRange = TIME_SLOTS.find(
        (slot) => slot.value === selectedTimeSlot,
      )?.timeRange;
      if (!selectedRange) {
        setPreferredSchedule("");
        return;
      }
      setPreferredSchedule(`${dayString} (${selectedRange})`);
      return;
    }

    if (!startTime || !endTime || startTime >= endTime) {
      setPreferredSchedule("");
      return;
    }

    setPreferredSchedule(`${dayString} (${startTime} - ${endTime})`);
  }, [selectedDays, selectedTimeSlot, useCustomTime, startTime, endTime]);

  const handleCreateRegistration = async () => {
    if (!test?.id) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không tìm thấy bài kiểm tra xếp lớp để tạo đăng ký.",
        variant: "destructive",
      });
      return;
    }

    if (!effectiveStudentProfileId || !branchId) {
      toast({
        title: "Thiếu dữ liệu",
        description:
          "Không tìm thấy Student Profile để tạo đăng ký hoặc thiếu chi nhánh. Vui lòng chọn đăng ký hiện có hoặc tạo profile trước.",
        variant: "destructive",
      });
      return;
    }

    if (!preferredSchedule.trim()) {
      toast({
        title: "Thiếu lịch học",
        description: "Vui lòng chọn ngày học và khung giờ học mong muốn.",
        variant: "destructive",
      });
      return;
    }

    if (!isPrimaryMainProgram && isSecondaryEnabled) {
      toast({
        title: "Không hợp lệ",
        description:
          "Chương trình bù/phụ trợ phải tạo đăng ký riêng, không thể đăng ký song song trong cùng một đăng ký.",
        variant: "destructive",
      });
      return;
    }

    if (isSecondaryEnabled && !canUseSecondaryProgram) {
      toast({
        title: "Không hợp lệ",
        description:
          "Gói học hiện tại không phải STANDARD nên không thể dùng cho hai trình độ song song.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const shouldCreateSecondaryTrack = isSecondaryEnabled && canUseSecondaryProgram;
      const { registrationId: createdId } =
        await createRegistrationFromPlacementTest({
          placementTestId: test.id,
          studentProfileId: effectiveStudentProfileId,
          branchId,
          programId,
          levelId,
          tuitionPlanId,
          secondaryLevelId: shouldCreateSecondaryTrack
            ? secondaryLevelId || undefined
            : undefined,
          secondaryLevelSkillFocus: shouldCreateSecondaryTrack && secondaryLevelId
            ? secondaryProgramSkillFocus || undefined
            : undefined,
          expectedStartDate: expectedStartDate || undefined,
          preferredSchedule: preferredSchedule || undefined,
          note: note || undefined,
        });

      setRegistrationId(createdId);
      setRegistrationOptions((prev) => {
        const exists = prev.some((item) => item.id === createdId);
        if (exists) return prev;
        return [
          {
            id: createdId,
            studentProfileId: effectiveStudentProfileId,
            preferredSchedule: preferredSchedule || "",
            programId,
            programName:
              tuitionPlans.find((p) => p.programId === programId)?.programName ||
              "",
            levelId,
            levelName: levels.find((item) => String(item.id) === levelId)?.name || "",
            secondaryLevelId: shouldCreateSecondaryTrack ? secondaryLevelId : "",
            secondaryLevelName: shouldCreateSecondaryTrack
              ? levels.find((item) => String(item.id) === secondaryLevelId)?.name || ""
              : "",
            tuitionPlanId,
            tuitionPlanName:
              tuitionPlans.find((p) => p.id === tuitionPlanId)?.name || "",
            learningTicketTypeCode:
              tuitionPlans.find((p) => p.id === tuitionPlanId)?.learningTicketTypeCode || "",
            learningTicketTypeName:
              tuitionPlans.find((p) => p.id === tuitionPlanId)?.learningTicketTypeName || "",
            totalSessions:
              tuitionPlans.find((p) => p.id === tuitionPlanId)?.totalSessions || 0,
            usedSessions: 0,
            remainingSessions:
              tuitionPlans.find((p) => p.id === tuitionPlanId)?.totalSessions || 0,
            label: `${studentName || "Học viên"} • Mới • ${toDisplayDate(new Date().toISOString())}`,
          },
          ...prev,
        ];
      });
      setAssignViewMode("suggested");
      setActiveStep("create");
      lastAutoSuggestRegistrationIdRef.current = createdId;
      await handleSuggestClasses(createdId, shouldCreateSecondaryTrack);
      toast({
        title: "Thành công",
        description: "Đã tạo đăng ký học viên.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      const code = extractDomainErrorCode(error);
      if (code === "Registration.TuitionPlanNotFound") {
        setTuitionPlanId("");
      }
      if (code === "Registration.ProgramNotFound") {
        setProgramId("");
        setTuitionPlanId("");
      }
      if (code === "Registration.SecondaryProgramDuplicated") {
        setIsSecondaryEnabled(true);
      }
      showDomainErrorToast(error, "Không thể tạo đăng ký.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuggestClasses = async (
    targetRegistrationId?: string,
    allowSecondaryOverride?: boolean,
  ) => {
    const registrationIdToSuggest = targetRegistrationId || registrationId;
    if (!registrationIdToSuggest) return;

    try {
      setIsSuggesting(true);
      setAssignViewMode("suggested");
      const suggestions = await suggestClassesForRegistration(registrationIdToSuggest);
      const registrationForSuggestion = registrationOptions.find(
        (item) => item.id === registrationIdToSuggest,
      );
      const registrationPlan =
        registrationForSuggestion?.tuitionPlanId
          ? tuitionPlans.find((plan) => plan.id === registrationForSuggestion.tuitionPlanId) ||
            selectedTuitionPlan
          : selectedTuitionPlan;
      const learningTicketTypeForSuggestion = {
        learningTicketTypeCode:
          registrationForSuggestion?.learningTicketTypeCode ||
          registrationPlan?.learningTicketTypeCode ||
          "",
        learningTicketTypeName:
          registrationForSuggestion?.learningTicketTypeName ||
          registrationPlan?.learningTicketTypeName ||
          "",
      };
      const canUseSecondaryForSuggestion =
        allowSecondaryOverride ??
        supportsParallelLevels(learningTicketTypeForSuggestion);
      const ticketFilteredSuggestions = filterSuggestedClassBucketByLearningTicketType(
        suggestions,
        learningTicketTypeForSuggestion,
      );
      const planFilteredSuggestions =
        filterSuggestedClassBucketByTuitionPlanEligibility(
          ticketFilteredSuggestions,
          registrationPlan,
        );
      const visibleSuggestions = canUseSecondaryForSuggestion
        ? planFilteredSuggestions
        : stripSecondarySuggestions(planFilteredSuggestions);

      setSuggestedClasses(visibleSuggestions);
      const primaryCount = visibleSuggestions?.suggestedClasses?.length ?? 0;
      const secondaryCount =
        visibleSuggestions?.secondarySuggestedClasses?.length ?? 0;
      const defaultTrack: RegistrationTrackType =
        primaryCount > 0
          ? "primary"
          : secondaryCount > 0
            ? "secondary"
            : "primary";
      const defaultClass =
        defaultTrack === "secondary"
          ? visibleSuggestions?.secondarySuggestedClasses?.[0]
          : visibleSuggestions?.suggestedClasses?.[0];
      setSelectedTrack(defaultTrack);
      if (defaultClass?.id) {
        setSelectedClassId(String(defaultClass.id));
        toast({
          title: "Thành công",
          description: `Đã gợi ý ${visibleSuggestions.length || 0} lớp phù hợp cho đăng ký.`,
          variant: "success",
        });
      } else {
        setSelectedClassId("");
        toast({
          title: "Thông báo",
          description: "Hiện chưa có lớp phù hợp với đăng ký này.",
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: toVietnameseError(
          error,
          "Không thể lấy danh sách lớp gợi ý.",
        ),
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAssignClass = async (
    sessionSelectionPattern?: string,
    entryType: EntryType = "immediate",
    firstStudyDate?: string,
    weeklyPattern?: WeeklyPatternEntry[] | null,
  ) => {
    if (!registrationId || !selectedClassId) return;
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
      const response = await assignClassToRegistration(registrationId, {
        classId: selectedClassId,
        entryType,
        track: selectedTrack,
        firstStudyDate: firstStudyDate?.trim() || undefined,
        sessionSelectionPattern: sessionSelectionPattern || undefined,
        weeklyPattern:
          weeklyPattern !== undefined
            ? weeklyPattern
            : sessionSelectionPattern
              ? undefined
              : null,
      });

      const nextRegistrationId = extractRegistrationIdFromAction(response) || registrationId;
      const isRetakeNewRegistration = nextRegistrationId !== registrationId;
      if (isRetakeNewRegistration) {
        setRegistrationId(nextRegistrationId);
      }

      toast({
        title: "Thành công",
        description: isRetakeNewRegistration
          ? `Đã xếp lớp và tạo đăng ký mới (${nextRegistrationId}).`
          : "Đã xếp lớp cho đăng ký.",
        variant: "success",
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showDomainErrorToast(error, "Không thể xếp lớp này.");
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
    if (!registrationId || !payload.primaryClassId) return;

    try {
      setIsAssigning(true);
      const selectedEntryType = payload.entryType || "immediate";
      const normalizedFirstStudyDate = payload.firstStudyDate?.trim() || undefined;
      const normalizedPrimaryFirstStudyDate =
        payload.primaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      const normalizedSecondaryFirstStudyDate =
        payload.secondaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      let targetRegistrationId = registrationId;

      const primaryResponse = await assignClassToRegistration(targetRegistrationId, {
        classId: payload.primaryClassId,
        entryType: selectedEntryType,
        track: "primary",
        firstStudyDate: normalizedPrimaryFirstStudyDate,
        sessionSelectionPattern:
          payload.primarySessionSelectionPattern || undefined,
        weeklyPattern:
          payload.primaryWeeklyPattern !== undefined
            ? payload.primaryWeeklyPattern
            : payload.primarySessionSelectionPattern
              ? undefined
              : null,
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
          weeklyPattern:
            payload.secondaryWeeklyPattern !== undefined
              ? payload.secondaryWeeklyPattern
              : payload.secondarySessionSelectionPattern
                ? undefined
                : null,
        });
        targetRegistrationId = extractRegistrationIdFromAction(secondaryResponse) || targetRegistrationId;
      }

      const isRetakeNewRegistration = targetRegistrationId !== registrationId;
      if (isRetakeNewRegistration) {
        setRegistrationId(targetRegistrationId);
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
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showDomainErrorToast(error, "Không thể xếp lớp gợi ý.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleLoadManualClasses = async () => {
    if (!registrationId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn đăng ký trước khi xếp lớp thủ công.",
        variant: "destructive",
      });
      return;
    }

    if (!branchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được chi nhánh để lọc danh sách lớp.",
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
        branchId,
      });

      const allItems = pickClassItems(response)
        .filter((item) => item?.id)
        .filter((item) => {
          const status = String(item?.status || "").toLowerCase();
          return status !== "cancelled" && status !== "completed";
        });
      const ticketFilteredItems = filterClassesByLearningTicketType(
        allItems,
        selectedRegistrationLearningTicketType,
      );
      const items = filterClassesByTuitionPlanEligibility(
        ticketFilteredItems,
        selectedRegistrationTuitionPlanForClassEligibility,
      );

      const countClassesByProgramAndLevel = (
        targetProgramId?: string,
        targetProgramName?: string,
        targetLevelId?: string,
        targetLevelName?: string,
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

      const primaryProgramFilterId = selectedRegistrationProgramId || programId;
      const primaryLevelFilterId = selectedRegistrationLevelId || levelId;
      const secondaryProgramFilterId =
        selectedRegistrationSecondaryProgramId ||
        secondaryProgramId ||
        suggestedClasses?.secondaryProgramId ||
        selectedRegistrationProgramId ||
        programId ||
        "";
      const secondaryLevelFilterId =
        selectedRegistrationSecondaryLevelId ||
        secondaryLevelId ||
        suggestedClasses?.secondaryLevelId ||
        "";
      const primaryFilteredCount = countClassesByProgramAndLevel(
        primaryProgramFilterId,
        selectedRegistrationProgramName,
        primaryLevelFilterId,
        selectedRegistrationLevelName || levels.find((item) => String(item.id) === primaryLevelFilterId)?.name || "",
      );
      const secondaryFilteredCount = hasSecondaryTrack
        ? countClassesByProgramAndLevel(
            secondaryProgramFilterId,
            selectedRegistrationSecondaryProgramName ||
              suggestedClasses?.secondaryProgramName ||
              selectedRegistrationProgramName ||
              "",
            secondaryLevelFilterId,
            selectedRegistrationSecondaryLevelName ||
              suggestedClasses?.secondaryLevelName ||
              levels.find((item) => String(item.id) === secondaryLevelFilterId)?.name ||
              "",
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
        const firstClassId = String(firstClass?.id || "");
        const secondClassId = String(secondClass?.id || firstClass?.id || "");
        setManualPrimaryClassId(firstClassId);
        setManualSecondaryClassId(hasSecondaryTrack ? secondClassId : "");
        setManualPrimarySessionPattern("");
        setManualSecondarySessionPattern("");
        toast({
          title: "Thành công",
          description: hasSecondaryTrack
            ? `Đã tải ${primaryFilteredCount} lớp cho chương trình chính và ${secondaryFilteredCount} lớp cho chương trình song song để xếp lớp thủ công.`
            : `Đã tải ${primaryFilteredCount} lớp để xếp lớp thủ công.`,
          variant: "success",
        });
      } else {
        setManualPrimaryClassId("");
        setManualSecondaryClassId("");
        setManualPrimarySessionPattern("");
        setManualSecondarySessionPattern("");
        toast({
          title: "Thông báo",
          description: `Không có lớp ${getLearningTicketTypeLabel(selectedRegistrationLearningTicketType)} phù hợp trong chi nhánh hiện tại.`,
          variant: "default",
        });
      }
    } catch (error: any) {
      showDomainErrorToast(error, "Không thể tải danh sách lớp thủ công.");
    } finally {
      setIsLoadingManualClasses(false);
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
    if (!registrationId || !manualPrimaryClassId) return;

    if (hasSecondaryTrack) {
      if (!manualSecondaryClassId) {
        toast({
          title: "Thiếu dữ liệu",
          description: "Vui lòng chọn lớp cho chương trình song song.",
          variant: "destructive",
        });
        return;
      }

      if (manualSecondaryClassId === manualPrimaryClassId) {
        toast({
          title: "Không hợp lệ",
          description:
            "Lớp của chương trình chính và chương trình song song phải khác nhau.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsAssigning(true);
      const normalizedFirstStudyDate = firstStudyDate?.trim() || undefined;
      const normalizedPrimaryFirstStudyDate =
        primaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      const normalizedSecondaryFirstStudyDate =
        secondaryFirstStudyDate?.trim() || normalizedFirstStudyDate;
      let targetRegistrationId = registrationId;

      const primaryResponse = await assignClassToRegistration(targetRegistrationId, {
        classId: manualPrimaryClassId,
        entryType,
        track: "primary",
        firstStudyDate: normalizedPrimaryFirstStudyDate,
        sessionSelectionPattern: manualPrimarySessionPattern || undefined,
        weeklyPattern:
          primaryWeeklyPattern !== undefined
            ? primaryWeeklyPattern
            : manualPrimarySessionPattern
              ? undefined
              : null,
      });

      targetRegistrationId = extractRegistrationIdFromAction(primaryResponse) || targetRegistrationId;

      if (hasSecondaryTrack) {
        const secondaryResponse = await assignClassToRegistration(targetRegistrationId, {
          classId: manualSecondaryClassId,
          entryType,
          track: "secondary",
          firstStudyDate: normalizedSecondaryFirstStudyDate,
          sessionSelectionPattern: manualSecondarySessionPattern || undefined,
          weeklyPattern:
            secondaryWeeklyPattern !== undefined
              ? secondaryWeeklyPattern
              : manualSecondarySessionPattern
                ? undefined
                : null,
        });
        targetRegistrationId = extractRegistrationIdFromAction(secondaryResponse) || targetRegistrationId;
      }

      const isRetakeNewRegistration = targetRegistrationId !== registrationId;
      if (isRetakeNewRegistration) {
        setRegistrationId(targetRegistrationId);
      }

      toast({
        title: "Thành công",
        description: isRetakeNewRegistration
          ? `Đã xếp lớp và tạo đăng ký mới (${targetRegistrationId}).`
          : hasSecondaryTrack
            ? "Đã xếp lớp thủ công cho cả chương trình chính và chương trình song song."
            : "Đã xếp lớp thủ công cho chương trình chính.",
        variant: "success",
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showDomainErrorToast(error, "Không thể xếp lớp thủ công.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleMoveToWaitingList = async () => {
    if (!registrationId) return;

    try {
      setIsWaiting(true);
      await assignClassToRegistration(registrationId, {
        entryType: "wait",
        track: selectedTrack,
      });
      toast({
        title: "Thành công",
        description: "Đã chuyển đăng ký sang trạng thái chờ xếp lớp.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      showDomainErrorToast(
        error,
        "Không thể chuyển đăng ký vào trạng thái chờ xếp lớp.",
      );
    } finally {
      setIsWaiting(false);
    }
  };

  useEffect(() => {
    if (!registrationId || !preferredSchedule.trim()) return;
    if (assignViewMode !== "none") return;
    if (lastAutoSuggestRegistrationIdRef.current === registrationId) return;

    lastAutoSuggestRegistrationIdRef.current = registrationId;
    void handleSuggestClasses(registrationId);
  }, [registrationId, preferredSchedule, assignViewMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={modalRef}
        className="h-[90dvh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col transition-all duration-200 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}
        style={{ width: "96vw", maxWidth: "1050px" }}
      >
        <RegistrationFlowHeader
          studentName={studentName}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            <RegistrationFlowStepTabs
              activeStep={activeStep}
              onChangeStep={setActiveStep}
            />

            <RegistrationSelectorCard
              registrationId={registrationId}
              registrationOptions={registrationOptions}
              onValueChange={(val) => {
                const normalizedValue = val === "__create_new__" ? "" : val;
                setRegistrationId(normalizedValue);
                setAssignViewMode("none");
                setAssignEntryType("immediate");
                setSuggestedClasses(null);
                setSelectedClassId("");
                if (normalizedValue) {
                  lastAutoSuggestRegistrationIdRef.current = "";
                }
                if (!test?.studentProfileId) {
                  const selectedRegistration = registrationOptions.find(
                    (item) => item.id === normalizedValue,
                  );
                  const fallbackStudentProfileId = normalizedValue
                    ? selectedRegistration?.studentProfileId
                    : resolvedStudentProfileId || registrationOptions[0]?.studentProfileId;
                  setResolvedStudentProfileId(
                    String(fallbackStudentProfileId || ""),
                  );
                }
              }}
            />

            {/* Warning messages - Modern alerts */}
            {!effectiveStudentProfileId && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  Placement test này chưa có Student Profile. Vui lòng dùng chức
                  năng &quot;Tạo tài khoản & Profile&quot; trước khi tạo đăng ký.
                </div>
              </div>
            )}

            {!!test?.studentProfileId && !branchId && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                <div className="text-sm text-red-700">
                  Không xác định được chi nhánh của tài khoản staff đang đăng
                  nhập. Vui lòng kiểm tra lại hồ sơ tài khoản.
                </div>
              </div>
            )}

            {/* Loading state */}
            {isBootstrapping && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-red-500" />
                <p className="mt-3 text-sm text-gray-500">Đang tải dữ liệu...</p>
              </div>
            )}

            {/* Content area */}
            {!isBootstrapping && (
              <div className="min-h-0">
                {activeStep === "create" ? (
                  <CreateRegistrationStep
                    isBootstrapping={isBootstrapping}
                    effectiveStudentProfileId={effectiveStudentProfileId}
                    studentName={studentName}
                    programId={programId}
                    setProgramId={setProgramId}
                    levelId={levelId}
                    setLevelId={setLevelId}
                    tuitionPlanId={tuitionPlanId}
                    setTuitionPlanId={setTuitionPlanId}
                    isSecondaryEnabled={isSecondaryEnabled}
                    setIsSecondaryEnabled={setIsSecondaryEnabled}
                    secondaryAllowed={canUseSecondaryProgram}
                    secondaryProgramId={secondaryProgramId}
                    setSecondaryProgramId={setSecondaryProgramId}
                    secondaryLevelId={secondaryLevelId}
                    setSecondaryLevelId={setSecondaryLevelId}
                    secondaryProgramSkillFocus={secondaryProgramSkillFocus}
                    setSecondaryProgramSkillFocus={setSecondaryProgramSkillFocus}
                    expectedStartDate={expectedStartDate}
                    setExpectedStartDate={setExpectedStartDate}
                    sessionsPerWeek={sessionsPerWeek}
                    handleSessionsPerWeekChange={handleSessionsPerWeekChange}
                    scheduleMode={scheduleMode}
                    onScheduleModeChange={handleScheduleModeChange}
                    manualSessionsInput={manualSessionsInput}
                    onManualSessionsInputChange={handleManualSessionsInputChange}
                    onManualSessionsInputBlur={handleManualSessionsInputBlur}
                    selectedDays={selectedDays}
                    toggleDay={toggleDay}
                    selectedTimeSlot={selectedTimeSlot}
                    setSelectedTimeSlot={setSelectedTimeSlot}
                    note={note}
                    setNote={setNote}
                    handleCreateRegistration={handleCreateRegistration}
                    canCreate={canCreate}
                    isCreating={isCreating}
                    registrationId={registrationId}
                    programs={programs}
                    filteredTuitionPlans={filteredTuitionPlans}
                    requiresStandardTuitionPlan={requiresStandardTuitionPlan}
                    secondaryBlockedReason={secondaryBlockedReason}
                    levels={levels}
                    weekDays={WEEK_DAYS}
                    timeSlots={TIME_SLOTS}
                    suggestedPanel={(
                      <SuggestAssignStep
                        mode="suggested-only"
                        registrationId={registrationId}
                        isSuggesting={isSuggesting}
                        assignViewMode={assignViewMode}
                        handleSuggestClasses={handleSuggestClasses}
                        allowManualAssign={allowManualAssign}
                        handleLoadManualClasses={handleLoadManualClasses}
                        isLoadingManualClasses={isLoadingManualClasses}
                        branchId={branchId}
                        handleMoveToWaitingList={handleMoveToWaitingList}
                        isWaiting={isWaiting}
                        suggestedClasses={suggestedClasses}
                        hasSecondaryTrack={hasSecondaryTrack}
                        selectedTrack={selectedTrack}
                        setSelectedTrack={setSelectedTrack}
                        selectedEntryType={assignEntryType}
                        setSelectedEntryType={setAssignEntryType}
                        showEntryTypeSelector={showEntryTypeSelector}
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
                        manualPrimaryProgramId={selectedRegistrationProgramId || programId}
                        manualPrimaryProgramName={selectedRegistrationProgramName}
                        manualPrimaryLevelId={selectedRegistrationLevelId || levelId}
                        manualPrimaryLevelName={
                          selectedRegistrationLevelName ||
                          levels.find((item) => String(item.id) === levelId)?.name ||
                          ""
                        }
                        manualSecondaryProgramId={
                          selectedRegistrationSecondaryProgramId ||
                          secondaryProgramId ||
                          suggestedClasses?.secondaryProgramId ||
                          selectedRegistrationProgramId ||
                          programId ||
                          ""
                        }
                        manualSecondaryProgramName={
                          selectedRegistrationSecondaryProgramName ||
                          suggestedClasses?.secondaryProgramName ||
                          selectedRegistrationProgramName ||
                          ""
                        }
                        manualSecondaryLevelId={
                          selectedRegistrationSecondaryLevelId ||
                          secondaryLevelId ||
                          suggestedClasses?.secondaryLevelId ||
                          ""
                        }
                        manualSecondaryLevelName={
                          selectedRegistrationSecondaryLevelName ||
                          suggestedClasses?.secondaryLevelName ||
                          levels.find((item) => String(item.id) === secondaryLevelId)?.name ||
                          ""
                        }
                        preferredSchedule={selectedRegistrationPreferredSchedule}
                        manualPrimarySessionPattern={manualPrimarySessionPattern}
                        setManualPrimarySessionPattern={setManualPrimarySessionPattern}
                        manualSecondarySessionPattern={manualSecondarySessionPattern}
                        setManualSecondarySessionPattern={setManualSecondarySessionPattern}
                        handleAssignManualClasses={handleAssignManualClasses}
                      />
                    )}
                  />
                ) : (
                  <SuggestAssignStep
                    mode="manual-wait-only"
                    registrationId={registrationId}
                    isSuggesting={isSuggesting}
                    assignViewMode={assignViewMode}
                    handleSuggestClasses={handleSuggestClasses}
                    allowManualAssign={allowManualAssign}
                    handleLoadManualClasses={handleLoadManualClasses}
                    isLoadingManualClasses={isLoadingManualClasses}
                    branchId={branchId}
                    handleMoveToWaitingList={handleMoveToWaitingList}
                    isWaiting={isWaiting}
                    suggestedClasses={suggestedClasses}
                    hasSecondaryTrack={hasSecondaryTrack}
                    selectedTrack={selectedTrack}
                    setSelectedTrack={setSelectedTrack}
                    selectedEntryType={assignEntryType}
                    setSelectedEntryType={setAssignEntryType}
                    showEntryTypeSelector={showEntryTypeSelector}
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
                    manualPrimaryProgramId={selectedRegistrationProgramId || programId}
                    manualPrimaryProgramName={selectedRegistrationProgramName}
                    manualPrimaryLevelId={selectedRegistrationLevelId || levelId}
                    manualPrimaryLevelName={
                      selectedRegistrationLevelName ||
                      levels.find((item) => String(item.id) === levelId)?.name ||
                      ""
                    }
                    manualSecondaryProgramId={
                      selectedRegistrationSecondaryProgramId ||
                      secondaryProgramId ||
                      suggestedClasses?.secondaryProgramId ||
                      selectedRegistrationProgramId ||
                      programId ||
                      ""
                    }
                    manualSecondaryProgramName={
                      selectedRegistrationSecondaryProgramName ||
                      suggestedClasses?.secondaryProgramName ||
                      selectedRegistrationProgramName ||
                      ""
                    }
                    manualSecondaryLevelId={
                      selectedRegistrationSecondaryLevelId ||
                      secondaryLevelId ||
                      suggestedClasses?.secondaryLevelId ||
                      ""
                    }
                    manualSecondaryLevelName={
                      selectedRegistrationSecondaryLevelName ||
                      suggestedClasses?.secondaryLevelName ||
                      levels.find((item) => String(item.id) === secondaryLevelId)?.name ||
                      ""
                    }
                    preferredSchedule={selectedRegistrationPreferredSchedule}
                    manualPrimarySessionPattern={manualPrimarySessionPattern}
                    setManualPrimarySessionPattern={setManualPrimarySessionPattern}
                    manualSecondarySessionPattern={manualSecondarySessionPattern}
                    setManualSecondarySessionPattern={setManualSecondarySessionPattern}
                    handleAssignManualClasses={handleAssignManualClasses}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <RegistrationCompletionPdfModal
        isOpen={isCompletionPdfOpen}
        registrationId={registrationId}
        studentName={studentName}
        onClose={() => setIsCompletionPdfOpen(false)}
      />
    </div>
  );
}

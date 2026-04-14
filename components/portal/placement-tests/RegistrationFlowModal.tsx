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
  suggestClassesForRegistration,
  getRegistrations,
} from "@/lib/api/registrationService";
import { getAllClasses } from "@/lib/api/classService";
import { getTuitionPlans } from "@/lib/api/tuitionPlanService";
import { getActiveProgramsForDropdown } from "@/lib/api/programService";
import {
  extractDomainErrorCode,
  getDomainErrorMessage,
} from "@/lib/api/domainErrorMessage";
import type {
  RegistrationTrackType,
  SuggestedClassBucket,
} from "@/types/registration";
import type { Program } from "@/types/admin/programs";
import CreateRegistrationStep from "@/components/portal/placement-tests/registration-flow/CreateRegistrationStep";
import SuggestAssignStep from "@/components/portal/placement-tests/registration-flow/SuggestAssignStep";
import RegistrationFlowHeader from "@/components/portal/placement-tests/registration-flow/RegistrationFlowHeader";
import RegistrationFlowStepTabs from "@/components/portal/placement-tests/registration-flow/RegistrationFlowStepTabs";
import RegistrationSelectorCard from "@/components/portal/placement-tests/registration-flow/RegistrationSelectorCard";

interface RegistrationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTest | null;
  branchId?: string;
  allowManualAssign?: boolean;
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

export default function RegistrationFlowModal({
  isOpen,
  onClose,
  test,
  branchId,
  allowManualAssign = false,
  onSuccess,
}: RegistrationFlowModalProps) {
  const { toast } = useToast();
  const studentName = (test?.studentName || "").trim();
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

    toast({
      title: isWarning ? "Cảnh báo" : "Lỗi",
      description: toVietnameseError(error, fallback),
      variant: isWarning ? "warning" : "destructive",
    });
  };

  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>([]);
  const [activePrograms, setActivePrograms] = useState<Program[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>("create");
  const [programId, setProgramId] = useState("");
  const [tuitionPlanId, setTuitionPlanId] = useState("");
  const [isSecondaryEnabled, setIsSecondaryEnabled] = useState(false);
  const [secondaryProgramId, setSecondaryProgramId] = useState("");
  const [secondaryProgramSkillFocus, setSecondaryProgramSkillFocus] =
    useState("");
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
      secondaryProgramId?: string;
      secondaryProgramName?: string;
      tuitionPlanId: string;
      tuitionPlanName: string;
      className?: string;
      secondaryClassName?: string;
      totalSessions: number;
      usedSessions: number;
      remainingSessions: number;
    }>
  >([]);
  const [resolvedStudentProfileId, setResolvedStudentProfileId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const normalizeName = (value?: string | null) =>
    String(value || "")
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
  const [selectedClassId, setSelectedClassId] = useState("");
  const [manualPrimaryClassId, setManualPrimaryClassId] = useState("");
  const [manualSecondaryClassId, setManualSecondaryClassId] = useState("");
  const [manualPrimarySessionPattern, setManualPrimarySessionPattern] =
    useState("");
  const [manualSecondarySessionPattern, setManualSecondarySessionPattern] =
    useState("");

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

  const canCreate =
    Boolean(effectiveStudentProfileId) &&
    Boolean(branchId) &&
    Boolean(programId) &&
    Boolean(tuitionPlanId) &&
    Boolean(preferredSchedule.trim());

  const hasSecondaryTrack = Boolean(
    secondaryProgramId || suggestedClasses?.secondaryProgramId,
  );
  const manualClassOptions = useMemo(
    () =>
      manualClasses.map((cls) => {
        const classId = String(cls?.id || "");
        const remainingSlots = getClassRemainingSlots(cls);
        const scheduleLabel = formatSchedulePattern(cls?.schedulePattern);
        const className = getClassDisplayName(cls);
        const safeRemaining =
          typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : null;
        return {
          id: classId,
          remainingSlots: safeRemaining,
          disabled: safeRemaining !== null && safeRemaining <= 0,
          programId: String(cls?.programId || cls?.program?.id || ""),
          programName: String(cls?.programName || cls?.program?.name || ""),
          label: `${className} • Còn chỗ: ${safeRemaining ?? "-"} • Lịch: ${scheduleLabel}`,
        };
      }),
    [manualClasses],
  );
  const activeSuggestedClasses =
    selectedTrack === "secondary"
      ? (suggestedClasses?.secondarySuggestedClasses ?? [])
      : (suggestedClasses?.suggestedClasses ?? []);
  const activeAlternativeClasses =
    selectedTrack === "secondary"
      ? (suggestedClasses?.secondaryAlternativeClasses ?? [])
      : (suggestedClasses?.alternativeClasses ?? []);

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

  const filteredTuitionPlans = useMemo(() => {
    return tuitionPlans.filter((p) => {
      if (!p.isActive) return false;
      if (!programId) return true;
      return p.programId === programId;
    });
  }, [tuitionPlans, programId]);

  const selectedRegistration = useMemo(
    () => registrationOptions.find((item) => item.id === registrationId),
    [registrationId, registrationOptions],
  );
  const selectedRegistrationPreferredSchedule =
    selectedRegistration?.preferredSchedule || "";

  const selectedRegistrationProgramId = selectedRegistration?.programId || "";
  const selectedRegistrationProgramName = selectedRegistration?.programName || "";
  const selectedRegistrationSecondaryProgramId =
    selectedRegistration?.secondaryProgramId || "";
  const selectedRegistrationSecondaryProgramName =
    selectedRegistration?.secondaryProgramName || "";

  const secondaryPrograms = useMemo(() => {
    return programs.filter((program) => {
      const isMainProgram = !program.isMakeup && !program.isSupplementary;
      return program.id !== programId && isMainProgram;
    });
  }, [programId, programs]);

  const selectedPrimaryProgram = useMemo(
    () => programs.find((program) => program.id === programId),
    [programId, programs],
  );
  const isPrimaryMainProgram = selectedPrimaryProgram
    ? !selectedPrimaryProgram.isMakeup && !selectedPrimaryProgram.isSupplementary
    : true;

  useEffect(() => {
    if (isPrimaryMainProgram) return;
    if (!isSecondaryEnabled && !secondaryProgramId && !secondaryProgramSkillFocus) {
      return;
    }
    setIsSecondaryEnabled(false);
    setSecondaryProgramId("");
    setSecondaryProgramSkillFocus("");
  }, [
    isPrimaryMainProgram,
    isSecondaryEnabled,
    secondaryProgramId,
    secondaryProgramSkillFocus,
  ]);

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

        const firstPlan = (planItems || []).find(
          (p) => p.isActive && p.programId === nextProgramId,
        );
        setTuitionPlanId(firstPlan?.id || "");
        const normalizedSecondaryRecommendation = (
          test?.secondaryProgramRecommendationName || ""
        )
          .trim()
          .toLowerCase();
        const recommendedSecondaryProgramId = String(
          test?.secondaryProgramRecommendationId || "",
        ).trim();
        const mainProgramIds = new Set(
          (activeProgramItems || [])
            .filter((program) => !program?.isMakeup && !program?.isSupplementary)
            .map((program) => String(program.id || ""))
            .filter(Boolean),
        );
        const recommendedSecondaryProgram = (planItems || []).find((p) => {
          const planProgramId = String(p.programId || "").trim();
          if (!mainProgramIds.has(planProgramId)) return false;
          if (
            recommendedSecondaryProgramId &&
            planProgramId === recommendedSecondaryProgramId
          ) {
            return true;
          }
          if (!normalizedSecondaryRecommendation) return false;
          return (
            (p.programName || "").trim().toLowerCase() ===
            normalizedSecondaryRecommendation
          );
        });
        const nextSecondaryProgramId =
          recommendedSecondaryProgram?.programId || "";
        const resolvedSecondaryProgramId =
          nextSecondaryProgramId && nextSecondaryProgramId !== nextProgramId
            ? nextSecondaryProgramId
            : "";
        setIsSecondaryEnabled(Boolean(resolvedSecondaryProgramId));
        setSecondaryProgramId(resolvedSecondaryProgramId);
        setSecondaryProgramSkillFocus(test?.secondaryProgramSkillFocus || "");

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

        if (test?.studentProfileId || studentName) {
          const registrationsResponse = await getRegistrations({
            branchId,
            pageNumber: 1,
            pageSize: 500,
          });

          const normalizedStudentName = normalizeName(studentName);
          const filteredRegistrations = (
            registrationsResponse.items || []
          ).filter((r) => {
            if (test?.studentProfileId) {
              return (
                String(r.studentProfileId || "") ===
                String(test.studentProfileId)
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
              secondaryProgramId: String(r.secondaryProgramId || ""),
              secondaryProgramName: String(r.secondaryProgramName || ""),
              tuitionPlanId: String(r.tuitionPlanId || ""),
              tuitionPlanName: String(r.tuitionPlanName || ""),
              className: String(r.className || ""),
              secondaryClassName: String(r.secondaryClassName || ""),
              totalSessions: Number(r.totalSessions ?? 0),
              usedSessions: Number(r.usedSessions ?? 0),
              remainingSessions: Number(r.remainingSessions ?? 0),
              label: `${r.studentName} • ${toVietnameseStatus(r.status)} • ${toDisplayDate(r.createdAt)} • ${r.programName}${r.secondaryProgramName ? ` • ${r.secondaryProgramName}` : ""}${classNames.length > 0 ? ` • Lớp: ${classNames.join(" + ")}` : ""}`,
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
              String(defaultRegistration?.studentProfileId || ""),
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
    test?.secondaryProgramRecommendationId,
    test?.secondaryProgramRecommendationName,
    test?.secondaryProgramSkillFocus,
    test?.scheduledAt,
    toast,
  ]);

  useEffect(() => {
    if (test?.studentProfileId) {
      setResolvedStudentProfileId("");
      return;
    }

    if (!registrationId) {
      setResolvedStudentProfileId("");
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
    if (!programId) {
      setTuitionPlanId("");
      return;
    }

    const match = tuitionPlans.find(
      (p) => p.id === tuitionPlanId && p.programId === programId && p.isActive,
    );
    if (!match) {
      const first = tuitionPlans.find(
        (p) => p.programId === programId && p.isActive,
      );
      setTuitionPlanId(first?.id || "");
    }
  }, [programId, tuitionPlanId, tuitionPlans]);

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

    try {
      setIsCreating(true);
      const { registrationId: createdId } =
        await createRegistrationFromPlacementTest({
          placementTestId: test.id,
          studentProfileId: effectiveStudentProfileId,
          branchId,
          programId,
          tuitionPlanId,
          secondaryProgramId: isSecondaryEnabled
            ? secondaryProgramId || undefined
            : undefined,
          secondaryProgramSkillFocus:
            isSecondaryEnabled && secondaryProgramId
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
            tuitionPlanId,
            tuitionPlanName:
              tuitionPlans.find((p) => p.id === tuitionPlanId)?.name || "",
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
      await handleSuggestClasses(createdId);
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

  const handleSuggestClasses = async (targetRegistrationId?: string) => {
    const registrationIdToSuggest = targetRegistrationId || registrationId;
    if (!registrationIdToSuggest) return;

    try {
      setIsSuggesting(true);
      setAssignViewMode("suggested");
      const suggestions = await suggestClassesForRegistration(registrationIdToSuggest);
      setSuggestedClasses(suggestions);
      const primaryCount = suggestions?.suggestedClasses?.length ?? 0;
      const secondaryCount =
        suggestions?.secondarySuggestedClasses?.length ?? 0;
      const defaultTrack: RegistrationTrackType =
        primaryCount > 0
          ? "primary"
          : secondaryCount > 0
            ? "secondary"
            : "primary";
      const defaultClass =
        defaultTrack === "secondary"
          ? suggestions?.secondarySuggestedClasses?.[0]
          : suggestions?.suggestedClasses?.[0];
      setSelectedTrack(defaultTrack);
      if (defaultClass?.id) {
        setSelectedClassId(String(defaultClass.id));
        toast({
          title: "Thành công",
          description: `Đã gợi ý ${suggestions.length} lớp phù hợp cho đăng ký.`,
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

  const handleAssignClass = async (sessionSelectionPattern?: string) => {
    if (!registrationId || !selectedClassId) return;

    try {
      setIsAssigning(true);
      await assignClassToRegistration(registrationId, {
        classId: selectedClassId,
        entryType: "Immediate",
        track: selectedTrack,
        sessionSelectionPattern: sessionSelectionPattern || undefined,
      });
      toast({
        title: "Thành công",
        description: "Đã xếp lớp cho đăng ký.",
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
    secondaryClassId?: string;
    secondarySessionSelectionPattern?: string;
  }) => {
    if (!registrationId || !payload.primaryClassId) return;

    try {
      setIsAssigning(true);

      await assignClassToRegistration(registrationId, {
        classId: payload.primaryClassId,
        entryType: "Immediate",
        track: "primary",
        sessionSelectionPattern:
          payload.primarySessionSelectionPattern || undefined,
      });

      if (payload.secondaryClassId) {
        await assignClassToRegistration(registrationId, {
          classId: payload.secondaryClassId,
          entryType: "Immediate",
          track: "secondary",
          sessionSelectionPattern:
            payload.secondarySessionSelectionPattern || undefined,
        });
      }

      toast({
        title: "Thành công",
        description: payload.secondaryClassId
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

      const items = pickClassItems(response)
        .filter((item) => item?.id)
        .filter((item) => {
          const status = String(item?.status || "").toLowerCase();
          return status !== "cancelled" && status !== "completed";
        });

      const countClassesByProgram = (
        targetProgramId?: string,
        targetProgramName?: string,
      ) => {
        const normalizedTargetProgramId = String(targetProgramId || "").trim();
        const normalizedTargetProgramName = normalizeText(targetProgramName);

        return items.filter((item) => {
          const itemProgramId = String(item?.programId || item?.program?.id || "").trim();
          const itemProgramName = normalizeText(
            String(item?.programName || item?.program?.name || ""),
          );

          if (normalizedTargetProgramId) {
            return itemProgramId === normalizedTargetProgramId;
          }

          if (normalizedTargetProgramName) {
            return itemProgramName === normalizedTargetProgramName;
          }

          return true;
        }).length;
      };

      const primaryProgramFilterId = selectedRegistrationProgramId || programId;
      const secondaryProgramFilterId =
        selectedRegistrationSecondaryProgramId ||
        secondaryProgramId ||
        suggestedClasses?.secondaryProgramId ||
        "";
      const primaryFilteredCount = countClassesByProgram(
        primaryProgramFilterId,
        selectedRegistrationProgramName,
      );
      const secondaryFilteredCount = hasSecondaryTrack
        ? countClassesByProgram(
            secondaryProgramFilterId,
            selectedRegistrationSecondaryProgramName ||
              suggestedClasses?.secondaryProgramName ||
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
        setManualSecondaryClassId(secondClassId);
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
          description: "Không có lớp phù hợp trong chi nhánh hiện tại.",
          variant: "default",
        });
      }
    } catch (error: any) {
      showDomainErrorToast(error, "Không thể tải danh sách lớp thủ công.");
    } finally {
      setIsLoadingManualClasses(false);
    }
  };

  const handleAssignManualClasses = async () => {
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

    if (!manualPrimarySessionPattern) {
      toast({
        title: "Thiếu lịch học",
        description: "Vui lòng chọn ngày/giờ học cho lớp chương trình chính.",
        variant: "destructive",
      });
      return;
    }

    if (hasSecondaryTrack && !manualSecondarySessionPattern) {
      toast({
        title: "Thiếu lịch học",
        description:
          "Vui lòng chọn ngày/giờ học cho lớp chương trình song song.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAssigning(true);

      await assignClassToRegistration(registrationId, {
        classId: manualPrimaryClassId,
        entryType: "Immediate",
        track: "primary",
        sessionSelectionPattern: manualPrimarySessionPattern,
      });

      if (hasSecondaryTrack) {
        await assignClassToRegistration(registrationId, {
          classId: manualSecondaryClassId,
          entryType: "Immediate",
          track: "secondary",
          sessionSelectionPattern: manualSecondarySessionPattern,
        });
      }

      toast({
        title: "Thành công",
        description: hasSecondaryTrack
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
        entryType: "Wait",
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
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="h-[90dvh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col transition-all duration-200 animate-in zoom-in-95"
        style={{ width: "96vw", maxWidth: "1050px" }}
      >
        <RegistrationFlowHeader
          studentName={test?.studentName || ""}
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
                setSuggestedClasses(null);
                setSelectedClassId("");
                if (normalizedValue) {
                  lastAutoSuggestRegistrationIdRef.current = "";
                }
                if (!test?.studentProfileId) {
                  const selectedRegistration = registrationOptions.find(
                    (item) => item.id === normalizedValue,
                  );
                  setResolvedStudentProfileId(
                    String(selectedRegistration?.studentProfileId || ""),
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
                  năng "Tạo tài khoản & Profile" trước khi tạo đăng ký.
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
                    tuitionPlanId={tuitionPlanId}
                    setTuitionPlanId={setTuitionPlanId}
                    isSecondaryEnabled={isSecondaryEnabled}
                    setIsSecondaryEnabled={setIsSecondaryEnabled}
                    secondaryAllowed={isPrimaryMainProgram}
                    secondaryProgramId={secondaryProgramId}
                    setSecondaryProgramId={setSecondaryProgramId}
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
                    secondaryPrograms={secondaryPrograms}
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
                        manualSecondaryProgramId={
                          selectedRegistrationSecondaryProgramId ||
                          secondaryProgramId ||
                          suggestedClasses?.secondaryProgramId ||
                          ""
                        }
                        manualSecondaryProgramName={
                          selectedRegistrationSecondaryProgramName ||
                          suggestedClasses?.secondaryProgramName ||
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
                    manualSecondaryProgramId={
                      selectedRegistrationSecondaryProgramId ||
                      secondaryProgramId ||
                      suggestedClasses?.secondaryProgramId ||
                      ""
                    }
                    manualSecondaryProgramName={
                      selectedRegistrationSecondaryProgramName ||
                      suggestedClasses?.secondaryProgramName ||
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
    </div>
  );
}
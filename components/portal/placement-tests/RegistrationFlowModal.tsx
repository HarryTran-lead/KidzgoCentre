"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  School,
  Rocket,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PlacementTest } from "@/types/placement-test";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import {
  assignClassToRegistration,
  createRegistrationFromPlacementTest,
  suggestClassesForRegistration,
  upgradeRegistration,
  getRegistrations,
} from "@/lib/api/registrationService";
import { getAllClasses } from "@/lib/api/classService";
import { getTuitionPlans } from "@/lib/api/tuitionPlanService";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import type {
  RegistrationTrackType,
  SuggestedClassBucket,
} from "@/types/registration";

interface RegistrationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTest | null;
  branchId?: string;
  allowManualAssign?: boolean;
  onSuccess?: () => void;
}

type StepKey = "create" | "suggest" | "upgrade";

type ProgramOption = {
  id: string;
  name: string;
};

const SESSIONS_PER_WEEK_OPTIONS = [
  { value: 2, label: "2 buổi/tuần" },
  { value: 3, label: "3 buổi/tuần" },
];

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
  return d.toISOString().slice(0, 10);
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
  if (hour) pieces.push(`Lúc: ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
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
  const childName = (test?.studentName || test?.childName || "").trim();

  const toVietnameseError = (error: unknown, fallback: string) =>
    getDomainErrorMessage(error, fallback);

  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>("create");

  const [programId, setProgramId] = useState("");
  const [tuitionPlanId, setTuitionPlanId] = useState("");
  const [secondaryProgramId, setSecondaryProgramId] = useState("");
  const [secondaryProgramSkillFocus, setSecondaryProgramSkillFocus] = useState("");
  const [expectedStartDate, setExpectedStartDate] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [note, setNote] = useState("");

  const [registrationId, setRegistrationId] = useState("");
  const [registrationOptions, setRegistrationOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [isCreating, setIsCreating] = useState(false);

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
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [suggestedClasses, setSuggestedClasses] = useState<SuggestedClassBucket | null>(null);
  const [manualClasses, setManualClasses] = useState<any[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<RegistrationTrackType>("primary");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [upgradeTuitionPlanId, setUpgradeTuitionPlanId] = useState("");

  const pickClassItems = (payload: any): any[] => {
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.page?.items)) return payload.data.page.items;
    if (Array.isArray(payload?.data?.classes?.items)) return payload.data.classes.items;
    if (Array.isArray(payload?.data?.classes)) return payload.data.classes;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  const getClassDisplayName = (cls: any) =>
    String(cls?.className || cls?.title || cls?.name || cls?.code || cls?.id || "");

  const getClassRemainingSlots = (cls: any) => {
    if (typeof cls?.remainingSlots === "number") return cls.remainingSlots;
    if (
      typeof cls?.capacity === "number" &&
      typeof cls?.currentEnrollment === "number"
    ) {
      return cls.capacity - cls.currentEnrollment;
    }
    if (
      typeof cls?.maxStudents === "number" &&
      typeof cls?.currentStudentCount === "number"
    ) {
      return cls.maxStudents - cls.currentStudentCount;
    }
    return null;
  };

  const canCreate =
    Boolean(test?.studentProfileId) &&
    Boolean(branchId) &&
    Boolean(programId) &&
    Boolean(tuitionPlanId) &&
    Boolean(preferredSchedule.trim());

  const hasSecondaryTrack = Boolean(secondaryProgramId || suggestedClasses?.secondaryProgramId);
  const activeSuggestedClasses =
    selectedTrack === "secondary"
      ? suggestedClasses?.secondarySuggestedClasses ?? []
      : suggestedClasses?.suggestedClasses ?? [];
  const activeAlternativeClasses =
    selectedTrack === "secondary"
      ? suggestedClasses?.secondaryAlternativeClasses ?? []
      : suggestedClasses?.alternativeClasses ?? [];

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
    if (selectedDays.length > value) {
      setSelectedDays((prev) => prev.slice(0, value));
    }
  };

  const programs = useMemo<ProgramOption[]>(() => {
    const byProgram = new Map<string, string>();
    tuitionPlans.forEach((plan) => {
      if (!plan.isActive) return;
      if (!plan.programId) return;
      if (!byProgram.has(plan.programId)) {
        byProgram.set(plan.programId, plan.programName || "Chương trình");
      }
    });
    return Array.from(byProgram.entries()).map(([id, name]) => ({ id, name }));
  }, [tuitionPlans]);

  const filteredTuitionPlans = useMemo(() => {
    return tuitionPlans.filter((p) => {
      if (!p.isActive) return false;
      if (!programId) return true;
      return p.programId === programId;
    });
  }, [tuitionPlans, programId]);

  const secondaryPrograms = useMemo(() => {
    return programs.filter((program) => program.id !== programId);
  }, [programId, programs]);

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        setIsBootstrapping(true);
        if (!branchId) {
          setTuitionPlans([]);
          setProgramId("");
          setTuitionPlanId("");
          return;
        }

        const planItems = await getTuitionPlans({
          pageNumber: 1,
          pageSize: 500,
          branchId,
        });

        setTuitionPlans(planItems || []);

        const normalizedRecommendation = (test?.programRecommendation || "").trim().toLowerCase();
        const recommendedProgram = normalizedRecommendation
          ? (planItems || []).find((p) => (p.programName || "").toLowerCase() === normalizedRecommendation)
          : undefined;

        const firstProgramId = (planItems || []).find((p) => p.isActive)?.programId || "";
        const nextProgramId = recommendedProgram?.programId || firstProgramId;
        setProgramId(nextProgramId);

        const firstPlan = (planItems || []).find(
          (p) => p.isActive && p.programId === nextProgramId
        );
        setTuitionPlanId(firstPlan?.id || "");
        const normalizedSecondaryRecommendation = (
          test?.secondaryProgramRecommendation || ""
        )
          .trim()
          .toLowerCase();
        const recommendedSecondaryProgram = normalizedSecondaryRecommendation
          ? (planItems || []).find(
              (p) => (p.programName || "").trim().toLowerCase() === normalizedSecondaryRecommendation,
            )
          : undefined;
        setSecondaryProgramId(recommendedSecondaryProgram?.programId || "");
        setSecondaryProgramSkillFocus(test?.secondaryProgramSkillFocus || "");

        setExpectedStartDate(toInputDateValue(test?.scheduledAt));
        setPreferredSchedule("");
        setSessionsPerWeek(2);
        setSelectedDays([]);
        setSelectedTimeSlot("");
        setUseCustomTime(false);
        setStartTime("18:00");
        setEndTime("20:00");
        setNote(childName);

        if (test?.studentProfileId) {
          const registrationsResponse = await getRegistrations({
            studentProfileId: test.studentProfileId,
            branchId,
            pageNumber: 1,
            pageSize: 200,
          });

          const sortedRegistrations = [...(registrationsResponse.items || [])].sort((a, b) => {
            const bt = new Date(b.createdAt || b.registrationDate || "").getTime();
            const at = new Date(a.createdAt || a.registrationDate || "").getTime();
            return (Number.isNaN(bt) ? 0 : bt) - (Number.isNaN(at) ? 0 : at);
          });

          const options = sortedRegistrations.map((r) => ({
            id: r.id,
            label: `${r.studentName} • ${toVietnameseStatus(r.status)} • ${toDisplayDate(r.createdAt)} • ${r.programName}`,
          }));
          setRegistrationOptions(options);

          const placementLinked = sortedRegistrations.find((r) =>
            String(r.note || "").includes(`PlacementTest:${test.id}`)
          );
          const defaultRegistration = placementLinked || sortedRegistrations[0];
          setRegistrationId(defaultRegistration?.id || "");
        } else {
          setRegistrationOptions([]);
          setRegistrationId("");
        }

        setSuggestedClasses(null);
        setManualClasses([]);
        setIsManualMode(false);
        setSelectedTrack("primary");
        setSelectedClassId("");
        setUpgradeTuitionPlanId("");
        setActiveStep("create");
      } catch (error) {
        console.error("Error loading registration options:", error);
        toast({
          title: "Lỗi",
          description: toVietnameseError(error, "Không thể tải dữ liệu đăng ký. Vui lòng thử lại."),
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
    childName,
    test?.id,
    test?.programRecommendation,
    test?.secondaryProgramRecommendation,
    test?.secondaryProgramSkillFocus,
    test?.scheduledAt,
    toast,
  ]);

  useEffect(() => {
    if (!programId) {
      setTuitionPlanId("");
      return;
    }

    const match = tuitionPlans.find((p) => p.id === tuitionPlanId && p.programId === programId && p.isActive);
    if (!match) {
      const first = tuitionPlans.find((p) => p.programId === programId && p.isActive);
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
    if (!test?.studentProfileId || !branchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Placement test chưa gắn Student Profile hoặc thiếu chi nhánh.",
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

    try {
      setIsCreating(true);
      const { registrationId: createdId } = await createRegistrationFromPlacementTest({
        placementTestId: test.id,
        studentProfileId: test.studentProfileId,
        branchId,
        programId,
        tuitionPlanId,
        secondaryProgramId: secondaryProgramId || undefined,
        secondaryProgramSkillFocus: secondaryProgramId
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
            label: `${childName || "Học viên"} • Mới • ${toDisplayDate(new Date().toISOString())}`,
          },
          ...prev,
        ];
      });
      toast({
        title: "Thành công",
        description: "Đã tạo đăng ký học viên.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: toVietnameseError(error, "Không thể tạo đăng ký."),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuggestClasses = async () => {
    if (!registrationId) return;

    try {
      setIsSuggesting(true);
      const suggestions = await suggestClassesForRegistration(registrationId);
      setSuggestedClasses(suggestions);
      const primaryCount = suggestions?.suggestedClasses?.length ?? 0;
      const secondaryCount = suggestions?.secondarySuggestedClasses?.length ?? 0;
      const defaultTrack: RegistrationTrackType =
        primaryCount > 0 ? "primary" : secondaryCount > 0 ? "secondary" : "primary";
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
        description: toVietnameseError(error, "Không thể lấy danh sách lớp gợi ý."),
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAssignClass = async () => {
    if (!registrationId || !selectedClassId) return;

    try {
      setIsAssigning(true);
      await assignClassToRegistration(registrationId, {
        classId: selectedClassId,
        entryType: "Immediate",
        track: selectedTrack,
      });
      toast({
        title: "Thành công",
        description: "Đã xếp lớp cho đăng ký.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: toVietnameseError(error, "Học viên đã đăng ký lớp này"),
        variant: "destructive",
      });
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
      setIsManualMode(true);

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

      setManualClasses(items);

      if (items.length > 0) {
        setSelectedClassId(String(items[0].id));
        toast({
          title: "Thành công",
          description: `Đã tải ${items.length} lớp để xếp lớp thủ công.`,
          variant: "success",
        });
      } else {
        setSelectedClassId("");
        toast({
          title: "Thông báo",
          description: "Không có lớp phù hợp trong chi nhánh hiện tại.",
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: toVietnameseError(error, "Không thể tải danh sách lớp thủ công."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingManualClasses(false);
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
      toast({
        title: "Lỗi",
        description: toVietnameseError(error, "Không thể chuyển đăng ký vào trạng thái chờ xếp lớp."),
        variant: "destructive",
      });
    } finally {
      setIsWaiting(false);
    }
  };

  const handleUpgrade = async () => {
    if (!registrationId || !upgradeTuitionPlanId) return;

    try {
      setIsUpgrading(true);
      await upgradeRegistration(registrationId, upgradeTuitionPlanId);
      toast({
        title: "Thành công",
        description: "Đã nâng cấp học vụ/gói học cho đăng ký.",
        variant: "success",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: toVietnameseError(error, "Không thể nâng cấp học vụ cho đăng ký."),
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!isOpen) return null;

  const stepTabs: Array<{ key: StepKey; label: string }> = [
    { key: "create", label: "Bước 1: Tạo đăng ký" },
    { key: "suggest", label: "Bước 2: Gợi ý & xếp lớp" },
    { key: "upgrade", label: "Bước 3: Học vụ phát sinh" },
  ];

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 px-3 py-2">
      <div className="h-auto max-h-[calc(100dvh-16px)] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-linear-to-r from-red-700 via-red-600 to-rose-600 px-5 py-3 text-white">
          <div>
            <h2 className="text-xl font-bold">Đăng Ký Từ Placement Test</h2>
            <p className="text-sm text-white/85">
              Tên học viên: {test?.studentName || test?.childName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/15" aria-label="Đóng">
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-84px)] overflow-y-auto space-y-3 p-3 text-sm">
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-1.5">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {stepTabs.map((tab) => {
                const isActive = tab.key === activeStep;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveStep(tab.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-linear-to-r from-red-600 to-rose-600 text-white shadow"
                        : "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-white px-3 py-1.5">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Đăng ký đang thao tác (tự lấy từ hệ thống)</label>
                <select
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Chưa có đăng ký nào cho học viên này</option>
                  {registrationOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                     {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden text-[11px] text-gray-500 md:block">
                Các bước thao tác độc lập. Bạn có thể chọn bất kỳ đăng ký đã có trong hệ thống.
              </div>
            </div>
          </div>

          {!test?.studentProfileId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Placement test này chưa có Student Profile. Vui lòng dùng chức năng "Tạo tài khoản & Profile" trước khi tạo đăng ký.
            </div>
          )}

          {!!test?.studentProfileId && !branchId && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Không xác định được chi nhánh của tài khoản staff đang đăng nhập. Vui lòng kiểm tra lại hồ sơ tài khoản.
            </div>
          )}

          {activeStep === "create" && (
          <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-2.5">
            <div className="mb-2 flex items-center gap-2 text-base font-semibold text-gray-900">
              <School size={18} className="text-red-600" />
              Bước 1: Tạo đăng ký học viên
            </div>

            {isBootstrapping ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-600">
                <Loader2 size={16} className="animate-spin" /> Đang tải chương trình và gói học...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Student Profile ID</label>
                  <input
                    value={test?.studentProfileId || ""}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Chương trình</label>
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="">Chọn chương trình</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Gói học</label>
                  <select
                    value={tuitionPlanId}
                    onChange={(e) => setTuitionPlanId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="">Chọn gói học</option>
                    {filteredTuitionPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalSessions} buổi)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Secondary program</label>
                  <select
                    value={secondaryProgramId}
                    onChange={(e) => setSecondaryProgramId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="">Không chọn secondary</option>
                    {secondaryPrograms.map((p) => (
                      <option key={`secondary-${p.id}`} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Secondary skill focus</label>
                  <input
                    value={secondaryProgramSkillFocus}
                    onChange={(e) => setSecondaryProgramSkillFocus(e.target.value)}
                    disabled={!secondaryProgramId}
                    placeholder="Ví dụ: Speaking"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Ngày dự kiến bắt đầu</label>
                  <input
                    type="date"
                    value={expectedStartDate}
                    onChange={(e) => setExpectedStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock3 size={16} className="text-red-600" />
                    Lịch học mong muốn <span className="text-red-500">*</span>
                  </label>

                  <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Số buổi học mỗi tuần</p>
                      <div className="flex flex-wrap gap-2">
                        {SESSIONS_PER_WEEK_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSessionsPerWeekChange(option.value)}
                            className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${
                              sessionsPerWeek === option.value
                                ? "border-red-600 bg-linear-to-r from-red-600 to-red-700 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Chọn ngày học (tối đa {sessionsPerWeek} ngày) <span className="text-red-500">*</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {WEEK_DAYS.map((day) => {
                          const isSelected = selectedDays.includes(day.value);
                          const isDisabled =
                            !isSelected && selectedDays.length >= sessionsPerWeek;

                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              disabled={isDisabled}
                              className={`min-w-20 rounded-xl border px-2 py-1.5 text-center transition-colors ${
                                isSelected
                                  ? "border-red-500 bg-red-100 text-red-700"
                                  : isDisabled
                                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <div className="text-sm font-semibold leading-none">{day.shortLabel}</div>
                              <div className="text-[11px] leading-tight">{day.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Khung giờ học <span className="text-red-500">*</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setUseCustomTime((prev) => !prev)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          {useCustomTime ? "Chọn khung giờ mẫu" : "Nhập giờ tùy chỉnh"}
                        </button>
                      </div>

                      {!useCustomTime ? (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          {TIME_SLOTS.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => setSelectedTimeSlot(slot.value)}
                              className={`rounded-xl border px-3 py-1.5 text-center transition-colors ${
                                selectedTimeSlot === slot.value
                                  ? "border-red-600 bg-linear-to-r from-red-600 to-red-700 text-white"
                                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <div className="text-sm font-semibold leading-none">{slot.label}</div>
                              <div className="text-[11px] leading-tight">{slot.timeRange}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 md:flex-row md:items-center">
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                          <span className="text-sm text-gray-500">đến</span>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Chuỗi gửi backend</label>
                    <input
                      value={preferredSchedule}
                      readOnly
                      placeholder="Ví dụ: Thứ 3,5 (18:00 - 20:00)"
                      className={`w-full rounded-xl border bg-white px-3 py-1.5 text-sm outline-none ${
                        preferredSchedule
                          ? "border-gray-300 text-gray-800"
                          : "border-red-300 text-gray-500"
                      }`}
                    />
                    {!preferredSchedule && (
                      <p className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle size={13} /> Vui lòng chọn đủ ngày học và khung giờ.
                      </p>
                    )}
                  </div> */}
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                  <textarea
                    rows={1}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateRegistration}
                disabled={!canCreate || isCreating || isBootstrapping}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Tạo đăng ký
              </button>

              {registrationId && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={12} /> registrationId: {registrationId}
                </span>
              )}
            </div>
          </div>
          )}

          {activeStep === "suggest" && (
          <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <ArrowRight size={18} className="text-red-600" />
              Bước 2: Gợi ý lớp phù hợp và xếp lớp
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSuggestClasses}
                disabled={!registrationId || isSuggesting}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <School size={14} />}
                Gợi ý lớp phù hợp
              </button>

              <button
                type="button"
                onClick={handleLoadManualClasses}
                disabled={!allowManualAssign || !registrationId || isLoadingManualClasses || !branchId}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingManualClasses ? <Loader2 size={14} className="animate-spin" /> : <School size={14} />}
                Xếp lớp thủ công
              </button>

              <button
                type="button"
                onClick={handleMoveToWaitingList}
                disabled={!registrationId || isWaiting}
                className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWaiting ? "Đang xử lý..." : "Đưa vào waiting list"}
              </button>
            </div>

            {suggestedClasses && (
              <div className="mt-4 space-y-3">
                {(hasSecondaryTrack || suggestedClasses.programName) && (
                  <div className="rounded-xl border border-red-200 bg-white p-3">
                    <div className="text-sm font-semibold text-gray-900">Track xếp lớp</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrack("primary");
                          setSelectedClassId(String(suggestedClasses.suggestedClasses?.[0]?.id ?? ""));
                        }}
                        className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
                          selectedTrack === "primary"
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        Primary
                        {suggestedClasses.programName ? ` • ${suggestedClasses.programName}` : ""}
                      </button>
                      {hasSecondaryTrack ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTrack("secondary");
                            setSelectedClassId(
                              String(suggestedClasses.secondarySuggestedClasses?.[0]?.id ?? ""),
                            );
                          }}
                          className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
                            selectedTrack === "secondary"
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-gray-300 bg-white text-gray-700"
                          }`}
                        >
                          Secondary
                          {suggestedClasses.secondaryProgramName
                            ? ` • ${suggestedClasses.secondaryProgramName}`
                            : ""}
                        </button>
                      ) : null}
                    </div>
                    {selectedTrack === "secondary" && suggestedClasses.secondaryProgramSkillFocus ? (
                      <div className="mt-2 text-xs text-gray-500">
                        Skill focus: {suggestedClasses.secondaryProgramSkillFocus}
                      </div>
                    ) : null}
                  </div>
                )}

                {activeSuggestedClasses.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {activeSuggestedClasses.map((cls: any) => {
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setSelectedClassId(String(cls.id))}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "border-red-500 bg-red-100"
                            : "border-red-200 bg-white hover:bg-red-50"
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-900">{cls.title || cls.code || cls.id}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          Còn chỗ: {typeof cls.remainingSlots === "number" ? cls.remainingSlots : "-"}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-600" title={cls.schedulePattern || ""}>
                          Lịch: {formatSchedulePattern(cls.schedulePattern)}
                        </div>
                      </button>
                    );
                  })}
                </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
                    Chưa có lớp gợi ý cho track {selectedTrack}.
                  </div>
                )}

                {activeAlternativeClasses.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="text-sm font-semibold text-amber-900">Lớp thay thế</div>
                    <div className="mt-2 text-xs text-amber-800">
                      Có {activeAlternativeClasses.length} lớp thay thế cho track {selectedTrack}.
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAssignClass}
                  disabled={!selectedClassId || isAssigning}
                  className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAssigning ? "Đang xếp lớp..." : "Xếp vào lớp đã chọn"}
                </button>
              </div>
            )}

            {allowManualAssign && isManualMode && (
              <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-white p-3">
                <div className="text-sm font-semibold text-gray-900">
                  Danh sách lớp theo chi nhánh tài khoản staff
                </div>

                {manualClasses.length === 0 && !isLoadingManualClasses ? (
                  <div className="text-xs text-gray-600">
                    Không có lớp để xếp thủ công trong phạm vi chi nhánh hiện tại.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {manualClasses.map((cls: any) => {
                      const classId = String(cls.id);
                      const isSelected = selectedClassId === classId;
                      const remainingSlots = getClassRemainingSlots(cls);

                      return (
                        <button
                          key={classId}
                          type="button"
                          onClick={() => setSelectedClassId(classId)}
                          className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "border-red-500 bg-red-100"
                              : "border-red-200 bg-white hover:bg-red-50"
                          }`}
                        >
                          <div className="text-sm font-semibold text-gray-900">{getClassDisplayName(cls)}</div>
                          <div className="mt-1 text-xs text-gray-600">
                            Còn chỗ: {typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : "-"}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-600" title={cls?.schedulePattern || ""}>
                            Lịch: {formatSchedulePattern(cls?.schedulePattern)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAssignClass}
                  disabled={!selectedClassId || isAssigning || manualClasses.length === 0}
                  className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAssigning ? "Đang xếp lớp..." : "Xếp vào lớp thủ công đã chọn"}
                </button>
              </div>
            )}
          </div>
          )}

          {activeStep === "upgrade" && (
          <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Rocket size={18} className="text-red-600" />
              Bước 3: Học vụ phát sinh (Upgrade)
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Gói học mới</label>
                <select
                  value={upgradeTuitionPlanId}
                  onChange={(e) => setUpgradeTuitionPlanId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Chọn gói để upgrade</option>
                  {filteredTuitionPlans
                    .filter((p) => p.id !== tuitionPlanId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalSessions} buổi)
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleUpgrade}
                disabled={!registrationId || !upgradeTuitionPlanId || isUpgrading}
                className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpgrading ? "Đang upgrade..." : "Upgrade"}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

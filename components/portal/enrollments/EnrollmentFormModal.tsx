"use client";

import { useState, useEffect, useMemo } from "react";
import { X, BookOpen, Users, Calendar, GraduationCap, CreditCard, Clock3, Loader2, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { getAccessToken } from "@/lib/store/authToken";
import { todayDateOnly } from "@/lib/datetime";
import type { CreateEnrollmentRequest, DayOfWeekCode } from "@/types/enrollment";
import { getActiveProgramsForDropdown } from "@/lib/api/programService";
import { getTuitionPlans } from "@/lib/api/tuitionPlanService";
import type { Program } from "@/types/admin/programs";
import type { TuitionPlan } from "@/types/admin/tuition_plan";

interface ClassOption {
  id: string;
  code: string;
  title: string;
  programId?: string;
  programName?: string;
}

interface ClassScheduleSlot {
  dayOfWeek: DayOfWeekCode;
  startTime: string;
  durationMinutes: number;
}

interface StudentProfileOption {
  id: string;
  fullName: string;
}

interface EnrollmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEnrollmentRequest) => Promise<void>;
}

const WEEKLY_DAY_OPTIONS: Array<{ value: DayOfWeekCode; label: string }> = [
  { value: "MO", label: "Thứ 2" },
  { value: "TU", label: "Thứ 3" },
  { value: "WE", label: "Thứ 4" },
  { value: "TH", label: "Thứ 5" },
  { value: "FR", label: "Thứ 6" },
  { value: "SA", label: "Thứ 7" },
  { value: "SU", label: "Chủ nhật" },
];

const DAY_LABELS: Record<DayOfWeekCode, string> = WEEKLY_DAY_OPTIONS.reduce(
  (acc, item) => {
    acc[item.value] = item.label;
    return acc;
  },
  {} as Record<DayOfWeekCode, string>
);

function normalizeDayCode(value?: string): DayOfWeekCode | null {
  const normalized = String(value || "").trim().toUpperCase();
  const valid = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  return valid.includes(normalized) ? (normalized as DayOfWeekCode) : null;
}

function buildSlotKey(slot: ClassScheduleSlot): string {
  return `${slot.dayOfWeek}-${slot.startTime}-${slot.durationMinutes}`;
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const matched = String(startTime).match(/^(\d{1,2}):(\d{2})$/);
  if (!matched) return "";

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  const totalMinutes = hour * 60 + minute + Math.max(0, Number(durationMinutes) || 0);
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const endHour = Math.floor(normalized / 60);
  const endMinute = normalized % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

function sortDayCodes(dayCodes: DayOfWeekCode[]): DayOfWeekCode[] {
  const order: Record<DayOfWeekCode, number> = {
    MO: 2,
    TU: 3,
    WE: 4,
    TH: 5,
    FR: 6,
    SA: 7,
    SU: 8,
  };

  return [...dayCodes].sort((a, b) => order[a] - order[b]);
}

function toWeeklyPatternFromSlots(slots: ClassScheduleSlot[]) {
  const grouped = new Map<string, { startTime: string; durationMinutes: number; dayOfWeeks: DayOfWeekCode[] }>();

  slots.forEach((slot) => {
    const key = `${slot.startTime}-${slot.durationMinutes}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        startTime: slot.startTime,
        durationMinutes: slot.durationMinutes,
        dayOfWeeks: [slot.dayOfWeek],
      });
      return;
    }

    if (!existing.dayOfWeeks.includes(slot.dayOfWeek)) {
      existing.dayOfWeeks.push(slot.dayOfWeek);
    }
  });

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      dayOfWeeks: sortDayCodes(item.dayOfWeeks),
    }))
    .sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.durationMinutes - b.durationMinutes;
    });
}

export default function EnrollmentFormModal({
  isOpen,
  onClose,
  onSubmit,
}: EnrollmentFormModalProps) {
  // Form state
  const [programId, setProgramId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentProfileId, setStudentProfileId] = useState("");
  const [enrollDate, setEnrollDate] = useState(
    todayDateOnly()
  );
  const [tuitionPlanId, setTuitionPlanId] = useState("");
  const [track, setTrack] = useState<"primary" | "secondary">("primary");
  const [useWeeklyPattern, setUseWeeklyPattern] = useState(false);
  const [weeklyPatternMode, setWeeklyPatternMode] = useState<"class" | "custom">("class");
  const [classScheduleSlots, setClassScheduleSlots] = useState<ClassScheduleSlot[]>([]);
  const [selectedCustomSlotKeys, setSelectedCustomSlotKeys] = useState<string[]>([]);
  const [classScheduleText, setClassScheduleText] = useState("");
  const [isLoadingClassSchedule, setIsLoadingClassSchedule] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  // Program/tuition state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>([]);

  // Class search state
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [debouncedClassQuery, setDebouncedClassQuery] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Student profile search state
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [debouncedStudentQuery, setDebouncedStudentQuery] = useState("");
  const [studentProfiles, setStudentProfiles] = useState<StudentProfileOption[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Debounce class search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClassQuery(classSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [classSearchQuery]);

  // Debounce student search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStudentQuery(studentSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBootstrappingData = async () => {
      try {
        setIsBootstrapping(true);
        const [programItems, tuitionItems] = await Promise.all([
          getActiveProgramsForDropdown(),
          getTuitionPlans({ pageSize: 500 }),
        ]);

        setPrograms(Array.isArray(programItems) ? programItems : []);
        setTuitionPlans(Array.isArray(tuitionItems) ? tuitionItems : []);
      } catch (error) {
        console.error("Error fetching programs/tuition plans:", error);
        setPrograms([]);
        setTuitionPlans([]);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void fetchBootstrappingData();
  }, [isOpen]);

  // Fetch classes
  useEffect(() => {
    if (!isOpen) return;
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const token = getAccessToken();
        const params = new URLSearchParams({ pageSize: "50" });
        if (debouncedClassQuery) params.append("searchTerm", debouncedClassQuery);
        const response = await fetch(`/api/classes?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        const data = result?.data || result;
        const items = data?.classes?.items || data?.items || data?.classes || [];
        const mapped = (Array.isArray(items) ? items : []).map((c: any) => ({
          id: c.id || c.classId,
          code: c.code || c.classCode || "",
          title: c.title || c.name || c.classTitle || "",
          programId: c.programId || c.program?.id || "",
          programName: c.programName || c.program?.name || "",
        }));
        setClasses(mapped);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setClasses([]);
      } finally {
        setIsLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [isOpen, debouncedClassQuery]);

  // Fetch student profiles
  useEffect(() => {
    if (!isOpen) return;
    const fetchStudentProfiles = async () => {
      setIsLoadingStudents(true);
      try {
        const token = getAccessToken();
        const params = new URLSearchParams({ profileType: "Student", pageSize: "50" });
        if (debouncedStudentQuery) params.append("searchTerm", debouncedStudentQuery);
        const response = await fetch(`/api/profiles?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        const data = result?.data || result;
        const items = data?.items || data?.profiles || [];
        const mapped = (Array.isArray(items) ? items : []).map((p: any) => ({
          id: p.id || p.profileId,
          fullName: p.displayName || p.fullName || p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        }));
        setStudentProfiles(mapped);
      } catch (error) {
        console.error("Error fetching student profiles:", error);
        setStudentProfiles([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudentProfiles();
  }, [isOpen, debouncedStudentQuery]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setClassId("");
      setStudentProfileId("");
      setEnrollDate(todayDateOnly());
      setProgramId("");
      setTuitionPlanId("");
      setTrack("primary");
      setUseWeeklyPattern(false);
      setWeeklyPatternMode("class");
      setClassScheduleSlots([]);
      setSelectedCustomSlotKeys([]);
      setClassScheduleText("");
      setClassSearchQuery("");
      setStudentSearchQuery("");
      setFormError("");
    }
  }, [isOpen]);

  const handleReset = () => {
    setClassId("");
    setStudentProfileId("");
    setEnrollDate(todayDateOnly());
    setProgramId("");
    setTuitionPlanId("");
    setTrack("primary");
    setUseWeeklyPattern(false);
    setWeeklyPatternMode("class");
    setClassScheduleSlots([]);
    setSelectedCustomSlotKeys([]);
    setClassScheduleText("");
    setClassSearchQuery("");
    setStudentSearchQuery("");
    setFormError("");
  };

  const toggleCustomSlot = (slotKey: string) => {
    setSelectedCustomSlotKeys((prev) =>
      prev.includes(slotKey)
        ? prev.filter((item) => item !== slotKey)
        : [...prev, slotKey]
    );
  };

  const filteredClasses = useMemo(() => {
    if (!programId) return classes;
    return classes.filter((item) => !item.programId || item.programId === programId);
  }, [classes, programId]);

  const filteredTuitionPlans = useMemo(() => {
    if (!programId) return tuitionPlans;
    const normalizedProgramName = String(
      programs.find((item) => item.id === programId)?.name || ""
    )
      .trim()
      .toLowerCase();

    return tuitionPlans.filter((plan) => {
      if (plan.programId && plan.programId === programId) return true;
      const normalizedPlanProgramName = String(plan.programName || "")
        .trim()
        .toLowerCase();
      return Boolean(
        normalizedProgramName &&
          normalizedPlanProgramName &&
          normalizedPlanProgramName === normalizedProgramName
      );
    });
  }, [tuitionPlans, programId, programs]);

  useEffect(() => {
    if (!tuitionPlanId) return;
    const exists = filteredTuitionPlans.some((plan) => plan.id === tuitionPlanId);
    if (!exists) {
      setTuitionPlanId("");
    }
  }, [filteredTuitionPlans, tuitionPlanId]);

  useEffect(() => {
    if (!classId) return;
    const exists = filteredClasses.some((item) => item.id === classId);
    if (!exists) {
      setClassId("");
    }
  }, [filteredClasses, classId]);

  useEffect(() => {
    if (!isOpen || !classId) {
      setClassScheduleSlots([]);
      setSelectedCustomSlotKeys([]);
      setClassScheduleText("");
      return;
    }

    const fetchClassSchedule = async () => {
      try {
        setIsLoadingClassSchedule(true);
        const token = getAccessToken();
        const response = await fetch(`/api/classes/${classId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const result = await response.json().catch(() => ({}));
        const data = result?.data || result || {};

        const rawSlots = Array.isArray(data?.weeklyScheduleSlots)
          ? data.weeklyScheduleSlots
          : Array.isArray(data?.class?.weeklyScheduleSlots)
            ? data.class.weeklyScheduleSlots
            : [];

        const normalizedSlots = rawSlots
          .map((slot: any) => {
            const dayOfWeek = normalizeDayCode(slot?.dayOfWeek || slot?.dayCode);
            if (!dayOfWeek) return null;

            return {
              dayOfWeek,
              startTime: String(slot?.startTime || "").slice(0, 5),
              durationMinutes: Number(slot?.durationMinutes || 0),
            } as ClassScheduleSlot;
          })
          .filter(Boolean)
          .filter((slot: ClassScheduleSlot) => slot.startTime && slot.durationMinutes > 0);

        setClassScheduleSlots(normalizedSlots);
        setClassScheduleText(
          String(data?.scheduleText || data?.class?.scheduleText || "")
        );

        setSelectedCustomSlotKeys((prev) => {
          const availableKeys = new Set(normalizedSlots.map(buildSlotKey));
          return prev.filter((item) => availableKeys.has(item));
        });
      } catch (error) {
        console.error("Error fetching class schedule:", error);
        setClassScheduleSlots([]);
        setSelectedCustomSlotKeys([]);
        setClassScheduleText("");
      } finally {
        setIsLoadingClassSchedule(false);
      }
    };

    void fetchClassSchedule();
  }, [classId, isOpen]);

  const selectedCustomSlots = useMemo(
    () => classScheduleSlots.filter((slot) => selectedCustomSlotKeys.includes(buildSlotKey(slot))),
    [classScheduleSlots, selectedCustomSlotKeys]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !studentProfileId || !enrollDate) return;

    setFormError("");

    const shouldSendWeeklyPattern = useWeeklyPattern;
    if (shouldSendWeeklyPattern) {
      if (classScheduleSlots.length === 0) {
        setFormError("Lớp chưa có lịch học hợp lệ để áp dụng weeklyPattern.");
        return;
      }

      if (weeklyPatternMode === "custom" && selectedCustomSlots.length === 0) {
        setFormError("Vui lòng chọn ít nhất một buổi học mong muốn từ lịch của lớp.");
        return;
      }
    }

    const payload: CreateEnrollmentRequest = {
      classId,
      studentProfileId,
      enrollDate,
      tuitionPlanId: tuitionPlanId.trim() || undefined,
      track,
    };

    if (shouldSendWeeklyPattern) {
      const sourceSlots =
        weeklyPatternMode === "class" ? classScheduleSlots : selectedCustomSlots;

      payload.weeklyPattern = toWeeklyPatternFromSlots(sourceSlots);
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Error creating enrollment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedProgram = programs.find((item) => item.id === programId);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-6xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header - Gradient đỏ như modal mẫu */}
        <div className="bg-linear-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Tạo ghi danh mới</h2>
                <p className="text-sm text-red-100">Nhập thông tin chi tiết về ghi danh</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto">
          <form id="create-enrollment-form" onSubmit={handleSubmit} className="space-y-6">
            {isBootstrapping ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin text-red-500" />
                <span>Đang tải chương trình và gói học...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                      Thông tin cơ bản
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Users size={16} className="text-gray-400" />
                          Học viên <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={studentProfileId}
                          onValueChange={(value) => {
                            setStudentProfileId(value);
                            setStudentSearchQuery("");
                          }}
                        >
                          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100">
                            <SelectValue placeholder="Chọn học viên" />
                          </SelectTrigger>
                          <SelectContent className="z-12050">
                            <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                              <input
                                type="text"
                                value={studentSearchQuery}
                                onChange={(e) => setStudentSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm học viên..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            {isLoadingStudents ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Đang tải...</div>
                            ) : studentProfiles.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy học viên</div>
                            ) : (
                              studentProfiles.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  <span className="font-medium text-gray-900">{profile.fullName}</span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <GraduationCap size={16} className="text-gray-400" />
                          Chương trình chính
                        </label>
                        <Select value={programId} onValueChange={setProgramId}>
                          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100">
                            <SelectValue placeholder="Chọn chương trình" />
                          </SelectTrigger>
                          <SelectContent className="z-12050">
                            {programs.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Không có chương trình khả dụng</div>
                            ) : (
                              programs.map((program) => (
                                <SelectItem key={program.id} value={program.id}>
                                  {program.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <BookOpen size={16} className="text-gray-400" />
                          Chọn lớp học <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={classId}
                          onValueChange={(value) => {
                            setClassId(value);
                            setClassSearchQuery("");

                            const matched = classes.find((item) => item.id === value);
                            if (matched?.programId) {
                              setProgramId(matched.programId);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100">
                            <SelectValue placeholder="Chọn lớp học" />
                          </SelectTrigger>
                          <SelectContent className="z-12050">
                            <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                              <input
                                type="text"
                                value={classSearchQuery}
                                onChange={(e) => setClassSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm lớp học..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            {isLoadingClasses ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Đang tải...</div>
                            ) : filteredClasses.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy lớp học</div>
                            ) : (
                              filteredClasses.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  <span className="font-medium text-red-600">{cls.code}</span>
                                  <span className="text-gray-700"> - {cls.title}</span>
                                  {cls.programName && (
                                    <span className="text-gray-500"> - {cls.programName}</span>
                                  )}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Calendar size={16} className="text-gray-400" />
                          Ngày ghi danh <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={enrollDate}
                          onChange={(e) => setEnrollDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                      Thông tin bổ sung
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <CreditCard size={16} className="text-gray-400" />
                          Gói học
                        </label>
                        <Select value={tuitionPlanId} onValueChange={setTuitionPlanId}>
                          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100">
                            <SelectValue
                              placeholder={
                                selectedProgram
                                  ? "Chọn gói học theo chương trình"
                                  : "Chọn chương trình trước khi chọn gói học"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="z-12050">
                            {!selectedProgram ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Vui lòng chọn chương trình trước</div>
                            ) : filteredTuitionPlans.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">Không có gói học phù hợp</div>
                            ) : (
                              filteredTuitionPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name}
                                  <span className="text-gray-400 text-xs ml-1">({plan.totalSessions} buổi)</span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <GraduationCap size={16} className="text-gray-400" />
                          Loại ghi danh
                        </label>
                        <Select
                          value={track}
                          onValueChange={(value) => setTrack(value as "primary" | "secondary")}
                        >
                          <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm transition-all hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100">
                            <SelectValue placeholder="Chọn loại ghi danh" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Chương trình chính</SelectItem>
                            <SelectItem value="secondary">Chương trình song song</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Clock3 size={14} className="text-red-500" />
                        Mẫu lịch học (tùy chọn)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setUseWeeklyPattern((prev) => !prev)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          useWeeklyPattern
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {useWeeklyPattern ? "Đang bật" : "Đang tắt"}
                      </button>
                    </div>

                    {!classId ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        Vui lòng chọn lớp trước để tải lịch học từ lớp.
                      </div>
                    ) : isLoadingClassSchedule ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                        <Loader2 size={14} className="animate-spin text-red-500" />
                        Đang tải lịch học của lớp...
                      </div>
                    ) : classScheduleSlots.length === 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        Lớp này chưa có lịch học hợp lệ để áp dụng weeklyPattern.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                          <div className="font-semibold text-gray-800 mb-1">Lịch lớp hiện tại</div>
                          <div>{classScheduleText || "Đã tải lịch theo từng buổi từ lớp."}</div>
                        </div>

                        {useWeeklyPattern && (
                          <>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-2">
                                Chế độ áp dụng
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setWeeklyPatternMode("class")}
                                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                                    weeklyPatternMode === "class"
                                      ? "border-red-500 bg-red-50 text-red-700"
                                      : "border-gray-200 bg-white text-gray-700 hover:border-red-200"
                                  }`}
                                >
                                  Theo toàn bộ lịch lớp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWeeklyPatternMode("custom")}
                                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                                    weeklyPatternMode === "custom"
                                      ? "border-red-500 bg-red-50 text-red-700"
                                      : "border-gray-200 bg-white text-gray-700 hover:border-red-200"
                                  }`}
                                >
                                  Chọn ngày mong muốn
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-2">
                                Buổi học từ lớp
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {classScheduleSlots.map((slot) => {
                                  const key = buildSlotKey(slot);
                                  const selected = selectedCustomSlotKeys.includes(key);
                                  const endTime = computeEndTime(slot.startTime, slot.durationMinutes);
                                  const disabled = weeklyPatternMode !== "custom";

                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => toggleCustomSlot(key)}
                                      className={`rounded-xl border px-3 py-2 text-left transition-all ${
                                        disabled
                                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                          : selected
                                            ? "border-red-400 bg-red-50 text-red-700"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-red-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">{DAY_LABELS[slot.dayOfWeek]}</span>
                                        {selected && <Check size={14} />}
                                      </div>
                                      <div className="text-xs mt-1">
                                        {slot.startTime}{endTime ? ` - ${endTime}` : ""} ({slot.durationMinutes} phút)
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
          </form>
        </div>

        {/* Footer - Giống modal mẫu */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                Đặt lại
              </button>
              <button
                type="submit"
                form="create-enrollment-form"
                disabled={isSubmitting || !classId || !studentProfileId || !enrollDate}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Đang xử lý..." : "Tạo ghi danh"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
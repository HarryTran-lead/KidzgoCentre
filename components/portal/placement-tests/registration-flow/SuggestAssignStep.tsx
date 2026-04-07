import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, School } from "lucide-react";
import type {
  RegistrationTrackType,
  SuggestedClassBucket,
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

function parseClassScheduleMeta(pattern?: string | null) {
  const raw = String(pattern || "").trim();
  if (!raw) {
    return { availableDays: [] as string[], defaultTime: "" };
  }

  const normalized = raw.replace(/^RRULE:/i, "");
  const tokens = normalized.split(";").map((item) => item.trim());
  const map = new Map<string, string>();

  tokens.forEach((token) => {
    const [k, v] = token.split("=");
    if (!k || !v) return;
    map.set(k.toUpperCase(), v);
  });

  const dayOrder = ["2", "3", "4", "5", "6", "7", "CN"];
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
    .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  const hourRaw = map.get("BYHOUR");
  const minuteRaw = map.get("BYMINUTE") || "0";
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const defaultTime =
    Number.isFinite(hour) && Number.isFinite(minute)
      ? `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      : "";

  return { availableDays, defaultTime };
}

function buildSessionSelectionPattern(
  days: string[],
  startTime: string,
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

  return `FREQ=WEEKLY;BYDAY=${byDay};BYHOUR=${hour};BYMINUTE=${minute}`;
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

interface SuggestAssignStepProps {
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
  selectedClassId: string;
  setSelectedClassId: (value: string) => void;
  activeSuggestedClasses: any[];
  activeAlternativeClasses: any[];
  formatSchedulePattern: (value?: string | null) => string;
  handleAssignClass: (sessionSelectionPattern?: string) => void;
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
  handleAssignManualClasses: () => void;
}

export default function SuggestAssignStep({
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
  selectedClassId,
  setSelectedClassId,
  activeSuggestedClasses,
  activeAlternativeClasses,
  formatSchedulePattern,
  handleAssignClass,
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
      ),
    [classMap, manualPrimaryClassId],
  );
  const secondaryScheduleMeta = useMemo(
    () =>
      parseClassScheduleMeta(
        classMap.get(manualSecondaryClassId)?.schedulePattern,
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

  const selectedSuggestedScheduleMeta = useMemo(
    () => parseClassScheduleMeta(selectedSuggestedClass?.schedulePattern),
    [selectedSuggestedClass],
  );

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

  const selectedTotalDays = useMemo(() => {
    const merged = new Set<string>([
      ...manualPrimaryDays,
      ...manualSecondaryDays,
    ]);
    return merged.size;
  }, [manualPrimaryDays, manualSecondaryDays]);

  useEffect(() => {
    if (assignViewMode !== "manual") return;
    setManualPrimaryDays((prev) => {
      const kept = prev.filter((day) =>
        primaryScheduleMeta.availableDays.includes(day),
      );
      if (kept.length > 0) return kept;
      return primaryScheduleMeta.availableDays[0]
        ? [primaryScheduleMeta.availableDays[0]]
        : [];
    });
    setManualPrimaryTime(
      (prev) => prev || primaryScheduleMeta.defaultTime || "",
    );
  }, [
    assignViewMode,
    primaryScheduleMeta.availableDays,
    primaryScheduleMeta.defaultTime,
  ]);

  useEffect(() => {
    if (assignViewMode !== "manual") return;
    setManualSecondaryDays((prev) => {
      const kept = prev.filter((day) =>
        secondaryScheduleMeta.availableDays.includes(day),
      );
      if (kept.length > 0) return kept;
      return secondaryScheduleMeta.availableDays[0]
        ? [secondaryScheduleMeta.availableDays[0]]
        : [];
    });
    setManualSecondaryTime(
      (prev) => prev || secondaryScheduleMeta.defaultTime || "",
    );
  }, [
    assignViewMode,
    secondaryScheduleMeta.availableDays,
    secondaryScheduleMeta.defaultTime,
  ]);

  useEffect(() => {
    setManualPrimarySessionPattern(
      buildSessionSelectionPattern(manualPrimaryDays, manualPrimaryTime),
    );
  }, [manualPrimaryDays, manualPrimaryTime, setManualPrimarySessionPattern]);

  useEffect(() => {
    if (!hasSecondaryTrack) {
      setManualSecondarySessionPattern("");
      return;
    }

    setManualSecondarySessionPattern(
      buildSessionSelectionPattern(manualSecondaryDays, manualSecondaryTime),
    );
  }, [
    hasSecondaryTrack,
    manualSecondaryDays,
    manualSecondaryTime,
    setManualSecondarySessionPattern,
  ]);

  useEffect(() => {
    if (assignViewMode !== "suggested") return;

    if (selectedTrack === "secondary") {
      setSuggestedSecondaryDays((prev) => {
        const kept = prev.filter((day) =>
          selectedSuggestedScheduleMeta.availableDays.includes(day),
        );
        if (kept.length > 0) return kept;
        return selectedSuggestedScheduleMeta.availableDays[0]
          ? [selectedSuggestedScheduleMeta.availableDays[0]]
          : [];
      });
      setSuggestedSecondaryTime(
        (prev) => prev || selectedSuggestedScheduleMeta.defaultTime || "",
      );
      return;
    }

    setSuggestedPrimaryDays((prev) => {
      const kept = prev.filter((day) =>
        selectedSuggestedScheduleMeta.availableDays.includes(day),
      );
      if (kept.length > 0) return kept;
      return selectedSuggestedScheduleMeta.availableDays[0]
        ? [selectedSuggestedScheduleMeta.availableDays[0]]
        : [];
    });
    setSuggestedPrimaryTime(
      (prev) => prev || selectedSuggestedScheduleMeta.defaultTime || "",
    );
  }, [
    assignViewMode,
    selectedTrack,
    selectedSuggestedScheduleMeta.availableDays,
    selectedSuggestedScheduleMeta.defaultTime,
  ]);

  const suggestedPrimarySessionPattern = useMemo(
    () =>
      buildSessionSelectionPattern(suggestedPrimaryDays, suggestedPrimaryTime),
    [suggestedPrimaryDays, suggestedPrimaryTime],
  );

  const suggestedSecondarySessionPattern = useMemo(
    () =>
      buildSessionSelectionPattern(
        suggestedSecondaryDays,
        suggestedSecondaryTime,
      ),
    [suggestedSecondaryDays, suggestedSecondaryTime],
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

    setManualSecondaryClassId(secondaryManualClassOptions[0]?.id || "");
  }, [
    assignViewMode,
    hasSecondaryTrack,
    manualSecondaryClassId,
    secondaryManualClassOptions,
    setManualSecondaryClassId,
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
    const currentPattern =
      selectedTrack === "secondary"
        ? suggestedSecondarySessionPattern
        : suggestedPrimarySessionPattern;
    handleAssignClass(currentPattern || undefined);
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
  }: {
    title: string;
    selectedClassId: string;
    selectedDays: string[];
    setSelectedDays: (value: string[]) => void;
    selectedTime: string;
    setSelectedTime: (value: string) => void;
    scheduleMeta: { availableDays: string[]; defaultTime: string };
    pattern: string;
  }) => {
    if (!selectedClassId) return null;

    return (
      <div className="space-y-3 bg-transparent w-full">
        <div className="text-sm font-semibold text-gray-800">{title}</div>
        <div className="space-y-1.5">
          <div className="text-[11px] text-gray-500">
            Chọn ngày học thuộc lịch của lớp đã chọn
          </div>
          <div className="grid grid-cols-4 gap-1.5 md:grid-cols-7">
            {WEEK_DAYS.map((day) => {
              const available = scheduleMeta.availableDays.includes(day.value);
              const active = selectedDays.includes(day.value);
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
                  className={`rounded-lg border px-1.5 py-1.5 text-center text-xs transition-colors ${
                    active
                      ? "border-red-500 bg-red-50 text-red-700 font-medium"
                      : available
                        ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  }`}
                >
                  <div className="leading-none">{day.shortLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] text-gray-500">
            Giờ bắt đầu buổi học
          </label>
          <input
            type="time"
            value={selectedTime}
            disabled
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 outline-none cursor-not-allowed"
          />
          {scheduleMeta.defaultTime ? (
            <p className="text-[11px] text-gray-500">
              Giờ học của lớp:{" "}
              <span className="font-medium text-gray-700">
                {scheduleMeta.defaultTime}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
        <ArrowRight size={18} className="text-red-600" />
        Gợi ý lớp phù hợp và xếp lớp
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <button
            type="button"
            onClick={handleSuggestClasses}
            disabled={!registrationId || isSuggesting}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
              assignViewMode === "suggested"
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

          <button
            type="button"
            onClick={handleLoadManualClasses}
            disabled={
              !allowManualAssign ||
              !registrationId ||
              isLoadingManualClasses ||
              !branchId
            }
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
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

          <button
            type="button"
            onClick={handleMoveToWaitingList}
            disabled={!registrationId || isWaiting}
            className="w-full rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWaiting ? "Đang xử lý..." : "Đưa vào danh sách chờ"}
          </button>
        </div>

        <div className="rounded-xl border border-red-100 bg-white/80 p-3">
          {assignViewMode === "suggested" && suggestedClasses && (
            <div className="space-y-3">
              {(hasSecondaryTrack || suggestedClasses.programName) && (
                <div className="rounded-xl border border-red-200 bg-white p-3">
                  <div className="text-sm font-semibold text-gray-900">
                    Track xếp lớp
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack("primary");
                        setSelectedClassId(
                          String(
                            suggestedClasses.suggestedClasses?.[0]?.id ?? "",
                          ),
                        );
                      }}
                      className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${
                        selectedTrack === "primary"
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      Primary
                      {suggestedClasses.programName
                        ? ` • ${suggestedClasses.programName}`
                        : ""}
                    </button>
                    {hasSecondaryTrack ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrack("secondary");
                          setSelectedClassId(
                            String(
                              suggestedClasses.secondarySuggestedClasses?.[0]
                                ?.id ?? "",
                            ),
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
                  {selectedTrack === "secondary" &&
                  suggestedClasses.secondaryProgramSkillFocus ? (
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
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
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
                          title={cls.schedulePattern || ""}
                        >
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
                  <div className="text-sm font-semibold text-amber-900">
                    Lớp thay thế
                  </div>
                  <div className="mt-2 text-xs text-amber-800">
                    Có {activeAlternativeClasses.length} lớp thay thế cho track{" "}
                    {selectedTrack}.
                  </div>
                </div>
              )}

              {selectedClassId
                ? renderTrackSessionSelector({
                    title:
                      selectedTrack === "secondary"
                        ? "Secondary - chọn ngày/giờ học"
                        : "Primary - chọn ngày/giờ học",
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
                  })
                : null}

              <button
                type="button"
                onClick={handleAssignSuggestedClass}
                disabled={!selectedClassId || isAssigning}
                className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning ? "Đang xếp lớp..." : "Xếp vào lớp đã chọn"}
              </button>
            </div>
          )}

          {allowManualAssign && assignViewMode === "manual" && (
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
                {/* <div className="mt-1 text-[11px] text-gray-500">
                  Tổng ngày đã chọn cho manual assign: {selectedTotalDays}
                  {preferredDays.length > 0 ? ` / ${preferredDays.length} ngày mong muốn` : ""}
                </div> */}
              </div>

              {manualClasses.length === 0 && !isLoadingManualClasses ? (
                <div className="text-xs text-gray-600">
                  Không có lớp để xếp thủ công trong phạm vi chi nhánh hiện tại.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Lớp cho chương trình Primary
                    </label>
                    <select
                      value={manualPrimaryClassId}
                      onChange={(e) => setManualPrimaryClassId(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="">Chọn lớp Primary</option>
                      {primaryManualClassOptions.map((option) => (
                        <option
                          key={`manual-primary-${option.id}`}
                          value={option.id}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {renderTrackSessionSelector({
                      title: "Primary - chọn ngày/giờ học",
                      selectedClassId: manualPrimaryClassId,
                      selectedDays: manualPrimaryDays,
                      setSelectedDays: setManualPrimaryDays,
                      selectedTime: manualPrimaryTime,
                      setSelectedTime: setManualPrimaryTime,
                      scheduleMeta: primaryScheduleMeta,
                      pattern: manualPrimarySessionPattern,
                    })}
                  </div>

                  {hasSecondaryTrack && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Lớp cho chương trình Secondary
                      </label>
                      <select
                        value={manualSecondaryClassId}
                        onChange={(e) =>
                          setManualSecondaryClassId(e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Chọn lớp Secondary</option>
                        {secondaryManualClassOptions.map((option) => (
                          <option
                            key={`manual-secondary-${option.id}`}
                            value={option.id}
                            disabled={option.disabled}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {renderTrackSessionSelector({
                        title: "Secondary - chọn ngày/giờ học",
                        selectedClassId: manualSecondaryClassId,
                        selectedDays: manualSecondaryDays,
                        setSelectedDays: setManualSecondaryDays,
                        selectedTime: manualSecondaryTime,
                        setSelectedTime: setManualSecondaryTime,
                        scheduleMeta: secondaryScheduleMeta,
                        pattern: manualSecondarySessionPattern,
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleAssignManualClasses}
                disabled={
                  !manualPrimaryClassId ||
                  isAssigning ||
                  primaryManualClassOptions.length === 0 ||
                  (hasSecondaryTrack &&
                    secondaryManualClassOptions.length === 0) ||
                  (hasSecondaryTrack && !manualSecondaryClassId)
                }
                className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAssigning
                  ? "Đang xếp lớp..."
                  : hasSecondaryTrack
                    ? "Xếp lớp thủ công (Primary + Secondary)"
                    : "Xếp lớp thủ công (Primary)"}
              </button>
            </div>
          )}

          {assignViewMode === "none" && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
              Chọn "Gợi ý lớp phù hợp" hoặc "Xếp lớp thủ công" để bắt đầu thao
              tác xếp lớp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

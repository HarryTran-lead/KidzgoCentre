"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Calendar, Clock, Filter, Loader2, Share2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type { WeeklyPatternEntry } from "@/types/registration";
import type { Registration, RegistrationTrackType } from "@/types/registration";

type TransferClassOption = {
  id: string;
  name: string;
  schedule: string;
  status?: string;
  remainingSlots: number | null;
  disabled?: boolean;
  disabledReason?: string;
  defaultSessionPattern?: string;
  defaultWeeklyPattern?: WeeklyPatternEntry[];
};

type RegistrationTransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedRegistration: Registration | null;
  transferTrack: RegistrationTrackType;
  setTransferTrack: (value: RegistrationTrackType) => void;
  transferClassId: string;
  setTransferClassId: (value: string) => void;
  transferEffectiveDate: string;
  setTransferEffectiveDate: (value: string) => void;
  transferSessionPattern: string;
  setTransferSessionPattern: (value: string) => void;
  transferWeeklyPattern: WeeklyPatternEntry[];
  setTransferWeeklyPattern: (value: WeeklyPatternEntry[]) => void;
  transferClassOptions: TransferClassOption[];
  isLoadingTransferClasses: boolean;
  isTransferring: boolean;
  onConfirmTransfer: () => void;
};

const RRULE_DAY_LABELS: Record<string, string> = {
  MO: "Thứ 2",
  TU: "Thứ 3",
  WE: "Thứ 4",
  TH: "Thứ 5",
  FR: "Thứ 6",
  SA: "Thứ 7",
  SU: "Chủ nhật",
};

function normalizeRRuleDay(value?: string): string {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
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
  };
  return map[raw] || "";
}

function normalizeTime(value?: string): string {
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

function buildPreviewFromWeeklyPattern(value?: WeeklyPatternEntry[]): string[] {
  if (!Array.isArray(value) || value.length === 0) return [];

  const lines = value
    .flatMap((entry) => {
      const time = normalizeTime(entry?.startTime);
      const days = Array.isArray(entry?.dayOfWeeks)
        ? entry.dayOfWeeks
            .map((day) => normalizeRRuleDay(String(day)))
            .filter(Boolean)
        : [];
      if (!time || days.length === 0) return [] as string[];
      return days.map(
        (dayCode) => `${RRULE_DAY_LABELS[dayCode] || dayCode} • ${time}`,
      );
    })
    .filter(Boolean);

  return Array.from(new Set(lines));
}

function buildPreviewFromScheduleText(value?: string): string[] {
  const text = String(value || "").trim();
  if (!text) return [];

  const chunks = text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const day = extractRRuleDayFromText(chunk);
      const timeMatch = chunk.match(
        /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})?/,
      );
      const startTime = normalizeTime(timeMatch?.[1]);
      return {
        day,
        startTime,
      };
    })
    .filter((item) => item.day && item.startTime)
    .map(
      (item) => `${RRULE_DAY_LABELS[item.day] || item.day} • ${item.startTime}`,
    );

  return Array.from(new Set(chunks));
}

export default function RegistrationTransferModal({
  isOpen,
  onClose,
  selectedRegistration,
  transferTrack,
  setTransferTrack,
  transferClassId,
  setTransferClassId,
  transferEffectiveDate,
  setTransferEffectiveDate,
  transferSessionPattern,
  setTransferSessionPattern,
  transferWeeklyPattern,
  setTransferWeeklyPattern,
  transferClassOptions,
  isLoadingTransferClasses,
  isTransferring,
  onConfirmTransfer,
}: RegistrationTransferModalProps) {
  const [selectedScheduleKeys, setSelectedScheduleKeys] = useState<string[]>(
    [],
  );

  const selectedTransferClass = useMemo(
    () =>
      transferClassOptions.find((item) => item.id === transferClassId) ?? null,
    [transferClassId, transferClassOptions],
  );
  const hasEnabledTransferOption = useMemo(
    () => transferClassOptions.some((item) => !item.disabled),
    [transferClassOptions],
  );

  const computedSessionPattern = useMemo(() => {
    return selectedTransferClass?.defaultSessionPattern || "";
  }, [selectedTransferClass?.defaultSessionPattern]);

  const scheduleOptions = useMemo(() => {
    const fromWeeklyPattern =
      selectedTransferClass?.defaultWeeklyPattern?.flatMap((entry) => {
        const time = normalizeTime(entry?.startTime);
        const durationRaw = Number(entry?.durationMinutes);
        const durationMinutes =
          Number.isFinite(durationRaw) && durationRaw > 0
            ? Math.floor(durationRaw)
            : 90;
        const days = Array.isArray(entry?.dayOfWeeks)
          ? entry.dayOfWeeks
              .map((day) => normalizeRRuleDay(String(day)))
              .filter(Boolean)
          : [];
        if (!time || days.length === 0)
          return [] as Array<{
            key: string;
            dayCode: string;
            time: string;
            durationMinutes: number;
            label: string;
          }>;
        return days.map((dayCode) => ({
          key: `${dayCode}|${time}`,
          dayCode,
          time,
          durationMinutes,
          label: `${RRULE_DAY_LABELS[dayCode] || dayCode} • ${time}`,
        }));
      }) || [];

    if (fromWeeklyPattern.length > 0) {
      return Array.from(
        new Map(fromWeeklyPattern.map((item) => [item.key, item])).values(),
      );
    }

    const pattern = computedSessionPattern.trim();
    if (pattern) {
      const normalized = pattern.replace(/^RRULE:/i, "");
      const parts = new Map<string, string>();
      normalized.split(";").forEach((token) => {
        const [key, value] = token.split("=");
        if (!key || !value) return;
        parts.set(key.toUpperCase(), value);
      });

      const dayCodes = String(parts.get("BYDAY") || "")
        .split(",")
        .map((item) => normalizeRRuleDay(item))
        .filter(Boolean);
      const hour = Number(parts.get("BYHOUR") || "");
      const minute = Number(parts.get("BYMINUTE") || "");
      if (dayCodes.length > 0 && !Number.isNaN(hour) && !Number.isNaN(minute)) {
        const time = normalizeTime(
          `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        );
        if (time) {
          return dayCodes.map((dayCode) => ({
            key: `${dayCode}|${time}`,
            dayCode,
            time,
            durationMinutes: 90,
            label: `${RRULE_DAY_LABELS[dayCode] || dayCode} • ${time}`,
          }));
        }
      }
    }

    const fromScheduleText = buildPreviewFromScheduleText(
      selectedTransferClass?.schedule,
    )
      .map((line) => {
        const [dayLabelRaw, timeRaw] = line
          .split("•")
          .map((part) => part.trim());
        const dayCode =
          Object.entries(RRULE_DAY_LABELS).find(
            ([, label]) => label === dayLabelRaw,
          )?.[0] || "";
        const time = normalizeTime(timeRaw);
        if (!dayCode || !time) return null;
        return {
          key: `${dayCode}|${time}`,
          dayCode,
          time,
          durationMinutes: 90,
          label: `${RRULE_DAY_LABELS[dayCode] || dayCode} • ${time}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return Array.from(
      new Map(fromScheduleText.map((item) => [item.key, item])).values(),
    );
  }, [
    computedSessionPattern,
    selectedTransferClass?.defaultWeeklyPattern,
    selectedTransferClass?.schedule,
  ]);

  useEffect(() => {
    if (!transferClassId || scheduleOptions.length === 0) {
      setSelectedScheduleKeys([]);
      return;
    }

    setSelectedScheduleKeys((prev) => {
      const available = new Set(scheduleOptions.map((item) => item.key));
      const kept = prev.filter((key) => available.has(key));
      return kept.length > 0 ? kept : scheduleOptions.map((item) => item.key);
    });
  }, [transferClassId, scheduleOptions]);

  const selectedWeeklyPattern = useMemo(() => {
    if (scheduleOptions.length === 0 || selectedScheduleKeys.length === 0)
      return [] as WeeklyPatternEntry[];
    const selected = scheduleOptions.filter((item) =>
      selectedScheduleKeys.includes(item.key),
    );
    if (selected.length === 0) return [];

    const grouped = new Map<
      string,
      { dayOfWeeks: string[]; startTime: string; durationMinutes: number }
    >();
    selected.forEach((item) => {
      const groupKey = `${item.time}|${item.durationMinutes}`;
      const existing = grouped.get(groupKey);
      if (!existing) {
        grouped.set(groupKey, {
          dayOfWeeks: [item.dayCode],
          startTime: item.time,
          durationMinutes: item.durationMinutes,
        });
        return;
      }

      if (!existing.dayOfWeeks.includes(item.dayCode)) {
        existing.dayOfWeeks.push(item.dayCode);
      }
    });

    return Array.from(grouped.values())
      .map((entry) => ({
        dayOfWeeks: entry.dayOfWeeks,
        startTime: entry.startTime,
        durationMinutes: entry.durationMinutes,
      }))
      .filter(
        (entry) => entry.dayOfWeeks.length > 0 && Boolean(entry.startTime),
      );
  }, [scheduleOptions, selectedScheduleKeys]);

  const schedulePreview = useMemo(
    () => scheduleOptions.map((item) => item.label),
    [scheduleOptions],
  );

  const selectedCount = selectedScheduleKeys.length;

  const toggleScheduleKey = (key: string) => {
    setSelectedScheduleKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  useEffect(() => {
    setTransferWeeklyPattern(selectedWeeklyPattern);
  }, [selectedWeeklyPattern, setTransferWeeklyPattern]);

  useEffect(() => {
    if (!selectedWeeklyPattern.length) {
      setTransferSessionPattern("");
      return;
    }

    if (selectedWeeklyPattern.length === 1) {
      const entry = selectedWeeklyPattern[0];
      const [hourRaw, minuteRaw] = String(entry.startTime || "").split(":");
      const hour = Number(hourRaw || "");
      const minute = Number(minuteRaw || "");
      if (
        !Number.isNaN(hour) &&
        !Number.isNaN(minute) &&
        Array.isArray(entry.dayOfWeeks) &&
        entry.dayOfWeeks.length > 0
      ) {
        setTransferSessionPattern(
          `FREQ=WEEKLY;BYDAY=${entry.dayOfWeeks.join(",")};BYHOUR=${hour};BYMINUTE=${minute}`,
        );
        return;
      }
    }

    setTransferSessionPattern("");
  }, [selectedWeeklyPattern, setTransferSessionPattern]);

  useEffect(() => {
    if (!transferClassId) {
      if (transferWeeklyPattern.length > 0) {
        setTransferWeeklyPattern([]);
      }
      if (transferSessionPattern) {
        setTransferSessionPattern("");
      }
    }
  }, [
    transferClassId,
    transferWeeklyPattern,
    transferSessionPattern,
    setTransferWeeklyPattern,
    setTransferSessionPattern,
  ]);

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-linear-to-r from-red-600 to-red-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Chuyển lớp cùng trình độ
              </h3>
              <p className="text-sm text-red-100">
                Chuyển học viên sang lớp khác
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/15"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">
              Tên học viên:{" "}
              {selectedRegistration?.studentName || "Không có thông tin"}
            </p>
            <p>
              Lớp học hiện tại:{" "}
              {selectedRegistration?.className || "Chưa có lớp"}
              {selectedRegistration?.secondaryClassName
                ? ` • Chương trình song song: ${selectedRegistration.secondaryClassName}`
                : ""}
            </p>
          </div>

          {selectedRegistration?.secondaryClassId && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-red-600" />
                <label className="text-sm font-medium text-gray-700">Chương trình cần chuyển lớp</label>
              </div>
              <Select
                value={transferTrack}
                onValueChange={(value) =>
                  setTransferTrack(value as RegistrationTrackType)
                }
              >
                <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
                  <SelectValue placeholder="Chọn chương trình cần chuyển" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Chương trình chính</SelectItem>
                  <SelectItem value="secondary">
                    Chương trình song song
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-red-600" />
                <label className="text-sm font-semibold text-gray-900">Lớp mới cùng trình độ</label>
              </div>
              <Select
                value={transferClassId || "__none__"}
                onValueChange={(value) =>
                  setTransferClassId(value === "__none__" ? "" : value)
                }
                disabled={isLoadingTransferClasses}
              >
                <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100">
                  <SelectValue placeholder="Chọn lớp mới cùng trình độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    Chọn lớp mới cùng trình độ
                  </SelectItem>
                  {transferClassOptions.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      disabled={Boolean(item.disabled)}
                    >
                      {item.name} • Còn chỗ: {item.remainingSlots ?? "-"} •
                      Lịch: {item.schedule || "Chưa có"}
                      {item.disabledReason ? ` • ${item.disabledReason}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingTransferClasses ? (
                <p className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={12} className="animate-spin" /> Đang tải danh
                  sách lớp...
                </p>
              ) : !transferClassOptions.length ? (
                <p className="text-xs text-amber-700">
                  Không có lớp nào cùng chương trình để chuyển.
                </p>
              ) : !hasEnabledTransferOption ? (
                <p className="text-xs text-amber-700">
                  Các lớp cùng chương trình hiện không khả dụng để chuyển (đã
                  hủy hoặc hết chỗ).
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-red-600" />
                <label className="text-sm font-semibold text-gray-900">Ngày bắt đầu</label>
              </div>
              <input
                type="datetime-local"
                value={transferEffectiveDate}
                onChange={(e) => setTransferEffectiveDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-red-100 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Clock size={16} className="text-red-600" />
              Lịch học mong muốn
            </div>
            <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">
              {!transferClassId ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                  Chọn lớp mới để xem lịch học áp dụng.
                </div>
              ) : schedulePreview.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {scheduleOptions.map((item) => {
                      const isSelected = selectedScheduleKeys.includes(
                        item.key,
                      );
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleScheduleKey(item.key)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                            isSelected
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Đã chọn {selectedCount}/{scheduleOptions.length} buổi.
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Lớp đã chọn chưa có dữ liệu lịch chuẩn. Vui lòng kiểm tra lịch
                  lớp trước khi chuyển.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onConfirmTransfer}
            disabled={
              !transferClassId || isTransferring || isLoadingTransferClasses
            }
            className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:shadow-lg hover:shadow-red-500/25 cursor-pointer"
          >
            {isTransferring ? "Đang chuyển lớp..." : "Xác nhận chuyển lớp"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

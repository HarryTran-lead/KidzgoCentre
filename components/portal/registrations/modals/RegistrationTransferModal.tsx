"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import type { Registration, RegistrationTrackType } from "@/types/registration";

type TransferClassOption = {
  id: string;
  name: string;
  schedule: string;
  remainingSlots: number | null;
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
  transferClassOptions: TransferClassOption[];
  isLoadingTransferClasses: boolean;
  isTransferring: boolean;
  onConfirmTransfer: () => void;
};

const WEEK_DAYS = [
  { value: "2", shortLabel: "T2", label: "Thứ 2", rrule: "MO" },
  { value: "3", shortLabel: "T3", label: "Thứ 3", rrule: "TU" },
  { value: "4", shortLabel: "T4", label: "Thứ 4", rrule: "WE" },
  { value: "5", shortLabel: "T5", label: "Thứ 5", rrule: "TH" },
  { value: "6", shortLabel: "T6", label: "Thứ 6", rrule: "FR" },
  { value: "7", shortLabel: "T7", label: "Thứ 7", rrule: "SA" },
  { value: "CN", shortLabel: "CN", label: "Chủ nhật", rrule: "SU" },
];

const TIME_SLOTS = [
  { value: "morning", label: "Sáng", timeRange: "08:00 - 10:00", startTime: "08:00" },
  { value: "late-morning", label: "Trưa", timeRange: "10:00 - 12:00", startTime: "10:00" },
  { value: "afternoon", label: "Chiều", timeRange: "14:00 - 16:00", startTime: "14:00" },
  { value: "late-afternoon", label: "Chiều", timeRange: "16:00 - 18:00", startTime: "16:00" },
  { value: "evening", label: "Tối", timeRange: "18:00 - 20:00", startTime: "18:00" },
  { value: "late-evening", label: "Tối", timeRange: "19:30 - 21:30", startTime: "19:30" },
];

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
  transferClassOptions,
  isLoadingTransferClasses,
  isTransferring,
  onConfirmTransfer,
}: RegistrationTransferModalProps) {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");

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

  const computedSessionPattern = useMemo(() => {
    if (selectedDays.length === 0) return "";

    const dayOrder = ["2", "3", "4", "5", "6", "7", "CN"];
    const byDay = [...selectedDays]
      .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
      .map((dayValue) => WEEK_DAYS.find((day) => day.value === dayValue)?.rrule)
      .filter(Boolean)
      .join(",");

    if (!byDay) return "";

    let sourceTime = "";
    if (useCustomTime) {
      if (!startTime || !endTime || startTime >= endTime) return "";
      sourceTime = startTime;
    } else {
      sourceTime = TIME_SLOTS.find((slot) => slot.value === selectedTimeSlot)?.startTime || "";
      if (!sourceTime) return "";
    }

    const [hourRaw, minuteRaw] = sourceTime.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

    return `FREQ=WEEKLY;BYDAY=${byDay};BYHOUR=${hour};BYMINUTE=${minute}`;
  }, [selectedDays, selectedTimeSlot, useCustomTime, startTime, endTime]);

  useEffect(() => {
    setTransferSessionPattern(computedSessionPattern);
  }, [computedSessionPattern, setTransferSessionPattern]);

  useEffect(() => {
    if (!isOpen) return;
    setSessionsPerWeek(2);
    setSelectedDays([]);
    setSelectedTimeSlot("");
    setUseCustomTime(false);
    setStartTime("18:00");
    setEndTime("20:00");
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-linear-to-r from-red-600 to-red-700 px-5 py-3 text-white">
          <h3 className="text-lg font-semibold">Chuyển lớp cùng trình độ</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/15"        
            aria-label="Dong"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Tên học viên: {selectedRegistration?.studentName || "Không có thông tin"}</p>
            <p>
              Lớp học hiện tại: {selectedRegistration?.className || "Chưa có lớp"}
              {selectedRegistration?.secondaryClassName
                ? ` • Secondary: ${selectedRegistration.secondaryClassName}`
                : ""}
            </p>
          </div>

          {selectedRegistration?.secondaryClassId && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Track chuyển lớp</label>
              <select
                value={transferTrack}
                onChange={(e) => setTransferTrack(e.target.value as RegistrationTrackType)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Lớp mới</label>
              <select
                value={transferClassId}
                onChange={(e) => setTransferClassId(e.target.value)}
                disabled={isLoadingTransferClasses}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
              >
                <option value="">Chọn lớp mới</option>
                {transferClassOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} • Còn chỗ: {item.remainingSlots ?? "-"} • {item.schedule}
                  </option>
                ))}
              </select>
              {isLoadingTransferClasses ? (
                <p className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={12} className="animate-spin" /> Đang tải danh sách lớp...
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Ngày bắt đầu</label>
              <input
                type="datetime-local"
                value={transferEffectiveDate}
                onChange={(e) => setTransferEffectiveDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-red-100 p-4">
            <div className="mb-3 text-lg font-semibold text-gray-800">Lịch học mong muốn</div>

            <div className="space-y-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">
              <div className="space-y-1.5">
                <p className="text-sm text-gray-700">Số buổi học mỗi tuần</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSessionsPerWeekChange(2)}
                    className={`flex-1 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      sessionsPerWeek === 2
                        ? "border-red-600 bg-linear-to-r from-red-600 to-red-700 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    2 buổi/tuần
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSessionsPerWeekChange(3)}
                    className={`flex-1 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      sessionsPerWeek === 3
                        ? "border-red-600 bg-linear-to-r from-red-600 to-red-700 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    3 buổi/tuần
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm text-gray-700">Chọn ngày học (tối đa {sessionsPerWeek} ngày)</p>
                <div className="grid grid-cols-4 gap-2 lg:grid-cols-7">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    const isDisabled = !isSelected && selectedDays.length >= sessionsPerWeek;
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        disabled={isDisabled}
                        className={`rounded-xl border p-1.5 text-center transition-colors ${
                          isSelected
                            ? "border-red-500 bg-red-100 text-red-700"
                            : isDisabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-sm font-semibold leading-none">{day.shortLabel}</div>
                        <div className="mt-1 text-[11px] leading-tight">{day.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Khung giờ học</p>
                  <button
                    type="button"
                    onClick={() => setUseCustomTime((prev) => !prev)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    {useCustomTime ? "Chọn khung giờ mẫu" : "Nhập giờ tùy chỉnh"}
                  </button>
                </div>

                {!useCustomTime ? (
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot.value)}
                        className={`rounded-xl border px-2 py-1.5 text-center transition-colors ${
                          selectedTimeSlot === slot.value
                            ? "border-red-600 bg-linear-to-r from-red-600 to-red-700 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-sm font-semibold leading-none">{slot.label}</div>
                        <div className="mt-1 text-[11px] leading-tight">{slot.timeRange}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                    <span className="text-sm font-medium text-gray-500">đến</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={onConfirmTransfer}
              disabled={!transferClassId || isTransferring || isLoadingTransferClasses}
              className="rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTransferring ? "Đang chuyển lớp..." : "Xác nhận chuyển lớp"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

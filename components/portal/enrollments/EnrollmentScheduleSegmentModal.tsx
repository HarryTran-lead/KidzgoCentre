"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Clock, Loader2, X } from "lucide-react";
import type { Enrollment } from "@/types/enrollment";
import {
  addEnrollmentScheduleSegment,
  getEnrollmentById,
} from "@/lib/api/enrollmentService";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import { useToast } from "@/hooks/use-toast";

const VALID_DAY_CODES = new Set(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);

interface EnrollmentScheduleSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: Enrollment | null;
  onChanged?: () => void;
}

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function isSupplementaryEnrollment(enrollment: Enrollment | null | undefined) {
  if (!enrollment) return false;
  if (enrollment.track === "secondary") return true;

  const normalizedSource = [
    enrollment.programName,
    enrollment.classTitle,
    enrollment.classCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /(supplementary|makeup|compensatory|bù|\bbu\b)/i.test(normalizedSource);
}

export default function EnrollmentScheduleSegmentModal({
  isOpen,
  onClose,
  enrollment,
  onChanged,
}: EnrollmentScheduleSegmentModalProps) {
  const { toast } = useToast();

  const [detailEnrollment, setDetailEnrollment] = useState<Enrollment | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [segmentEffectiveFrom, setSegmentEffectiveFrom] = useState("");
  const [segmentEffectiveTo, setSegmentEffectiveTo] = useState("");
  const [segmentDayCodes, setSegmentDayCodes] = useState("");
  const [segmentStartTime, setSegmentStartTime] = useState("");
  const [segmentDurationMinutes, setSegmentDurationMinutes] = useState("90");
  const [segmentClearPattern, setSegmentClearPattern] = useState(false);
  const [isAddingSegment, setIsAddingSegment] = useState(false);

  const displayedEnrollment = detailEnrollment || enrollment;
  const isSupplementaryOnlyFeature = useMemo(
    () => isSupplementaryEnrollment(displayedEnrollment),
    [displayedEnrollment],
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const fetchDetail = useCallback(async () => {
    if (!isOpen || !enrollment?.id) return;

    try {
      setIsLoadingDetail(true);
      const response = await getEnrollmentById(enrollment.id);
      if (response.isSuccess && response.data) {
        setDetailEnrollment(response.data);
        return;
      }
      setDetailEnrollment(null);
    } catch {
      setDetailEnrollment(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [isOpen, enrollment?.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!isOpen) {
      setDetailEnrollment(null);
      setSegmentEffectiveFrom("");
      setSegmentEffectiveTo("");
      setSegmentDayCodes("");
      setSegmentStartTime("");
      setSegmentDurationMinutes("90");
      setSegmentClearPattern(false);
    }
  }, [isOpen]);

  const handleAddScheduleSegment = async () => {
    if (!displayedEnrollment?.id) return;

    if (!isSupplementaryOnlyFeature) {
      toast({
        title: "Không áp dụng",
        description: "Schedule segment chỉ áp dụng cho chương trình bù.",
        variant: "destructive",
      });
      return;
    }

    const effectiveFrom = segmentEffectiveFrom.trim();
    if (!effectiveFrom) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn ngày hiệu lực bắt đầu (effectiveFrom).",
        variant: "destructive",
      });
      return;
    }

    const normalizedDays = segmentDayCodes
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);

    const hasInvalidDayCodes = normalizedDays.some((code) => !VALID_DAY_CODES.has(code));
    if (hasInvalidDayCodes) {
      toast({
        title: "Dữ liệu không hợp lệ",
        description: "Day codes chỉ chấp nhận: MO, TU, WE, TH, FR, SA, SU.",
        variant: "destructive",
      });
      return;
    }

    if (segmentEffectiveTo && segmentEffectiveTo < effectiveFrom) {
      toast({
        title: "Dữ liệu không hợp lệ",
        description: "effectiveTo phải lớn hơn hoặc bằng effectiveFrom.",
        variant: "destructive",
      });
      return;
    }

    const durationMinutes = Number(segmentDurationMinutes || "0");
    const canBuildPattern =
      !segmentClearPattern &&
      normalizedDays.length > 0 &&
      Boolean(segmentStartTime.trim()) &&
      Number.isFinite(durationMinutes) &&
      durationMinutes > 0;

    if (!segmentClearPattern && !canBuildPattern) {
      toast({
        title: "Thiếu dữ liệu",
        description:
          "Khi không bật Clear weekly pattern, bạn cần nhập day codes, start time và duration > 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingSegment(true);

      const response = await addEnrollmentScheduleSegment(displayedEnrollment.id, {
        effectiveFrom,
        effectiveTo: segmentEffectiveTo.trim() || null,
        clearWeeklyPattern: segmentClearPattern,
        weeklyPattern: canBuildPattern
          ? [
              {
                dayOfWeeks: normalizedDays as any,
                startTime: segmentStartTime.trim(),
                durationMinutes,
              },
            ]
          : undefined,
      });

      if (!response.isSuccess) {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể thêm schedule segment.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Thành công",
        description: "Đã thêm schedule segment cho ghi danh.",
        variant: "success",
      });

      setSegmentEffectiveFrom("");
      setSegmentEffectiveTo("");
      setSegmentDayCodes("");
      setSegmentStartTime("");
      setSegmentDurationMinutes("90");
      setSegmentClearPattern(false);

      await fetchDetail();
      onChanged?.();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: getDomainErrorMessage(error, "Không thể thêm schedule segment."),
        variant: "destructive",
      });
    } finally {
      setIsAddingSegment(false);
    }
  };

  if (!isOpen || !enrollment) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-linear-to-r from-indigo-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                <Calendar size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Schedule Segment</h3>
                <p className="text-xs text-blue-100">
                  Tách riêng khỏi chi tiết ghi danh - chỉ dùng cho chương trình bù
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Đóng"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>
                <span className="text-gray-500">Học viên:</span>{" "}
                <span className="font-semibold text-gray-900">{displayedEnrollment?.studentName || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Lớp:</span>{" "}
                <span className="font-semibold text-gray-900">{displayedEnrollment?.classTitle || displayedEnrollment?.classCode || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Track:</span>{" "}
                <span className="font-semibold text-gray-900">{displayedEnrollment?.track || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500">Chương trình:</span>{" "}
                <span className="font-semibold text-gray-900">{displayedEnrollment?.programName || "N/A"}</span>
              </div>
            </div>
          </div>

          {!isSupplementaryOnlyFeature && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  Ghi danh này không thuộc chương trình bù, nên không được cấu hình schedule segment.
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
            <div className="mb-3 text-sm font-semibold text-gray-700">Danh sách segment hiện tại</div>
            {isLoadingDetail ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                Đang tải chi tiết segment...
              </div>
            ) : !Array.isArray(displayedEnrollment?.scheduleSegments) ||
              displayedEnrollment.scheduleSegments.length === 0 ? (
              <div className="text-sm text-gray-500">Chưa có segment riêng.</div>
            ) : (
              <div className="space-y-2">
                {displayedEnrollment.scheduleSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-gray-800">
                      {formatDate(segment.effectiveFrom)} - {segment.effectiveTo ? formatDate(segment.effectiveTo) : "Hiện tại"}
                    </div>
                    <div className="mt-1 text-gray-600">
                      {Array.isArray(segment.activeWeeklyPattern) && segment.activeWeeklyPattern.length > 0
                        ? segment.activeWeeklyPattern
                            .map((entry) => {
                              const days = Array.isArray(entry?.dayOfWeeks)
                                ? entry.dayOfWeeks.join(", ")
                                : "";
                              const startTime = String(entry?.startTime || "").trim();
                              const duration = Number(entry?.durationMinutes || 0);
                              const durationLabel =
                                Number.isFinite(duration) && duration > 0
                                  ? `${duration} phút`
                                  : "";
                              return [days, startTime, durationLabel]
                                .filter(Boolean)
                                .join(" • ");
                            })
                            .filter(Boolean)
                            .join(" | ")
                        : "Học toàn bộ lịch lớp"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-gray-700">Thêm Schedule Segment</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                type="date"
                value={segmentEffectiveFrom}
                onChange={(event) => setSegmentEffectiveFrom(event.target.value)}
                disabled={!isSupplementaryOnlyFeature}
                className={cn(
                  "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none",
                  !isSupplementaryOnlyFeature && "cursor-not-allowed bg-gray-100 text-gray-400",
                )}
              />
              <input
                type="date"
                value={segmentEffectiveTo}
                onChange={(event) => setSegmentEffectiveTo(event.target.value)}
                disabled={!isSupplementaryOnlyFeature}
                className={cn(
                  "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none",
                  !isSupplementaryOnlyFeature && "cursor-not-allowed bg-gray-100 text-gray-400",
                )}
              />
              <input
                type="text"
                value={segmentDayCodes}
                onChange={(event) => setSegmentDayCodes(event.target.value)}
                placeholder="Days: MO,WE,SA"
                disabled={!isSupplementaryOnlyFeature || segmentClearPattern}
                className={cn(
                  "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none",
                  (!isSupplementaryOnlyFeature || segmentClearPattern) &&
                    "cursor-not-allowed bg-gray-100 text-gray-400",
                )}
              />
              <input
                type="time"
                value={segmentStartTime}
                onChange={(event) => setSegmentStartTime(event.target.value)}
                disabled={!isSupplementaryOnlyFeature || segmentClearPattern}
                className={cn(
                  "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none",
                  (!isSupplementaryOnlyFeature || segmentClearPattern) &&
                    "cursor-not-allowed bg-gray-100 text-gray-400",
                )}
              />
              <input
                type="number"
                min={1}
                value={segmentDurationMinutes}
                onChange={(event) => setSegmentDurationMinutes(event.target.value)}
                placeholder="Duration minutes"
                disabled={!isSupplementaryOnlyFeature || segmentClearPattern}
                className={cn(
                  "rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none",
                  (!isSupplementaryOnlyFeature || segmentClearPattern) &&
                    "cursor-not-allowed bg-gray-100 text-gray-400",
                )}
              />
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={segmentClearPattern}
                  onChange={(event) => setSegmentClearPattern(event.target.checked)}
                  disabled={!isSupplementaryOnlyFeature}
                />
                Clear weekly pattern
              </label>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Nếu bật Clear weekly pattern thì học viên sẽ quay về lịch đầy đủ của lớp.
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleAddScheduleSegment}
                disabled={isAddingSegment || !segmentEffectiveFrom.trim() || !isSupplementaryOnlyFeature}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingSegment && <Loader2 size={14} className="animate-spin" />}
                {isAddingSegment ? "Đang thêm..." : "Thêm segment"}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-linear-to-r from-blue-500/5 to-indigo-700/5 px-6 py-4">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-300 px-6 py-2.5 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

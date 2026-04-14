"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import type { Registration, RegistrationStatus } from "@/types/registration";

type RegistrationDetailModalProps = {
  isOpen: boolean;
  item: Registration | null;
  isLoading: boolean;
  onClose: () => void;
};

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

function statusBadgeClass(status: RegistrationStatus) {
  const classes: Record<RegistrationStatus, string> = {
    New: "bg-blue-100 text-blue-700",
    WaitingForClass: "bg-amber-100 text-amber-700",
    ClassAssigned: "bg-cyan-100 text-cyan-700",
    Studying: "bg-emerald-100 text-emerald-700",
    Paused: "bg-orange-100 text-orange-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-rose-100 text-rose-700",
  };
  return classes[status];
}

function toDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function toDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
}

function toTrackLabel(track?: string | null) {
  const normalized = String(track || "").toLowerCase();
  if (normalized === "secondary") return "Chương trình song song";
  return "Chương trình chính";
}

function toStudyDayCodesLabel(codes?: string[]) {
  const map: Record<string, string> = {
    MO: "Thứ 2",
    TU: "Thứ 3",
    WE: "Thứ 4",
    TH: "Thứ 5",
    FR: "Thứ 6",
    SA: "Thứ 7",
    SU: "Chủ nhật",
  };
  if (!Array.isArray(codes) || codes.length === 0) return "";
  return codes
    .map((value) => map[String(value || "").toUpperCase()] || String(value))
    .filter(Boolean)
    .join(", ");
}

function extractPlacementTestId(note?: string | null): string {
  const raw = String(note || "");
  const matched = raw.match(/PlacementTest:([0-9a-fA-F-]{36})/);
  return matched?.[1] || "";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default function RegistrationDetailModal({
  isOpen,
  item,
  isLoading,
  onClose,
}: RegistrationDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) return null;
  if (!item && !isLoading) return null;
  if (typeof window === "undefined") return null;

  const placementTestId = extractPlacementTestId(item?.note);
  const noteDisplay = String(item?.note || "").replace(
    /\.?\s*Started from PlacementTest:[0-9a-fA-F-]{36}\.?/g,
    "",
  ).trim();

  const placementTestDetailPath = useMemo(() => {
    if (!placementTestId) return "";
    const segments = String(pathname || "")
      .split("/")
      .filter(Boolean);
    const hasLocalePrefix = segments.length >= 2 && segments[1] === "portal";
    const localePrefix = hasLocalePrefix ? `/${segments[0]}` : "";

    return `${localePrefix}/portal/staff-management/leads?tab=placement_tests&placementTestId=${encodeURIComponent(
      placementTestId,
    )}`;
  }, [pathname, placementTestId]);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-red-100 bg-linear-to-r from-red-600 to-red-700 px-5 py-3 text-white">
          <h3 className="text-lg font-semibold">Chi tiết đăng ký</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/15"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" /> Đang tải chi tiết...
          </div>
        ) : item ? (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Học viên</div>
                <div className="text-lg font-semibold text-gray-900">
                  {item.studentName || "Không có thông tin"}
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(item.status)}`}
              >
                {statusLabel(item.status)}
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin chương trình</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info
                  label="Chương trình"
                  value={
                    item.secondaryProgramName
                      ? `${item.programName || "-"} • ${item.secondaryProgramName}`
                      : item.programName || "-"
                  }
                />
                <Info label="Gói học" value={item.tuitionPlanName || "-"} />
                <Info
                  label="Lớp"
                  value={
                    item.secondaryClassName
                      ? `${item.className || "Chưa xếp lớp"} • ${item.secondaryClassName}`
                      : item.className || "Chưa xếp lớp"
                  }
                />
                <Info
                  label="Chú trọng kĩ năng"
                  value={item.secondaryProgramSkillFocus || item.secondaryEntryType || "Chưa có"}
                />
                <Info label="Tổng số buổi" value={String(item.totalSessions ?? 0)} />
                <Info label="Đã học" value={String(item.usedSessions ?? 0)} />
                <Info label="Buổi còn lại" value={String(item.remainingSessions ?? 0)} />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin lịch học</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info label="Ngày dự kiến" value={toDate(item.expectedStartDate)} />
                <Info label="Ngày bắt đầu thực tế" value={toDate(item.actualStartDate)} />
                <Info label="Lịch học mong muốn" value={item.preferredSchedule || "-"} />
              </div>

              {!!item.actualStudySchedules?.length && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Lịch học thực tế theo tuần
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {item.actualStudySchedules.map((schedule, index) => {
                      const studyDays =
                        schedule.studyDaysSummary ||
                        (Array.isArray(schedule.studyDays) && schedule.studyDays.length > 0
                          ? schedule.studyDays.join(", ")
                          : toStudyDayCodesLabel(schedule.studyDayCodes) || "-");

                      return (
                        <div
                          key={`${schedule.track || "track"}-${schedule.classId || index}`}
                          className="rounded-xl border border-emerald-200 bg-white p-3"
                        >
                          <div className="text-sm font-semibold text-gray-900">
                            {toTrackLabel(schedule.track)}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-gray-700">
                            <div>
                              Lớp: <span className="font-semibold">{schedule.className || "Chưa xếp lớp"}</span>
                            </div>
                            <div>
                              Ngày học: <span className="font-semibold">{studyDays} hàng tuần</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Thông tin hệ thống</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info label="Ngày tạo" value={toDateTime(item.createdAt)} />
                <Info label="Cập nhật lần cuối" value={toDateTime(item.updatedAt)} />
              </div>

              <div className="group rounded-xl bg-white p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Ghi chú
                </div>
                <div className="mt-1 break-all text-sm font-semibold text-gray-900">
                  {noteDisplay || "-"}
                </div>

                {!!placementTestId && !!placementTestDetailPath && (
                  <button
                    type="button"
                    onClick={() => router.push(placementTestDetailPath)}
                    className="mt-2 text-xs font-medium text-red-600 opacity-0 transition-opacity hover:underline group-hover:opacity-100 cursor-pointer"
                    title="Ấn vào để xem bài kiểm tra đầu vào của bé này"
                  >
                    Ấn vào để xem bài kiểm tra đầu vào của bé này
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Download, ExternalLink, Loader2, X, User, Calendar, BookOpen, Clock, Tag, Users, GraduationCap, CalendarClock, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportRegistrationEnrollmentConfirmationPdf } from "@/lib/api/registrationService";
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
    New: "bg-blue-100 text-blue-700 border border-blue-200",
    WaitingForClass: "bg-amber-100 text-amber-700 border border-amber-200",
    ClassAssigned: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    Studying: "bg-green-100 text-green-700 border border-green-200",
    Paused: "bg-orange-100 text-orange-700 border border-orange-200",
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Cancelled: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return classes[status];
}

function statusIcon(status: RegistrationStatus) {
  switch (status) {
    case "Studying":
    case "Completed":
      return <CheckCircle size={14} className="mr-1" />;
    case "Cancelled":
      return <AlertCircle size={14} className="mr-1" />;
    default:
      return <Clock size={14} className="mr-1" />;
  }
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

function toDateTimeOrRaw(value?: string | null) {
  const formatted = toDateTime(value);
  if (formatted !== "-") return formatted;
  const raw = String(value || "").trim();
  return raw || "-";
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

function toStudyDayCodeLabel(code?: string | null) {
  if (!code) return "";
  return toStudyDayCodesLabel([String(code)]);
}

function normalizeVietnameseScheduleText(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  return raw
    .replace(/\bthu\s*2\b/gi, "Thứ 2")
    .replace(/\bthu\s*3\b/gi, "Thứ 3")
    .replace(/\bthu\s*4\b/gi, "Thứ 4")
    .replace(/\bthu\s*5\b/gi, "Thứ 5")
    .replace(/\bthu\s*6\b/gi, "Thứ 6")
    .replace(/\bthu\s*7\b/gi, "Thứ 7")
    .replace(/\bchu\s*nhat\b/gi, "Chủ nhật")
    .replace(/\bhang\s*tuan\b/gi, "hàng tuần")
    .replace(/\bngay\s*hoc\b/gi, "Ngày học");
}

function extractPlacementTestId(note?: string | null): string {
  const raw = String(note || "");
  const matched = raw.match(/placementtest\s*[:=]\s*([0-9a-fA-F-]{32,36})/i);
  return matched?.[1] || "";
}

function InfoCard({ icon, label, value, iconColor = "text-red-500" }: { icon?: React.ReactNode; label: string; value: string; iconColor?: string }) {
  return (
    <div className="rounded-xl bg-white p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        {icon && <div className={cn("flex-shrink-0", iconColor)}>{icon}</div>}
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </div>
      </div>
      <div className="mt-1 break-all text-sm font-semibold text-gray-900">{value || "-"}</div>
    </div>
  );
}

function Section({ title, icon, children, colorClass = "border-red-200 bg-red-50/40" }: { title: string; icon?: React.ReactNode; children: React.ReactNode; colorClass?: string }) {
  return (
    <div className={cn("space-y-3 rounded-xl border p-4", colorClass)}>
      <div className="flex items-center gap-2">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function RegistrationDetailModal({
  isOpen,
  item,
  isLoading,
  onClose,
}: RegistrationDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const placementTestId = extractPlacementTestId(item?.note);

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

  const handleOpenPlacementTest = useCallback(() => {
    if (!placementTestId || !placementTestDetailPath) return;
    const separator = placementTestDetailPath.includes("?") ? "&" : "?";
    router.push(`${placementTestDetailPath}${separator}from=registration-detail&ts=${Date.now()}`);
  }, [placementTestDetailPath, placementTestId, router]);

  const handleExportPdf = useCallback(async () => {
    if (!item?.id || isExportingPdf) return;

    try {
      setIsExportingPdf(true);
      const fileName = await exportRegistrationEnrollmentConfirmationPdf(item.id);
      toast({
        title: "Thành công",
        description: `Đã xuất file PDF: ${fileName}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error?.message || "Không thể xuất PDF xác nhận ghi danh.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, item?.id, toast]);

  if (!isOpen) return null;
  if (!item && !isLoading) return null;
  if (typeof window === "undefined") return null;

  const firstStudySession = item?.firstStudySession;
  const noteDisplay = String(item?.note || "")
    .replace(/\.?\s*Started\s+from\s+PlacementTest\s*[:=]\s*[0-9a-fA-F-]{32,36}\.?/gi, "")
    .replace(/\s*\|\s*$/, "")
    .trim();

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Gradient đỏ như các modal khác */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Chi tiết đăng ký</h3>
                <p className="text-xs text-red-100">Thông tin chi tiết về đăng ký học</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-600">
            <Loader2 size={20} className="animate-spin text-red-500" />
            <span>Đang tải chi tiết...</span>
          </div>
        ) : item ? (
          <div className="space-y-5 p-6">
            {/* Student Info Card */}
            <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50/50 to-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-md">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Học viên</div>
                    <div className="text-xl font-bold text-gray-900">
                      {item.studentName || "Không có thông tin"}
                    </div>
                  </div>
                </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExportingPdf ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Xuất PDF
                </button>
                  <span
                    className={cn(
                    "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold",
                    statusBadgeClass(item.status)
                  )}
                  >
                    {statusIcon(item.status)}
                  {statusLabel(item.status)}
                  </span>
              </div>
              </div>
            </div>

            {/* Program Information Section */}
            <Section 
              title="Thông tin chương trình" 
              icon={<GraduationCap size={16} className="text-blue-600" />}
              colorClass="border-blue-200 bg-blue-50/40"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoCard
                  icon={<BookOpen size={14} />}
                  label="Chương trình"
                  value={
                    item.secondaryProgramName
                      ? `${item.programName || "-"} • ${item.secondaryProgramName}`
                      : item.programName || "-"
                  }
                />
                <InfoCard
                  icon={<Tag size={14} />}
                  label="Gói học"
                  value={item.tuitionPlanName || "-"}
                />
                <InfoCard
                  icon={<Users size={14} />}
                  label="Lớp"
                  value={
                    item.secondaryClassName
                      ? `${item.className || "Chưa xếp lớp"} • ${item.secondaryClassName}`
                      : item.className || "Chưa xếp lớp"
                  }
                />
                <InfoCard
                  icon={<BookOpen size={14} />}
                  label="Chú trọng kĩ năng"
                  value={item.secondaryProgramSkillFocus || item.secondaryEntryType || "Chưa có"}
                />
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Tổng số buổi"
                  value={String(item.totalSessions ?? 0)}
                />
                <InfoCard
                  icon={<CheckCircle size={14} />}
                  label="Đã học"
                  value={String(item.usedSessions ?? 0)}
                />
                <InfoCard
                  icon={<Clock size={14} />}
                  label="Buổi còn lại"
                  value={String(item.remainingSessions ?? 0)}
                />
              </div>
            </Section>

            {/* Schedule Information Section */}
            <Section 
              title="Thông tin lịch học" 
              icon={<CalendarClock size={16} className="text-emerald-600" />}
              colorClass="border-emerald-200 bg-emerald-50/40"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Ngày dự kiến"
                  value={toDate(item.expectedStartDate)}
                />
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Ngày bắt đầu thực tế"
                  value={toDate(item.actualStartDate)}
                />
                <InfoCard
                  icon={<Clock size={14} />}
                  label="Lịch học mong muốn"
                  value={normalizeVietnameseScheduleText(item.preferredSchedule) || "-"}
                />
                <InfoCard
                  label="Buổi học đầu tiên"
                  value={
                    firstStudySession
                      ? [
                          toDateTime(
                            firstStudySession.sessionDate ||
                              null,
                          ),
                          normalizeVietnameseScheduleText(
                            firstStudySession.studyDayName,
                          ) ||
                            toStudyDayCodeLabel(firstStudySession.studyDayCode) ||
                            "",
                        ]
                          .filter((part) => part && part !== "-")
                          .join(" • ") || "-"
                      : "-"
                  }
                />
              </div>

              {!!item.actualStudySchedules?.length && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 flex items-center gap-1">
                    <Clock size={12} />
                    Lịch học thực tế theo tuần
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {item.actualStudySchedules.map((schedule, index) => {
                      const studyDays =
                        normalizeVietnameseScheduleText(schedule.studyDaysSummary) ||
                        (Array.isArray(schedule.studyDayDisplayNames) &&
                        schedule.studyDayDisplayNames.length > 0
                          ? normalizeVietnameseScheduleText(schedule.studyDayDisplayNames.join(", "))
                          : "") ||
                        (Array.isArray(schedule.studyDays) && schedule.studyDays.length > 0
                          ? normalizeVietnameseScheduleText(schedule.studyDays.join(", "))
                          : toStudyDayCodesLabel(schedule.studyDayCodes) || "-");

                      return (
                        <div
                          key={`${schedule.track || "track"}-${schedule.classId || index}`}
                          className="rounded-xl border border-emerald-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-100">
                              {schedule.track === "secondary" ? (
                                <BookOpen size={12} className="text-emerald-600" />
                              ) : (
                                <GraduationCap size={12} className="text-emerald-600" />
                              )}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {toTrackLabel(schedule.track)}
                            </div>
                          </div>
                          <div className="mt-2 space-y-1.5 text-xs text-gray-700">
                            <div className="flex items-start gap-1">
                              <Users size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <span>
                                Lớp: <span className="font-semibold">{schedule.className || "Chưa xếp lớp"}</span>
                              </span>
                            </div>
                            <div className="flex items-start gap-1">
                              <Calendar size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <span>
                                Ngày học: <span className="font-semibold">{studyDays} hàng tuần</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* System Information Section */}
            <Section 
              title="Thông tin hệ thống" 
              icon={<FileText size={16} className="text-red-600" />}
              colorClass="border-red-200 bg-red-50/40"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Ngày tạo"
                  value={toDateTime(item.createdAt)}
                />
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Cập nhật lần cuối"
                  value={toDateTime(item.updatedAt)}
                />
              </div>

              <div className="rounded-xl bg-white p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-red-500" />
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Ghi chú
                  </div>
                </div>
                <div className="mt-1 break-all text-sm font-medium text-gray-900">
                  {noteDisplay || "-"}
                </div>

                {!!placementTestId && !!placementTestDetailPath && (
                  <button
                    type="button"
                    onClick={handleOpenPlacementTest}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors cursor-pointer"
                    title="Ấn vào để xem bài kiểm tra đầu vào của bé này"
                  >
                    <ExternalLink size={12} />
                    Xem bài kiểm tra đầu vào
                  </button>
                )}
              </div>
            </Section>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
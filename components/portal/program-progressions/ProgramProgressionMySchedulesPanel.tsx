"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, RefreshCw, UserRound, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import LeadPagination from "@/components/portal/leads/LeadPagination";
import {
  getMyProgramProgressionAssessmentSchedules,
  getProgramProgressionSchedules,
} from "@/lib/api/programProgressionService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import type {
  ProgramProgressionMyAssessmentSchedule,
  ProgramProgressionScheduleParticipantStatus,
  ProgramProgressionScheduleStatus,
} from "@/types/program-progression";

type ProgramProgressionMySchedulesPanelProps = {
  canFilterByStudent?: boolean;
};

function scheduleStatusLabel(status: ProgramProgressionScheduleStatus): string {
  if (status === "Scheduled") return "Đã lên lịch";
  if (status === "Completed") return "Đã hoàn thành";
  return "Đã hủy";
}

function participantStatusLabel(status: ProgramProgressionScheduleParticipantStatus): string {
  if (status === "Scheduled") return "Đã lên lịch";
  if (status === "Completed") return "Đã hoàn thành";
  if (status === "NoShow") return "Vắng mặt";
  return "Đã hủy";
}

function assessmentStatusLabel(status?: string | null): string {
  if (!status) return "Chưa có";
  if (status === "Recorded") return "Đã ghi nhận";
  if (status === "Approved") return "Đã duyệt";
  return status;
}

function mapScheduleErrorMessage(error: unknown): string {
  const err = (error || {}) as {
    message?: string;
    response?: {
      data?: {
        title?: string;
        detail?: string;
        message?: string;
      };
    };
  };

  const title = String(err.response?.data?.title || "").trim().toLowerCase();
  const detail = String(
    err.response?.data?.detail || err.response?.data?.message || err.message || ""
  )
    .trim()
    .toLowerCase();

  if (title.includes("parentprofile") || detail.includes("parent profile not found in token")) {
    return "Hồ sơ phụ huynh trong phiên đăng nhập chưa đồng bộ. Hệ thống sẽ tự động thử lấy dữ liệu theo học sinh đang chọn.";
  }

  return "Vui lòng thử lại sau.";
}

export default function ProgramProgressionMySchedulesPanel({
  canFilterByStudent = false,
}: ProgramProgressionMySchedulesPanelProps) {
  const { toast } = useToast();
  const { selectedProfile } = useSelectedStudentProfile();

  const [items, setItems] = useState<ProgramProgressionMyAssessmentSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [statusFilter, setStatusFilter] = useState<"all" | ProgramProgressionScheduleStatus>("all");
  const [participantStatusFilter, setParticipantStatusFilter] = useState<
    "all" | ProgramProgressionScheduleParticipantStatus
  >("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const effectiveStudentProfileId = useMemo(
    () => (canFilterByStudent ? selectedProfile?.id?.trim() || undefined : undefined),
    [canFilterByStudent, selectedProfile?.id]
  );

  const query = useMemo(
    () => ({
      studentProfileId: effectiveStudentProfileId,
      status: statusFilter === "all" ? undefined : statusFilter,
      participantStatus:
        participantStatusFilter === "all" ? undefined : participantStatusFilter,
      from: fromDate ? `${fromDate}T00:00:00` : undefined,
      to: toDate ? `${toDate}T23:59:59` : undefined,
      pageNumber,
      pageSize,
    }),
    [
      effectiveStudentProfileId,
      statusFilter,
      participantStatusFilter,
      fromDate,
      toDate,
      pageNumber,
      pageSize,
    ]
  );

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMyProgramProgressionAssessmentSchedules(query);
      setItems(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      console.error("Failed to load my assessment schedules", error);

      const err = error as {
        message?: string;
        response?: { data?: { title?: string; detail?: string; message?: string } };
      };
      const title = String(err.response?.data?.title || "").trim().toLowerCase();
      const detail = String(err.response?.data?.detail || err.message || "").trim().toLowerCase();
      const isParentProfileMissing =
        title.includes("parentprofile") || detail.includes("parent profile not found in token");

      if (canFilterByStudent && effectiveStudentProfileId && isParentProfileMissing) {
        try {
          const fallback = await getProgramProgressionSchedules({
            sourceClassId: undefined,
            studentProfileId: effectiveStudentProfileId,
            status: statusFilter === "all" ? undefined : statusFilter,
            participantStatus:
              participantStatusFilter === "all" ? undefined : participantStatusFilter,
            from: fromDate ? `${fromDate}T00:00:00` : undefined,
            to: toDate ? `${toDate}T23:59:59` : undefined,
            pageNumber,
            pageSize,
          });

          const mapped = fallback.items.map((schedule) => {
            const participant = (schedule.participants || []).find(
              (item) => item.studentProfileId === effectiveStudentProfileId
            );

            return {
              id: schedule.id,
              sourceClassName: schedule.sourceClassName,
              scheduledAt: schedule.scheduledAt,
              durationMinutes: schedule.durationMinutes,
              roomName: schedule.roomName ?? null,
              assignedTeacherName: schedule.assignedTeacherName ?? null,
              status: schedule.status,
              participantStatus: participant?.status,
              assessmentStatus: participant?.assessmentStatus ?? null,
            } satisfies ProgramProgressionMyAssessmentSchedule;
          });

          setItems(mapped);
          setTotalCount(fallback.totalCount);
          setTotalPages(fallback.totalPages);

          toast({
            variant: "warning",
            title: "Đang dùng dữ liệu dự phòng",
            description: "Hệ thống đang hiển thị lịch theo hồ sơ học sinh đã chọn.",
          });
          return;
        } catch (fallbackError) {
          console.error("Fallback load for parent schedules failed", fallbackError);
        }
      }

      toast({
        variant: "destructive",
        title: "Không thể tải lịch của tôi",
        description: mapScheduleErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    canFilterByStudent,
    effectiveStudentProfileId,
    fromDate,
    pageNumber,
    pageSize,
    participantStatusFilter,
    query,
    statusFilter,
    toDate,
    toast,
  ]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    setPageNumber(1);
  }, [effectiveStudentProfileId, statusFilter, participantStatusFilter, fromDate, toDate]);

  const scheduleStats = useMemo(() => {
    const scheduledCount = items.filter((item) => item.status === "Scheduled").length;
    const completedCount = items.filter((item) => item.status === "Completed").length;
    const cancelledCount = items.filter((item) => item.status === "Cancelled").length;

    return {
      totalCount: items.length,
      scheduledCount,
      completedCount,
      cancelledCount,
    };
  }, [items]);

  const safeTotalCount = totalCount > 0 ? totalCount : items.length;
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
          <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 opacity-10 blur-xl" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 p-2.5 text-white flex-shrink-0">
              <CalendarClock size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Lịch trong trang</div>
              <div className="text-xl font-bold mt-1 text-gray-900">{scheduleStats.totalCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
          <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 opacity-10 blur-xl" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-2.5 text-white flex-shrink-0">
              <Clock3 size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Đã lên lịch</div>
              <div className="text-xl font-bold mt-1 text-gray-900">{scheduleStats.scheduledCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
          <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 opacity-10 blur-xl" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-2.5 text-white flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Hoàn thành</div>
              <div className="text-xl font-bold mt-1 text-gray-900">{scheduleStats.completedCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
          <div className="absolute right-0 top-0 h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-red-600 to-red-700 opacity-10 blur-xl" />
          <div className="relative flex items-center gap-3 z-10">
            <div className="rounded-xl bg-gradient-to-r from-slate-600 to-gray-700 p-2.5 text-white flex-shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">Đã hủy</div>
              <div className="text-xl font-bold mt-1 text-gray-900">{scheduleStats.cancelledCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {canFilterByStudent && (
            <div>
              <label className="mb-1 block text-xs text-gray-600">
                Học sinh đang theo dõi
              </label>
              <div className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-700">
                {selectedProfile?.displayName || "Chưa chọn học sinh"}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-gray-600">Trạng thái lịch</label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | ProgramProgressionScheduleStatus)
              }
              searchPlaceholder="Tìm kiếm trạng thái lịch..."
              emptyText="Không có trạng thái phù hợp."
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="Completed">Đã hoàn thành</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Trạng thái tham gia</label>
            <Select
              value={participantStatusFilter}
              onValueChange={(value) =>
                setParticipantStatusFilter(value as "all" | ProgramProgressionScheduleParticipantStatus)
              }
              searchPlaceholder="Tìm kiếm trạng thái tham gia..."
              emptyText="Không có trạng thái phù hợp."
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                <SelectValue placeholder="Chọn trạng thái tham gia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="Completed">Đã hoàn thành</SelectItem>
                <SelectItem value="NoShow">Vắng mặt</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-10 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-10 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => void loadSchedules()}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
        <div className="border-b border-red-100 bg-linear-to-r from-red-500/10 to-red-700/10 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Lịch đánh giá của tôi
            </h3>
            {!isLoading && (
              <span className="text-xs text-gray-500">
                {safeTotalCount} lịch
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-red-200 p-6 text-center">
              <CalendarClock size={22} className="mx-auto mb-2 text-red-500" />
              <div className="text-sm font-semibold text-gray-900">Không có lịch đánh giá</div>
              <p className="mt-1 text-xs text-gray-500">Bạn chưa có lịch đánh giá trong bộ lọc đã chọn.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-red-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-red-200 bg-linear-to-r from-red-500/5 to-red-700/5">
                    <tr>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Lớp</th>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Giáo viên / Phòng</th>
                      <th className="min-w-45 px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                      <th className="min-w-40 px-6 py-3 text-left text-sm font-semibold text-gray-700">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="group transition-all duration-200 hover:bg-linear-to-r hover:from-red-50/50 hover:to-white"
                      >
                        <td className="min-w-55 px-6 py-4 align-top text-sm text-gray-900">
                          <div className="font-medium">{item.sourceClassName || "Lớp chưa xác định"}</div>
                        </td>
                        <td className="min-w-55 px-6 py-4 align-top text-sm text-gray-700">
                          <div>{new Date(item.scheduledAt).toLocaleString("vi-VN")}</div>
                          <div className="mt-1 text-xs text-gray-500">Thời lượng: {item.durationMinutes ?? "--"} phút</div>
                        </td>
                        <td className="min-w-55 px-6 py-4 align-top text-sm text-gray-700">
                          <div className="inline-flex items-center gap-1.5">
                            <UserRound size={12} className="text-gray-400" />
                            <span>{item.assignedTeacherName || "--"}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">Phòng: {item.roomName || "--"}</div>
                        </td>
                        <td className="min-w-45 px-6 py-4 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                              {scheduleStatusLabel(item.status)}
                            </span>
                            {item.participantStatus && (
                              <span className="rounded-full border border-indigo-200 bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                                {participantStatusLabel(item.participantStatus)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="min-w-40 px-6 py-4 align-top text-sm text-gray-700">
                          {assessmentStatusLabel(item.assessmentStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <LeadPagination
                currentPage={pageNumber}
                totalPages={safeTotalPages}
                pageSize={pageSize}
                totalCount={safeTotalCount}
                itemLabel="lịch đánh giá"
                onPageChange={(page) => setPageNumber(page)}
                onPageSizeChange={() => undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

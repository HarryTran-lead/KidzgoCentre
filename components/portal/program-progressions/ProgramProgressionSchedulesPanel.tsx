"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  UserRound,
  UserX,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LeadPagination from "@/components/portal/leads/LeadPagination";
import {
  cancelProgramProgressionSchedule,
  createProgramProgressionSchedule,
  getProgramProgressionClassOptions,
  getProgramProgressionScheduleAvailability,
  getProgramProgressionScheduleContextOptions,
  getProgramProgressionSchedules,
  markProgramProgressionParticipantNoShow,
  updateProgramProgressionSchedule,
  type ProgramProgressionLookupOption,
} from "@/lib/api/programProgressionService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import ConfirmModal from "@/components/ConfirmModal";
import type {
  ProgramProgressionSchedule,
  ProgramProgressionScheduleStatus,
  ProgramProgressionScheduleUpsertPayload,
} from "@/types/program-progression";

type ProgramProgressionSchedulesPanelProps = {
  canManageSchedules: boolean;
  canCancelSchedules: boolean;
  canMarkNoShow: boolean;
  isStudentView?: boolean;
};

type ScheduleFormState = {
  sourceClassId: string;
  scheduledAt: string;
  durationMinutes: string;
  roomId: string;
  assignedTeacherUserId: string;
  notes: string;
  studentProfileIds: string[];
};

const FILTER_ALL_VALUE = "all";
const ROOM_NONE_VALUE = "__no_room__";
const TEACHER_NONE_VALUE = "__no_teacher__";
const CLASS_EMPTY_VALUE = "__select_class__";
const PAGE_SIZE = 10;

const DEFAULT_SCHEDULE_FORM: ScheduleFormState = {
  sourceClassId: "",
  scheduledAt: "",
  durationMinutes: "60",
  roomId: "",
  assignedTeacherUserId: "",
  notes: "",
  studentProfileIds: [],
};

function toLocalInputDateTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

function toUtcIso(localDateTime: string): string {
  if (!localDateTime) return "";
  return new Date(localDateTime).toISOString();
}

function parseOptionalNumber(value: string): number | undefined {
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function statusBadge(status: ProgramProgressionScheduleStatus): string {
  if (status === "Completed") return "bg-green-100 text-green-700 border-green-200";
  if (status === "Cancelled") return "bg-gray-100 text-gray-600 border-gray-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function scheduleStatusLabel(status: ProgramProgressionScheduleStatus): string {
  if (status === "Scheduled") return "Đã lên lịch";
  if (status === "Completed") return "Đã hoàn thành";
  return "Đã hủy";
}

function participantStatusLabel(status: string): string {
  if (status === "Scheduled") return "Đã lên lịch";
  if (status === "Completed") return "Đã hoàn thành";
  if (status === "NoShow") return "Vắng mặt";
  if (status === "Cancelled") return "Đã hủy";
  return status;
}

function normalizeOptions(options: ProgramProgressionLookupOption[]): ProgramProgressionLookupOption[] {
  const map = new Map<string, ProgramProgressionLookupOption>();
  for (const option of options) {
    if (!option.id.trim()) continue;
    if (!map.has(option.id)) {
      map.set(option.id, option);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function resolveScheduleErrorMessage(error: unknown): string {
  const fallback = "Vui lòng kiểm tra dữ liệu và thử lại.";
  const err = (error || {}) as {
    message?: string;
    response?: {
      data?: {
        title?: string;
        code?: string;
        message?: string;
        detail?: string;
      };
    };
  };

  const combined = [
    err.response?.data?.title,
    err.response?.data?.code,
    err.response?.data?.message,
    err.response?.data?.detail,
    err.message,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (combined.includes("one or more validation errors occurred") || combined.includes("validation")) {
    return "Dữ liệu lịch đánh giá chưa hợp lệ. Vui lòng kiểm tra lại lớp, thời gian, phòng và giáo viên.";
  }

  if (combined.includes("conflict") || combined.includes("schedule")) {
    return "Khung giờ đang bị trùng lịch hoặc không khả dụng. Vui lòng chọn thời gian khác.";
  }

  return fallback;
}

export default function ProgramProgressionSchedulesPanel({
  canManageSchedules,
  canCancelSchedules,
  canMarkNoShow,
  isStudentView = false,
}: ProgramProgressionSchedulesPanelProps) {
  const { toast } = useToast();

  const [items, setItems] = useState<ProgramProgressionSchedule[]>([]);
  const [classOptions, setClassOptions] = useState<ProgramProgressionLookupOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<ProgramProgressionLookupOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<ProgramProgressionLookupOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<ProgramProgressionLookupOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClassOptions, setIsLoadingClassOptions] = useState(true);
  const [isLoadingClassContext, setIsLoadingClassContext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [sourceClassIdFilter, setSourceClassIdFilter] = useState(FILTER_ALL_VALUE);
  const [statusFilter, setStatusFilter] = useState<"all" | ProgramProgressionScheduleStatus>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ProgramProgressionSchedule | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(DEFAULT_SCHEDULE_FORM);

  const [studentListModalSchedule, setStudentListModalSchedule] = useState<ProgramProgressionSchedule | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [schedulePendingCancel, setSchedulePendingCancel] = useState<ProgramProgressionSchedule | null>(null);
  const [isCancellingSchedule, setIsCancellingSchedule] = useState(false);
  const [availableRoomIds, setAvailableRoomIds] = useState<Set<string> | null>(null);
  const [availableTeacherIds, setAvailableTeacherIds] = useState<Set<string> | null>(null);
  const [isLoadingAvailabilityOptions, setIsLoadingAvailabilityOptions] = useState(false);

  const query = useMemo(
    () => ({
      sourceClassId:
        sourceClassIdFilter === FILTER_ALL_VALUE ? undefined : sourceClassIdFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      from: fromDate ? `${fromDate}T00:00:00` : undefined,
      to: toDate ? `${toDate}T23:59:59` : undefined,
      pageNumber,
      pageSize: PAGE_SIZE,
    }),
    [sourceClassIdFilter, statusFilter, fromDate, toDate, pageNumber]
  );

  const mergedClassOptions = useMemo(() => {
    const map = new Map<string, ProgramProgressionLookupOption>();
    for (const option of classOptions) {
      map.set(option.id, option);
    }
    for (const schedule of items) {
      if (schedule.sourceClassId && !map.has(schedule.sourceClassId)) {
        map.set(schedule.sourceClassId, {
          id: schedule.sourceClassId,
          name: schedule.sourceClassName || schedule.sourceClassId,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [classOptions, items]);

  const classNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of mergedClassOptions) {
      map.set(option.id, option.name);
    }
    return map;
  }, [mergedClassOptions]);

  const loadClassOptions = useCallback(async () => {
    setIsLoadingClassOptions(true);
    try {
      const options = await getProgramProgressionClassOptions({ pageSize: 200 });
      setClassOptions(options);
    } catch (error) {
      console.error("Failed to load class options", error);
      toast({
        variant: "warning",
        title: "Không thể tải danh sách lớp",
        description: "Bạn vẫn có thể tải lịch và thử làm mới lại.",
      });
    } finally {
      setIsLoadingClassOptions(false);
    }
  }, [toast]);

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getProgramProgressionSchedules(query);
      setItems(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("Failed to load progression schedules", error);
      toast({
        variant: "destructive",
        title: "Không thể tải lịch đánh giá",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, toast]);

  const loadClassContext = useCallback(
    async (classId: string, scheduleSeed?: ProgramProgressionSchedule | null) => {
      const safeClassId = classId.trim();
      if (!safeClassId) {
        setRoomOptions([]);
        setTeacherOptions([]);
        setStudentOptions([]);
        return;
      }

      setIsLoadingClassContext(true);
      try {
        const context = await getProgramProgressionScheduleContextOptions(safeClassId);

        const seededRooms = [...context.rooms];
        const seededTeachers = [...context.teachers];
        const seededStudents = [...context.students];

        if (
          scheduleSeed?.roomId &&
          !seededRooms.some((room) => room.id === scheduleSeed.roomId)
        ) {
          seededRooms.unshift({
            id: scheduleSeed.roomId,
            name: scheduleSeed.roomName || scheduleSeed.roomId,
          });
        }

        if (
          scheduleSeed?.assignedTeacherUserId &&
          !seededTeachers.some((teacher) => teacher.id === scheduleSeed.assignedTeacherUserId)
        ) {
          seededTeachers.unshift({
            id: scheduleSeed.assignedTeacherUserId,
            name:
              scheduleSeed.assignedTeacherName || scheduleSeed.assignedTeacherUserId,
          });
        }

        if (scheduleSeed?.participants) {
          for (const participant of scheduleSeed.participants) {
            if (!participant.studentProfileId) continue;
            if (seededStudents.some((student) => student.id === participant.studentProfileId)) {
              continue;
            }
            seededStudents.push({
              id: participant.studentProfileId,
              name: participant.studentName || participant.studentProfileId,
            });
          }
        }

        const normalizedRooms = normalizeOptions(seededRooms);
        const normalizedTeachers = normalizeOptions(seededTeachers);
        const normalizedStudents = normalizeOptions(seededStudents);

        setRoomOptions(normalizedRooms);
        setTeacherOptions(normalizedTeachers);
        setStudentOptions(normalizedStudents);

        setForm((prev) => {
          const nextRoomId = normalizedRooms.some((room) => room.id === prev.roomId)
            ? prev.roomId
            : "";
          const nextTeacherId = normalizedTeachers.some(
            (teacher) => teacher.id === prev.assignedTeacherUserId
          )
            ? prev.assignedTeacherUserId
            : "";
          const nextStudentIds = prev.studentProfileIds.filter((studentId) =>
            normalizedStudents.some((student) => student.id === studentId)
          );

          return {
            ...prev,
            roomId: nextRoomId,
            assignedTeacherUserId: nextTeacherId,
            studentProfileIds: nextStudentIds,
          };
        });
      } catch (error) {
        console.error("Failed to load schedule context options", error);
        setRoomOptions([]);
        setTeacherOptions([]);
        setStudentOptions([]);
        toast({
          variant: "warning",
          title: "Không thể tải dữ liệu lớp",
          description: "Vui lòng thử chọn lại lớp hoặc tải lại.",
        });
      } finally {
        setIsLoadingClassContext(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    void loadClassOptions();
  }, [loadClassOptions]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    setPageNumber(1);
  }, [sourceClassIdFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (!form.sourceClassId.trim()) {
      setRoomOptions([]);
      setTeacherOptions([]);
      setStudentOptions([]);
      return;
    }

    void loadClassContext(form.sourceClassId, editingSchedule);
  }, [isModalOpen, form.sourceClassId, editingSchedule, loadClassContext]);

  useEffect(() => {
    if (!isModalOpen) return;

    const sourceClassId = form.sourceClassId.trim();
    if (!sourceClassId || !form.scheduledAt) {
      setAvailableRoomIds(null);
      setAvailableTeacherIds(null);
      return;
    }

    const parsedDate = new Date(form.scheduledAt);
    if (Number.isNaN(parsedDate.getTime())) {
      setAvailableRoomIds(null);
      setAvailableTeacherIds(null);
      return;
    }

    let isCancelled = false;

    const loadAvailability = async () => {
      setIsLoadingAvailabilityOptions(true);
      try {
        const availability = await getProgramProgressionScheduleAvailability({
          sourceClassId,
          scheduledAt: parsedDate.toISOString(),
          durationMinutes: parseOptionalNumber(form.durationMinutes),
          excludeScheduleId: editingSchedule?.id,
          includeUnavailable: true,
        });

        if (isCancelled) return;

        const nextRoomIds = new Set(
          (availability?.availableRooms || []).map((room) => room.roomId)
        );
        const nextTeacherIds = new Set(
          (availability?.availableTeachers || []).map((teacher) => teacher.userId)
        );

        setAvailableRoomIds(nextRoomIds);
        setAvailableTeacherIds(nextTeacherIds);

        setForm((prev) => ({
          ...prev,
          roomId: prev.roomId && nextRoomIds.has(prev.roomId) ? prev.roomId : "",
          assignedTeacherUserId:
            prev.assignedTeacherUserId && nextTeacherIds.has(prev.assignedTeacherUserId)
              ? prev.assignedTeacherUserId
              : "",
        }));
      } catch (error) {
        if (isCancelled) return;

        console.error("Failed to auto-load schedule availability", error);
        setAvailableRoomIds(null);
        setAvailableTeacherIds(null);
      } finally {
        if (!isCancelled) {
          setIsLoadingAvailabilityOptions(false);
        }
      }
    };

    void loadAvailability();

    return () => {
      isCancelled = true;
    };
  }, [
    isModalOpen,
    form.sourceClassId,
    form.scheduledAt,
    form.durationMinutes,
    editingSchedule?.id,
  ]);

  const totalPagesForUi = Math.max(1, totalPages);
  const shownTotalCount = totalCount > 0 ? totalCount : items.length;
  const startIndex = shownTotalCount === 0 ? 0 : (pageNumber - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min((pageNumber - 1) * PAGE_SIZE + items.length, shownTotalCount);

  const resolveClassName = useCallback(
    (classId: string, fallbackName?: string | null): string => {
      return classNameById.get(classId) || fallbackName || classId;
    },
    [classNameById]
  );

  const scheduleStats = useMemo(() => {
    const scheduledCount = items.filter((item) => item.status === "Scheduled").length;
    const completedCount = items.filter((item) => item.status === "Completed").length;
    const cancelledCount = items.filter((item) => item.status === "Cancelled").length;
    const participantCount = items.reduce(
      (sum, item) => sum + (item.scheduledParticipantCount ?? item.participants?.length ?? 0),
      0
    );

    return {
      scheduledCount,
      completedCount,
      cancelledCount,
      participantCount,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((schedule) => {
      const searchable = [
        resolveClassName(schedule.sourceClassId, schedule.sourceClassName),
        schedule.sourceClassId,
        schedule.assignedTeacherName,
        schedule.roomName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    });
  }, [items, resolveClassName, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const shownItems = filteredItems;
  const displayTotalCount = isSearching ? filteredItems.length : shownTotalCount;
  const displayCurrentPage = isSearching ? 1 : pageNumber;
  const displayTotalPages = isSearching ? 1 : totalPagesForUi;

  const selectableRoomOptions = useMemo(() => {
    if (!availableRoomIds) return roomOptions;

    const filtered = roomOptions.filter((room) => availableRoomIds.has(room.id));
    if (!form.roomId) return filtered;

    const selected = roomOptions.find((room) => room.id === form.roomId);
    if (!selected || filtered.some((room) => room.id === selected.id)) {
      return filtered;
    }

    return [selected, ...filtered];
  }, [roomOptions, availableRoomIds, form.roomId]);

  const selectableTeacherOptions = useMemo(() => {
    if (!availableTeacherIds) return teacherOptions;

    const filtered = teacherOptions.filter((teacher) => availableTeacherIds.has(teacher.id));
    if (!form.assignedTeacherUserId) return filtered;

    const selected = teacherOptions.find(
      (teacher) => teacher.id === form.assignedTeacherUserId
    );
    if (!selected || filtered.some((teacher) => teacher.id === selected.id)) {
      return filtered;
    }

    return [selected, ...filtered];
  }, [teacherOptions, availableTeacherIds, form.assignedTeacherUserId]);

  const openCreate = () => {
    setEditingSchedule(null);
    setForm(DEFAULT_SCHEDULE_FORM);
    setRoomOptions([]);
    setTeacherOptions([]);
    setStudentOptions([]);
    setAvailableRoomIds(null);
    setAvailableTeacherIds(null);
    setIsModalOpen(true);
  };

  const openEdit = (schedule: ProgramProgressionSchedule) => {
    setEditingSchedule(schedule);
    setForm({
      sourceClassId: schedule.sourceClassId,
      scheduledAt: toLocalInputDateTime(schedule.scheduledAt),
      durationMinutes: schedule.durationMinutes ? String(schedule.durationMinutes) : "60",
      roomId: schedule.roomId || "",
      assignedTeacherUserId: schedule.assignedTeacherUserId || "",
      notes: schedule.notes || "",
      studentProfileIds: (schedule.participants || [])
        .map((participant) => participant.studentProfileId)
        .filter(Boolean),
    });
    setAvailableRoomIds(null);
    setAvailableTeacherIds(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting || isLoadingClassContext || isLoadingAvailabilityOptions) return;
    setIsModalOpen(false);
    setEditingSchedule(null);
    setForm(DEFAULT_SCHEDULE_FORM);
    setRoomOptions([]);
    setTeacherOptions([]);
    setStudentOptions([]);
    setAvailableRoomIds(null);
    setAvailableTeacherIds(null);
  };

  const handleSubmit = async () => {
    const sourceClassId = form.sourceClassId.trim();
    const scheduledAt = toUtcIso(form.scheduledAt);

    if (!sourceClassId || !scheduledAt) {
      toast({
        variant: "warning",
        title: "Thiếu thông tin bắt buộc",
        description: "Lớp và thời gian đánh giá là bắt buộc.",
      });
      return;
    }

    const payload: ProgramProgressionScheduleUpsertPayload = {
      sourceClassId,
      scheduledAt,
      durationMinutes: parseOptionalNumber(form.durationMinutes),
      roomId: form.roomId.trim() || null,
      assignedTeacherUserId: form.assignedTeacherUserId.trim() || null,
      notes: form.notes.trim() || null,
      studentProfileIds:
        form.studentProfileIds.length > 0
          ? Array.from(new Set(form.studentProfileIds))
          : null,
    };

    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        await updateProgramProgressionSchedule(editingSchedule.id, payload);
      } else {
        await createProgramProgressionSchedule(payload);
      }

      toast({
        variant: "success",
        title: editingSchedule ? "Cập nhật lịch thành công" : "Tạo lịch thành công",
        description: "Lịch đánh giá đã được lưu.",
      });

      closeModal();
      await loadSchedules();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Không thể lưu lịch",
        description: resolveScheduleErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSchedule = (schedule: ProgramProgressionSchedule) => {
    setSchedulePendingCancel(schedule);
    setIsCancelModalOpen(true);
  };

  const confirmCancelSchedule = async () => {
    if (!schedulePendingCancel) return;

    setIsCancellingSchedule(true);
    try {
      await cancelProgramProgressionSchedule(schedulePendingCancel.id);
      toast({
        variant: "success",
        title: "Đã hủy lịch",
        description: "Lịch đánh giá đã được chuyển sang trạng thái Đã hủy.",
      });
      setIsCancelModalOpen(false);
      setSchedulePendingCancel(null);
      await loadSchedules();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Không thể hủy lịch",
        description: resolveScheduleErrorMessage(error),
      });
    } finally {
      setIsCancellingSchedule(false);
    }
  };

  const handleMarkNoShow = async (participantId: string) => {
    const confirmed = window.confirm("Xác nhận đánh dấu học sinh này là vắng mặt?");
    if (!confirmed) return;

    try {
      await markProgramProgressionParticipantNoShow(participantId);
      toast({
        variant: "success",
        title: "Đã đánh dấu vắng mặt",
        description: "Trạng thái tham gia đã được cập nhật.",
      });
      await loadSchedules();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Không thể cập nhật trạng thái tham gia",
        description: resolveScheduleErrorMessage(error),
      });
    }
  };

  const toggleStudentSelection = (studentProfileId: string) => {
    setForm((prev) => {
      const selected = prev.studentProfileIds.includes(studentProfileId)
        ? prev.studentProfileIds.filter((id) => id !== studentProfileId)
        : [...prev.studentProfileIds, studentProfileId];

      return {
        ...prev,
        studentProfileIds: selected,
      };
    });
  };

  const selectAllStudents = () => {
    setForm((prev) => ({
      ...prev,
      studentProfileIds: studentOptions.map((student) => student.id),
    }));
  };

  const clearStudentSelection = () => {
    setForm((prev) => ({ ...prev, studentProfileIds: [] }));
  };

  const schedulePendingCancelLabel = schedulePendingCancel
    ? `${resolveClassName(
        schedulePendingCancel.sourceClassId,
        schedulePendingCancel.sourceClassName
      )} - ${new Date(schedulePendingCancel.scheduledAt).toLocaleString("vi-VN")}`
    : "lịch đánh giá này";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-red-600 to-red-700 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-2 text-white shadow-sm">
              <CalendarClock size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Đã lên lịch</div>
              <div className="text-xl font-bold text-gray-900">{scheduleStats.scheduledCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-gray-700 to-gray-800 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-gray-700 to-gray-800 p-2 text-white shadow-sm">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Đã hoàn thành</div>
              <div className="text-xl font-bold text-gray-900">{scheduleStats.completedCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-rose-500 to-rose-600 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-rose-500 to-rose-600 p-2 text-white shadow-sm">
              <XCircle size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Đã hủy</div>
              <div className="text-xl font-bold text-gray-900">{scheduleStats.cancelledCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-red-500 to-red-600 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-red-500 to-red-600 p-2 text-white shadow-sm">
              <Users size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Tổng học sinh trong trang</div>
              <div className="text-xl font-bold text-gray-900">{scheduleStats.participantCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative lg:flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo lớp, giáo viên, phòng học..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={sourceClassIdFilter}
              onValueChange={setSourceClassIdFilter}
              searchPlaceholder="Tìm lớp học..."
              emptyText="Không có lớp phù hợp."
            >
              <SelectTrigger className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>Tất cả lớp</SelectItem>
                {mergedClassOptions.map((classOption) => (
                  <SelectItem key={classOption.id} value={classOption.id}>
                    {classOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | ProgramProgressionScheduleStatus)
              }
              searchPlaceholder="Tìm kiếm trạng thái..."
              emptyText="Không có trạng thái phù hợp."
            >
              <SelectTrigger className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
                <SelectItem value="Completed">Đã hoàn thành</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />

            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void Promise.all([loadClassOptions(), loadSchedules()]);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
          >
            <RefreshCw size={16} /> Làm mới
          </button>

          {canManageSchedules && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} /> Tạo lịch đánh giá
            </button>
          )}
        </div>
      </div>

      <div
        className={
          isStudentView
            ? "rounded-2xl border border-white/15 bg-white/5"
            : "overflow-hidden rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm"
        }
      >
        <div
          className={
            isStudentView
              ? "border-b border-white/10 p-4"
              : "border-b border-red-100 bg-linear-to-r from-red-500/10 to-red-700/10 p-4"
          }
        >
          <div className="flex items-center justify-between">
            <h3 className={isStudentView ? "text-sm font-semibold text-white" : "text-sm font-semibold text-gray-900"}>
              Danh sách lịch đánh giá
            </h3>
            {!isLoading && (
              <span className={isStudentView ? "text-xs text-indigo-100" : "text-xs text-gray-500"}>
                {displayTotalCount} lịch
              </span>
            )}
          </div>
        </div>

        <div>
          {isLoading || isLoadingClassOptions ? (
            <div className={isStudentView ? "text-sm text-indigo-100" : "text-sm text-gray-500"}>
              Đang tải dữ liệu...
            </div>
          ) : shownItems.length === 0 ? (
            <div className="border border-dashed border-red-200 p-6 text-center">
              <CalendarClock size={22} className="mx-auto mb-2 text-red-500" />
              <div className="text-sm font-semibold text-gray-900">Không có lịch đánh giá</div>
              <p className="mt-1 text-xs text-gray-500">Thử thay đổi bộ lọc hoặc tạo lịch mới.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-red-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                    <tr>
                      <th className="min-w-52.5 px-6 py-3 text-left text-sm font-semibold text-gray-700">Lớp</th>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                      <th className="min-w-60 px-6 py-3 text-left text-sm font-semibold text-gray-700">Phòng / Giáo viên</th>
                      <th className="min-w-42.5 px-6 py-3 text-left text-sm font-semibold text-gray-700">Học sinh</th>
                      <th className="min-w-37.5 px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                      <th className="min-w-55 px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {shownItems.map((schedule) => (
                      <Fragment key={schedule.id}>
                        <tr
                          className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                        >
                          <td className="min-w-52.5 px-6 py-4 align-top text-sm text-gray-900">
                            <div className="font-medium">
                              {resolveClassName(schedule.sourceClassId, schedule.sourceClassName)}
                            </div>
                          </td>

                          <td className="min-w-55 px-6 py-4 align-top text-sm text-gray-700">
                            <div className="inline-flex items-center gap-1.5">
                              <Clock3 size={12} className="text-gray-400" />
                              <span>{new Date(schedule.scheduledAt).toLocaleString("vi-VN")}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Thời lượng: {schedule.durationMinutes ?? "--"} phút
                            </div>
                          </td>

                          <td className="min-w-60 px-6 py-4 align-top text-sm text-gray-700">
                            <div className="inline-flex items-center gap-1.5">
                              <MapPin size={12} className="text-gray-400" />
                              <span>{schedule.roomName || "Chưa gán phòng"}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                              <UserRound size={12} className="text-gray-400" />
                              <span>{schedule.assignedTeacherName || "Chưa gán giáo viên"}</span>
                            </div>
                          </td>

                          <td className="min-w-42.5 px-6 py-4 align-top text-sm text-gray-700">
                            <div>
                              {schedule.scheduledParticipantCount ?? schedule.participants?.length ?? 0} học sinh
                            </div>
                            <button
                              type="button"
                              onClick={() => setStudentListModalSchedule(schedule)}
                              className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              Xem chi tiết
                            </button>
                          </td>

                          <td className="min-w-37.5 px-6 py-4 align-top">
                            <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadge(schedule.status)}`}>
                              {scheduleStatusLabel(schedule.status)}
                            </span>
                          </td>

                          <td className="min-w-55 px-6 py-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              {canManageSchedules && schedule.status === "Scheduled" && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(schedule)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700"
                                >
                                  <Edit size={12} /> Sửa
                                </button>
                              )}

                              {canCancelSchedules && schedule.status === "Scheduled" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelSchedule(schedule)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                                >
                                  <XCircle size={12} /> Hủy lịch
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <LeadPagination
                currentPage={displayCurrentPage}
                totalPages={displayTotalPages}
                pageSize={PAGE_SIZE}
                totalCount={displayTotalCount}
                itemLabel="lịch đánh giá"
                onPageChange={(page) => {
                  if (!isSearching) {
                    setPageNumber(page);
                  }
                }}
                onPageSizeChange={() => undefined}
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-linear-to-r from-red-600 to-red-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {editingSchedule ? "Cập nhật lịch đánh giá" : "Tạo lịch đánh giá"}
                  </h3>
                  <p className="text-xs text-red-100">Thiết lập lịch, giáo viên, phòng và danh sách học sinh</p>
                </div>
                <button type="button" onClick={closeModal} className="rounded-full p-1 hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Lớp*</label>
                  <Select
                    value={form.sourceClassId || CLASS_EMPTY_VALUE}
                    onValueChange={(value) => {
                      const nextClassId = value === CLASS_EMPTY_VALUE ? "" : value;
                      setForm((prev) => ({
                        ...prev,
                        sourceClassId: nextClassId,
                        roomId: "",
                        assignedTeacherUserId: "",
                        studentProfileIds: [],
                      }));
                    }}
                    searchPlaceholder="Tìm lớp học..."
                    emptyText="Không có lớp phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue placeholder="Chọn lớp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CLASS_EMPTY_VALUE}>Chọn lớp</SelectItem>
                      {mergedClassOptions.map((classOption) => (
                        <SelectItem key={classOption.id} value={classOption.id}>
                          {classOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Thời gian đánh giá *</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Thời lượng (phút)</label>
                  <input
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))
                    }
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-xs text-gray-600">Phòng học</label>
                    {form.scheduledAt && (
                      <span className="text-[11px] text-blue-600">
                        {isLoadingAvailabilityOptions
                          ? "Đang lọc phòng trống..."
                          : `${selectableRoomOptions.length} phòng rảnh`}
                      </span>
                    )}
                  </div>
                  <Select
                    value={form.roomId || ROOM_NONE_VALUE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        roomId: value === ROOM_NONE_VALUE ? "" : value,
                      }))
                    }
                    searchPlaceholder="Tìm phòng học..."
                    emptyText="Không có phòng phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue placeholder="Chọn phòng học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ROOM_NONE_VALUE}>Chưa gán phòng</SelectItem>
                      {selectableRoomOptions.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-xs text-gray-600">Giáo viên phụ trách</label>
                    {form.scheduledAt && (
                      <span className="text-[11px] text-blue-600">
                        {isLoadingAvailabilityOptions
                          ? "Đang lọc giáo viên rảnh..."
                          : `${selectableTeacherOptions.length} giáo viên rảnh`}
                      </span>
                    )}
                  </div>
                  <Select
                    value={form.assignedTeacherUserId || TEACHER_NONE_VALUE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        assignedTeacherUserId: value === TEACHER_NONE_VALUE ? "" : value,
                      }))
                    }
                    searchPlaceholder="Tìm giáo viên..."
                    emptyText="Không có giáo viên phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue placeholder="Chọn giáo viên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TEACHER_NONE_VALUE}>Chưa gán giáo viên</SelectItem>
                      {selectableTeacherOptions.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs text-gray-600">Học sinh theo lớp</label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllStudents}
                      disabled={studentOptions.length === 0}
                      className="rounded-lg border border-red-200 bg-white px-2 py-1 font-semibold text-red-700 disabled:opacity-50"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={clearStudentSelection}
                      disabled={form.studentProfileIds.length === 0}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-600 disabled:opacity-50"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50/30 p-3">
                  {isLoadingClassContext ? (
                    <div className="text-xs text-gray-500">Đang tải danh sách học sinh theo lớp...</div>
                  ) : !form.sourceClassId.trim() ? (
                    <div className="text-xs text-gray-500">Vui lòng chọn lớp để hiển thị học sinh.</div>
                  ) : studentOptions.length === 0 ? (
                    <div className="text-xs text-gray-500">Lớp này chưa có dữ liệu học sinh hoạt động.</div>
                  ) : (
                    <>
                      <div className="mb-2 text-xs text-gray-600">
                        Đã chọn <span className="font-semibold text-gray-900">{form.studentProfileIds.length}</span> / {studentOptions.length} học sinh
                      </div>
                      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                        {studentOptions.map((student) => {
                          const checked = form.studentProfileIds.includes(student.id);
                          return (
                            <label
                              key={student.id}
                              className="flex cursor-pointer items-center justify-between rounded-lg border border-red-100 bg-white px-3 py-2"
                            >
                              <span className="text-sm text-gray-700">{student.name}</span>
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleStudentSelection(student.id)}
                                  className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200"
                                />
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Để trống sẽ áp dụng cho toàn bộ học sinh trong lớp.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">Ghi chú</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-red-100 bg-red-50/40 p-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || !form.sourceClassId.trim() || !form.scheduledAt}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                <Save size={14} /> {isSubmitting ? "Đang lưu..." : "Lưu lịch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {studentListModalSchedule && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setStudentListModalSchedule(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-linear-to-r from-red-600 to-red-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Danh sách học sinh</h3>
                  <p className="text-xs text-red-100">
                    {resolveClassName(
                      studentListModalSchedule.sourceClassId,
                      studentListModalSchedule.sourceClassName
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStudentListModalSchedule(null)}
                  className="rounded-full p-1 hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
              {studentListModalSchedule.participants &&
              studentListModalSchedule.participants.length > 0 ? (
                <div className="space-y-2">
                  {studentListModalSchedule.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between rounded-lg border border-red-100 bg-white p-3"
                    >
                      <div className="text-sm font-semibold text-gray-800">
                        {participant.studentName || "Học sinh"}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            participant.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : participant.status === "NoShow"
                              ? "bg-rose-100 text-rose-700"
                              : participant.status === "Cancelled"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {participantStatusLabel(participant.status)}
                        </span>

                        {canMarkNoShow &&
                          participant.status === "Scheduled" &&
                          studentListModalSchedule.status === "Scheduled" && (
                            <button
                              type="button"
                              onClick={() => void handleMarkNoShow(participant.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700"
                            >
                              <UserX size={11} /> Vắng mặt
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-red-200 bg-white p-3 text-sm text-gray-500">
                  Chưa có dữ liệu học sinh cho lịch này.
                </div>
              )}

              {studentListModalSchedule.notes && (
                <div className="rounded-lg border border-red-100 bg-red-50/30 p-3 text-sm text-gray-700">
                  Ghi chú: {studentListModalSchedule.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-red-100 bg-red-50/40 p-4">
              <button
                type="button"
                onClick={() => setStudentListModalSchedule(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          if (isCancellingSchedule) return;
          setIsCancelModalOpen(false);
          setSchedulePendingCancel(null);
        }}
        onConfirm={() => {
          void confirmCancelSchedule();
        }}
        title="Xác nhận hủy lịch đánh giá"
        message={`Bạn sắp hủy ${schedulePendingCancelLabel}. Sau khi hủy sẽ không thể khôi phục trạng thái ban đầu.`}
        confirmText="Hủy lịch"
        cancelText="Đóng"
        variant="danger"
        isLoading={isCancellingSchedule}
      />
    </div>
  );
}

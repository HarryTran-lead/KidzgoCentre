"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  User,
  Users,
  X,
} from "lucide-react";

import { createLeaveRequest } from "@/lib/api/leaveRequestService";
import { getClassById } from "@/lib/api/classService";
import { getAllStudents, getStudentClasses } from "@/lib/api/studentService";
import {
  getParentTimetable,
  type ParentTimetableSession,
} from "@/lib/api/parentScheduleService";
import { useToast } from "@/hooks/use-toast";
import { getDomainErrorMessage } from "@/lib/api/domainErrorMessage";
import { parseApiDateKeepWallClock } from "@/lib/datetime";

import type { LeaveRequestPayload, LeaveRequestRecord } from "@/types/leaveRequest";
import type { StudentClass } from "@/types/student/class";
import type { StudentSummary } from "@/types/student/student";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (record: LeaveRequestRecord) => void;
  lockedStudentProfileId?: string | null;
};

type FormErrors = Partial<
  Record<"studentProfileId" | "classId" | "sessionDate" | "endDate" | "reason", string>
>;

const initialFormState: LeaveRequestPayload = {
  studentProfileId: "",
  classId: "",
  sessionId: null,
  sessionDate: "",
  endDate: null,
  reason: "",
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getFieldClass(hasError: boolean, extra?: string) {
  return cn(
    "w-full rounded-xl bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all disabled:cursor-not-allowed disabled:opacity-60",
    hasError
      ? "border border-red-500 focus:border-red-500 focus:ring-red-100"
      : "border border-gray-200 focus:border-red-400 focus:ring-red-200",
    extra,
  );
}

function classLabel(item: StudentClass) {
  const raw = item as any;
  return raw.name ?? raw.className ?? raw.title ?? raw.code ?? raw.id;
}

function studentId(student: StudentSummary) {
  const raw = student as any;
  return raw.id ?? raw.profileId ?? raw.studentProfileId ?? raw.studentId ?? raw.userId ?? "";
}

function studentLabel(student: StudentSummary) {
  const raw = student as any;
  return raw.fullName ?? raw.name ?? raw.displayName ?? raw.email ?? raw.id ?? "Học viên";
}

function parentLabel(student: StudentSummary) {
  const raw = student as any;
  return (
    raw.parentName ??
    raw.fatherName ??
    raw.motherName ??
    raw.guardianName ??
    raw.userName ??
    raw.userEmail ??
    ""
  );
}

function studentClassLabel(student: StudentSummary) {
  const raw = student as any;

  if (raw.className) return raw.className;
  if (Array.isArray(raw.classNames) && raw.classNames.length) {
    return raw.classNames.filter(Boolean).join(", ");
  }
  if (Array.isArray(raw.classes) && raw.classes.length) {
    return raw.classes
      .map((item: any) => item.name ?? item.className ?? item.title ?? item.code ?? item.id)
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function studentClassOptions(student: StudentSummary): StudentClass[] {
  const raw = student as any;

  if (Array.isArray(raw.classes) && raw.classes.length) {
    return raw.classes
      .map((item: any) => ({
        id: item.id ?? item.classId ?? "",
        name: item.name ?? item.className ?? item.title ?? item.code,
      }))
      .filter((item: StudentClass) => item.id || item.name);
  }

  if (raw.classId || raw.className) {
    return [
      {
        id: raw.classId ?? "",
        name: raw.className ?? "",
      },
    ].filter((item: StudentClass) => item.id || item.name);
  }

  return [];
}

async function enrichClassNames(items: StudentClass[]) {
  const needsLookup = items.filter((item) => {
    const raw = item as any;
    return !raw.name && !raw.className && !raw.title && !raw.code;
  });

  if (!needsLookup.length) return items;

  const lookupIds = Array.from(
    new Set(needsLookup.map((item) => (item as any).id ?? item.id).filter(Boolean)),
  );

  const detailResults = await Promise.all(
    lookupIds.map(async (id) => {
      try {
        const response: any = await getClassById(id);
        return response?.data ? { id, detail: response.data } : null;
      } catch {
        return null;
      }
    }),
  );

  const detailMap = new Map(detailResults.filter(Boolean).map((item: any) => [item.id, item.detail]));

  return items.map((item) => {
    const raw = item as any;
    const id = raw.id ?? item.id;
    const detail = detailMap.get(id);
    if (!detail) return item;

    return {
      ...item,
      name: raw.name ?? detail.name ?? detail.className ?? detail.title ?? detail.code,
      className: raw.className ?? detail.className,
      title: raw.title ?? detail.title,
      code: raw.code ?? detail.code,
    } as StudentClass;
  });
}

function mergeClassOptions(primary: StudentClass[], fallback: StudentClass[]) {
  const merged = new Map<string, StudentClass>();

  [...fallback, ...primary].forEach((item) => {
    const key = String((item as any)?.id ?? item.id ?? item.name ?? "").trim();
    if (!key) return;

    if (!merged.has(key)) {
      merged.set(key, item);
      return;
    }

    const existing = merged.get(key)!;
    merged.set(key, {
      ...existing,
      ...item,
      name:
        (item as any)?.name ??
        (existing as any)?.name ??
        (item as any)?.className ??
        (existing as any)?.className,
    });
  });

  return Array.from(merged.values());
}

function Banner({
  kind,
  text,
}: {
  kind: "error" | "success";
  text: string;
}) {
  const cls =
    kind === "error"
      ? "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700"
      : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700";
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className={`rounded-2xl border p-3 ${cls}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5" />
        <div className="text-sm font-medium whitespace-pre-line">{text}</div>
      </div>
    </div>
  );
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateVN(value?: string | null) {
  const date = parseDateKey(value);
  if (!date) return value ?? "";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getCalendarStart(date: Date) {
  const start = getMonthStart(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  return start;
}

function getCalendarDays(date: Date) {
  const start = getCalendarStart(date);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatTimeRange(session: ParentTimetableSession) {
  const raw = session.plannedDatetime ?? session.actualDatetime;
  if (!raw) return "";

  const start = parseApiDateKeepWallClock(raw);
  if (Number.isNaN(start.getTime())) return "";

  const startHour = String(start.getHours()).padStart(2, "0");
  const startMin = String(start.getMinutes()).padStart(2, "0");

  const duration = Number(session.durationMinutes ?? 0);
  if (duration <= 0) {
    return `${startHour}:${startMin}`;
  }

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = startMinutes + duration;
  const endHour = String(Math.floor(endMinutes / 60) % 24).padStart(2, "0");
  const endMin = String(endMinutes % 60).padStart(2, "0");

  return `${startHour}:${startMin} - ${endHour}:${endMin}`;
}

function formatTimezoneOffset(date: Date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

function toLocalBoundaryIso(date: Date, boundary: "start" | "end") {
  const normalized = new Date(date);
  if (boundary === "start") {
    normalized.setHours(0, 0, 0, 0);
  } else {
    normalized.setHours(23, 59, 59, 999);
  }

  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  const hours = String(normalized.getHours()).padStart(2, "0");
  const minutes = String(normalized.getMinutes()).padStart(2, "0");
  const seconds = String(normalized.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${formatTimezoneOffset(normalized)}`;
}

function buildLeaveRequestErrorMessage(error: unknown, fallback: string) {
  const apiError = (error as any)?.response?.data ?? (error as any)?.data ?? (error as any);
  const code =
    apiError?.code ??
    apiError?.title ??
    apiError?.data?.code ??
    apiError?.data?.title;
  const description =
    apiError?.description ??
    apiError?.detail ??
    apiError?.message ??
    apiError?.data?.description ??
    apiError?.data?.detail ??
    apiError?.data?.message;

  if (code === "LeaveRequest.ExceededMonthlyLeaveLimit") {
    return "Học viên đã vượt quá giới hạn 2 buổi nghỉ trong tháng.";
  }

  return description ?? getDomainErrorMessage(error, fallback);
}

export default function LeaveRequestCreateModal({
  open,
  onClose,
  onCreated,
  lockedStudentProfileId,
}: Props) {
  const [formState, setFormState] = useState<LeaveRequestPayload>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState(false);
  const [studentProfiles, setStudentProfiles] = useState<StudentSummary[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const [classSessions, setClassSessions] = useState<ParentTimetableSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const isStudentLocked = !!lockedStudentProfileId;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (creating) return;
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, creating]);

  const handleClose = () => {
    if (!creating) onClose();
  };

  useEffect(() => {
    if (!open) {
      setFormState(initialFormState);
      setFormErrors({});
      setCreating(false);
      setActionError(null);
      setClasses([]);
      setClassesError(null);
      setProfilesError(null);
      setClassSessions([]);
      setSessionsError(null);
      setSearchTerm("");
      setParentSearchTerm("");
      setVisibleMonth(getMonthStart(new Date()));
    }
  }, [open]);

  useEffect(() => {
    if (!open || !lockedStudentProfileId) return;

    setFormState((prev) => ({
      ...prev,
      studentProfileId: lockedStudentProfileId,
      classId: "",
      sessionId: null,
      sessionDate: "",
      endDate: null,
    }));
    setFormErrors({});
    setClasses([]);
  }, [lockedStudentProfileId, open]);

  const filteredStudents = useMemo(() => {
    if (isStudentLocked) {
      const locked = studentProfiles.find((student) => studentId(student) === lockedStudentProfileId);
      return locked ? [locked] : [];
    }

    const studentTerm = searchTerm.trim().toLowerCase();
    const parentTerm = parentSearchTerm.trim().toLowerCase();
    if (!studentTerm && !parentTerm) return studentProfiles;

    return studentProfiles.filter((student) => {
      const matchedStudent = studentTerm ? studentLabel(student).toLowerCase().includes(studentTerm) : true;
      const matchedParent = parentTerm ? parentLabel(student).toLowerCase().includes(parentTerm) : true;
      return matchedStudent && matchedParent;
    });
  }, [isStudentLocked, lockedStudentProfileId, parentSearchTerm, searchTerm, studentProfiles]);

  const selectedStudent = useMemo(() => {
    const currentId = formState.studentProfileId;
    if (!currentId) return undefined;

    return (
      studentProfiles.find((student) => studentId(student) === currentId) ??
      filteredStudents.find((student) => studentId(student) === currentId)
    );
  }, [filteredStudents, formState.studentProfileId, studentProfiles]);

  const selectedStudentClassText = useMemo(() => {
    if (!selectedStudent) return "";
    return studentClassLabel(selectedStudent);
  }, [selectedStudent]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ParentTimetableSession[]>();
    classSessions.forEach((session) => {
      const raw = session.plannedDatetime ?? session.actualDatetime;
      if (!raw) return;
      const date = parseApiDateKeepWallClock(raw);
      if (Number.isNaN(date.getTime())) return;
      const key = formatDateKey(date);
      const current = map.get(key) ?? [];
      current.push(session);
      map.set(key, current);
    });
    return map;
  }, [classSessions]);

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateSessions = useMemo(() => sessionsByDate.get(formState.sessionDate) ?? [], [formState.sessionDate, sessionsByDate]);
  const selectedSession = useMemo(() => selectedDateSessions.find((session) => session.id === formState.sessionId) ?? null, [formState.sessionId, selectedDateSessions]);

  useEffect(() => {
    if (!open) return;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);

      try {
        const response: any = await getAllStudents({
          profileType: "Student",
          isActive: true,
          pageNumber: 1,
          pageSize: 200,
        });

        const data = Array.isArray(response?.data)
          ? response.data
          : response?.data?.items ?? response?.data?.students ?? [];

        setStudentProfiles(data);
      } catch {
        setProfilesError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };

    void fetchProfiles();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (!formState.studentProfileId) {
      setClasses([]);
      setClassesError(null);
      return;
    }

    const fetchClasses = async () => {
      setClassesLoading(true);
      setClassesError(null);

      try {
        const response: any = await getStudentClasses({
          studentProfileId: formState.studentProfileId,
          pageNumber: 1,
          pageSize: 100,
        });

        const data = Array.isArray(response?.data)
          ? response.data
          : response?.data?.items ?? response?.data?.classes?.items ?? [];

        const enriched = await enrichClassNames(data);
        const fallbackClasses = selectedStudent ? studentClassOptions(selectedStudent) : [];
        const merged = mergeClassOptions(enriched, fallbackClasses);

        setClasses(merged);

        if (!formState.classId && merged.length === 1 && (merged[0] as any).id) {
          setFormState((prev) => ({ ...prev, classId: (merged[0] as any).id }));
          return;
        }

        if (
          formState.classId &&
          !merged.some((item) => String((item as any).id ?? item.id) === formState.classId)
        ) {
          setFormState((prev) => ({
            ...prev,
            classId: "",
            sessionId: null,
            sessionDate: "",
            endDate: null,
          }));
        }
      } catch {
        setClasses([]);
        setClassesError("Không thể tải danh sách lớp.");
      } finally {
        setClassesLoading(false);
      }
    };

    void fetchClasses();
  }, [open, formState.classId, formState.studentProfileId, selectedStudent]);

  useEffect(() => {
    if (!open) return;
    if (!formState.sessionDate) return;
    if (formState.endDate) return;

    setFormState((prev) => ({ ...prev, endDate: prev.sessionDate }));
  }, [formState.endDate, formState.sessionDate, open]);

  useEffect(() => {
    if (!open || !formState.classId || !formState.studentProfileId) {
      setClassSessions([]);
      setSessionsError(null);
      return;
    }

    const fetchSessions = async () => {
      setSessionsLoading(true);
      setSessionsError(null);

      try {
        const from = getMonthStart(visibleMonth);
        const to = getMonthEnd(visibleMonth);
        const response = await getParentTimetable({
          from: toLocalBoundaryIso(from, "start"),
          to: toLocalBoundaryIso(to, "end"),
          studentProfileId: formState.studentProfileId,
          classId: formState.classId,
        });

        const list = response?.sessions ?? (response as any)?.data?.sessions ?? [];
        const filtered = Array.isArray(list)
          ? list.filter((session) => String(session.classId ?? "") === formState.classId)
          : [];

        setClassSessions(
          filtered.sort((left, right) => {
            const leftTime =
              parseApiDateKeepWallClock(left.plannedDatetime ?? left.actualDatetime ?? "").getTime() || 0;
            const rightTime =
              parseApiDateKeepWallClock(right.plannedDatetime ?? right.actualDatetime ?? "").getTime() || 0;
            return leftTime - rightTime;
          }),
        );
      } catch {
        setClassSessions([]);
        setSessionsError("Không thể tải lịch học của lớp trong tháng này.");
      } finally {
        setSessionsLoading(false);
      }
    };

    void fetchSessions();
  }, [formState.classId, formState.studentProfileId, open, visibleMonth]);

  useEffect(() => {
    if (!open) return;
    const selectedDate = parseDateKey(formState.sessionDate);
    if (!selectedDate) return;
    setVisibleMonth(getMonthStart(selectedDate));
  }, [formState.sessionDate, open]);

  useEffect(() => {
    if (!formState.sessionDate) return;

    if (selectedDateSessions.length === 1) {
      const onlySession = selectedDateSessions[0];
      if (formState.sessionId !== onlySession.id) {
        setFormState((prev) => ({ ...prev, sessionId: onlySession.id }));
      }
      return;
    }

    if (
      formState.sessionId &&
      !selectedDateSessions.some((session) => session.id === formState.sessionId)
    ) {
      setFormState((prev) => ({ ...prev, sessionId: null }));
    }
  }, [formState.sessionDate, formState.sessionId, selectedDateSessions]);

  const canSubmit = useMemo(() => {
    return !!formState.studentProfileId && !!formState.classId && !!formState.sessionDate && !!String(formState.reason ?? "").trim();
  }, [formState.classId, formState.reason, formState.sessionDate, formState.studentProfileId]);

  const isSingleSessionLeave = useMemo(() => {
    if (formState.sessionId) return true;
    if (!formState.sessionDate) return false;
    return selectedDateSessions.length > 0;
  }, [formState.sessionDate, formState.sessionId, selectedDateSessions.length]);

  const scrollToFeedback = () => {
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const showFormError = (message: string, nextErrors?: FormErrors) => {
    setActionError(message);
    if (nextErrors) setFormErrors(nextErrors);
    toast({ title: "Không thể tạo đơn nghỉ", description: message, variant: "destructive" });
    scrollToFeedback();
  };

  const submitLeaveRequest = async () => {
    const nextErrors: FormErrors = {};
    const trimmedReason = String(formState.reason ?? "").trim();
    const normalizedEndDate = isSingleSessionLeave
      ? formState.sessionDate
      : String(formState.endDate ?? formState.sessionDate ?? "").trim() || formState.sessionDate;

    if (!formState.studentProfileId) nextErrors.studentProfileId = "Vui lòng chọn học viên áp dụng.";
    if (!formState.classId) nextErrors.classId = "Vui lòng chọn lớp học.";
    if (!formState.sessionDate) nextErrors.sessionDate = "Vui lòng chọn ngày nghỉ bắt đầu.";
    if (!trimmedReason) nextErrors.reason = "Vui lòng nhập lý do xin nghỉ.";
    if (formState.sessionDate && normalizedEndDate && normalizedEndDate < formState.sessionDate) {
      nextErrors.endDate = "Ngày nghỉ kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.";
    }

    if (Object.keys(nextErrors).length > 0) {
      showFormError("Vui lòng kiểm tra lại các trường bắt buộc trước khi gửi đơn.", nextErrors);
      return;
    }

    setCreating(true);
    setActionError(null);
    setFormErrors({});

    try {
      const payload: LeaveRequestPayload = {
        ...formState,
        sessionId: formState.sessionId?.trim() ? formState.sessionId.trim() : null,
        endDate: normalizedEndDate,
        reason: trimmedReason,
      };

      const response: any = await createLeaveRequest(payload);
      const isSuccess = response?.isSuccess ?? response?.success ?? false;

      if (!isSuccess) {
        showFormError(response?.message ?? "Không thể tạo đơn xin nghỉ.");
        return;
      }

      const record =
        response?.data?.leaveRequests?.[0] ??
        response?.data?.record ??
        response?.data ??
        response?.record ?? {
          id: `leave-${Date.now()}`,
          ...payload,
          status: "PENDING",
        };

      onCreated(record as LeaveRequestRecord);

      const statusText = String((record as LeaveRequestRecord | undefined)?.status ?? "").toUpperCase();
      toast({
        title: "Tạo đơn nghỉ thành công",
        description:
          statusText === "APPROVED" || statusText === "AUTO_APPROVED"
            ? "Đơn đã được duyệt. Nếu có lượt học bù, vui lòng chọn lịch bù để hoàn tất luồng."
            : "Yêu cầu đã được gửi thành công.",
        variant: "success",
      });

      onClose();
    } catch (error) {
      console.error("Create leave request error:", error);
      showFormError(buildLeaveRequestErrorMessage(error, "Không thể tạo đơn xin nghỉ."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[140] ${open ? "" : "pointer-events-none opacity-0"}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4">
        <div
          ref={modalRef}
          className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
        >
          {/* Modal Header - Gradient đỏ */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <CalendarDays size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Tạo đơn xin nghỉ</h2>
                  <p className="text-sm text-red-100">
                    Điền thông tin nghỉ học và chọn đúng buổi học cần xử lý.
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={creating}
                className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Đóng"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div
            ref={scrollContainerRef}
            className="p-6 max-h-[70vh] overflow-y-auto"
          >
            <div ref={feedbackRef} className="space-y-6">
              {actionError && <Banner kind="error" text={actionError} />}

              {/* Học viên */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-red-600" />
                  <div className="text-sm font-semibold text-gray-800">
                    Học viên <span className="text-red-600">*</span>
                  </div>
                </div>

                {isStudentLocked ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {selectedStudent ? studentLabel(selectedStudent) : "Học viên đang được chọn"}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Đơn nghỉ này áp dụng cho học viên đang được chọn ở Parent Portal.
                    </div>
                    {selectedStudentClassText ? (
                      <div className="mt-2 text-xs text-gray-700">
                        <span className="font-medium">Lớp đang theo học:</span> {selectedStudentClassText}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="relative">
                        <input
                          className={cn(
                            "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900",
                            "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                          )}
                          placeholder="Tìm theo tên học viên"
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                      <div className="relative">
                        <input
                          className={cn(
                            "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900",
                            "focus:outline-none focus:ring-2 focus:ring-red-300 transition-all"
                          )}
                          placeholder="Tìm theo tên phụ huynh"
                          value={parentSearchTerm}
                          onChange={(event) => setParentSearchTerm(event.target.value)}
                        />
                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        className={getFieldClass(formErrors.studentProfileId != null, "h-11 appearance-none px-4 pr-10")}
                        value={formState.studentProfileId}
                        onChange={(event) => {
                          const nextStudentId = event.target.value;
                          setFormState((prev) => ({
                            ...prev,
                            studentProfileId: nextStudentId,
                            classId: "",
                            sessionId: null,
                            sessionDate: "",
                            endDate: null,
                          }));
                          setFormErrors((prev) => ({
                            ...prev,
                            studentProfileId: undefined,
                            classId: undefined,
                            sessionDate: undefined,
                            endDate: undefined,
                          }));
                          setActionError(null);
                          setClasses([]);
                        }}
                      >
                        <option value="">
                          {profilesLoading
                            ? "Đang tải học viên..."
                            : filteredStudents.length
                              ? "Chọn học viên"
                              : "Không tìm thấy học viên"}
                        </option>
                        {filteredStudents.map((student) => (
                          <option key={studentId(student)} value={studentId(student)}>
                            {studentLabel(student)}
                            {studentClassLabel(student) ? ` • ${studentClassLabel(student)}` : ""}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {profilesLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                      </div>
                    </div>
                  </>
                )}

                {formErrors.studentProfileId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {formErrors.studentProfileId}
                  </p>
                )}
                {profilesError && <p className="text-sm text-red-600">{profilesError}</p>}
              </div>

              {/* Lớp */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-red-600" />
                  <div className="text-sm font-semibold text-gray-800">
                    Lớp <span className="text-red-600">*</span>
                  </div>
                </div>
                <div className="relative">
                  <select
                    className={getFieldClass(formErrors.classId != null, "h-11 appearance-none px-4 pr-10")}
                    value={formState.classId}
                    onChange={(event) => {
                      const nextClassId = event.target.value;
                      setFormState((prev) => ({
                        ...prev,
                        classId: nextClassId,
                        sessionId: null,
                        sessionDate: "",
                        endDate: null,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        classId: undefined,
                        sessionDate: undefined,
                        endDate: undefined,
                      }));
                      setActionError(null);
                    }}
                    disabled={!formState.studentProfileId || classesLoading}
                  >
                    <option value="">
                      {!formState.studentProfileId
                        ? "Chọn học viên trước"
                        : classesLoading
                          ? "Đang tải lớp..."
                          : classes.length
                            ? "Chọn lớp"
                            : "Học viên chưa có lớp đang theo học"}
                    </option>
                    {classes.map((item) => (
                      <option key={(item as any).id ?? item.id} value={(item as any).id ?? item.id}>
                        {classLabel(item)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {classesLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Dropdown chỉ hiển thị các lớp mà học viên đang theo học.
                </div>
                {formErrors.classId && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {formErrors.classId}
                  </p>
                )}
                {classesError && <p className="text-sm text-red-600">{classesError}</p>}
              </div>

              {/* Lịch */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-red-600" />
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Chọn buổi nghỉ trên lịch</div>
                      <div className="text-xs text-gray-500">
                        Lịch chỉ tô đậm những ngày lớp thực sự có buổi học để phụ huynh chọn nhanh.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                      className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!formState.classId}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="min-w-40 text-center text-sm font-semibold text-gray-800">
                      {visibleMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                      className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!formState.classId}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  {!formState.classId ? (
                    <div className="text-sm text-gray-500">
                      Chọn lớp trước để hiển thị lịch học của lớp.
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-gray-500">
                        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                          <div key={label}>{label}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day) => {
                          const key = formatDateKey(day);
                          const inMonth = day.getMonth() === visibleMonth.getMonth();
                          const sessions = sessionsByDate.get(key) ?? [];
                          const isSelected = formState.sessionDate === key;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isPast = day < today;
                          const canPick = inMonth && sessions.length > 0 && !isPast;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                if (!canPick) return;
                                setFormState((prev) => ({
                                  ...prev,
                                  sessionDate: key,
                                  sessionId: sessions.length === 1 ? sessions[0].id : null,
                                  endDate: key,
                                }));
                                setFormErrors((prev) => ({
                                  ...prev,
                                  sessionDate: undefined,
                                  endDate: undefined,
                                }));
                                setActionError(null);
                              }}
                              disabled={!canPick}
                              className={cn(
                                "min-h-[72px] rounded-xl p-2 text-left transition-all",
                                isSelected
                                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                                  : canPick
                                    ? "cursor-pointer border-2 border-red-200 bg-red-50/40 text-gray-800 hover:bg-red-100 hover:border-red-300"
                                    : "border border-gray-200 bg-gray-50 text-gray-300",
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{day.getDate()}</span>
                                {sessions.length > 0 && !isSelected && (
                                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
                                    {sessions.length} buổi
                                  </span>
                                )}
                              </div>

                              <div className={cn("mt-2 text-[11px]", isSelected ? "text-white/90" : "text-gray-500")}>
                                {sessions.length > 0
                                  ? sessions
                                      .slice(0, 2)
                                      .map((session) => formatTimeRange(session))
                                      .filter(Boolean)
                                      .join(", ")
                                  : inMonth
                                    ? "Không có buổi"
                                    : ""}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {sessionsLoading && <div className="mt-3 text-sm text-gray-500">Đang tải lịch học...</div>}
                      {sessionsError && <div className="mt-3 text-sm text-red-600">{sessionsError}</div>}

                      {selectedDateSessions.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                          <div className="text-sm font-semibold text-gray-800">
                            Buổi học ngày {parseDateKey(formState.sessionDate)?.toLocaleDateString("vi-VN")}
                          </div>
                          <p className="mt-1 text-xs text-gray-600">
                            Nếu trong ngày có nhiều buổi, hãy chọn đúng session bên dưới để hệ thống xử lý chính xác.
                          </p>

                          <ul className="mt-3 space-y-2 text-xs text-gray-700">
                            {selectedDateSessions.map((session) => (
                              <li key={session.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormState((prev) => ({
                                      ...prev,
                                      sessionId: prev.sessionId === session.id ? null : session.id,
                                    }));
                                    setActionError(null);
                                  }}
                                  className={cn(
                                    "w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition-all",
                                    formState.sessionId === session.id
                                      ? "border-red-500 bg-gradient-to-r from-red-600 to-red-700 text-white"
                                      : "border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:border-red-200",
                                  )}
                                >
                                  <div className="font-medium">
                                    {session.classTitle ?? session.classCode ?? "Buổi học"}
                                  </div>
                                  <div className="mt-1">
                                    {formatTimeRange(session)}
                                    {session.plannedTeacherName ? ` • GV: ${session.plannedTeacherName}` : ""}
                                    {session.plannedRoomName ? ` • Phòng: ${session.plannedRoomName}` : ""}
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Ngày nghỉ */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <CalendarDays size={16} className="text-red-600" />
                    Ngày nghỉ (từ) <span className="text-red-600">*</span>
                  </div>
                  <input
                    type="date"
                    className={getFieldClass(formErrors.sessionDate != null, "h-11 px-4")}
                    value={formState.sessionDate}
                    onChange={(event) => {
                      const nextDate = event.target.value;
                      setFormState((prev) => ({
                        ...prev,
                        sessionDate: nextDate,
                        sessionId: null,
                        endDate: prev.sessionId || !prev.endDate ? nextDate : prev.endDate,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        sessionDate: undefined,
                        endDate: undefined,
                      }));
                      setActionError(null);
                    }}
                  />
                  {formErrors.sessionDate && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} /> {formErrors.sessionDate}
                    </p>
                  )}
                </div>

                {isSingleSessionLeave ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <CalendarDays size={16} className="text-red-600" />
                      Ngày nghỉ (đến)
                    </div>
                    <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700">
                      {formState.sessionDate ? formatDateVN(formState.sessionDate) : "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Đơn nghỉ theo buổi được tự động khóa cùng ngày với ngày nghỉ bắt đầu.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <CalendarDays size={16} className="text-red-600" />
                      Ngày nghỉ (đến)
                    </div>
                    <input
                      type="date"
                      className={getFieldClass(formErrors.endDate != null, "h-11 px-4")}
                      value={formState.endDate ?? ""}
                      onChange={(event) => {
                        setFormState((prev) => ({ ...prev, endDate: event.target.value }));
                        setFormErrors((prev) => ({ ...prev, endDate: undefined }));
                        setActionError(null);
                      }}
                    />
                    <div className="text-xs text-gray-500">
                      Nếu nghỉ một ngày, hệ thống sẽ tự hiểu là nghỉ trong ngày bắt đầu.
                    </div>
                    {formErrors.endDate && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> {formErrors.endDate}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Lý do */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-800">
                  Lý do <span className="text-red-600">*</span>
                </div>
                <textarea
                  className={getFieldClass(formErrors.reason != null, "min-h-[100px] resize-none px-4 py-3")}
                  placeholder="Nhập lý do xin nghỉ..."
                  value={formState.reason ?? ""}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, reason: event.target.value }));
                    setFormErrors((prev) => ({ ...prev, reason: undefined }));
                    setActionError(null);
                  }}
                />
                {formErrors.reason && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {formErrors.reason}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-red-500/5 to-red-700/5 p-6">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={creating}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy bỏ
              </button>
              <button
                onClick={submitLeaveRequest}
                disabled={!canSubmit || creating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Gửi yêu cầu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
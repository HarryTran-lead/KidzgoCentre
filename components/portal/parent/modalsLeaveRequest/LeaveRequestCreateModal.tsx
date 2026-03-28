"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  X,
  User,
  Users,
  BookOpen,
} from "lucide-react";

import { createLeaveRequest } from "@/lib/api/leaveRequestService";
import { getClassById } from "@/lib/api/classService";
import { getAllStudents, getStudentClasses } from "@/lib/api/studentService";
import {
  getParentTimetable,
  type ParentTimetableSession,
} from "@/lib/api/parentScheduleService";

import type { LeaveRequestPayload, LeaveRequestRecord } from "@/types/leaveRequest";
import type { StudentClass } from "@/types/student/class";
import type { StudentSummary } from "@/types/student/student";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (record: LeaveRequestRecord) => void;
  lockedStudentProfileId?: string | null;
};

const initialFormState: LeaveRequestPayload = {
  studentProfileId: "",
  classId: "",
  sessionDate: "",
  endDate: null,
  reason: "",
};

function classLabel(c: StudentClass) {
  const cc = c as any;
  return cc.name ?? cc.className ?? cc.title ?? cc.code ?? cc.id;
}

function studentId(s: StudentSummary) {
  const ss = s as any;
  return (
    ss.id ??
    ss.profileId ??
    ss.studentProfileId ??
    ss.studentId ??
    ss.userId ??
    ""
  );
}

function studentLabel(s: StudentSummary) {
  const ss = s as any;
  return ss.fullName ?? ss.name ?? ss.displayName ?? ss.email ?? ss.id ?? "Học viên";
}

function parentLabel(s: StudentSummary) {
  const ss = s as any;
  return (
    ss.parentName ??
    ss.fatherName ??
    ss.motherName ??
    ss.guardianName ??
    ss.userName ??
    ss.userEmail ??
    ""
  );
}

function studentClassLabel(s: StudentSummary) {
  const ss = s as any;

  if (ss.className) return ss.className;

  if (Array.isArray(ss.classNames) && ss.classNames.length) {
    return ss.classNames.filter(Boolean).join(", ");
  }

  if (Array.isArray(ss.classes) && ss.classes.length) {
    return ss.classes
      .map((c: any) => c.name ?? c.className ?? c.title ?? c.code ?? c.id)
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function studentClassOptions(s: StudentSummary): StudentClass[] {
  const ss = s as any;

  if (Array.isArray(ss.classes) && ss.classes.length) {
    return ss.classes
      .map((c: any) => ({
        id: c.id ?? c.classId ?? "",
        name: c.name ?? c.className ?? c.title ?? c.code,
      }))
      .filter((c: any) => c.id || c.name);
  }

  if (ss.classId || ss.className) {
    return [
      {
        id: ss.classId ?? "",
        name: ss.className ?? "",
      },
    ].filter((c: any) => c.id || c.name);
  }

  return [];
}

async function enrichClassNames(items: StudentClass[]) {
  const needsLookup = items.filter((item) => {
    const it = item as any;
    return !it.name && !it.className && !it.title && !it.code;
  });

  if (!needsLookup.length) return items;

  const lookupIds = Array.from(
    new Set(needsLookup.map((it) => (it as any).id ?? it.id).filter(Boolean))
  );

  const detailResults = await Promise.all(
    lookupIds.map(async (id) => {
      try {
        const res: any = await getClassById(id);
        return res?.data ? { id, detail: res.data } : null;
      } catch {
        return null;
      }
    })
  );

  const detailMap = new Map(
    detailResults.filter(Boolean).map((x: any) => [x.id, x.detail])
  );

  return items.map((item) => {
    const it = item as any;
    const id = it.id ?? item.id;
    const detail = detailMap.get(id);
    if (!detail) return item;

    return {
      ...item,
      name: it.name ?? detail.name ?? detail.className ?? detail.title ?? detail.code,
      className: it.className ?? detail.className,
      title: it.title ?? detail.title,
      code: it.code ?? detail.code,
    } as any;
  });
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
        <div className="text-sm font-medium">{text}</div>
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
  const start = new Date(raw);
  if (Number.isNaN(start.getTime())) return "";
  const duration = Number(session.durationMinutes ?? 0);
  if (duration <= 0) {
    return start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  const end = new Date(start.getTime() + duration * 60000);
  return `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function LeaveRequestCreateModal({
  open,
  onClose,
  onCreated,
  lockedStudentProfileId,
}: Props) {
  const [formState, setFormState] = useState<LeaveRequestPayload>(initialFormState);
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
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const isStudentLocked = !!lockedStudentProfileId;

  // reset khi đóng
  useEffect(() => {
    if (!open) {
      setFormState(initialFormState);
      setCreating(false);
      setActionError(null);
      setActionMessage(null);
      setClasses([]);
      setClassesError(null);
      setProfilesError(null);
      setClassSessions([]);
      setSessionsError(null);
      setSearchTerm("");
      setParentSearchTerm("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!lockedStudentProfileId) return;

    setFormState((prev) => {
      if (prev.studentProfileId === lockedStudentProfileId) return prev;
      return {
        ...prev,
        studentProfileId: lockedStudentProfileId,
        classId: "",
      };
    });
    setClasses([]);
  }, [lockedStudentProfileId, open]);

  // load students khi mở
  useEffect(() => {
    if (!open) return;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);
      try {
        const res: any = await getAllStudents({
          profileType: "Student",
          isActive: true,
          pageNumber: 1,
          pageSize: 200,
        });

        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.items ?? res?.data?.students ?? [];

        setStudentProfiles(data);
      } catch {
        setProfilesError("Không thể tải danh sách học viên.");
      } finally {
        setProfilesLoading(false);
      }
    };

    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filteredStudents = useMemo(() => {
    if (isStudentLocked) {
      const locked = studentProfiles.find(
        (student) => studentId(student) === lockedStudentProfileId
      );
      return locked ? [locked] : [];
    }

    const studentTerm = searchTerm.trim().toLowerCase();
    const parentTerm = parentSearchTerm.trim().toLowerCase();

    if (!studentTerm && !parentTerm) return studentProfiles;

    return studentProfiles.filter((student) => {
      const studentName = studentLabel(student).toLowerCase();
      const parentName = parentLabel(student).toLowerCase();

      const matchStudent = studentTerm ? studentName.includes(studentTerm) : true;
      const matchParent = parentTerm ? parentName.includes(parentTerm) : true;

      return matchStudent && matchParent;
    });
  }, [isStudentLocked, lockedStudentProfileId, parentSearchTerm, searchTerm, studentProfiles]);

  const selectedStudent = useMemo(() => {
    const id = formState.studentProfileId;
    if (!id) return undefined;

    return (
      studentProfiles.find((student) => studentId(student) === id) ??
      filteredStudents.find((student) => studentId(student) === id)
    );
  }, [filteredStudents, formState.studentProfileId, studentProfiles]);

  const selectedStudentClassText = useMemo(() => {
    if (!selectedStudent) return "";
    return studentClassLabel(selectedStudent);
  }, [selectedStudent]);

  // load classes theo student (chỉ lấy lớp học sinh đang theo học)
  useEffect(() => {
    if (!open) return;
    if (!formState.studentProfileId) return;

    const fetchClasses = async () => {
      setClassesLoading(true);
      setClassesError(null);
      try {
        const res: any = await getStudentClasses({
          studentProfileId: formState.studentProfileId,
          pageNumber: 1,
          pageSize: 100,
        });

        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.items ?? res?.data?.classes?.items ?? [];

        const enriched = await enrichClassNames(data);
        setClasses(enriched);
        if (!formState.classId && enriched.length === 1 && (enriched[0] as any).id) {
          setFormState((p) => ({ ...p, classId: (enriched[0] as any).id }));
        }
      } catch {
        setClassesError("Không thể tải danh sách lớp.");
      } finally {
        setClassesLoading(false);
      }
    };

    fetchClasses();
  }, [open, formState.classId, formState.studentProfileId, selectedStudent]);

  // auto endDate = sessionDate nếu rỗng
  useEffect(() => {
    if (!open) return;
    if (!formState.sessionDate) return;
    if (formState.endDate) return;
    setFormState((p) => ({ ...p, endDate: p.sessionDate }));
  }, [open, formState.sessionDate, formState.endDate]);

  useEffect(() => {
    if (!open || !formState.classId) {
      setClassSessions([]);
      setSessionsError(null);
      return;
    }

    const run = async () => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const from = getMonthStart(visibleMonth);
        const to = getMonthEnd(visibleMonth);
        const res = await getParentTimetable({
          from: from.toISOString(),
          to: to.toISOString(),
        });
        const list = res?.sessions ?? res?.data?.sessions ?? [];
        const filtered = Array.isArray(list)
          ? list.filter((session) => String(session.classId ?? "") === formState.classId)
          : [];
        setClassSessions(filtered);
      } catch {
        setClassSessions([]);
        setSessionsError("Không thể tải lịch học của lớp trong tháng này.");
      } finally {
        setSessionsLoading(false);
      }
    };

    run();
  }, [formState.classId, open, visibleMonth]);

  useEffect(() => {
    if (!open) return;
    const selectedDate = parseDateKey(formState.sessionDate);
    if (!selectedDate) return;
    setVisibleMonth(getMonthStart(selectedDate));
  }, [formState.sessionDate, open]);

  const canSubmit = useMemo(() => {
    return (
      !!formState.studentProfileId &&
      !!formState.classId &&
      !!formState.sessionDate
    );
  }, [formState]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ParentTimetableSession[]>();
    classSessions.forEach((session) => {
      const raw = session.plannedDatetime ?? session.actualDatetime;
      if (!raw) return;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return;
      const key = formatDateKey(date);
      const current = map.get(key) ?? [];
      current.push(session);
      map.set(key, current);
    });
    return map;
  }, [classSessions]);

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateSessions = useMemo(
    () => sessionsByDate.get(formState.sessionDate) ?? [],
    [formState.sessionDate, sessionsByDate],
  );

  const handleCreate = async () => {
    setCreating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res: any = await createLeaveRequest(formState);
      const isSuccess = res?.isSuccess ?? res?.success ?? false;

      if (!isSuccess) {
        setActionError(res?.message ?? "Không thể tạo đơn xin nghỉ.");
        return;
      }

      const record =
        res?.data?.leaveRequests?.[0] ??
        res?.data?.record ??
        res?.data ??
        res?.record;
      if (record) onCreated(record as LeaveRequestRecord);

      const statusText = String((record as LeaveRequestRecord | undefined)?.status ?? "").toUpperCase();
      setActionMessage(
        statusText === "APPROVED" || statusText === "AUTO_APPROVED"
          ? "Tạo đơn xin nghỉ thành công. Đơn đã được duyệt; nếu có lượt học bù, vui lòng chọn buổi học bù để hoàn tất xếp lịch."
          : "Tạo đơn xin nghỉ thành công."
      );
      onClose();
    } catch (error) {
      console.error("Create leave request error:", error);
      const apiError = (error as any)?.response?.data;
      const code = apiError?.code ?? apiError?.title ?? apiError?.data?.code ?? apiError?.data?.title;
      const description =
        apiError?.description ??
        apiError?.detail ??
        apiError?.message ??
        apiError?.data?.description ??
        apiError?.data?.detail ??
        apiError?.data?.message;

      if (code === "LeaveRequest.ExceededMonthlyLeaveLimit") {
        setActionError("Học viên đã vượt quá giới hạn 2 buổi nghỉ trong tháng.");
      } else {
        setActionError(description ?? "Không thể tạo đơn xin nghỉ.");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[140] ${open ? "" : "pointer-events-none opacity-0"}`}
      aria-hidden={!open}
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div className="w-[min(720px,calc(100vw-24px))] max-h-[calc(100vh-24px)] rounded-3xl border border-red-200 bg-white shadow-2xl overflow-hidden flex flex-col">
          {/* header */}
          <div className="shrink-0 p-5 border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100/30">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">Tạo đơn xin nghỉ</div>
                    <div className="text-sm text-gray-600">
                      Vui lòng điền thông tin để gửi yêu cầu nghỉ học
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-red-300 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* body */}
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5 space-y-6 bg-gradient-to-b from-white to-red-50/20">
            {(actionError || actionMessage) && (
              <div className="space-y-3">
                {actionError && <Banner kind="error" text={actionError} />}
                {actionMessage && <Banner kind="success" text={actionMessage} />}
              </div>
            )}

            {/* Student */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User size={18} className="text-red-600" />
                <div className="text-sm font-semibold text-gray-800">Học viên</div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <input
                    className="h-11 w-full rounded-xl border border-red-300 bg-white pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-text disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Tìm theo tên học viên"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isStudentLocked}
                  />
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="relative">
                  <input
                    className="h-11 w-full rounded-xl border border-red-300 bg-white pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-text disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Tìm theo tên phụ huynh"
                    value={parentSearchTerm}
                    onChange={(e) => setParentSearchTerm(e.target.value)}
                    disabled={isStudentLocked}
                  />
                  <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  value={formState.studentProfileId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFormState((p) => ({
                      ...p,
                      studentProfileId: id,
                      classId: "",
                    }));
                    setClasses([]);
                  }}
                  disabled={isStudentLocked}
                >
                  <option value="">
                    {profilesLoading
                      ? "Đang tải học viên..."
                      : filteredStudents.length
                        ? "Chọn học viên"
                        : "Không tìm thấy học viên"}
                  </option>

                  {filteredStudents.map((p) => (
                    <option key={studentId(p)} value={studentId(p)}>
                      {studentLabel(p)}
                      {studentClassLabel(p) ? ` • ${studentClassLabel(p)}` : ""}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {profilesLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>

              {profilesError && <div className="text-sm text-red-600">{profilesError}</div>}

              {selectedStudentClassText && (
                <div className="p-3 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50">
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">Lớp của học viên:</span>{" "}
                    {selectedStudentClassText}
                  </div>
                </div>
              )}
            </div>

            {/* Class */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-red-600" />
                <div className="text-sm font-semibold text-gray-800">Lớp</div>
              </div>
              
              <div className="relative">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-red-300 bg-white px-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:opacity-60 cursor-pointer"
                  value={formState.classId}
                  onChange={(e) => setFormState((p) => ({ ...p, classId: e.target.value }))}
                  disabled={!formState.studentProfileId || classesLoading}
                >
                  <option value="">
                    {!formState.studentProfileId
                      ? "Chọn học viên trước"
                      : classesLoading
                        ? "Đang tải lớp..."
                        : "Chọn lớp"}
                  </option>

                  {classes.map((c) => (
                    <option key={(c as any).id ?? c.id} value={(c as any).id ?? c.id}>
                      {classLabel(c)}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {classesLoading ? <Loader2 size={16} className="animate-spin" /> : "▾"}
                </div>
              </div>

              {classesError && <div className="text-sm text-red-600">{classesError}</div>}
            </div>

            {/* Calendar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-red-600" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Chọn buổi nghỉ trên lịch</div>
                    <div className="text-xs text-gray-500">
                      Hệ thống chỉ tô đậm những ngày lớp thực sự có buổi học để phụ huynh chọn nhanh.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    className="rounded-xl border border-red-200 bg-white p-2 text-gray-600 hover:bg-red-50"
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
                    className="rounded-xl border border-red-200 bg-white p-2 text-gray-600 hover:bg-red-50"
                    disabled={!formState.classId}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-red-200 bg-white p-4">
                {!formState.classId ? (
                  <div className="text-sm text-gray-500">Chọn lớp trước để hiển thị lịch học của lớp.</div>
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
                        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
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
                                endDate: key,
                              }));
                            }}
                            disabled={!canPick}
                            className={`min-h-[72px] rounded-2xl border p-2 text-left transition ${
                              isSelected
                                ? "border-red-500 bg-red-600 text-white shadow-md"
                                : canPick
                                  ? "border-red-200 bg-red-50/40 text-gray-800 hover:bg-red-100"
                                  : "border-gray-200 bg-gray-50 text-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{day.getDate()}</span>
                              {sessions.length > 0 && (
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                    isSelected ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {sessions.length} buổi
                                </span>
                              )}
                            </div>
                            <div className={`mt-2 text-[11px] ${isSelected ? "text-white/90" : "text-gray-500"}`}>
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
                    {sessionsLoading && <div className="mt-3 text-sm text-gray-500">Đang tải lịch học…</div>}
                    {sessionsError && <div className="mt-3 text-sm text-red-600">{sessionsError}</div>}
                    {!!selectedDateSessions.length && (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/50 p-3">
                        <div className="text-sm font-semibold text-gray-800">
                          Buổi học ngày {parseDateKey(formState.sessionDate)?.toLocaleDateString("vi-VN")}
                        </div>
                        <ul className="mt-2 space-y-2 text-xs text-gray-700">
                          {selectedDateSessions.map((session) => (
                            <li key={session.id} className="rounded-xl border border-red-100 bg-white px-3 py-2">
                              <div className="font-medium text-gray-900">
                                {session.classTitle ?? session.classCode ?? "Buổi học"}
                              </div>
                              <div className="mt-1">
                                {formatTimeRange(session)}
                                {session.plannedTeacherName ? ` • GV: ${session.plannedTeacherName}` : ""}
                                {session.plannedRoomName ? ` • Phòng: ${session.plannedRoomName}` : ""}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarDays size={16} className="text-red-600" />
                  Ngày nghỉ (từ)
                </div>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-red-300 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
                  value={formState.sessionDate}
                  onChange={(e) => setFormState((p) => ({ ...p, sessionDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarDays size={16} className="text-red-600" />
                  Ngày nghỉ (đến)
                </div>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-red-300 bg-white px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-pointer"
                  value={formState.endDate ?? ""}
                  onChange={(e) => setFormState((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-800">Lý do</div>
              <textarea
                className="min-h-[100px] w-full resize-none rounded-xl border border-red-300 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 cursor-text"
                placeholder="Nhập lý do xin nghỉ..."
                value={formState.reason ?? ""}
                onChange={(e) => setFormState((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 border-t border-red-200 bg-white/95 px-5 py-4 backdrop-blur flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-red-300 bg-gradient-to-r from-white to-red-50 text-gray-700 font-medium hover:bg-red-50 transition-all disabled:opacity-60 cursor-pointer"
                disabled={creating}
              >
                Hủy
              </button>

              <button
                onClick={handleCreate}
                disabled={!canSubmit || creating}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 hover:shadow-lg transition-all disabled:opacity-70 cursor-pointer"
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

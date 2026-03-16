/**
 * Teacher Attendance API Helper Functions
 *
 * Aligns frontend attendance flows with the current backend contract.
 */

import { getAccessToken } from "@/lib/store/authToken";
import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import type {
  AttendanceApiResponse,
  AttendanceItemApi,
  AttendanceRawStatus,
  AttendanceStatus,
  AttendanceSummaryApi,
  FetchAttendanceResult,
  FetchSessionResult,
  FetchSessionsParams,
  FetchSessionsResult,
  FetchStudentAttendanceHistoryParams,
  FetchStudentAttendanceHistoryResult,
  LessonDetail,
  SessionApiItem,
  SessionApiResponse,
  SessionListApiResponse,
  Student,
  StudentAttendanceHistoryApiResponse,
} from "@/types/teacher/attendance";

function getAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function formatDow(date: Date): string {
  const vietnameseDow = ["Chu nhat", "Thu 2", "Thu 3", "Thu 4", "Thu 5", "Thu 6", "Thu 7"];
  return vietnameseDow[date.getDay()] ?? "Thu";
}

function formatDateLabel(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${formatDow(date)}, ${dd}/${mm}/${yyyy}`;
}

function formatTimeRange(start: Date, durationMinutes?: number): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const duration = typeof durationMinutes === "number" && durationMinutes > 0 ? durationMinutes : 60;
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return `${startStr} - ${endStr}`;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mapApiStatusToUi(status: unknown): AttendanceStatus | null {
  const raw = String(status ?? "").trim().toLowerCase();
  if (raw === "present") return "present";
  if (raw === "absent") return "absent";
  if (raw === "makeup") return "makeup";
  if (raw === "notmarked" || raw === "not_marked") return "notMarked";
  return null;
}

function mapUiStatusToApi(status: AttendanceStatus | null | undefined): number {
  if (status === "present") return 0;
  if (status === "absent") return 1;
  if (status === "makeup") return 2;
  return 3;
}

function mapSessionToLesson(session: SessionApiItem): { lesson: LessonDetail; attendance: AttendanceSummaryApi } {
  const datetimeIso: string | undefined = session?.actualDatetime ?? session?.plannedDatetime ?? undefined;
  let startDate: Date | null = null;

  if (datetimeIso) {
    const parsedDate = new Date(datetimeIso);
    if (!Number.isNaN(parsedDate.getTime())) {
      startDate = new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        parsedDate.getHours(),
        parsedDate.getMinutes(),
        parsedDate.getSeconds(),
      );
    }
  }

  const lesson: LessonDetail = {
    id: String(session?.id ?? session?.sessionId ?? ""),
    lesson: (session as any)?.lessonName ?? (session as any)?.lesson?.name ?? session?.classTitle ?? "Buoi hoc",
    course:
      (session as any)?.courseName ??
      (session as any)?.course?.name ??
      session?.classTitle ??
      session?.classCode ??
      "Lop hoc",
    teacher: session?.actualTeacherName ?? session?.plannedTeacherName ?? "Giao vien",
    room: session?.actualRoomName ?? session?.plannedRoomName ?? "Phong hoc",
    date: startDate ? formatDateLabel(startDate) : "Chua cap nhat",
    time: startDate ? formatTimeRange(startDate, session?.durationMinutes ?? undefined) : "--:--",
    status: (session as any)?.status ?? null,
    participationType: (session as any)?.participationType ?? null,
    branch: (session as any)?.branchName ?? (session as any)?.branch?.name ?? null,
    students:
      typeof (session as any)?.students === "number"
        ? (session as any).students
        : Array.isArray((session as any)?.students)
          ? (session as any).students.length
          : typeof (session as any)?.studentCount === "number"
            ? (session as any).studentCount
            : 0,
  };

  return {
    lesson,
    attendance: (session as any)?.attendanceSummary ?? {
      totalStudents: lesson.students ?? 0,
      presentCount: 0,
      absentCount: 0,
      makeupCount: 0,
      notMarkedCount: 0,
    },
  };
}

function mapSessionsListResponse(json: SessionListApiResponse): FetchSessionsResult {
  const data: any = (json as any)?.data;
  const items: SessionApiItem[] = Array.isArray(data?.sessions)
    ? data.sessions
    : Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray((json as any)?.sessions)
          ? (json as any).sessions
          : [];

  return {
    sessions: items,
    totalCount: typeof data?.totalCount === "number" ? data.totalCount : items.length,
    totalPages: typeof data?.totalPages === "number" ? data.totalPages : undefined,
  };
}

function resolveAttendanceItems(data: AttendanceApiResponse["data"]): AttendanceItemApi[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.attendances)) return data.attendances;
  if (Array.isArray(data.students)) return data.students;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

export async function fetchSessionDetail(
  sessionId: string,
  signal?: AbortSignal,
): Promise<FetchSessionResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Ban chua dang nhap. Vui long dang nhap lai.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.SESSIONS}/${sessionId}`, {
    headers: getAuthHeaders(token),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch session error", res.status, text);
    throw new Error("Khong the tai thong tin buoi day.");
  }

  const json: SessionApiResponse = await res.json();
  const data: any = json?.data ?? json;
  const session: SessionApiItem | undefined = data?.session ?? data;

  if (!session?.id && !session?.sessionId) {
    throw new Error("Khong tim thay du lieu buoi day.");
  }

  return mapSessionToLesson(session);
}

export function toISODateStart(date: Date): string {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  return `${formatDateISO(base)}T00:00:00+07:00`;
}

export function toISODateEnd(date: Date): string {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return `${formatDateISO(base)}T23:59:59+07:00`;
}

export function getTodayRange(): { from: string; to: string } {
  const today = new Date();
  return {
    from: toISODateStart(today),
    to: toISODateEnd(today),
  };
}

export function parseSessionDate(session: SessionApiItem): Date | null {
  const raw = session?.actualDatetime ?? session?.plannedDatetime ?? null;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatSessionDisplayDate(session: SessionApiItem): string {
  const parsed = parseSessionDate(session);
  return parsed ? formatDateLabel(parsed) : "Chua cap nhat";
}

export function formatSessionDisplayTime(session: SessionApiItem): string {
  const parsed = parseSessionDate(session);
  return parsed ? formatTimeRange(parsed, session?.durationMinutes ?? undefined) : "--:--";
}

export function mapSessionToLessonDetail(session: SessionApiItem): LessonDetail {
  return mapSessionToLesson(session).lesson;
}

export async function fetchSessions(
  params: FetchSessionsParams,
  signal?: AbortSignal,
): Promise<FetchSessionsResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Ban chua dang nhap. Vui long dang nhap lai.");
  }

  const query = new URLSearchParams();
  if (params.classId) query.set("classId", params.classId);
  if (params.branchId) query.set("branchId", params.branchId);
  if (params.status) query.set("status", params.status);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.pageNumber) query.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  const url = `${TEACHER_ENDPOINTS.TIMETABLE}?${query.toString()}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(token),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch sessions error", res.status, text);
    throw new Error("Khong the tai danh sach buoi hoc.");
  }

  const json: SessionListApiResponse = await res.json();
  return mapSessionsListResponse(json);
}

export async function fetchAttendance(
  sessionId: string,
  signal?: AbortSignal,
): Promise<FetchAttendanceResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Ban chua dang nhap. Vui long dang nhap lai.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}`, {
    headers: getAuthHeaders(token),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch attendance error", res.status, text);
    throw new Error("Khong the tai danh sach diem danh.");
  }

  const json: AttendanceApiResponse = await res.json();
  const data: any = json?.data ?? json;
  const rawStudents = resolveAttendanceItems(data);

  const students: Student[] = rawStudents.map((item: AttendanceItemApi, idx: number) => {
    const studentProfileId = String(item?.studentProfileId ?? "").trim();
    const attendanceId = String(item?.id ?? "").trim();
    const studentName = String(item?.studentName ?? "").trim() || `Hoc vien ${idx + 1}`;

    return {
      ...item,
      id: studentProfileId || attendanceId || `row:${idx}`,
      studentProfileId: studentProfileId || undefined,
      attendanceId: attendanceId || undefined,
      studentName,
      status: mapApiStatusToUi(item?.attendanceStatus),
      note: item?.note ?? undefined,
      absenceRate: Number((item as any)?.absenceRate ?? 0),
    };
  });

  const summary: AttendanceSummaryApi = data?.summary ?? data?.attendanceSummary ?? {
    totalStudents: students.length,
    presentCount: students.filter((student) => student.status === "present").length,
    absentCount: students.filter((student) => student.status === "absent").length,
    makeupCount: students.filter((student) => student.status === "makeup").length,
    notMarkedCount: students.filter((student) => !student.status || student.status === "notMarked").length,
  };

  const hasAnyMarked = students.some((student) => {
    if (!student.status) return false;
    return student.status !== "notMarked";
  });

  return {
    students,
    attendanceSummary: summary,
    hasAnyMarked,
  };
}

export async function saveAttendance(
  sessionId: string,
  students: Student[],
  isCreate: boolean,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Ban chua dang nhap. Vui long dang nhap lai.");
  }

  const payload = (students ?? [])
    .map((student) => {
      const studentProfileId = String(student.studentProfileId ?? student.id ?? "").trim();
      if (!studentProfileId) return null;

      return {
        studentProfileId,
        attendanceStatus: mapUiStatusToApi(student.status),
        note: typeof student.note === "string" && student.note.trim() ? student.note.trim() : undefined,
      };
    })
    .filter(Boolean) as Array<{
      studentProfileId: string;
      attendanceStatus: number;
      note?: string;
    }>;

  if (!payload.length) {
    throw new Error("Khong co hoc vien hop le de luu diem danh.");
  }

  if (isCreate) {
    const res = await fetch(`${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ attendances: payload }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Create attendance error", res.status, text);
      throw new Error("Khong the luu diem danh.");
    }
    return;
  }

  const results = await Promise.all(
    payload.map(async (item) => {
      const res = await fetch(
        `${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}/students/${item.studentProfileId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(token),
          body: JSON.stringify({
            attendanceStatus: item.attendanceStatus,
            note: item.note,
          }),
          signal,
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Update failed for ${item.studentProfileId}`);
      }
    }),
  ).then(
    () => [],
    (error) => {
      throw error;
    },
  );

  void results;
}

export async function fetchStudentAttendanceHistory(
  params?: FetchStudentAttendanceHistoryParams,
  signal?: AbortSignal,
): Promise<FetchStudentAttendanceHistoryResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Ban chua dang nhap. Vui long dang nhap lai.");
  }

  const query = new URLSearchParams();
  query.set("pageNumber", String(params?.pageNumber ?? 1));
  query.set("pageSize", String(params?.pageSize ?? 10));

  const res = await fetch(`${TEACHER_ENDPOINTS.ATTENDANCE_STUDENTS}?${query.toString()}`, {
    headers: getAuthHeaders(token),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch history error", res.status, text);
    throw new Error("Khong the tai lich su diem danh.");
  }

  const json: StudentAttendanceHistoryApiResponse = await res.json();
  const data: any = json?.data ?? {};

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pageNumber: Number(data?.pageNumber ?? params?.pageNumber ?? 1),
    pageSize: Number(data?.pageSize ?? params?.pageSize ?? 10),
    totalCount: Number(data?.totalCount ?? 0),
    totalPages: Number(data?.totalPages ?? 1),
  };
}

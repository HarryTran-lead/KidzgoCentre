/**
 * Teacher Attendance API Helper Functions
 *
 * This file provides type-safe helper functions for teacher attendance API calls.
 */

import { getAccessToken } from "@/lib/store/authToken";
import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import type {
  AttendanceStatus,
  AttendanceRawStatus,
  Student,
  LessonDetail,
  AttendanceSummaryApi,
  AttendanceItemApi,
  StudentAttendanceHistoryItem,
  SessionApiItem,
  AttendanceApiResponse,
  StudentAttendanceHistoryApiResponse,
  SessionApiResponse,
  SessionListApiResponse,
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  FetchAttendanceResult,
  FetchSessionResult,
  FetchSessionsParams,
  FetchSessionsResult,
} from "@/types/teacher/attendance";

/**
 * Format date label (Vietnamese)
 */
function formatDow(date: Date): string {
  const vietnameseDow = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return vietnameseDow[date.getDay()] ?? "Thứ";
}

function formatDateLabel(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${formatDow(date)}, ${dd}/${mm}/${yyyy}`;
}

function formatTimeRange(start: Date, durationMinutes?: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
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

/**
 * Map session API item to LessonDetail
 */
function mapSessionToLesson(session: SessionApiItem): { lesson: LessonDetail; attendance: AttendanceSummaryApi } {
  const datetimeIso: string | undefined = session?.actualDatetime ?? session?.plannedDatetime ?? undefined;
  let startDate: Date | null = null;

  if (datetimeIso) {
    // Parse the ISO datetime string
    const parsedDate = new Date(datetimeIso);

    // Check if date is valid
    if (!isNaN(parsedDate.getTime())) {
      // Use local timezone components to ensure correct date display
      // This prevents timezone offset from changing the date
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
    id: String(session?.id ?? ""),
    lesson: session?.lessonName ?? session?.lesson?.name ?? session?.name ?? "Buổi học",
    course:
      session?.courseName ??
      session?.course?.name ??
      session?.className ??
      session?.class?.name ??
      session?.class?.code ??
      "Lớp học",
    teacher: session?.teacherName ?? session?.teacher?.fullName ?? session?.teacher?.name ?? "Giáo viên",
    room: session?.roomName ?? session?.room?.name ?? "Phòng học",
    date: startDate ? formatDateLabel(startDate) : "Chưa cập nhật",
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

  const attendance: AttendanceSummaryApi = {
    totalStudents: (session as any)?.attendanceSummary?.totalStudents ?? lesson.students ?? 0,
    presentCount: (session as any)?.attendanceSummary?.presentCount ?? 0,
    absentCount: (session as any)?.attendanceSummary?.absentCount ?? 0,
    makeupCount: (session as any)?.attendanceSummary?.makeupCount ?? 0,
  };

  return { lesson, attendance };
}

/**
 * Fetch session detail
 */
export async function fetchSessionDetail(
  sessionId: string,
  signal?: AbortSignal,
): Promise<FetchSessionResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.SESSION}/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch session error", res.status, text);
    throw new Error("Không thể tải thông tin buổi dạy.");
  }

  const json: SessionApiResponse = await res.json();
  let session: SessionApiItem | undefined;

  if (json?.data) {
    // Check if data has a session property (nested structure)
    if (typeof json.data === "object" && "session" in json.data) {
      session = (json.data as any).session;
    } else {
      // data is directly a SessionApiItem
      session = json.data as SessionApiItem;
    }
  }

  // Fallback to json itself if data is not available
  if (!session) {
    session = json as unknown as SessionApiItem;
  }

  if (!session?.id) {
    throw new Error("Không tìm thấy dữ liệu buổi dạy.");
  }

  return mapSessionToLesson(session);
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
  if (!parsed) return "Chưa cập nhật";
  return formatDateLabel(parsed);
}

export function formatSessionDisplayTime(session: SessionApiItem): string {
  const parsed = parseSessionDate(session);
  if (!parsed) return "--:--";
  return formatTimeRange(parsed, session?.durationMinutes ?? undefined);
}

export function mapSessionToLessonDetail(session: SessionApiItem): LessonDetail {
  return mapSessionToLesson(session).lesson;
}

/**
 * Fetch sessions list (teacher)
 */
export async function fetchSessions(
  params: FetchSessionsParams,
  signal?: AbortSignal,
): Promise<FetchSessionsResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
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
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch sessions error", res.status, text);
    throw new Error("Không thể tải danh sách buổi học.");
  }

  const json: SessionListApiResponse = await res.json();
  return mapSessionsListResponse(json);
}

/**
 * Fetch attendance list for a session
 */
export async function fetchAttendance(
  sessionId: string,
  signal?: AbortSignal,
): Promise<FetchAttendanceResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch attendance error", res.status, text);
    throw new Error("Không thể tải danh sách điểm danh.");
  }

  const json: AttendanceApiResponse = await res.json();
  const data: any = (json as any)?.data ?? json;

  const students: Student[] = Array.isArray(data?.students)
    ? data.students
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  const summary: AttendanceSummaryApi | undefined =
    data?.attendanceSummary ?? data?.summary ?? undefined;

  const hasAnyMarked: boolean =
    typeof data?.hasAnyMarked === "boolean" ? data.hasAnyMarked : true;

  return {
    students,
    attendanceSummary: summary,
    hasAnyMarked,
  };
}

/**
 * Save attendance (create first time, update later)
 */
export async function saveAttendance(
  sessionId: string,
  students: Student[],
  isCreate: boolean,
  signal?: AbortSignal,
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const payload = (students ?? []).map((s: any) => ({
    studentId: s.id,
    status: (s.status ?? "absent") as AttendanceStatus,
    note: s.note ?? undefined,
  }));

  const url = isCreate ? TEACHER_ENDPOINTS.ATTENDANCE : `${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}`;
  const method = isCreate ? "POST" : "PUT";

  const body: CreateAttendanceRequest | UpdateAttendanceRequest = isCreate
    ? { sessionId, attendances: payload as AttendanceItemApi[] }
    : { attendances: payload as AttendanceItemApi[] };

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Save attendance error", res.status, text);
    throw new Error("Không thể lưu điểm danh.");
  }
}

/**
 * Fetch student attendance history
 */
export async function fetchStudentAttendanceHistory(
  studentId: string,
  signal?: AbortSignal,
): Promise<StudentAttendanceHistoryItem[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.STUDENT_ATTENDANCE}/${studentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch history error", res.status, text);
    throw new Error("Không thể tải lịch sử điểm danh.");
  }

  const json: StudentAttendanceHistoryApiResponse = await res.json();
  const data: any = (json as any)?.data ?? json;

  const items: StudentAttendanceHistoryItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  return items;
}

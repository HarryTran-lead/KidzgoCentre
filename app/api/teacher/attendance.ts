/**
 * Teacher Attendance API Helper Functions
 *
 * Aligns frontend attendance flows with the current backend contract.
 */

import { getAccessToken } from "@/lib/store/authToken";
import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { toISOStartOfDayVN, toISOEndOfDayVN, dateOnlyVN, parseApiDateKeepWallClock } from "@/lib/datetime";
import type {
  AttendanceApiResponse,
  AttendanceItemApi,
  AttendanceRawStatus,
  AttendanceStatus,
  AttendanceSummaryApi,
  UpdateAttendanceRequest,
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
  StudentAttendanceHistoryItem,
  StudentAttendanceHistoryApiResponse,
} from "@/types/teacher/attendance";

type SessionLike = SessionApiItem & {
  lessonName?: string | null;
  lesson?: { name?: string | null } | null;
  courseName?: string | null;
  course?: { name?: string | null } | null;
  students?: number | Array<unknown> | null;
  studentCount?: number | null;
  attendanceSummary?: AttendanceSummaryApi;
};

type SessionResponseData = {
  session?: SessionApiItem;
  sessions?: SessionApiItem[];
  items?: SessionApiItem[];
  totalCount?: number;
  totalPages?: number;
};

type AttendanceResponseData =
  | NonNullable<AttendanceApiResponse["data"]>
  | {
      hasAnyMarked?: boolean;
      summary?: AttendanceSummaryApi;
      attendanceSummary?: AttendanceSummaryApi;
    };

function isSessionApiItem(value: SessionResponseData | SessionApiItem | null): value is SessionApiItem {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  return "id" in value || "sessionId" in value || "actualDatetime" in value || "plannedDatetime" in value;
}

function isAttendanceItemApi(value: unknown): value is AttendanceItemApi {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  return "attendanceStatus" in value || "markedAt" in value || "studentProfileId" in value;
}

function getAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function pickFirstErrorMessage(errors: unknown): string | null {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const firstText = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (firstText) return firstText.trim();
    }
  }

  return null;
}

function formatAttendanceErrorMessage(raw: string, fallback: string): string {
  const text = raw.trim();
  if (!text) return fallback;

  const parsed = tryParseJson(text);
  if (!parsed || typeof parsed !== "object") {
    return text;
  }

  const problem = parsed as Record<string, unknown>;
  const type = String(problem.type ?? "").toLowerCase();
  const title = String(problem.title ?? "").toLowerCase();

  if (type.includes("attendance.updatewindowclosed") || title.includes("attendance.updatewindowclosed")) {
    return "Buổi học này chỉ được cập nhật điểm danh trong vòng 24 giờ sau khi kết thúc.";
  }

  const detail = typeof problem.detail === "string" ? problem.detail.trim() : "";
  if (detail) return detail;

  const message = typeof problem.message === "string" ? problem.message.trim() : "";
  if (message) return message;

  const firstError = pickFirstErrorMessage(problem.errors);
  if (firstError) return firstError;

  const problemTitle = typeof problem.title === "string" ? problem.title.trim() : "";
  if (problemTitle) return problemTitle;

  return fallback;
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

/**
 * Parse ISO datetime string thanh Date object.
 * Backend now trả ISO 8601 có offset (+07:00), dùng new Date() trực tiếp.
 */
function parseISODateTime(isoString: string | undefined): Date | null {
  if (!isoString) return null;
  const d = parseApiDateKeepWallClock(isoString);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatHistoryDateParts(value?: string | null): { date?: string | null; startTime?: string | null } {
  if (!value) return {};

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return {};

  const date = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(parsed);

  const startTime = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(parsed);

  return { date, startTime };
}

function normalizeStudentAttendanceHistoryItem(item: StudentAttendanceHistoryItem): StudentAttendanceHistoryItem {
  const sessionDateTime = String((item as any)?.sessionDateTime ?? "").trim() || undefined;
  const derived = formatHistoryDateParts(sessionDateTime);
  const sessionName = String(item?.sessionName ?? "").trim();
  const className = String(item?.className ?? "").trim();

  return {
    ...item,
    sessionDateTime,
    sessionName: sessionName || className || undefined,
    className: className || undefined,
    date: String(item?.date ?? "").trim() || derived.date || undefined,
    startTime: String(item?.startTime ?? "").trim() || derived.startTime || undefined,
  };
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
  const sessionLike = session as SessionLike;
  const datetimeIso: string | undefined = session?.actualDatetime ?? session?.plannedDatetime ?? undefined;
  // Su dung parseISODateTime de tranh loi chuyen doi timezone (dung voi backend gui gio VN)
  const startDate = parseISODateTime(datetimeIso);

  const lesson: LessonDetail = {
    id: String(session?.id ?? session?.sessionId ?? ""),
    lesson: sessionLike.lessonName ?? sessionLike.lesson?.name ?? session?.classTitle ?? "Buoi hoc",
    course:
      sessionLike.courseName ??
      sessionLike.course?.name ??
      session?.classTitle ??
      session?.classCode ??
      "Lop hoc",
    teacher: session?.actualTeacherName ?? session?.plannedTeacherName ?? "Giao vien",
    room: session?.actualRoomName ?? session?.plannedRoomName ?? "Phong hoc",
    date: startDate ? formatDateLabel(startDate) : "Chua cap nhat",
    time: startDate ? formatTimeRange(startDate, session?.durationMinutes ?? undefined) : "--:--",
    status: sessionLike.status ?? null,
    participationType: sessionLike.participationType ?? null,
    branch: sessionLike.branchName ?? null,
    students:
      typeof sessionLike.students === "number"
        ? sessionLike.students
        : Array.isArray(sessionLike.students)
          ? sessionLike.students.length
          : typeof sessionLike.studentCount === "number"
            ? sessionLike.studentCount
            : 0,
  };

  return {
    lesson,
    attendance: sessionLike.attendanceSummary ?? {
      totalStudents: lesson.students ?? 0,
      presentCount: 0,
      absentCount: 0,
      makeupCount: 0,
      notMarkedCount: 0,
    },
  };
}

function mapSessionsListResponse(json: SessionListApiResponse): FetchSessionsResult {
  const data = (json.data ?? null) as SessionResponseData | SessionApiItem[] | null;
  const structuredData =
    data && !Array.isArray(data) && typeof data === "object" ? data : null;

  const rootData = json as SessionResponseData;
  const items: SessionApiItem[] = Array.isArray(structuredData?.sessions)
    ? structuredData.sessions
    : Array.isArray(data)
      ? data
      : Array.isArray(structuredData?.items)
        ? structuredData.items
        : Array.isArray(rootData?.sessions)
          ? rootData.sessions ?? []
          : [];

  return {
    sessions: items,
    totalCount: typeof structuredData?.totalCount === "number" ? structuredData.totalCount : items.length,
    totalPages: typeof structuredData?.totalPages === "number" ? structuredData.totalPages : undefined,
  };
}

function resolveAttendanceItems(data: AttendanceApiResponse["data"]): AttendanceItemApi[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object" || isAttendanceItemApi(data)) return [];
  if (Array.isArray(data.attendances)) return data.attendances;
  if (Array.isArray(data.students)) return data.students;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function extractSingleAttendanceItem(data: AttendanceApiResponse["data"]): AttendanceItemApi | null {
  return isAttendanceItemApi(data) ? data : null;
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
  const data = (json?.data ?? json) as SessionResponseData | SessionApiItem;
  const wrappedData =
    data && !Array.isArray(data) && typeof data === "object" && "session" in data ? data : null;
  const session: SessionApiItem | undefined = wrappedData?.session ?? (isSessionApiItem(data) ? data : undefined);

  if (!session?.id && !session?.sessionId) {
    throw new Error("Khong tim thay du lieu buoi day.");
  }

  return mapSessionToLesson(session);
}

export function toISODateStart(date: Date): string {
  return toISOStartOfDayVN(date);
}

export function toISODateEnd(date: Date): string {
  return toISOEndOfDayVN(date);
}

export function getTodayRange(): { from: string; to: string } {
  const today = new Date();
  return {
    from: toISODateStart(today),
    to: toISODateEnd(today),
  };
}

export function parseSessionDate(session: SessionApiItem): Date | null {
  return parseISODateTime(session?.actualDatetime ?? session?.plannedDatetime ?? undefined);
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
  const data = (json?.data ?? json) as AttendanceResponseData;
  const structuredData =
    data && !Array.isArray(data) && typeof data === "object" && !isAttendanceItemApi(data) ? data : null;
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
      absenceRate: 0,
    };
  });

  const summary: AttendanceSummaryApi = structuredData?.summary ?? structuredData?.attendanceSummary ?? {
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

  // Backend bulk POST is idempotent and can both create missing records and update existing ones.
  // That matches the Attendance API guide better than forcing PUT for the whole class after first mark.
  void isCreate;

  const res = await fetch(`${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ attendances: payload }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Save attendance error", res.status, text);
    throw new Error(formatAttendanceErrorMessage(text, "Không thể lưu điểm danh."));
  }
}

export async function updateAttendance(
  sessionId: string,
  studentProfileId: string,
  payload: UpdateAttendanceRequest,
  signal?: AbortSignal,
): Promise<AttendanceItemApi | null> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Ban chua dang nhap. Vui long dang nhap lai.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}/students/${studentProfileId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      attendanceStatus: payload.attendanceStatus,
      note: payload.note,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Update attendance error", res.status, text);
    throw new Error(
      formatAttendanceErrorMessage(text, `Không thể cập nhật điểm danh cho học viên ${studentProfileId}.`),
    );
  }

  const json: AttendanceApiResponse = await res.json();
  return extractSingleAttendanceItem(json?.data);
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
  const data = json?.data ?? {};
  const items = Array.isArray(data?.items) ? data.items.map(normalizeStudentAttendanceHistoryItem) : [];

  return {
    items,
    pageNumber: Number(data?.pageNumber ?? params?.pageNumber ?? 1),
    pageSize: Number(data?.pageSize ?? params?.pageSize ?? 10),
    totalCount: Number(data?.totalCount ?? 0),
    totalPages: Number(data?.totalPages ?? 1),
    hasPreviousPage: Boolean(data?.hasPreviousPage),
    hasNextPage: Boolean(data?.hasNextPage),
  };
}

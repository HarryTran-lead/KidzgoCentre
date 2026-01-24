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
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  FetchAttendanceResult,
  FetchSessionResult,
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
        parsedDate.getSeconds()
      );
    }
  }

  const date = startDate ? formatDateLabel(startDate) : "Chưa cập nhật";
  const time = startDate ? formatTimeRange(startDate, session?.durationMinutes ?? undefined) : "--:--";

  const lesson: LessonDetail = {
    id: String(session?.id ?? session?.sessionId ?? ""),
    course: session?.classCode ?? session?.classTitle ?? "Buổi học",
    lesson: session?.classTitle ?? session?.classCode ?? "Buổi học",
    date,
    time,
    room: session?.actualRoomName ?? session?.plannedRoomName ?? "Đang cập nhật",
    teacher: session?.actualTeacherName ?? session?.plannedTeacherName ?? "Chưa cập nhật",
    students: session?.attendanceSummary?.totalStudents ?? 0,
    branch: session?.branchName ?? null,
    status: session?.status ?? null,
    participationType: session?.participationType ?? null,
  };

  return {
    lesson,
    attendance: session?.attendanceSummary ?? null,
  };
}

/**
 * Map attendance API item to Student
 */
function mapAttendanceToStudent(item: AttendanceItemApi, index: number): Student {
  const rawStatus = item.attendanceStatus ?? "NotMarked";
  let status: AttendanceStatus | null = null;
  if (rawStatus === "Present") status = "present";
  else if (rawStatus === "Late") status = "late";
  else if (rawStatus === "Absent") status = "absent";

  return {
    id: String(item.studentProfileId || item.id || index),
    name: item.studentName || "Học viên",
    status,
    absenceRate: 0,
    note: (item.note ?? item.comment ?? undefined) || undefined,
  };
}

/**
 * Convert AttendanceStatus to API format
 */
export function statusToApi(status: AttendanceStatus | null): AttendanceRawStatus {
  if (status === "present") return "Present";
  if (status === "late") return "Late";
  if (status === "absent") return "Absent";
  return "NotMarked";
}

/**
 * Fetch session detail
 */
export async function fetchSessionDetail(
  sessionId: string,
  signal?: AbortSignal
): Promise<FetchSessionResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.SESSIONS}/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch session detail error", res.status, text);
    throw new Error("Không thể tải thông tin buổi dạy.");
  }

  const json: SessionApiResponse = await res.json();
  let session: SessionApiItem | undefined;
  
  if (json?.data) {
    // Check if data has a session property (nested structure)
    if (typeof json.data === 'object' && 'session' in json.data) {
      session = json.data.session;
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

/**
 * Fetch attendance list for a session
 */
export async function fetchAttendance(
  sessionId: string,
  signal?: AbortSignal
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
  const rawItems: AttendanceItemApi[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.data?.items)
    ? json.data.items
    : Array.isArray(json)
    ? json
    : [];

  if (signal?.aborted) {
    throw new Error("Request aborted");
  }

  let mappedStudents = rawItems.map(mapAttendanceToStudent);

  // Calculate absence rate for each student based on attendance history
  try {
    const historyResults = await Promise.allSettled(
      mappedStudents.map(async (s) => {
        if (!s.id || signal?.aborted) return s;

        const hRes = await fetch(
          `${TEACHER_ENDPOINTS.ATTENDANCE_STUDENTS}/${s.id}?pageNumber=1&pageSize=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );

        if (!hRes.ok) return s;

        const hJson: StudentAttendanceHistoryApiResponse = await hRes.json();
        const items: StudentAttendanceHistoryItem[] =
          hJson?.data?.items && Array.isArray(hJson.data.items)
            ? hJson.data.items
            : [];

        const total = items.length;
        if (total === 0) return s;

        const absentCount = items.filter(
          (it) => it.attendanceStatus === "Absent"
        ).length;

        const rate = (absentCount / total) * 100;
        return { ...s, absenceRate: rate };
      })
    );

    mappedStudents = historyResults.map((r, idx) =>
      r.status === "fulfilled" && r.value
        ? (r.value as Student)
        : mappedStudents[idx]
    );
  } catch (err) {
    console.error("Error when fetching student attendance history:", err);
  }

  // Check if any student has been marked
  const hasAnyMarked = mappedStudents.some(
    (s) => s.status !== null || (s.note ?? "").trim().length > 0
  );

  // Calculate attendance summary from list if not provided by server
  const total = mappedStudents.length;
  const presentCount = mappedStudents.filter((s) => s.status === "present").length;
  const lateCount = mappedStudents.filter((s) => s.status === "late").length;
  const absentCount = mappedStudents.filter((s) => s.status === "absent").length;
  const notMarkedCount = mappedStudents.filter((s) => s.status === null).length;

  const attendanceSummary: AttendanceSummaryApi = {
    totalStudents: total,
    presentCount: presentCount + lateCount,
    absentCount,
    notMarkedCount,
  };

  return {
    students: mappedStudents,
    attendanceSummary,
    hasAnyMarked,
  };
}

/**
 * Create attendance record for a session
 */
export async function createAttendance(
  sessionId: string,
  data: CreateAttendanceRequest
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

/**
 * Update attendance record for a student in a session
 */
export async function updateAttendance(
  sessionId: string,
  studentProfileId: string,
  data: UpdateAttendanceRequest
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(
    `${TEACHER_ENDPOINTS.ATTENDANCE}/${sessionId}/students/${studentProfileId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

/**
 * Save attendance for multiple students
 */
export async function saveAttendance(
  sessionId: string,
  students: Student[],
  isNewSession: boolean
): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  // Only send students that have been marked or have notes
  const itemsToSave = students.filter(
    (s) => s.status !== null || (s.note ?? "").trim().length > 0
  );

  if (itemsToSave.length === 0) {
    throw new Error("Vui lòng điểm danh ít nhất một học viên.");
  }

  const results = await Promise.allSettled(
    itemsToSave.map(async (s) => {
      if (isNewSession) {
        // POST - Create new attendance
        const body: CreateAttendanceRequest = {
          studentProfileId: s.id,
          attendanceStatus: statusToApi(s.status),
        };
        if ((s.note ?? "").trim().length > 0) {
          body.comment = s.note ?? "";
        }
        await createAttendance(sessionId, body);
      } else {
        // PUT - Update existing attendance
        const body: UpdateAttendanceRequest = {
          attendanceStatus: statusToApi(s.status),
          comment: (s.note ?? "").trim().length > 0 ? s.note : undefined,
        };
        await updateAttendance(sessionId, s.id, body);
      }
    })
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error("Save attendance errors:", failed);
    throw new Error(`Không thể lưu điểm danh cho ${failed.length} học viên.`);
  }
}

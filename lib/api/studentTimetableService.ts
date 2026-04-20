import { STUDENT_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import type {
  StudentTimetableResponse,
  StudentTimetableSession,
} from "@/types/student/timetable";

function mapStudentSession(raw: Record<string, unknown>): StudentTimetableSession {
  const g = (camel: string, pascal: string) =>
    (raw[camel] ?? raw[pascal] ?? null) as string | null;
  const gn = (camel: string, pascal: string) =>
    (raw[camel] ?? raw[pascal] ?? null) as number | null;
  const gb = (camel: string, pascal: string) =>
    (raw[camel] ?? raw[pascal] ?? null) as boolean | null;

  return {
    id: String(raw.id ?? raw.Id ?? ""),
    classId: String(raw.classId ?? raw.ClassId ?? ""),
    classCode: g("classCode", "ClassCode"),
    classTitle: g("classTitle", "ClassTitle"),
    plannedDatetime: g("plannedDatetime", "PlannedDatetime"),
    actualDatetime: g("actualDatetime", "ActualDatetime"),
    durationMinutes: gn("durationMinutes", "DurationMinutes"),
    registrationId: g("registrationId", "RegistrationId"),
    track: g("track", "Track"),
    isMakeup: gb("isMakeup", "IsMakeup"),
    attendanceStatus: g("attendanceStatus", "AttendanceStatus"),
    absenceType: g("absenceType", "AbsenceType"),
    participationType: g("participationType", "ParticipationType"),
    status: g("status", "Status"),
    plannedRoomName: g("plannedRoomName", "PlannedRoomName"),
    actualRoomName: g("actualRoomName", "ActualRoomName"),
    plannedTeacherName: g("plannedTeacherName", "PlannedTeacherName"),
    actualTeacherName: g("actualTeacherName", "ActualTeacherName"),
    lessonPlanLink: g("lessonPlanLink", "LessonPlanLink"),
    color: g("color", "Color"),
  };
}

export async function getStudentTimetable(params?: {
  from?: string;
  to?: string;
}): Promise<StudentTimetableResponse> {
  const endpoint = STUDENT_ENDPOINTS.TIMETABLE ?? "/api/students/timetable";
  return get<StudentTimetableResponse>(endpoint, {
    params: params ?? {},
  });
}

export function extractStudentTimetableSessions(
  payload?: StudentTimetableResponse | null
): StudentTimetableSession[] {
  if (!payload) return [];

  const root = payload as Record<string, unknown>;
  const dataLayer = (root.data ?? root) as Record<string, unknown>;
  const nestedDataLayer = (dataLayer.data ?? dataLayer) as Record<string, unknown>;

  const rawList =
    nestedDataLayer.sessions ??
    nestedDataLayer.Sessions ??
    dataLayer.sessions ??
    dataLayer.Sessions ??
    root.sessions ??
    root.Sessions ??
    [];

  const sessions = Array.isArray(rawList) ? rawList : [];
  return sessions
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => mapStudentSession(item));
}

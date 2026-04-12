import { PARENT_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

export type ParentTimetableSession = {
  id: string;
  classId: string;
  classCode?: string | null;
  classTitle?: string | null;
  studentProfileId?: string | null;
  studentDisplayName?: string | null;
  studentAvatarUrl?: string | null;
  registrationId?: string | null;
  track?: string | null;
  isMakeup?: boolean | null;
  plannedDatetime?: string | null;
  actualDatetime?: string | null;
  durationMinutes?: number | null;
  participationType?: string | null;
  status?: string | null;
  attendanceStatus?: string | null;
  color?: string | null;
  programName?: string | null;
  plannedRoomName?: string | null;
  actualRoomName?: string | null;
  plannedTeacherName?: string | null;
  actualTeacherName?: string | null;
  lessonPlanLink?: string | null;
};

// Backend C# may return PascalCase — normalize to camelCase
function mapSession(raw: Record<string, unknown>): ParentTimetableSession {
  const g = (camel: string, pascal: string) =>
    (raw[camel] ?? raw[pascal] ?? null) as string | null;
  const gn = (camel: string, pascal: string) =>
    (raw[camel] ?? raw[pascal] ?? null) as number | null;
  const gb = (camel: string, pascal: string) =>
    (raw[camel] ?? raw[pascal] ?? null) as boolean | null;

  return {
    id: (raw.id ?? raw.Id ?? "") as string,
    classId: (raw.classId ?? raw.ClassId ?? "") as string,
    classCode: g("classCode", "ClassCode"),
    classTitle: g("classTitle", "ClassTitle"),
    studentProfileId: g("studentProfileId", "StudentProfileId"),
    studentDisplayName: g("studentDisplayName", "StudentDisplayName"),
    studentAvatarUrl: g("studentAvatarUrl", "StudentAvatarUrl"),
    registrationId: g("registrationId", "RegistrationId"),
    track: g("track", "Track"),
    isMakeup: gb("isMakeup", "IsMakeup"),
    plannedDatetime: g("plannedDatetime", "PlannedDatetime"),
    actualDatetime: g("actualDatetime", "ActualDatetime"),
    durationMinutes: gn("durationMinutes", "DurationMinutes"),
    participationType: g("participationType", "ParticipationType"),
    status: g("status", "Status"),
    attendanceStatus: g("attendanceStatus", "AttendanceStatus"),
    color: g("color", "Color"),
    programName: g("programName", "ProgramName"),
    plannedRoomName: g("plannedRoomName", "PlannedRoomName"),
    actualRoomName: g("actualRoomName", "ActualRoomName"),
    plannedTeacherName: g("plannedTeacherName", "PlannedTeacherName"),
    actualTeacherName: g("actualTeacherName", "ActualTeacherName"),
    lessonPlanLink: g("lessonPlanLink", "LessonPlanLink"),
  };
}

export type ParentTimetableResponse = {
  isSuccess?: boolean;
  sessions?: ParentTimetableSession[];
  data?: {
    sessions?: ParentTimetableSession[];
  };
};

export async function getParentTimetable(params?: {
  from?: string;
  to?: string;
  studentProfileId?: string;
  classId?: string;
}): Promise<{ sessions: ParentTimetableSession[] }> {
  const endpoint = PARENT_ENDPOINTS.TIMETABLE ?? "/api/parent/timetable";
  const res = await get<Record<string, unknown>>(endpoint, {
    params: params ?? {},
  });

  // Extract raw sessions array from various response shapes
  const resData = (res?.data ?? res) as Record<string, unknown> | undefined;
  const rawList =
    (resData as Record<string, unknown>)?.sessions ??
    (resData as Record<string, unknown>)?.Sessions ??
    (res as Record<string, unknown>)?.sessions ??
    (res as Record<string, unknown>)?.Sessions ??
    [];
  const arr = Array.isArray(rawList) ? rawList : [];

  return { sessions: arr.map((s: Record<string, unknown>) => mapSession(s)) };
}

import { STUDENT_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import type {
  StudentTimetableResponse,
  StudentTimetableSession,
} from "@/types/student/timetable";

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
  const direct = payload?.sessions;
  if (Array.isArray(direct)) return direct;

  const nested = payload?.data?.sessions;
  if (Array.isArray(nested)) return nested;

  return [];
}

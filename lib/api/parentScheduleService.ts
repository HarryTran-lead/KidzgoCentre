import { PARENT_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

export type ParentTimetableSession = {
  id: string;
  classId: string;
  classCode?: string | null;
  classTitle?: string | null;
  registrationId?: string | null;
  track?: string | null;
  isMakeup?: boolean | null;
  plannedDatetime?: string | null;
  actualDatetime?: string | null;
  durationMinutes?: number | null;
  participationType?: string | null;
  status?: string | null;
  plannedRoomName?: string | null;
  actualRoomName?: string | null;
  plannedTeacherName?: string | null;
  actualTeacherName?: string | null;
  lessonPlanLink?: string | null;
};

export type ParentTimetableResponse = {
  sessions?: ParentTimetableSession[];
  data?: {
    sessions?: ParentTimetableSession[];
  };
};

export async function getParentTimetable(params?: {
  from?: string;
  to?: string;
}): Promise<ParentTimetableResponse> {
  const endpoint = PARENT_ENDPOINTS.TIMETABLE ?? "/api/parent/timetable";
  return get<ParentTimetableResponse>(endpoint, {
    params: params ?? {},
  });
}

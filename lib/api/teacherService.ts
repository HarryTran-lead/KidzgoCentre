/**
 * Teacher Class API Helper Functions
 *
 * Calls the teacher-specific endpoints to get classes and sessions.
 * Token is automatically injected via axios interceptors.
 */

import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

export type TeacherClass = {
  id: string;
  code?: string;
  name?: string;
  title?: string;
  programName?: string;
  branchName?: string;
  level?: string;
};

export type TeacherClassListResponse = {
  isSuccess: boolean;
  data: {
    classes: {
      items: TeacherClass[];
      totalCount: number;
      pageNumber: number;
      pageSize: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      length: number;
      totalPages: number;
    };
  };
};

export type TeacherSession = {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  branchName?: string;
  plannedDatetime?: string;
  actualDatetime?: string;
  durationMinutes?: number;
};

export type TeacherTimetableResponse = {
  isSuccess: boolean;
  data: {
    sessions: TeacherSession[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
};

/**
 * Get all classes for the current teacher
 * API: GET /api/teacher/classes
 */
export async function getTeacherClasses(params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<TeacherClassListResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  }

  const url = `${TEACHER_ENDPOINTS.CLASSES}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<TeacherClassListResponse>(url);
}

/**
 * Get timetable/sessions for the current teacher
 * API: GET /api/teacher/timetable?from=...&to=...
 */
export async function getTeacherTimetable(params: {
  from: string;
  to: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<TeacherTimetableResponse> {
  const queryParams = new URLSearchParams();

  queryParams.append('from', params.from);
  queryParams.append('to', params.to);

  if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

  const url = `${TEACHER_ENDPOINTS.TIMETABLE}?${queryParams.toString()}`;
  return get<TeacherTimetableResponse>(url);
}

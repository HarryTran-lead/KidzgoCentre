import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get, put } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";

export type TeacherPortalQuery = QueryParams;

export async function getTeacherDashboard(params?: TeacherPortalQuery): Promise<any> {
  return get<any>(`${TEACHER_ENDPOINTS.DASHBOARD}${buildQueryString(params)}`);
}

export async function getTeacherProfileSummary(params?: TeacherPortalQuery): Promise<any> {
  return get<any>(`${TEACHER_ENDPOINTS.PROFILE}${buildQueryString(params)}`);
}

export async function updateTeacherProfile(payload: Record<string, unknown>): Promise<any> {
  return put<any>(TEACHER_ENDPOINTS.PROFILE, payload);
}

export async function getTeacherTimesheet(params?: TeacherPortalQuery): Promise<any> {
  return get<any>(`${TEACHER_ENDPOINTS.TIMESHEET}${buildQueryString(params)}`);
}

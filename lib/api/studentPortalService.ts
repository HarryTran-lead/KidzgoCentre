import { STUDENT_PORTAL_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";

export type StudentPortalQuery = QueryParams;

export async function getStudentDashboard(params?: StudentPortalQuery): Promise<any> {
  return get<any>(`${STUDENT_PORTAL_ENDPOINTS.DASHBOARD}${buildQueryString(params)}`);
}

export async function getStudentProfileSummary(params?: StudentPortalQuery): Promise<any> {
  return get<any>(`${STUDENT_PORTAL_ENDPOINTS.PROFILE}${buildQueryString(params)}`);
}

export async function getStudentReports(params?: StudentPortalQuery): Promise<any> {
  return get<any>(`${STUDENT_PORTAL_ENDPOINTS.REPORTS}${buildQueryString(params)}`);
}

export async function getStudentMedia(params?: StudentPortalQuery): Promise<any> {
  return get<any>(`${STUDENT_PORTAL_ENDPOINTS.MEDIA}${buildQueryString(params)}`);
}

export async function getStudentTests(params?: StudentPortalQuery): Promise<any> {
  return get<any>(`${STUDENT_PORTAL_ENDPOINTS.TESTS}${buildQueryString(params)}`);
}

export async function getStudentTestById(id: string): Promise<any> {
  return get<any>(STUDENT_PORTAL_ENDPOINTS.TEST_BY_ID(id));
}

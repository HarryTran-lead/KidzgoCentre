import { STAFF_PORTAL_ENDPOINTS } from "@/constants/apiURL";
import { get, post } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";

export type StaffPortalQuery = QueryParams;

export async function getStaffDashboard(params?: StaffPortalQuery): Promise<any> {
  return get<any>(`${STAFF_PORTAL_ENDPOINTS.DASHBOARD}${buildQueryString(params)}`);
}

export async function getStaffAnnouncements(params?: StaffPortalQuery): Promise<any> {
  return get<any>(
    `${STAFF_PORTAL_ENDPOINTS.ANNOUNCEMENTS}${buildQueryString(params)}`
  );
}

export async function createStaffAnnouncement(
  payload: Record<string, unknown>
): Promise<any> {
  return post<any>(STAFF_PORTAL_ENDPOINTS.ANNOUNCEMENTS, payload);
}

export async function getStaffPendingEnrollments(
  params?: StaffPortalQuery
): Promise<any> {
  return get<any>(
    `${STAFF_PORTAL_ENDPOINTS.ENROLLMENTS_PENDING}${buildQueryString(params)}`
  );
}

export async function approveStaffEnrollment(
  id: string,
  payload: Record<string, unknown> = {}
): Promise<any> {
  return post<any>(STAFF_PORTAL_ENDPOINTS.ENROLLMENT_APPROVE(id), payload);
}

export async function rejectStaffEnrollment(
  id: string,
  payload: Record<string, unknown> = {}
): Promise<any> {
  return post<any>(STAFF_PORTAL_ENDPOINTS.ENROLLMENT_REJECT(id), payload);
}

export async function getStaffFeeSummary(params?: StaffPortalQuery): Promise<any> {
  return get<any>(
    `${STAFF_PORTAL_ENDPOINTS.FEES_SUMMARY}${buildQueryString(params)}`
  );
}

export async function getStaffStudents(params?: StaffPortalQuery): Promise<any> {
  return get<any>(`${STAFF_PORTAL_ENDPOINTS.STUDENTS}${buildQueryString(params)}`);
}

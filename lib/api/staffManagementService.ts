import { STAFF_MANAGEMENT_PORTAL_ENDPOINTS } from "@/constants/apiURL";
import { get, post } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";

export type StaffManagementQuery = QueryParams;

export async function getStaffManagementStudents(
  params?: StaffManagementQuery
): Promise<any> {
  return get<any>(
    `${STAFF_MANAGEMENT_PORTAL_ENDPOINTS.STUDENTS}${buildQueryString(params)}`
  );
}

export async function getStaffManagementMedia(
  params?: StaffManagementQuery
): Promise<any> {
  return get<any>(
    `${STAFF_MANAGEMENT_PORTAL_ENDPOINTS.MEDIA}${buildQueryString(params)}`
  );
}

export async function approveStaffManagementMedia(
  id: string,
  payload: Record<string, unknown> = {}
): Promise<any> {
  return post<any>(STAFF_MANAGEMENT_PORTAL_ENDPOINTS.MEDIA_APPROVE(id), payload);
}

export async function rejectStaffManagementMedia(
  id: string,
  payload: Record<string, unknown> = {}
): Promise<any> {
  return post<any>(STAFF_MANAGEMENT_PORTAL_ENDPOINTS.MEDIA_REJECT(id), payload);
}

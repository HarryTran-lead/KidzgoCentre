/**
 * Class API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { CLASS_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import type { StudentClassResponse } from "@/types/student/class";

/**
 * Get all classes with optional pagination
 */
export async function getAllClasses(params?: {
  pageNumber?: number;
  pageSize?: number;
  branchId?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params?.branchId) queryParams.append("branchId", params.branchId);

  const url = queryParams.toString()
    ? `${CLASS_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
    : CLASS_ENDPOINTS.GET_ALL;
  
  return get<any>(url);
}

export async function getClassById(id: string): Promise<StudentClassResponse> {
  const endpoint = CLASS_ENDPOINTS.GET_BY_ID
    ? CLASS_ENDPOINTS.GET_BY_ID(id)
    : `/api/classes/${id}`;

  return get<StudentClassResponse>(endpoint);
}

export async function getAllClasses(params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<ClassListResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  }

  const url = `${CLASS_ENDPOINTS.GET_ALL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<ClassListResponse>(url);
}
/**
 * Class API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { CLASS_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import type { StudentClassResponse } from "@/types/student/class";

export type ClassInfo = {
  id: string;
  code?: string;
  name?: string;
  title?: string;
  programName?: string;
  branchName?: string;
  level?: string;
};

export type ClassListResponse = {
  isSuccess: boolean;
  data: {
    classes: ClassInfo[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
};

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
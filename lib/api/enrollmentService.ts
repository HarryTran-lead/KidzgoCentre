/**
 * Enrollment Service
 * Handles all API calls related to enrollments
 */

import { get, post, put, patch } from "@/lib/axios";
import { ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";
import type {
  Enrollment,
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  AssignTuitionPlanRequest,
  EnrollmentFilterParams,
  EnrollmentPaginatedResponse,
  EnrollmentHistoryItem,
} from "@/types/enrollment";
import type { ApiResponse } from "@/types/apiResponse";

/**
 * Get all enrollments with optional filters
 */
export async function getAllEnrollments(
  params?: EnrollmentFilterParams
): Promise<ApiResponse<EnrollmentPaginatedResponse>> {
  const queryParams = new URLSearchParams();

  if (params?.classId) queryParams.append("classId", params.classId);
  if (params?.studentProfileId) queryParams.append("studentProfileId", params.studentProfileId);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);

  const response = await get<any>(
    `${ENROLLMENT_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
  );

  // Handle nested response structures from the backend
  const rawData = response?.data || response || {};
  const responseData = rawData?.data || rawData;
  const enrollments = responseData?.enrollments?.items || responseData?.items || 
    (Array.isArray(responseData) ? responseData : []);

  return {
    isSuccess: response?.isSuccess || response?.success || false,
    message: response?.message || "",
    data: {
      items: enrollments,
      totalCount: responseData?.totalCount || enrollments.length || 0,
      pageNumber: responseData?.pageNumber || params?.pageNumber || 1,
      pageSize: responseData?.pageSize || params?.pageSize || 10,
      totalPages: responseData?.totalPages || Math.ceil((responseData?.totalCount || enrollments.length || 0) / (params?.pageSize || 10)),
    },
  };
}

/**
 * Get enrollment by ID
 */
export async function getEnrollmentById(id: string): Promise<ApiResponse<Enrollment>> {
  const response = await get<any>(ENROLLMENT_ENDPOINTS.GET_BY_ID(id));
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Create a new enrollment
 */
export async function createEnrollment(
  data: CreateEnrollmentRequest
): Promise<ApiResponse<Enrollment>> {
  const response = await post<any>(ENROLLMENT_ENDPOINTS.CREATE, data);
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Update an enrollment
 */
export async function updateEnrollment(
  id: string,
  data: UpdateEnrollmentRequest
): Promise<ApiResponse<Enrollment>> {
  const response = await put<any>(ENROLLMENT_ENDPOINTS.UPDATE(id), data);
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Pause an enrollment
 */
export async function pauseEnrollment(id: string): Promise<ApiResponse<Enrollment>> {
  const response = await patch<any>(ENROLLMENT_ENDPOINTS.PAUSE(id));
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Drop an enrollment
 */
export async function dropEnrollment(id: string): Promise<ApiResponse<Enrollment>> {
  const response = await patch<any>(ENROLLMENT_ENDPOINTS.DROP(id));
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Reactivate an enrollment
 */
export async function reactivateEnrollment(id: string): Promise<ApiResponse<Enrollment>> {
  const response = await patch<any>(ENROLLMENT_ENDPOINTS.REACTIVATE(id));
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Assign tuition plan to an enrollment
 */
export async function assignTuitionPlan(
  id: string,
  data: AssignTuitionPlanRequest
): Promise<ApiResponse<Enrollment>> {
  const response = await patch<any>(ENROLLMENT_ENDPOINTS.ASSIGN_TUITION_PLAN(id), data);
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Get enrollment history for a student
 */
export async function getStudentEnrollmentHistory(
  studentProfileId: string
): Promise<ApiResponse<EnrollmentHistoryItem[]>> {
  const response = await get<any>(ENROLLMENT_ENDPOINTS.STUDENT_HISTORY(studentProfileId));
  const items = response.data?.items || response.data || [];
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: Array.isArray(items) ? items : [],
  };
}

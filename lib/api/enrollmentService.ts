/**
 * Enrollment Service
 * Handles all API calls related to enrollments
 */

import { get, post, put, patch } from "@/lib/axios";
import { ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";
import type {
  Enrollment,
  EnrollmentScheduleSegment,
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  AssignTuitionPlanRequest,
  EnrollmentFilterParams,
  EnrollmentPaginatedResponse,
  EnrollmentHistoryItem,
  AddEnrollmentScheduleSegmentRequest,
} from "@/types/enrollment";
import type { ApiResponse } from "@/types/apiResponse";

function toApiSuccess(response: any) {
  if (typeof response?.isSuccess === "boolean") return response.isSuccess;
  if (typeof response?.success === "boolean") return response.success;
  return false;
}

function toApiMessage(response: any) {
  return (
    response?.message ||
    response?.detail ||
    response?.title ||
    ""
  );
}

function unwrapData(response: any) {
  const level1 = response?.data ?? response;
  const level2 = level1?.data ?? level1;
  return level2;
}

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
  if (params?.branchId) queryParams.append("branchId", params.branchId);

  const response = await get<any>(
    `${ENROLLMENT_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
  );

  const responseData = unwrapData(response) || {};
  const enrollments = responseData?.enrollments?.items || responseData?.items || 
    (Array.isArray(responseData) ? responseData : []);

  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
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
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
  };
}

/**
 * Create a new enrollment
 */
export async function createEnrollment(
  data: CreateEnrollmentRequest
): Promise<ApiResponse<Enrollment>> {
  const response = await post<any>(ENROLLMENT_ENDPOINTS.CREATE, data);
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
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
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
  };
}

/**
 * Add schedule segment for supplementary enrollment
 */
export async function addEnrollmentScheduleSegment(
  id: string,
  data: AddEnrollmentScheduleSegmentRequest
): Promise<ApiResponse<EnrollmentScheduleSegment>> {
  const response = await post<any>(ENROLLMENT_ENDPOINTS.SCHEDULE_SEGMENTS(id), data);
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
  };
}

/**
 * Pause an enrollment
 */
export async function pauseEnrollment(id: string): Promise<ApiResponse<Enrollment>> {
  const response = await patch<any>(ENROLLMENT_ENDPOINTS.PAUSE(id));
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
  };
}

/**
 * Drop an enrollment
 */
export async function dropEnrollment(id: string): Promise<ApiResponse<Enrollment>> {
  const response = await patch<any>(ENROLLMENT_ENDPOINTS.DROP(id));
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
  };
}

/**
 * Reactivate an enrollment
 */
export async function reactivateEnrollment(id: string): Promise<ApiResponse<Enrollment>> {
  const response = await patch<any>(ENROLLMENT_ENDPOINTS.REACTIVATE(id));
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
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
  const responseData = unwrapData(response);
  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: responseData,
  };
}

/**
 * Get enrollment history for a student
 */
export async function getStudentEnrollmentHistory(
  studentProfileId: string,
  params?: { pageNumber?: number; pageSize?: number }
): Promise<ApiResponse<EnrollmentHistoryItem[]>> {
  const query = new URLSearchParams();
  if (typeof params?.pageNumber === "number" && params.pageNumber > 0) {
    query.set("pageNumber", String(params.pageNumber));
  }
  if (typeof params?.pageSize === "number" && params.pageSize > 0) {
    query.set("pageSize", String(params.pageSize));
  }

  const url = query.toString()
    ? `${ENROLLMENT_ENDPOINTS.STUDENT_HISTORY(studentProfileId)}?${query.toString()}`
    : ENROLLMENT_ENDPOINTS.STUDENT_HISTORY(studentProfileId);

  const response = await get<any>(url);
  const responseData = unwrapData(response);
  const items =
    responseData?.enrollments?.items ||
    responseData?.items ||
    (Array.isArray(responseData) ? responseData : []);

  return {
    isSuccess: toApiSuccess(response),
    message: toApiMessage(response),
    data: Array.isArray(items) ? items : [],
  };
}

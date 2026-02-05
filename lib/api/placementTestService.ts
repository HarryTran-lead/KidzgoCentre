/**
 * Placement Test Service
 * Handles all API calls related to placement tests
 */

import { get, post, put, del } from "@/lib/axios";
import { PLACEMENT_TEST_ENDPOINTS } from "@/constants/apiURL";
import type {
  PlacementTest,
  CreatePlacementTestRequest,
  UpdatePlacementTestRequest,
  PlacementTestResult,
  PlacementTestNote,
} from "@/types/placement-test";
import type { ApiResponse } from "@/types/apiResponse";

// Paginated response type
interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all placement tests with optional filters
 */
export async function getAllPlacementTests(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  branchId?: string;
  teacherId?: string;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<ApiResponse<PaginatedResponse<PlacementTest>>> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append("pageNumber", params.page.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.branchId) queryParams.append("branchId", params.branchId);
  if (params?.teacherId) queryParams.append("assignedTeacherId", params.teacherId);
  if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);

  const response = await get<any>(`${PLACEMENT_TEST_ENDPOINTS.GET_ALL}?${queryParams.toString()}`);
  
  // Handle nested response structure: response.data.data or response.data
  const responseData = response.data?.data || response.data || {};
  const placementTests = responseData.placementTests || responseData.items || [];
  
  return {
    isSuccess: response.isSuccess || response.success || true,
    message: response.message,
    data: {
      items: placementTests,
      totalCount: responseData.totalCount || placementTests.length || 0,
      pageNumber: responseData.page || responseData.pageNumber || 1,
      pageSize: responseData.pageSize || 10,
      totalPages: responseData.totalPages || Math.ceil((responseData.totalCount || 0) / (responseData.pageSize || 10)),
    },
  };
}

/**
 * Get placement test by ID
 */
export async function getPlacementTestById(id: string): Promise<ApiResponse<PlacementTest>> {
  const response = await get<any>(PLACEMENT_TEST_ENDPOINTS.GET_BY_ID(id));
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Create new placement test
 */
export async function createPlacementTest(
  data: CreatePlacementTestRequest
): Promise<ApiResponse<PlacementTest>> {
  const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.CREATE, data);
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Update placement test
 */
export async function updatePlacementTest(
  id: string,
  data: UpdatePlacementTestRequest
): Promise<ApiResponse<PlacementTest>> {
  const response = await put<any>(PLACEMENT_TEST_ENDPOINTS.UPDATE(id), data);
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Cancel placement test
 */
export async function cancelPlacementTest(
  id: string,
  reason?: string
): Promise<ApiResponse<void>> {
  const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.CANCEL(id), { reason });
  return {
    isSuccess: response.isSuccess || response.success || true,
    message: response.message || 'Cancelled successfully',
    data: undefined as any,
  };
}

/**
 * Mark placement test as no-show
 */
export async function markPlacementTestNoShow(
  id: string
): Promise<ApiResponse<void>> {
  const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.NO_SHOW(id), {});
  return {
    isSuccess: response.isSuccess || response.success || true,
    message: response.message || 'Marked as no-show',
    data: undefined as any,
  };
}

/**
 * Update placement test results
 */
export async function updatePlacementTestResults(
  id: string,
  results: PlacementTestResult
): Promise<ApiResponse<void>> {
  const response = await put<any>(PLACEMENT_TEST_ENDPOINTS.UPDATE_RESULTS(id), results);
  return {
    isSuccess: response.isSuccess || response.success || true,
    message: response.message || 'Results updated successfully',
    data: undefined as any,
  };
}

/**
 * Add note to placement test
 */
export async function addPlacementTestNote(
  id: string,
  note: Omit<PlacementTestNote, "id" | "createdAt" | "createdBy">
): Promise<ApiResponse<PlacementTestNote>> {
  const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.ADD_NOTE(id), note);
  return {
    isSuccess: response.isSuccess || response.success || false,
    message: response.message,
    data: response.data || response,
  };
}

/**
 * Convert placement test to enrolled student
 */
export async function convertPlacementTestToEnrolled(
  id: string
): Promise<ApiResponse<void>> {
  const response = await post<any>(PLACEMENT_TEST_ENDPOINTS.CONVERT_TO_ENROLLED(id), {});
  return {
    isSuccess: response.isSuccess || response.success || true,
    message: response.message || 'Converted to enrolled student successfully',
    data: undefined as any,
  };
}

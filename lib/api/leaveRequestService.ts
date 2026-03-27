/**
 * Leave Request API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { LEAVE_REQUEST_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import type {
  LeaveRequestPayload,
  LeaveRequestListResponse,
  LeaveRequestDetailResponse,
  LeaveRequestActionResponse,
  LeaveRequestBulkApproveResponse,
} from "@/types/leaveRequest";

export async function getLeaveRequests(): Promise<LeaveRequestListResponse> {
  return get<LeaveRequestListResponse>(LEAVE_REQUEST_ENDPOINTS.GET_ALL);
}

export async function getLeaveRequestsWithParams(params?: {
  studentProfileId?: string;
  classId?: string;
  status?: string;
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<LeaveRequestListResponse> {
  const qs = new URLSearchParams();
  if (params?.studentProfileId) qs.set("studentProfileId", params.studentProfileId);
  if (params?.classId) qs.set("classId", params.classId);
  if (params?.status) qs.set("status", params.status);
  if (params?.branchId) qs.set("branchId", params.branchId);
  if (params?.pageNumber) qs.set("pageNumber", String(params.pageNumber));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const endpoint = qs.toString()
    ? `${LEAVE_REQUEST_ENDPOINTS.GET_ALL}?${qs.toString()}`
    : LEAVE_REQUEST_ENDPOINTS.GET_ALL;
  return get<LeaveRequestListResponse>(endpoint);
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequestDetailResponse> {
  return get<LeaveRequestDetailResponse>(LEAVE_REQUEST_ENDPOINTS.GET_BY_ID(id));
}

export async function createLeaveRequest(data: LeaveRequestPayload): Promise<LeaveRequestDetailResponse> {
  return post<LeaveRequestDetailResponse>(LEAVE_REQUEST_ENDPOINTS.CREATE, {
    ...data,
    endDate: data.endDate?.trim() ? data.endDate : null,
    reason: data.reason?.trim() ? data.reason.trim() : null,
  });
}

export async function approveLeaveRequest(id: string): Promise<LeaveRequestActionResponse> {
  return put<LeaveRequestActionResponse>(LEAVE_REQUEST_ENDPOINTS.APPROVE(id), {});
}

export async function approveLeaveRequestsBulk(
  ids: string[]
): Promise<LeaveRequestBulkApproveResponse> {
  return put<LeaveRequestBulkApproveResponse>(LEAVE_REQUEST_ENDPOINTS.APPROVE_BULK, { ids });
}

export async function rejectLeaveRequest(id: string): Promise<LeaveRequestActionResponse> {
  return put<LeaveRequestActionResponse>(LEAVE_REQUEST_ENDPOINTS.REJECT(id), {});
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequestActionResponse> {
  return put<LeaveRequestActionResponse>(LEAVE_REQUEST_ENDPOINTS.CANCEL(id), {});
}

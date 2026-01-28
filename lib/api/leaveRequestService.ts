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
} from "@/types/leaveRequest";

export async function getLeaveRequests(): Promise<LeaveRequestListResponse> {
  return get<LeaveRequestListResponse>(LEAVE_REQUEST_ENDPOINTS.GET_ALL);
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequestDetailResponse> {
  return get<LeaveRequestDetailResponse>(LEAVE_REQUEST_ENDPOINTS.GET_BY_ID(id));
}

export async function createLeaveRequest(data: LeaveRequestPayload): Promise<LeaveRequestDetailResponse> {
  return post<LeaveRequestDetailResponse>(LEAVE_REQUEST_ENDPOINTS.CREATE, data);
}

export async function approveLeaveRequest(id: string): Promise<LeaveRequestActionResponse> {
 return put<LeaveRequestActionResponse>(LEAVE_REQUEST_ENDPOINTS.APPROVE(id), {});}

export async function rejectLeaveRequest(id: string): Promise<LeaveRequestActionResponse> {
return put<LeaveRequestActionResponse>(LEAVE_REQUEST_ENDPOINTS.REJECT(id), {});}

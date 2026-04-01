import type { ApiResponse } from "@/types/apiResponse";
import type { ListData } from "@/types/apiResponse";

export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "AUTO_APPROVED"
  | "CANCELLED";

export interface LeaveRequestPayload {
  studentProfileId: string;
  classId: string;
  sessionId?: string | null;
  sessionDate: string;
  endDate?: string | null;
  reason?: string | null;
}

export interface LeaveRequestRecord extends LeaveRequestPayload {
  id: string;
  status?: LeaveRequestStatus;
  noticeHours?: number;
  requestedAt?: string;
  approvedAt?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  requesterName?: string;
  studentName?: string;
  className?: string;
}

export type LeaveRequestListResponse =
  ApiResponse<ListData<LeaveRequestRecord>>;

export type LeaveRequestDetailResponse = ApiResponse<LeaveRequestRecord>;
export type LeaveRequestActionResponse = ApiResponse<LeaveRequestRecord>;

export interface LeaveRequestBulkApproveError {
  id?: string;
  code?: string;
  message?: string;
}

export interface LeaveRequestBulkApproveResult {
  approvedIds?: string[];
  errors?: LeaveRequestBulkApproveError[];
}

export type LeaveRequestBulkApproveResponse =
  ApiResponse<LeaveRequestBulkApproveResult>;

import type { ApiResponse } from "@/types/apiResponse";
import type { ListData } from "@/types/apiResponse";

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "AUTO_APPROVED";

export interface LeaveRequestPayload {
  studentProfileId: string;
  classId: string;
  sessionDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveRequestRecord extends LeaveRequestPayload {
  id: string;
  status?: LeaveRequestStatus;
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
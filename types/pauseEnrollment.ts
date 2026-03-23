import type { ApiResponse } from "@/types/apiResponse";

export type PauseEnrollmentRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export type PauseEnrollmentOutcome =
  | "ContinueSameClass"
  | "ReassignEquivalentClass"
  | "ContinueWithTutoring";

export interface PauseEnrollmentClassSummary {
  id: string;
  code?: string | null;
  title?: string | null;
  programId?: string | null;
  programName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}

export interface PauseEnrollmentRequestRecord {
  id: string;
  studentProfileId: string;
  classId?: string | null;
  pauseFrom: string;
  pauseTo: string;
  reason?: string | null;
  status?: PauseEnrollmentRequestStatus | string | null;
  requestedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  outcome?: PauseEnrollmentOutcome | null;
  outcomeNote?: string | null;
  outcomeBy?: string | null;
  outcomeAt?: string | null;
  classes?: PauseEnrollmentClassSummary[];
}

export interface CreatePauseEnrollmentRequestPayload {
  studentProfileId: string;
  pauseFrom: string;
  pauseTo: string;
  reason?: string | null;
}

export interface UpdatePauseEnrollmentOutcomePayload {
  outcome: PauseEnrollmentOutcome;
  outcomeNote?: string | null;
}

export interface PauseEnrollmentBulkApprovePayload {
  ids: string[];
}

export interface PauseEnrollmentBulkApproveError {
  id: string;
  code?: string;
  message?: string;
}

export interface PauseEnrollmentBulkApproveResult {
  approvedIds: string[];
  errors: PauseEnrollmentBulkApproveError[];
}

export interface PauseEnrollmentListData {
  items: PauseEnrollmentRequestRecord[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

export interface PauseEnrollmentStudentOption {
  id: string;
  label: string;
  parentName?: string;
  classText?: string;
}

export type PauseEnrollmentRequestListResponse =
  ApiResponse<PauseEnrollmentListData>;

export type PauseEnrollmentRequestDetailResponse =
  ApiResponse<PauseEnrollmentRequestRecord>;

export type PauseEnrollmentRequestActionResponse =
  ApiResponse<PauseEnrollmentRequestRecord>;

export type PauseEnrollmentBulkApproveResponse =
  ApiResponse<PauseEnrollmentBulkApproveResult>;

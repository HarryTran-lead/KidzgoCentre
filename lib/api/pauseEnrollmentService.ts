import { PAUSE_ENROLLMENT_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import type {
  CreatePauseEnrollmentRequestPayload,
  PauseEnrollmentBulkApprovePayload,
  PauseEnrollmentBulkApproveResponse,
  PauseEnrollmentRequestActionResponse,
  PauseEnrollmentRequestDetailResponse,
  PauseEnrollmentRequestListResponse,
  UpdatePauseEnrollmentOutcomePayload,
} from "@/types/pauseEnrollment";

export async function getPauseEnrollmentRequestsWithParams(params?: {
  studentProfileId?: string;
  classId?: string;
  status?: string;
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PauseEnrollmentRequestListResponse> {
  const qs = new URLSearchParams();

  if (params?.studentProfileId) qs.set("studentProfileId", params.studentProfileId);
  if (params?.classId) qs.set("classId", params.classId);
  if (params?.status) qs.set("status", params.status);
  if (params?.branchId) qs.set("branchId", params.branchId);
  if (params?.pageNumber) qs.set("pageNumber", String(params.pageNumber));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));

  const endpoint = qs.toString()
    ? `${PAUSE_ENROLLMENT_ENDPOINTS.GET_ALL}?${qs.toString()}`
    : PAUSE_ENROLLMENT_ENDPOINTS.GET_ALL;

  return get<PauseEnrollmentRequestListResponse>(endpoint);
}

export async function getPauseEnrollmentRequestById(
  id: string
): Promise<PauseEnrollmentRequestDetailResponse> {
  return get<PauseEnrollmentRequestDetailResponse>(
    PAUSE_ENROLLMENT_ENDPOINTS.GET_BY_ID(id)
  );
}

export async function createPauseEnrollmentRequest(
  data: CreatePauseEnrollmentRequestPayload
): Promise<PauseEnrollmentRequestDetailResponse> {
  return post<PauseEnrollmentRequestDetailResponse>(
    PAUSE_ENROLLMENT_ENDPOINTS.CREATE,
    {
      ...data,
      reason: data.reason?.trim() ? data.reason : null,
    }
  );
}

export async function approvePauseEnrollmentRequest(
  id: string
): Promise<PauseEnrollmentRequestActionResponse> {
  return put<PauseEnrollmentRequestActionResponse>(
    PAUSE_ENROLLMENT_ENDPOINTS.APPROVE(id),
    {}
  );
}

export async function approvePauseEnrollmentRequestsBulk(
  payload: PauseEnrollmentBulkApprovePayload
): Promise<PauseEnrollmentBulkApproveResponse> {
  return put<PauseEnrollmentBulkApproveResponse>(
    PAUSE_ENROLLMENT_ENDPOINTS.APPROVE_BULK,
    payload
  );
}

export async function rejectPauseEnrollmentRequest(
  id: string
): Promise<PauseEnrollmentRequestActionResponse> {
  return put<PauseEnrollmentRequestActionResponse>(
    PAUSE_ENROLLMENT_ENDPOINTS.REJECT(id),
    {}
  );
}

export async function cancelPauseEnrollmentRequest(
  id: string
): Promise<PauseEnrollmentRequestActionResponse> {
  try {
    return await put<PauseEnrollmentRequestActionResponse>(
      PAUSE_ENROLLMENT_ENDPOINTS.CANCEL(id),
      {}
    );
  } catch (error: any) {
    const status = Number(error?.response?.status ?? 0);
    if (status === 404 || status === 405) {
      return post<PauseEnrollmentRequestActionResponse>(
        PAUSE_ENROLLMENT_ENDPOINTS.CANCEL(id),
        {}
      );
    }
    throw error;
  }
}

export async function updatePauseEnrollmentOutcome(
  id: string,
  payload: UpdatePauseEnrollmentOutcomePayload
): Promise<PauseEnrollmentRequestActionResponse> {
  return put<PauseEnrollmentRequestActionResponse>(
    PAUSE_ENROLLMENT_ENDPOINTS.OUTCOME(id),
    {
      ...payload,
      outcomeNote: payload.outcomeNote?.trim() ? payload.outcomeNote : null,
    }
  );
}

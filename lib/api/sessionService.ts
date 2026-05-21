import { SESSION_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import type { ApiResponse } from "@/types/apiResponse";
import type {
  SessionDetail,
  SubmitTeachingLogRequest,
  SubmitTeachingLogResponse,
  TeachingLog,
} from "@/types/admin/sessions";

export type SourceSession = {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  branchName?: string;
  plannedDatetime?: string;
  actualDatetime?: string;
  durationMinutes?: number;
  moduleId?: string | null;
  lessonPlanTemplateId?: string | null;
  sessionIndexInModule?: number | null;
  teachingLogId?: string | null;
  teachingLogStatus?: string | null;
  teachingProgressStatus?: string | null;
  actualTeachingType?: string | null;
};

export type SessionByIdResponse = {
  isSuccess: boolean;
  data: {
    session: SessionDetail;
  };
};

export type SessionListResponse = {
  isSuccess: boolean;
  data: {
    sessions: {
      items: SourceSession[];
      pageNumber: number;
      pageSize: number;
      totalCount: number;
    };
  };
};

export async function getSessionById(id: string): Promise<SessionByIdResponse> {
  return get<SessionByIdResponse>(SESSION_ENDPOINTS.GET_BY_ID(id));
}

export async function getAllSessions(params?: {
  classId?: string;
  branchId?: string;
  status?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<SessionListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.classId) queryParams.append('classId', params.classId);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.status) queryParams.append('status', params.status);
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  }

  const url = `${SESSION_ENDPOINTS.GET_ALL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<SessionListResponse>(url);
}

export async function getTeachingLog(sessionId: string): Promise<ApiResponse<TeachingLog>> {
  return get<ApiResponse<TeachingLog>>(SESSION_ENDPOINTS.TEACHING_LOG(sessionId));
}

export async function submitTeachingLog(
  sessionId: string,
  payload: SubmitTeachingLogRequest
): Promise<ApiResponse<SubmitTeachingLogResponse>> {
  return post<ApiResponse<SubmitTeachingLogResponse>>(
    SESSION_ENDPOINTS.TEACHING_LOG(sessionId),
    payload
  );
}

export async function updateTeachingLog(
  sessionId: string,
  payload: SubmitTeachingLogRequest
): Promise<ApiResponse<SubmitTeachingLogResponse>> {
  return put<ApiResponse<SubmitTeachingLogResponse>>(
    SESSION_ENDPOINTS.TEACHING_LOG(sessionId),
    payload
  );
}


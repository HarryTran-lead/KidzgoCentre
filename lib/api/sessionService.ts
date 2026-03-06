import { SESSION_ENDPOINTS, TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";

export type SourceSession = {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  branchName?: string;
  plannedDatetime?: string;
  actualDatetime?: string;
  durationMinutes?: number;
};

export type SessionByIdResponse = {
  isSuccess: boolean;
  data: {
    session: SourceSession;
  };
};

export type SessionListResponse = {
  isSuccess: boolean;
  data: {
    sessions: SourceSession[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
};

export async function getSessionById(id: string): Promise<SessionByIdResponse> {
  return get<SessionByIdResponse>(SESSION_ENDPOINTS.GET_BY_ID(id));
}

export async function getAllSessions(params?: {
  classId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<SessionListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.classId) queryParams.append('classId', params.classId);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  }

  const url = `${TEACHER_ENDPOINTS.SESSIONS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<SessionListResponse>(url);
}

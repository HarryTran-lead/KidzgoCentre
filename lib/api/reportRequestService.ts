import { REPORT_REQUEST_ENDPOINTS } from "@/constants/apiURL";
import { get, post } from "@/lib/axios";
import type {
  CreateReportRequestPayload,
  CompleteReportRequestPayload,
  ReportRequestListQuery,
  ReportRequestListResponse,
  ReportRequestDetailResponse,
} from "@/types/admin/reportRequest";

export async function getReportRequests(
  query?: ReportRequestListQuery
): Promise<ReportRequestListResponse> {
  const params = new URLSearchParams();
  if (query?.reportType) params.set("reportType", query.reportType);
  if (query?.status) params.set("status", query.status);
  if (query?.priority) params.set("priority", query.priority);
  if (query?.assignedTeacherUserId) params.set("assignedTeacherUserId", query.assignedTeacherUserId);
  if (query?.targetStudentProfileId) params.set("targetStudentProfileId", query.targetStudentProfileId);
  if (query?.targetClassId) params.set("targetClassId", query.targetClassId);
  if (query?.month) params.set("month", String(query.month));
  if (query?.year) params.set("year", String(query.year));
  params.set("pageNumber", String(query?.pageNumber ?? 1));
  params.set("pageSize", String(query?.pageSize ?? 20));

  const qs = params.toString();
  return get<ReportRequestListResponse>(`${REPORT_REQUEST_ENDPOINTS.BASE}?${qs}`);
}

export async function getReportRequestById(
  id: string
): Promise<ReportRequestDetailResponse> {
  return get<ReportRequestDetailResponse>(REPORT_REQUEST_ENDPOINTS.BY_ID(id));
}

export async function createReportRequest(
  payload: CreateReportRequestPayload
): Promise<ReportRequestDetailResponse> {
  return post<ReportRequestDetailResponse>(REPORT_REQUEST_ENDPOINTS.BASE, payload);
}

export async function completeReportRequest(
  id: string,
  payload?: CompleteReportRequestPayload
): Promise<ReportRequestDetailResponse> {
  return post<ReportRequestDetailResponse>(
    REPORT_REQUEST_ENDPOINTS.COMPLETE(id),
    payload ?? {}
  );
}

export async function cancelReportRequest(
  id: string
): Promise<ReportRequestDetailResponse> {
  return post<ReportRequestDetailResponse>(REPORT_REQUEST_ENDPOINTS.CANCEL(id), {});
}

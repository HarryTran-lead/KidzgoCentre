import { INCIDENT_REPORT_ENDPOINTS } from "@/constants/apiURL";
import { get, post, patch } from "@/lib/axios";
import type {
  CreateIncidentReportPayload,
  AddIncidentCommentPayload,
  AssignIncidentPayload,
  UpdateIncidentStatusPayload,
  IncidentReportListQuery,
  IncidentReportListResponse,
  IncidentReportDetailResponse,
  IncidentReportCommentResponse,
  IncidentReportStatisticsResponse,
} from "@/types/admin/incidentReport";

export async function getIncidentReports(
  query?: IncidentReportListQuery
): Promise<IncidentReportListResponse> {
  const params = new URLSearchParams();
  if (query?.branchId) params.set("branchId", query.branchId);
  if (query?.openedByUserId) params.set("openedByUserId", query.openedByUserId);
  if (query?.assignedToUserId) params.set("assignedToUserId", query.assignedToUserId);
  if (query?.classId) params.set("classId", query.classId);
  if (query?.category) params.set("category", query.category);
  if (query?.status) params.set("status", query.status);
  if (query?.keyword) params.set("keyword", query.keyword);
  if (query?.createdFrom) params.set("createdFrom", query.createdFrom);
  if (query?.createdTo) params.set("createdTo", query.createdTo);
  params.set("pageNumber", String(query?.pageNumber ?? 1));
  params.set("pageSize", String(query?.pageSize ?? 10));

  const qs = params.toString();
  return get<IncidentReportListResponse>(`${INCIDENT_REPORT_ENDPOINTS.BASE}?${qs}`);
}

export async function getIncidentReportById(
  id: string
): Promise<IncidentReportDetailResponse> {
  return get<IncidentReportDetailResponse>(INCIDENT_REPORT_ENDPOINTS.BY_ID(id));
}

export async function createIncidentReport(
  payload: CreateIncidentReportPayload
): Promise<IncidentReportDetailResponse> {
  return post<IncidentReportDetailResponse>(INCIDENT_REPORT_ENDPOINTS.BASE, payload);
}

export async function addIncidentComment(
  id: string,
  payload: AddIncidentCommentPayload
): Promise<IncidentReportCommentResponse> {
  return post<IncidentReportCommentResponse>(
    INCIDENT_REPORT_ENDPOINTS.COMMENTS(id),
    payload
  );
}

export async function assignIncidentReport(
  id: string,
  payload: AssignIncidentPayload
): Promise<{ isSuccess: boolean; data: import("@/types/admin/incidentReport").IncidentReportDto }> {
  return patch(INCIDENT_REPORT_ENDPOINTS.ASSIGN(id), payload);
}

export async function updateIncidentStatus(
  id: string,
  payload: UpdateIncidentStatusPayload
): Promise<{ isSuccess: boolean; data: import("@/types/admin/incidentReport").IncidentReportDto }> {
  return patch(INCIDENT_REPORT_ENDPOINTS.STATUS(id), payload);
}

export async function getIncidentStatistics(
  query?: Omit<IncidentReportListQuery, "pageNumber" | "pageSize">
): Promise<IncidentReportStatisticsResponse> {
  const params = new URLSearchParams();
  if (query?.branchId) params.set("branchId", query.branchId);
  if (query?.openedByUserId) params.set("openedByUserId", query.openedByUserId);
  if (query?.assignedToUserId) params.set("assignedToUserId", query.assignedToUserId);
  if (query?.classId) params.set("classId", query.classId);
  if (query?.category) params.set("category", query.category);
  if (query?.status) params.set("status", query.status);
  if (query?.keyword) params.set("keyword", query.keyword);
  if (query?.createdFrom) params.set("createdFrom", query.createdFrom);
  if (query?.createdTo) params.set("createdTo", query.createdTo);

  const qs = params.toString();
  const url = qs
    ? `${INCIDENT_REPORT_ENDPOINTS.STATISTICS}?${qs}`
    : INCIDENT_REPORT_ENDPOINTS.STATISTICS;
  return get<IncidentReportStatisticsResponse>(url);
}

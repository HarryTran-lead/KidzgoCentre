import { PARENT_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";

export type ParentPortalQuery = QueryParams;

export async function getParentOverview(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.OVERVIEW}${buildQueryString(params)}`);
}

export async function getParentInvoices(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.INVOICES}${buildQueryString(params)}`);
}

export async function getParentPayments(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.PAYMENTS}${buildQueryString(params)}`);
}

export async function getParentHomework(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.HOMEWORK}${buildQueryString(params)}`);
}

export async function getParentProgress(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.PROGRESS}${buildQueryString(params)}`);
}

export async function getParentMedia(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.MEDIA}${buildQueryString(params)}`);
}

export async function getParentApprovals(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.APPROVALS}${buildQueryString(params)}`);
}

export async function getParentTests(params?: ParentPortalQuery): Promise<any> {
  return get<any>(`${PARENT_ENDPOINTS.TESTS}${buildQueryString(params)}`);
}

export async function getParentTestById(id: string): Promise<any> {
  return get<any>(PARENT_ENDPOINTS.TEST_BY_ID(id));
}

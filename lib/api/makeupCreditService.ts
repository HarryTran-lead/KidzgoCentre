/**
 * Makeup Credit API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { MAKEUP_CREDIT_ENDPOINTS } from "@/constants/apiURL";
import { get, post } from "@/lib/axios";
import type {
  MakeupAllocationResponse,
  MakeupCredit,
  MakeupCreditsResponse,
  MakeupCreditResponse,
  MakeupCreditStudentsResponse,
  MakeupAllocationsResponse,
  MakeupSuggestionsResponse,
} from "@/types/makeupCredit";

export type UseMakeupCreditPayload = {
  studentProfileId?: string | null;
  classId: string;
  targetSessionId: string;
};

export async function getAllMakeupCredits(): Promise<MakeupCreditsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.GET_ALL ?? "/api/makeup-credits/all";
  return get<MakeupCreditsResponse>(endpoint);
}
export async function getMakeupCredits(params?: {
  studentProfileId?: string;
  status?: string;
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<MakeupCreditsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.GET_ALL ?? "/api/makeup-credits/all";
  const qs = new URLSearchParams();
  if (params?.studentProfileId) qs.set("studentProfileId", params.studentProfileId);
  if (params?.status) qs.set("status", params.status);
  if (params?.branchId) qs.set("branchId", params.branchId);
  if (params?.pageNumber) qs.set("pageNumber", String(params.pageNumber));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const url = qs.toString() ? `${endpoint}?${qs.toString()}` : endpoint;
  return get<MakeupCreditsResponse>(url);
}
export async function getMakeupCreditStudents(): Promise<MakeupCreditStudentsResponse> {
  const endpoint =
    MAKEUP_CREDIT_ENDPOINTS.STUDENTS ?? "/api/makeup-credits/students";
  return get<MakeupCreditStudentsResponse>(endpoint);
}

export async function getMakeupCreditsList(params: {
  studentProfileId: string;
  status?: string;
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<MakeupCreditsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.GET ?? "/api/makeup-credits";
  const qs = new URLSearchParams();
  qs.set("studentProfileId", params.studentProfileId);
  if (params.status) qs.set("status", params.status);
  if (params.branchId) qs.set("branchId", params.branchId);
  if (params.pageNumber) qs.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const url = `${endpoint}?${qs.toString()}`;
  return get<MakeupCreditsResponse>(url);
}

export async function getMakeupCreditsByStudent(
  studentProfileId: string
): Promise<MakeupCreditsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.GET_ALL ?? "/api/makeup-credits/all";
  const url = `${endpoint}?studentProfileId=${encodeURIComponent(studentProfileId)}`;
  return get<MakeupCreditsResponse>(url);
}

export async function getMakeupCreditById(
  creditId: string
): Promise<MakeupCreditResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.GET_BY_ID
    ? MAKEUP_CREDIT_ENDPOINTS.GET_BY_ID(creditId)
    : `/api/makeup-credits/${creditId}`;
  return get<MakeupCreditResponse>(endpoint);
}
export async function getMakeupCreditSuggestions(
  makeupCreditId: string,
  params?: { makeupDate?: string; timeOfDay?: string }
) {
  const qs = new URLSearchParams();
  if (params?.makeupDate) qs.set("makeupDate", params.makeupDate);
  if (params?.timeOfDay) qs.set("timeOfDay", params.timeOfDay);

  const url =
    qs.toString().length > 0
      ? `/api/makeup-credits/${makeupCreditId}/suggestions?${qs.toString()}`
      : `/api/makeup-credits/${makeupCreditId}/suggestions`;

  return get(url);
}

export async function getMakeupCreditAvailableSessions(
  makeupCreditId: string,
  params?: { fromDate?: string; toDate?: string; timeOfDay?: string }
) {
  const qs = new URLSearchParams();
  if (params?.fromDate) qs.set("fromDate", params.fromDate);
  if (params?.toDate) qs.set("toDate", params.toDate);
  if (params?.timeOfDay) qs.set("timeOfDay", params.timeOfDay);

  const endpoint = MAKEUP_CREDIT_ENDPOINTS.AVAILABLE_SESSIONS
    ? MAKEUP_CREDIT_ENDPOINTS.AVAILABLE_SESSIONS(makeupCreditId)
    : `/api/makeup-credits/${makeupCreditId}/parent/get-available-sessions`;

  const url = qs.toString().length > 0 ? `${endpoint}?${qs.toString()}` : endpoint;
  return get<MakeupSuggestionsResponse>(url);
}

export async function useMakeupCredit(
  creditId: string,
  payload: UseMakeupCreditPayload
): Promise<MakeupAllocationResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.USE
    ? MAKEUP_CREDIT_ENDPOINTS.USE(creditId)
    : `/api/makeup-credits/${creditId}/use`;
  return post<MakeupAllocationResponse>(endpoint, payload);
}

export async function expireMakeupCredit(
  creditId: string,
  payload?: { expiresAt?: string | null }
): Promise<MakeupCreditResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.EXPIRE
    ? MAKEUP_CREDIT_ENDPOINTS.EXPIRE(creditId)
    : `/api/makeup-credits/${creditId}/expire`;
  return post<MakeupCreditResponse>(endpoint, payload ?? {});
}

export async function getMakeupAllocations(params: {
  studentProfileId: string;
}): Promise<MakeupAllocationsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.ALLOCATIONS ?? "/api/makeup-credits/allocations";
  const url = `${endpoint}?studentProfileId=${encodeURIComponent(params.studentProfileId)}`;
  return get<MakeupAllocationsResponse>(url);
}


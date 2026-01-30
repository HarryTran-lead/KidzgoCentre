/**
 * Makeup Credit API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { MAKEUP_CREDIT_ENDPOINTS } from "@/constants/apiURL";
import { get, post } from "@/lib/axios";
import type {
      MakeupCredit,
  MakeupCreditsResponse,
  MakeupCreditResponse,
  MakeupCreditStudentsResponse,
  MakeupSuggestionsResponse,

} from "@/types/makeupCredit";

export type UseMakeupCreditPayload = {
  classId: string;
  targetSessionId: string;
  date?: string;
  time?: string;
  note?: string;
};

export async function getAllMakeupCredits(): Promise<MakeupCreditsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.GET_ALL ?? "/api/makeup-credits/all";
  return get<MakeupCreditsResponse>(endpoint);
}
export async function getMakeupCreditStudents(): Promise<MakeupCreditStudentsResponse> {
  const endpoint =
    MAKEUP_CREDIT_ENDPOINTS.STUDENTS ?? "/api/makeup-credits/students";
  return get<MakeupCreditStudentsResponse>(endpoint);
}

export async function getMakeupCreditsByStudent(
  studentId: string
): Promise<MakeupCreditsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.GET_ALL ?? "/api/makeup-credits/all";
  const url = `${endpoint}?studentId=${encodeURIComponent(studentId)}`;
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

export async function useMakeupCredit(
  creditId: string,
  payload: UseMakeupCreditPayload
): Promise<MakeupSuggestionsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.USE
    ? MAKEUP_CREDIT_ENDPOINTS.USE(creditId)
    : `/api/makeup-credits/${creditId}/use`;
  return post<MakeupSuggestionsResponse>(endpoint, payload);
}


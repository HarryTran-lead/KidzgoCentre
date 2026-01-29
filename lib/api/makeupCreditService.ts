/**
 * Makeup Credit API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { MAKEUP_CREDIT_ENDPOINTS } from "@/constants/apiURL";
import { get, post } from "@/lib/axios";
import type {
  MakeupCreditsResponse,
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

export async function getMakeupCreditSuggestions(
  creditId: string
): Promise<MakeupSuggestionsResponse> {
  const endpoint = MAKEUP_CREDIT_ENDPOINTS.SUGGESTIONS
    ? MAKEUP_CREDIT_ENDPOINTS.SUGGESTIONS(creditId)
    : `/api/makeup-credits/${creditId}/suggestions`;
  return get<MakeupSuggestionsResponse>(endpoint);
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
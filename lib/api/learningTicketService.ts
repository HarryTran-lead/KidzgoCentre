import { get } from "@/lib/axios";
import { LEARNING_TICKET_ENDPOINTS } from "@/constants/apiURL";
import type {
  LearningTicketBalance,
  LearningTicketLedgerResponse,
  CompatibleTicketCheckResponse,
} from "@/types/learning-ticket";

export async function getTicketBalance(studentProfileId: string): Promise<LearningTicketBalance> {
  const url = LEARNING_TICKET_ENDPOINTS.BALANCE(studentProfileId);
  const res = await get<{ data?: LearningTicketBalance } | LearningTicketBalance>(url);
  // Support both wrapped { data: ... } and direct payload patterns
  const data = (res as any)?.data ?? res;
  return data as LearningTicketBalance;
}

export async function getTicketLedger(studentProfileId: string): Promise<LearningTicketLedgerResponse> {
  const url = LEARNING_TICKET_ENDPOINTS.LEDGER(studentProfileId);
  const res = await get<{ data?: LearningTicketLedgerResponse } | LearningTicketLedgerResponse>(url);
  const data = (res as any)?.data ?? res;
  return data as LearningTicketLedgerResponse;
}

export async function getCompatibleTicketForSession(
  studentProfileId: string,
  sessionId: string
): Promise<CompatibleTicketCheckResponse> {
  const url = `${LEARNING_TICKET_ENDPOINTS.COMPATIBLE(studentProfileId)}?sessionId=${sessionId}`;
  const res = await get<any>(url);
  const data = (res as any)?.data ?? res;
  return {
    compatible: Boolean(data?.compatible),
    ticketItemId: data?.ticketItemId ?? null,
    ticketTypeId: data?.ticketTypeId ?? null,
    ticketTypeCode: data?.ticketTypeCode ?? null,
    reason: String(data?.reason ?? ""),
  };
}

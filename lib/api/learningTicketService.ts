import { get } from "@/lib/axios";
import { LEARNING_TICKET_ENDPOINTS } from "@/constants/apiURL";
import type {
  CompatibleLearningTicketsResponse,
  LearningTicketBalance,
  LearningTicketLedgerResponse,
  CompatibleTicketCheckResponse,
} from "@/types/learning-ticket";

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}

function unwrapApiData(payload: unknown): unknown {
  let current = payload;
  for (let index = 0; index < 4; index += 1) {
    if (isRecord(current) && "data" in current && current.data !== undefined) {
      current = current.data;
      continue;
    }
    break;
  }
  return current;
}

function pickItems(payload: unknown): unknown[] {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.compatibleTickets)) return data.compatibleTickets;
  if (Array.isArray(data.tickets)) return data.tickets;
  return [];
}

function nullableString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function getTicketBalance(studentProfileId: string): Promise<LearningTicketBalance> {
  const url = LEARNING_TICKET_ENDPOINTS.BALANCE(studentProfileId);
  const res = await get<{ data?: LearningTicketBalance } | LearningTicketBalance>(url);
  const data = unwrapApiData(res);
  return data as LearningTicketBalance;
}

export async function getTicketLedger(studentProfileId: string): Promise<LearningTicketLedgerResponse> {
  const url = LEARNING_TICKET_ENDPOINTS.LEDGER(studentProfileId);
  const res = await get<{ data?: LearningTicketLedgerResponse } | LearningTicketLedgerResponse>(url);
  const data = unwrapApiData(res);
  return { items: pickItems(data) as LearningTicketLedgerResponse["items"] };
}

export async function getCompatibleTicketForSession(
  studentProfileId: string,
  sessionId: string
): Promise<CompatibleTicketCheckResponse> {
  const url = `${LEARNING_TICKET_ENDPOINTS.COMPATIBLE(studentProfileId)}?sessionId=${encodeURIComponent(sessionId)}`;
  const res = await get<unknown>(url);
  const data = unwrapApiData(res);
  const record = isRecord(data) ? data : {};
  return {
    compatible: Boolean(record.compatible),
    ticketItemId: nullableString(record.ticketItemId),
    ticketTypeId: nullableString(record.ticketTypeId),
    ticketTypeCode: nullableString(record.ticketTypeCode),
    reason: String(record.reason ?? ""),
  };
}

export async function getCompatibleTicketsForStudent(
  studentProfileId: string,
): Promise<CompatibleLearningTicketsResponse> {
  const url = LEARNING_TICKET_ENDPOINTS.COMPATIBLE_TICKETS(studentProfileId);
  const res = await get<unknown>(url);
  return { items: pickItems(res) as CompatibleLearningTicketsResponse["items"] };
}

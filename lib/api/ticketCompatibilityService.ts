import { get, post, put, del } from "@/lib/axios";
import { TICKET_TYPE_COMPATIBILITY_ENDPOINTS, LEARNING_TICKET_ENDPOINTS } from "@/constants/apiURL";
import type {
  TicketTypeCompatibility,
  CreateTicketTypeCompatibilityRequest,
  UpdateTicketTypeCompatibilityRequest,
} from "@/types/ticket-type-compatibility";
import type { CompatibleTicketCheckResponse } from "@/types/learning-ticket";

function pickItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function mapItem(item: any): TicketTypeCompatibility {
  return {
    id: String(item?.id ?? ""),
    learningTicketTypeId: String(item?.learningTicketTypeId ?? ""),
    learningTicketTypeCode: item?.learningTicketTypeCode ?? null,
    learningTicketTypeName: item?.learningTicketTypeName ?? null,
    slotTypeId: String(item?.slotTypeId ?? ""),
    slotTypeCode: item?.slotTypeCode ?? null,
    slotTypeName: item?.slotTypeName ?? null,
    isCompatible: Boolean(item?.isCompatible),
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
  };
}

export async function getTicketTypeCompatibilities(options?: {
  learningTicketTypeId?: string;
  slotTypeId?: string;
}): Promise<TicketTypeCompatibility[]> {
  const params = new URLSearchParams();
  if (options?.learningTicketTypeId) params.set("learningTicketTypeId", options.learningTicketTypeId);
  if (options?.slotTypeId) params.set("slotTypeId", options.slotTypeId);
  const url = params.toString()
    ? `${TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BASE}?${params.toString()}`
    : TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BASE;
  const response = await get<any>(url);
  return pickItems(response).map(mapItem).filter((x) => x.id);
}

export async function getTicketTypeCompatibilityById(id: string): Promise<TicketTypeCompatibility> {
  const response = await get<any>(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BY_ID(id));
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function createTicketTypeCompatibility(
  payload: CreateTicketTypeCompatibilityRequest
): Promise<TicketTypeCompatibility> {
  const response = await post<any>(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BASE, payload);
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function updateTicketTypeCompatibility(
  id: string,
  payload: UpdateTicketTypeCompatibilityRequest
): Promise<TicketTypeCompatibility> {
  const response = await put<any>(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BY_ID(id), payload);
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function deleteTicketTypeCompatibility(id: string): Promise<void> {
  await del(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BY_ID(id));
}

export async function getCompatibleTicket(
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

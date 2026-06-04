import { get, post, put, del } from "@/lib/axios";
import { TICKET_TYPE_COMPATIBILITY_ENDPOINTS, LEARNING_TICKET_ENDPOINTS } from "@/constants/apiURL";
import type {
  BulkOverrideRequest,
  TicketTypeCompatibility,
  TicketCompatibilityMatrix,
  CreateTicketTypeCompatibilityRequest,
  UpdateTicketTypeCompatibilityRequest,
} from "@/types/ticket-type-compatibility";
import type { CompatibleTicketCheckResponse } from "@/types/learning-ticket";

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function pickItems(payload: unknown): unknown[] {
  const root = toRecord(payload);
  const data = root.data;
  const dataRecord = toRecord(data);

  if (Array.isArray(dataRecord.items)) return dataRecord.items;
  if (Array.isArray(data)) return data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function mapItem(item: unknown): TicketTypeCompatibility {
  const record = toRecord(item);
  return {
    id: String(record.id ?? ""),
    learningTicketTypeId: String(record.learningTicketTypeId ?? ""),
    learningTicketTypeCode: (record.learningTicketTypeCode as string | null | undefined) ?? null,
    learningTicketTypeName: (record.learningTicketTypeName as string | null | undefined) ?? null,
    slotTypeId: String(record.slotTypeId ?? ""),
    slotTypeCode: (record.slotTypeCode as string | null | undefined) ?? null,
    slotTypeName: (record.slotTypeName as string | null | undefined) ?? null,
    isCompatible: Boolean(record.isCompatible),
    createdAt: (record.createdAt as string | null | undefined) ?? null,
    updatedAt: (record.updatedAt as string | null | undefined) ?? null,
  };
}

function mapMatrix(payload: unknown): TicketCompatibilityMatrix {
  const root = toRecord(payload);
  const data = toRecord(root.data ?? payload);
  return {
    learningTicketTypes: Array.isArray(data.learningTicketTypes)
      ? (data.learningTicketTypes as TicketCompatibilityMatrix["learningTicketTypes"])
      : [],
    slotTypes: Array.isArray(data.slotTypes)
      ? (data.slotTypes as TicketCompatibilityMatrix["slotTypes"])
      : [],
    cells: Array.isArray(data.cells)
      ? (data.cells as TicketCompatibilityMatrix["cells"])
      : [],
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
  const response = await get<unknown>(url);
  return pickItems(response).map(mapItem).filter((x) => x.id);
}

export async function getTicketTypeCompatibilityById(id: string): Promise<TicketTypeCompatibility> {
  const response = await get<unknown>(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BY_ID(id));
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function createTicketTypeCompatibility(
  payload: CreateTicketTypeCompatibilityRequest
): Promise<TicketTypeCompatibility> {
  const response = await post<unknown>(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BASE, payload);
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function updateTicketTypeCompatibility(
  id: string,
  payload: UpdateTicketTypeCompatibilityRequest
): Promise<TicketTypeCompatibility> {
  const response = await put<unknown>(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BY_ID(id), payload);
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function deleteTicketTypeCompatibility(id: string): Promise<void> {
  await del(TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BY_ID(id));
}

export async function getTicketTypeCompatibilityMatrix(options?: {
  learningTicketTypeId?: string;
  onlyActive?: boolean;
}): Promise<TicketCompatibilityMatrix> {
  const params = new URLSearchParams();
  if (options?.learningTicketTypeId) {
    params.set("learningTicketTypeId", options.learningTicketTypeId);
  }
  if (options?.onlyActive !== undefined) {
    params.set("onlyActive", String(options.onlyActive));
  }

  const url = params.toString()
    ? `${TICKET_TYPE_COMPATIBILITY_ENDPOINTS.MATRIX}?${params.toString()}`
    : TICKET_TYPE_COMPATIBILITY_ENDPOINTS.MATRIX;
  const response = await get<unknown>(url);
  return mapMatrix(response);
}

export async function bulkUpsertTicketTypeOverrides(
  learningTicketTypeId: string,
  payload: BulkOverrideRequest
): Promise<void> {
  await put(
    TICKET_TYPE_COMPATIBILITY_ENDPOINTS.BULK_OVERRIDES(learningTicketTypeId),
    payload
  );
}

export async function getCompatibleTicket(
  studentProfileId: string,
  sessionId: string
): Promise<CompatibleTicketCheckResponse> {
  const url = `${LEARNING_TICKET_ENDPOINTS.COMPATIBLE(studentProfileId)}?sessionId=${sessionId}`;
  const res = await get<unknown>(url);
  const resRecord = toRecord(res);
  const data = toRecord(resRecord.data ?? res);
  return {
    compatible: Boolean(data.compatible),
    ticketItemId: (data.ticketItemId as string | null | undefined) ?? null,
    ticketTypeId: (data.ticketTypeId as string | null | undefined) ?? null,
    ticketTypeCode: (data.ticketTypeCode as string | null | undefined) ?? null,
    reason: String(data.reason ?? ""),
  };
}

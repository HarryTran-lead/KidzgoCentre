import { get, post, put, del } from "@/lib/axios";
import {
  LEARNING_TICKET_TYPE_ENDPOINTS,
} from "@/constants/apiURL";
import type {
  LearningTicketType,
  CreateLearningTicketTypeRequest,
  UpdateLearningTicketTypeRequest,
} from "@/types/learning-ticket-type";

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

function mapItem(item: unknown): LearningTicketType {
  const record = toRecord(item);
  return {
    id: String(record.id ?? ""),
    code: String(record.code ?? ""),
    name: String(record.name ?? ""),
    description: (record.description as string | null | undefined) ?? null,
    compatibilityMode: record.compatibilityMode === "RuleBased" ? "RuleBased" : "AllowAll",
    allowedDayGroups: Array.isArray(record.allowedDayGroups) ? record.allowedDayGroups as LearningTicketType["allowedDayGroups"] : [],
    allowedTimeBands: Array.isArray(record.allowedTimeBands) ? record.allowedTimeBands as LearningTicketType["allowedTimeBands"] : [],
    allowedTeacherTypes: Array.isArray(record.allowedTeacherTypes) ? record.allowedTeacherTypes as LearningTicketType["allowedTeacherTypes"] : [],
    allowedUsageTypes: Array.isArray(record.allowedUsageTypes) ? record.allowedUsageTypes as LearningTicketType["allowedUsageTypes"] : [],
    isActive: Boolean(record.isActive ?? true),
    createdAt: (record.createdAt as string | null | undefined) ?? null,
    updatedAt: (record.updatedAt as string | null | undefined) ?? null,
  };
}

export async function getLearningTicketTypes(options?: {
  searchTerm?: string;
  isActive?: boolean;
}): Promise<LearningTicketType[]> {
  const params = new URLSearchParams();
  if (options?.searchTerm) params.set("searchTerm", options.searchTerm);
  if (options?.isActive !== undefined) params.set("isActive", String(options.isActive));
  const url = params.toString()
    ? `${LEARNING_TICKET_TYPE_ENDPOINTS.BASE}?${params.toString()}`
    : LEARNING_TICKET_TYPE_ENDPOINTS.BASE;
  const response = await get<unknown>(url);
  return pickItems(response).map(mapItem).filter((x) => x.id);
}

export async function getLearningTicketTypeById(id: string): Promise<LearningTicketType> {
  const response = await get<unknown>(LEARNING_TICKET_TYPE_ENDPOINTS.BY_ID(id));
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function createLearningTicketType(
  payload: CreateLearningTicketTypeRequest
): Promise<LearningTicketType> {
  const response = await post<unknown>(LEARNING_TICKET_TYPE_ENDPOINTS.BASE, payload);
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function updateLearningTicketType(
  id: string,
  payload: UpdateLearningTicketTypeRequest
): Promise<LearningTicketType> {
  const response = await put<unknown>(LEARNING_TICKET_TYPE_ENDPOINTS.BY_ID(id), payload);
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function deleteLearningTicketType(id: string): Promise<void> {
  await del(LEARNING_TICKET_TYPE_ENDPOINTS.BY_ID(id));
}

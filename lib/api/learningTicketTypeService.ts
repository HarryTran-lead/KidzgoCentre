import { get, post, put, del } from "@/lib/axios";
import {
  LEARNING_TICKET_TYPE_ENDPOINTS,
} from "@/constants/apiURL";
import type {
  LearningTicketType,
  CreateLearningTicketTypeRequest,
  UpdateLearningTicketTypeRequest,
} from "@/types/learning-ticket-type";

function pickItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function mapItem(item: any): LearningTicketType {
  return {
    id: String(item?.id ?? ""),
    code: String(item?.code ?? ""),
    name: String(item?.name ?? ""),
    description: item?.description ?? null,
    isActive: Boolean(item?.isActive ?? true),
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
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
  const response = await get<any>(url);
  return pickItems(response).map(mapItem).filter((x) => x.id);
}

export async function getLearningTicketTypeById(id: string): Promise<LearningTicketType> {
  const response = await get<any>(LEARNING_TICKET_TYPE_ENDPOINTS.BY_ID(id));
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function createLearningTicketType(
  payload: CreateLearningTicketTypeRequest
): Promise<LearningTicketType> {
  const response = await post<any>(LEARNING_TICKET_TYPE_ENDPOINTS.BASE, payload);
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function updateLearningTicketType(
  id: string,
  payload: UpdateLearningTicketTypeRequest
): Promise<LearningTicketType> {
  const response = await put<any>(LEARNING_TICKET_TYPE_ENDPOINTS.BY_ID(id), payload);
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function deleteLearningTicketType(id: string): Promise<void> {
  await del(LEARNING_TICKET_TYPE_ENDPOINTS.BY_ID(id));
}

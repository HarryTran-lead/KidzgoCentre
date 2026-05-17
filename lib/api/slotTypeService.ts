import { get, post, put, del } from "@/lib/axios";
import { SLOT_TYPE_ENDPOINTS } from "@/constants/apiURL";
import type {
  SlotType,
  CreateSlotTypeRequest,
  UpdateSlotTypeRequest,
} from "@/types/slot-type";

function pickItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function mapItem(item: any): SlotType {
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

export async function getSlotTypes(options?: {
  searchTerm?: string;
  isActive?: boolean;
}): Promise<SlotType[]> {
  const params = new URLSearchParams();
  if (options?.searchTerm) params.set("searchTerm", options.searchTerm);
  if (options?.isActive !== undefined) params.set("isActive", String(options.isActive));
  const url = params.toString()
    ? `${SLOT_TYPE_ENDPOINTS.BASE}?${params.toString()}`
    : SLOT_TYPE_ENDPOINTS.BASE;
  const response = await get<any>(url);
  return pickItems(response).map(mapItem).filter((x) => x.id);
}

export async function getSlotTypeById(id: string): Promise<SlotType> {
  const response = await get<any>(SLOT_TYPE_ENDPOINTS.BY_ID(id));
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function createSlotType(payload: CreateSlotTypeRequest): Promise<SlotType> {
  const response = await post<any>(SLOT_TYPE_ENDPOINTS.BASE, payload);
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function updateSlotType(
  id: string,
  payload: UpdateSlotTypeRequest
): Promise<SlotType> {
  const response = await put<any>(SLOT_TYPE_ENDPOINTS.BY_ID(id), payload);
  const data = response?.data ?? response;
  return mapItem(data);
}

export async function deleteSlotType(id: string): Promise<void> {
  await del(SLOT_TYPE_ENDPOINTS.BY_ID(id));
}

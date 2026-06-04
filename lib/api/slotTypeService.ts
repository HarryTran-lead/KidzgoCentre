import { get, post, put, del } from "@/lib/axios";
import { SLOT_TYPE_ENDPOINTS } from "@/constants/apiURL";
import type {
  SlotType,
  CreateSlotTypeRequest,
  UpdateSlotTypeRequest,
} from "@/types/slot-type";

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

function mapItem(item: unknown): SlotType {
  const record = toRecord(item);
  return {
    id: String(record.id ?? ""),
    code: String(record.code ?? ""),
    name: String(record.name ?? ""),
    description: (record.description as string | null | undefined) ?? null,
    dayGroup: (record.dayGroup as SlotType["dayGroup"] | undefined) ?? "None",
    timeBand: (record.timeBand as SlotType["timeBand"] | undefined) ?? "None",
    teacherType: (record.teacherType as SlotType["teacherType"] | undefined) ?? "None",
    usageType: (record.usageType as SlotType["usageType"] | undefined) ?? "None",
    isActive: Boolean(record.isActive ?? true),
    createdAt: (record.createdAt as string | null | undefined) ?? null,
    updatedAt: (record.updatedAt as string | null | undefined) ?? null,
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
  const response = await get<unknown>(url);
  return pickItems(response).map(mapItem).filter((x) => x.id);
}

export async function getSlotTypeById(id: string): Promise<SlotType> {
  const response = await get<unknown>(SLOT_TYPE_ENDPOINTS.BY_ID(id));
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function createSlotType(payload: CreateSlotTypeRequest): Promise<SlotType> {
  const response = await post<unknown>(SLOT_TYPE_ENDPOINTS.BASE, payload);
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function updateSlotType(
  id: string,
  payload: UpdateSlotTypeRequest
): Promise<SlotType> {
  const response = await put<unknown>(SLOT_TYPE_ENDPOINTS.BY_ID(id), payload);
  const responseRecord = toRecord(response);
  const data = responseRecord.data ?? response;
  return mapItem(data);
}

export async function deleteSlotType(id: string): Promise<void> {
  await del(SLOT_TYPE_ENDPOINTS.BY_ID(id));
}

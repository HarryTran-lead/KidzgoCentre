import { HOLIDAY_ENDPOINTS } from "@/constants/apiURL";
import { del, get, patch, post, put } from "@/lib/axios";
import type {
  HolidayDeleteResponse,
  HolidayResponse,
  HolidaysResponse,
  HolidayUpsertPayload,
} from "@/types/holiday";

export async function getHolidays(params?: {
  isActive?: boolean;
  from?: string;
  to?: string;
}): Promise<HolidaysResponse> {
  const qs = new URLSearchParams();
  if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);

  const endpoint = HOLIDAY_ENDPOINTS.GET_ALL;
  const url = qs.toString() ? `${endpoint}?${qs.toString()}` : endpoint;
  return get<HolidaysResponse>(url);
}

export async function getHolidayById(id: string): Promise<HolidayResponse> {
  return get<HolidayResponse>(HOLIDAY_ENDPOINTS.GET_BY_ID(id));
}

export async function createHoliday(payload: HolidayUpsertPayload): Promise<HolidayResponse> {
  return post<HolidayResponse>(HOLIDAY_ENDPOINTS.CREATE, payload);
}

export async function updateHoliday(
  id: string,
  payload: HolidayUpsertPayload
): Promise<HolidayResponse> {
  return put<HolidayResponse>(HOLIDAY_ENDPOINTS.UPDATE(id), payload);
}

export async function toggleHolidayStatus(id: string): Promise<HolidayResponse> {
  return patch<HolidayResponse>(HOLIDAY_ENDPOINTS.TOGGLE_STATUS(id), {});
}

export async function deleteHoliday(id: string): Promise<HolidayDeleteResponse> {
  return del<HolidayDeleteResponse>(HOLIDAY_ENDPOINTS.DELETE(id));
}
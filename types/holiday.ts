import type { ApiResponse, ListData } from "./apiResponse";

export type Holiday = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

export type HolidayUpsertPayload = {
  name: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  isActive: boolean;
};

export type HolidayDeleteResult = {
  id: string;
  deleted: boolean;
};

export type HolidaysResponse = ApiResponse<ListData<Holiday>>;
export type HolidayResponse = ApiResponse<Holiday>;
export type HolidayDeleteResponse = ApiResponse<HolidayDeleteResult>;
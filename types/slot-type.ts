export type SlotDayGroup = 'None' | 'Weekday' | 'Weekend';
export type SlotTimeBand = 'None' | 'Morning' | 'Afternoon' | 'Evening';
export type SlotTeacherType = 'None' | 'Standard' | 'Native';
export type SlotUsageType = 'None' | 'Standard' | 'Makeup' | 'Remedial' | 'Review' | 'Custom';

export interface SlotType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  dayGroup: SlotDayGroup;
  timeBand: SlotTimeBand;
  teacherType: SlotTeacherType;
  usageType: SlotUsageType;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SlotTypeQueryParams {
  searchTerm?: string;
  isActive?: boolean;
}

export interface CreateSlotTypeRequest {
  code: string;
  name: string;
  description?: string | null;
  dayGroup: SlotDayGroup;
  timeBand: SlotTimeBand;
  teacherType: SlotTeacherType;
  usageType: SlotUsageType;
  isActive: boolean;
}

export type UpdateSlotTypeRequest = CreateSlotTypeRequest;
export type SlotTypePayload = CreateSlotTypeRequest;
export type CreateSlotTypePayload = CreateSlotTypeRequest;
export type UpdateSlotTypePayload = UpdateSlotTypeRequest;
export type SlotTypeCreateRequest = CreateSlotTypeRequest;
export type SlotTypeUpdateRequest = UpdateSlotTypeRequest;
export type SlotTypeCreatePayload = CreateSlotTypeRequest;
export type SlotTypeUpdatePayload = UpdateSlotTypeRequest;

export interface SlotTypesResponse {
  items: SlotType[];
}

export type SlotTypeListResponse = SlotTypesResponse;
export type SlotTypesListResponse = SlotTypesResponse;

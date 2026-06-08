import type { LearningTicketType, TicketCompatibilityMode } from './learning-ticket-type';
import type { SlotDayGroup, SlotTeacherType, SlotTimeBand, SlotType, SlotUsageType } from './slot-type';

export type MatrixCellSource =
  | 'OverrideAllow'
  | 'OverrideDeny'
  | 'AllowAll'
  | 'Rule'
  | 'None'
  | 'NoTicketType'
  | 'NoSlotType';

export interface TicketTypeCompatibility {
  id: string;
  learningTicketTypeId: string;
  learningTicketTypeCode?: string | null;
  learningTicketTypeName?: string | null;
  slotTypeId: string;
  slotTypeCode?: string | null;
  slotTypeName?: string | null;
  isCompatible: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TicketTypeCompatibilityQueryParams {
  learningTicketTypeId?: string;
  slotTypeId?: string;
}

export interface CreateTicketTypeCompatibilityRequest {
  learningTicketTypeId: string;
  slotTypeId: string;
  isCompatible: boolean;
}

export type CreateTicketTypeCompatibilityPayload = CreateTicketTypeCompatibilityRequest;

export interface UpdateTicketTypeCompatibilityRequest {
  learningTicketTypeId?: string;
  slotTypeId?: string;
  isCompatible: boolean;
}

export type UpdateTicketTypeCompatibilityPayload = UpdateTicketTypeCompatibilityRequest;

export interface TicketTypeCompatibilitiesResponse {
  items: TicketTypeCompatibility[];
}

export type TicketTypeCompatibilityListResponse = TicketTypeCompatibilitiesResponse;
export type TicketTypeCompatibilitiesListResponse = TicketTypeCompatibilitiesResponse;

export interface CompatibilityMatrixLearningTicketType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  compatibilityMode: TicketCompatibilityMode;
  allowedDayGroups?: SlotDayGroup[];
  allowedTimeBands?: SlotTimeBand[];
  allowedTeacherTypes?: SlotTeacherType[];
  allowedUsageTypes?: SlotUsageType[];
  isActive: boolean;
}

export interface CompatibilityMatrixSlotType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  dayGroup: SlotDayGroup;
  timeBand: SlotTimeBand;
  teacherType: SlotTeacherType;
  usageType: SlotUsageType;
  isActive: boolean;
}

export interface CompatibilityMatrixCell {
  learningTicketTypeId: string;
  slotTypeId: string;
  isCompatible: boolean;
  source: MatrixCellSource;
  reason?: string | null;
  overrideValue?: boolean | null;
  overrideIsCompatible?: boolean | null;
}

export interface TicketTypeCompatibilityMatrix {
  learningTicketTypes: CompatibilityMatrixLearningTicketType[];
  slotTypes: CompatibilityMatrixSlotType[];
  cells: CompatibilityMatrixCell[];
}

export type CompatibilityMatrix = TicketTypeCompatibilityMatrix;
export type TicketCompatibilityMatrix = TicketTypeCompatibilityMatrix;
export type TicketTypeCompatibilityMatrixCell = CompatibilityMatrixCell;
export type TicketCompatibilityMatrixCell = CompatibilityMatrixCell;
export type TicketTypeCompatibilityMatrixResponse = TicketTypeCompatibilityMatrix;
export type TicketCompatibilityMatrixResponse = TicketTypeCompatibilityMatrix;

export interface GetTicketTypeCompatibilityMatrixParams {
  learningTicketTypeId?: string;
  onlyActive?: boolean;
}

export interface TicketTypeCompatibilityOverrideItem {
  slotTypeId: string;
  isCompatible: boolean | null;
}

export interface BulkUpsertTicketTypeCompatibilityOverridesRequest {
  items: TicketTypeCompatibilityOverrideItem[];
}

export type BulkUpsertTicketTypeCompatibilityOverrideRequest = BulkUpsertTicketTypeCompatibilityOverridesRequest;
export type BulkOverrideTicketTypeCompatibilityRequest = BulkUpsertTicketTypeCompatibilityOverridesRequest;
export type TicketTypeCompatibilityBulkOverrideRequest = BulkUpsertTicketTypeCompatibilityOverridesRequest;
export type BulkUpsertOverridesRequest = BulkUpsertTicketTypeCompatibilityOverridesRequest;
export type BulkOverrideRequest = BulkUpsertTicketTypeCompatibilityOverridesRequest;
export type UpsertTicketTypeCompatibilityOverridesRequest = BulkUpsertTicketTypeCompatibilityOverridesRequest;

export interface TicketTypeCompatibilityBulkOverrideResponse {
  learningTicketType?: LearningTicketType;
  slotTypes?: SlotType[];
  items?: TicketTypeCompatibility[];
}

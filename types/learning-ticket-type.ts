import type { SlotDayGroup, SlotTeacherType, SlotTimeBand, SlotUsageType } from './slot-type';

export type TicketCompatibilityMode = 'AllowAll' | 'RuleBased';

export interface LearningTicketType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  compatibilityMode: TicketCompatibilityMode;
  allowedDayGroups: SlotDayGroup[];
  allowedTimeBands: SlotTimeBand[];
  allowedTeacherTypes: SlotTeacherType[];
  allowedUsageTypes: SlotUsageType[];
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LearningTicketTypeQueryParams {
  searchTerm?: string;
  isActive?: boolean;
}

export interface CreateLearningTicketTypeRequest {
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

export type UpdateLearningTicketTypeRequest = CreateLearningTicketTypeRequest;
export type LearningTicketTypePayload = CreateLearningTicketTypeRequest;
export type CreateLearningTicketTypePayload = CreateLearningTicketTypeRequest;
export type UpdateLearningTicketTypePayload = UpdateLearningTicketTypeRequest;
export type LearningTicketTypeCreateRequest = CreateLearningTicketTypeRequest;
export type LearningTicketTypeUpdateRequest = UpdateLearningTicketTypeRequest;
export type LearningTicketTypeCreatePayload = CreateLearningTicketTypeRequest;
export type LearningTicketTypeUpdatePayload = UpdateLearningTicketTypeRequest;

export interface LearningTicketTypesResponse {
  items: LearningTicketType[];
}

export type LearningTicketTypeListResponse = LearningTicketTypesResponse;
export type LearningTicketTypesListResponse = LearningTicketTypesResponse;

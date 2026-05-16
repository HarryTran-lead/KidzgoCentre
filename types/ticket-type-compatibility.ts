/** Phase 1.5 — TicketTypeCompatibility types */

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

export interface CreateTicketTypeCompatibilityRequest {
  learningTicketTypeId: string;
  slotTypeId: string;
  isCompatible: boolean;
}

export interface UpdateTicketTypeCompatibilityRequest {
  learningTicketTypeId: string;
  slotTypeId: string;
  isCompatible: boolean;
}

export interface TicketTypeCompatibilityListResponse {
  items: TicketTypeCompatibility[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

/** Response for compatible ticket check */
export interface CompatibleTicketResponse {
  compatible: boolean;
  ticketItemId: string | null;
  ticketTypeId: string | null;
  ticketTypeCode: string | null;
  reason: string;
}

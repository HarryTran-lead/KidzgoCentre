/** Phase 1.5 — SlotType types */

export interface SlotType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateSlotTypeRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSlotTypeRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface SlotTypeListResponse {
  items: SlotType[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

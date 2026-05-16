/** Phase 1.5 — LearningTicketType types */

export interface LearningTicketType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateLearningTicketTypeRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateLearningTicketTypeRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface LearningTicketTypeListResponse {
  items: LearningTicketType[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

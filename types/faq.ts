// types/faq.ts

// ─── Category ─────────────────────────────────────────────────────────────────

export interface FaqCategory {
  id: string;
  name: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  totalFaqCount?: number;
  publishedFaqCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFaqCategoryRequest {
  name: string;
  icon?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateFaqCategoryRequest {
  name: string;
  icon?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface GetAdminFaqCategoriesParams {
  includeInactive?: boolean;
  includeDeleted?: boolean;
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

export interface FaqItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string | null;
  categorySortOrder?: number;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  isDeleted: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFaqItemRequest {
  categoryId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface UpdateFaqItemRequest {
  categoryId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface GetAdminFaqItemsParams {
  categoryId?: string;
  searchTerm?: string;
  isPublished?: boolean;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface PaginatedFaqItems {
  items: FaqItem[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface FaqCategoriesResponse {
  isSuccess: boolean;
  data: {
    categories: FaqCategory[];
  };
}

export interface FaqItemsResponse {
  isSuccess: boolean;
  data: {
    faqs: PaginatedFaqItems;
  };
}

export interface FaqCategoryResponse {
  isSuccess: boolean;
  data: FaqCategory;
}

export interface FaqItemResponse {
  isSuccess: boolean;
  data: FaqItem;
}

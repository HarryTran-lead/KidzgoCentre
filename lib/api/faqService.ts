/**
 * FAQ Service
 * All API calls for FAQ categories and items
 */

import { get, post, put, del, publicGet } from "@/lib/axios";
import { FAQ_ENDPOINTS } from "@/constants/apiURL";
import type {
  FaqCategoriesResponse,
  FaqCategoryResponse,
  FaqItemsResponse,
  FaqItemResponse,
  CreateFaqCategoryRequest,
  UpdateFaqCategoryRequest,
  CreateFaqItemRequest,
  UpdateFaqItemRequest,
  GetAdminFaqCategoriesParams,
  GetAdminFaqItemsParams,
} from "@/types/faq";

// ─── Public (unauthenticated) ────────────────────────────────────────────────

export async function getPublicFaqCategories(): Promise<FaqCategoriesResponse> {
  return publicGet<FaqCategoriesResponse>(FAQ_ENDPOINTS.PUBLIC_CATEGORIES);
}

export async function getPublicFaqItems(params?: {
  categoryId?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<FaqItemsResponse> {
  const qs = new URLSearchParams();
  if (params?.categoryId) qs.append("categoryId", params.categoryId);
  if (params?.searchTerm) qs.append("searchTerm", params.searchTerm);
  if (params?.pageNumber !== undefined) qs.append("pageNumber", String(params.pageNumber));
  if (params?.pageSize !== undefined) qs.append("pageSize", String(params.pageSize));
  const url = qs.toString()
    ? `${FAQ_ENDPOINTS.PUBLIC_ITEMS}?${qs.toString()}`
    : FAQ_ENDPOINTS.PUBLIC_ITEMS;
  return publicGet<FaqItemsResponse>(url);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAdminFaqCategories(
  params?: GetAdminFaqCategoriesParams
): Promise<FaqCategoriesResponse> {
  const qs = new URLSearchParams();
  if (params?.includeInactive !== undefined) qs.append("includeInactive", String(params.includeInactive));
  if (params?.includeDeleted !== undefined) qs.append("includeDeleted", String(params.includeDeleted));
  const url = qs.toString()
    ? `${FAQ_ENDPOINTS.ADMIN_CATEGORIES}?${qs.toString()}`
    : FAQ_ENDPOINTS.ADMIN_CATEGORIES;
  return get<FaqCategoriesResponse>(url);
}

export async function createFaqCategory(
  data: CreateFaqCategoryRequest
): Promise<FaqCategoryResponse> {
  return post<FaqCategoryResponse>(FAQ_ENDPOINTS.CATEGORIES_CREATE, data);
}

export async function updateFaqCategory(
  id: string,
  data: UpdateFaqCategoryRequest
): Promise<FaqCategoryResponse> {
  return put<FaqCategoryResponse>(FAQ_ENDPOINTS.CATEGORY_BY_ID(id), data);
}

export async function deleteFaqCategory(id: string): Promise<FaqCategoryResponse> {
  return del<FaqCategoryResponse>(FAQ_ENDPOINTS.CATEGORY_BY_ID(id));
}

// ─── FAQ Items ────────────────────────────────────────────────────────────────

export async function getAdminFaqItems(
  params?: GetAdminFaqItemsParams
): Promise<FaqItemsResponse> {
  const qs = new URLSearchParams();
  if (params?.categoryId) qs.append("categoryId", params.categoryId);
  if (params?.searchTerm) qs.append("searchTerm", params.searchTerm);
  if (params?.isPublished !== undefined) qs.append("isPublished", String(params.isPublished));
  if (params?.includeDeleted !== undefined) qs.append("includeDeleted", String(params.includeDeleted));
  if (params?.pageNumber !== undefined) qs.append("pageNumber", String(params.pageNumber));
  if (params?.pageSize !== undefined) qs.append("pageSize", String(params.pageSize));
  const url = qs.toString()
    ? `${FAQ_ENDPOINTS.ADMIN_ITEMS}?${qs.toString()}`
    : FAQ_ENDPOINTS.ADMIN_ITEMS;
  return get<FaqItemsResponse>(url);
}

export async function createFaqItem(data: CreateFaqItemRequest): Promise<FaqItemResponse> {
  return post<FaqItemResponse>(FAQ_ENDPOINTS.ITEM_CREATE, data);
}

export async function updateFaqItem(
  id: string,
  data: UpdateFaqItemRequest
): Promise<FaqItemResponse> {
  return put<FaqItemResponse>(FAQ_ENDPOINTS.ITEM_BY_ID(id), data);
}

export async function deleteFaqItem(id: string): Promise<FaqItemResponse> {
  return del<FaqItemResponse>(FAQ_ENDPOINTS.ITEM_BY_ID(id));
}

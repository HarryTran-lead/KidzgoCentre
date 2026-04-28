import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { get, patch, post, put } from "@/lib/axios";
import type {
  CreateDiscountCampaignRequest,
  DiscountCampaign,
  DiscountCampaignPaginatedResponse,
  GetDiscountCampaignsOptions,
  ToggleDiscountCampaignStatusResponse,
  UpdateDiscountCampaignRequest,
} from "@/types/admin/discountCampaign";

function pickItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.campaigns?.items)) return payload.data.campaigns.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.campaigns)) return payload.data.campaigns;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickPagination(payload: any): { pageNumber: number; totalPages: number; totalCount: number } {
  const src =
    payload?.data?.campaigns ??
    payload?.data ??
    payload;
  return {
    pageNumber: Number(src?.pageNumber ?? 1),
    totalPages: Number(src?.totalPages ?? 1),
    totalCount: Number(src?.totalCount ?? 0),
  };
}

function pickDetail(payload: any): any {
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload;
}

function mapToDiscountCampaign(item: any): DiscountCampaign {
  return {
    id: String(item?.id ?? ""),
    name: String(item?.name ?? ""),
    code: item?.code ? String(item.code) : null,
    description: item?.description ? String(item.description) : null,
    branchId: item?.branchId ? String(item.branchId) : null,
    branchName: item?.branchName ? String(item.branchName) : null,
    programId: item?.programId ? String(item.programId) : null,
    programName: item?.programName ? String(item.programName) : null,
    tuitionPlanId: item?.tuitionPlanId ? String(item.tuitionPlanId) : null,
    tuitionPlanName: item?.tuitionPlanName ? String(item.tuitionPlanName) : null,
    discountType: item?.discountType === "FixedAmount" ? "FixedAmount" : "Percentage",
    discountValue: Number(item?.discountValue ?? 0),
    priority: Number(item?.priority ?? 0),
    startDate: String(item?.startDate ?? ""),
    endDate: String(item?.endDate ?? ""),
    applyForInitialRegistration: Boolean(item?.applyForInitialRegistration),
    applyForRenewal: Boolean(item?.applyForRenewal),
    applyForUpgrade: Boolean(item?.applyForUpgrade),
    isActive: Boolean(item?.isActive),
    isCurrentlyApplicable: Boolean(item?.isCurrentlyApplicable),
    createdAt: String(item?.createdAt ?? ""),
    updatedAt: String(item?.updatedAt ?? ""),
  };
}

export async function getDiscountCampaigns(
  options?: GetDiscountCampaignsOptions
): Promise<DiscountCampaignPaginatedResponse> {
  const params = new URLSearchParams({
    pageNumber: String(options?.pageNumber ?? 1),
    pageSize: String(options?.pageSize ?? 20),
  });

  if (options?.branchId) params.append("branchId", options.branchId);
  if (options?.programId) params.append("programId", options.programId);
  if (options?.tuitionPlanId) params.append("tuitionPlanId", options.tuitionPlanId);
  if (options?.isActive !== undefined) params.append("isActive", String(options.isActive));
  if (options?.searchTerm) params.append("searchTerm", options.searchTerm);

  const response = await get<any>(`${ADMIN_ENDPOINTS.REGISTRATION_DISCOUNT_CAMPAIGNS}?${params.toString()}`);
  const items = pickItems(response).map(mapToDiscountCampaign).filter((x) => x.id);
  const pagination = pickPagination(response);

  return { items, ...pagination };
}

export async function getDiscountCampaignById(id: string): Promise<DiscountCampaign> {
  const response = await get<any>(ADMIN_ENDPOINTS.REGISTRATION_DISCOUNT_CAMPAIGNS_BY_ID(id));
  return mapToDiscountCampaign(pickDetail(response));
}

export async function createDiscountCampaign(
  payload: CreateDiscountCampaignRequest
): Promise<DiscountCampaign> {
  const response = await post<any>(ADMIN_ENDPOINTS.REGISTRATION_DISCOUNT_CAMPAIGNS, payload);
  return mapToDiscountCampaign(pickDetail(response));
}

export async function updateDiscountCampaign(
  id: string,
  payload: UpdateDiscountCampaignRequest
): Promise<DiscountCampaign> {
  const response = await put<any>(ADMIN_ENDPOINTS.REGISTRATION_DISCOUNT_CAMPAIGNS_BY_ID(id), payload);
  return mapToDiscountCampaign(pickDetail(response));
}

export async function toggleDiscountCampaignStatus(
  id: string
): Promise<ToggleDiscountCampaignStatusResponse> {
  const response = await patch<any>(ADMIN_ENDPOINTS.REGISTRATION_DISCOUNT_CAMPAIGNS_TOGGLE_STATUS(id));
  const data = response?.data ?? response;
  return {
    id: String(data?.id ?? id),
    isActive: Boolean(data?.isActive),
    updatedAt: String(data?.updatedAt ?? ""),
  };
}

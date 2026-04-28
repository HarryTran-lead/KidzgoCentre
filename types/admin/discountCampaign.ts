export type DiscountType = "Percentage" | "FixedAmount";

export interface DiscountCampaign {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  branchId: string | null;
  branchName: string | null;
  programId: string | null;
  programName: string | null;
  tuitionPlanId: string | null;
  tuitionPlanName: string | null;
  discountType: DiscountType;
  discountValue: number;
  priority: number;
  startDate: string;
  endDate: string;
  applyForInitialRegistration: boolean;
  applyForRenewal: boolean;
  applyForUpgrade: boolean;
  isActive: boolean;
  isCurrentlyApplicable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountCampaignRequest {
  name: string;
  code?: string | null;
  description?: string | null;
  branchId?: string | null;
  programId?: string | null;
  tuitionPlanId?: string | null;
  discountType: DiscountType;
  discountValue: number;
  priority: number;
  startDate: string;
  endDate: string;
  applyForInitialRegistration: boolean;
  applyForRenewal: boolean;
  applyForUpgrade: boolean;
}

export type UpdateDiscountCampaignRequest = CreateDiscountCampaignRequest;

export interface ToggleDiscountCampaignStatusResponse {
  id: string;
  isActive: boolean;
  updatedAt: string;
}

export interface GetDiscountCampaignsOptions {
  branchId?: string;
  programId?: string;
  tuitionPlanId?: string;
  isActive?: boolean;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface DiscountCampaignPaginatedResponse {
  items: DiscountCampaign[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
}

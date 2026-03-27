import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { del, get, patch, post, put } from "@/lib/axios";
import type {
  CreateTuitionPlan,
  CreateTuitionPlanResponse,
  TuitionPlan,
  UpdateTuitionPlanRequest,
  UpdateTuitionPlanResponse,
} from "@/types/admin/tuition_plan";

export type ProgramOption = {
  id: string;
  name: string;
  branchId?: string;
  isActive?: boolean;
  isMakeup?: boolean;
};

function pickItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.tuitionPlans?.items)) return payload.data.tuitionPlans.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.tuitionPlans)) return payload.data.tuitionPlans;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickPrograms(payload: any): any[] {
  if (Array.isArray(payload?.data?.programs?.items)) return payload.data.programs.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.programs)) return payload.data.programs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickDetail(payload: any): any {
  if (payload?.data?.tuitionPlan) return payload.data.tuitionPlan;
  if (payload?.data) return payload.data;
  if (payload?.tuitionPlan) return payload.tuitionPlan;
  return payload;
}

function mapToTuitionPlan(item: any): TuitionPlan {
  return {
    id: String(item?.id ?? ""),
    branchId: String(item?.branchId ?? ""),
    branchName: String(item?.branchName ?? item?.branch?.name ?? ""),
    programId: String(item?.programId ?? ""),
    programName: String(item?.programName ?? item?.program?.name ?? ""),
    name: String(item?.name ?? ""),
    totalSessions: Number(item?.totalSessions ?? 0),
    tuitionAmount: Number(item?.tuitionAmount ?? 0),
    unitPriceSession: Number(item?.unitPriceSession ?? 0),
    currency: String(item?.currency ?? "VND"),
    isActive: Boolean(item?.isActive),
    createdAt: String(item?.createdAt ?? ""),
    updatedAt: String(item?.updatedAt ?? ""),
  };
}

export async function getTuitionPlans(options?: {
  pageNumber?: number;
  pageSize?: number;
  branchId?: string;
}): Promise<TuitionPlan[]> {
  const params = new URLSearchParams({
    pageNumber: String(options?.pageNumber ?? 1),
    pageSize: String(options?.pageSize ?? 100),
  });

  if (options?.branchId) {
    params.append("branchId", options.branchId);
  }

  const response = await get<any>(`${ADMIN_ENDPOINTS.TUITION_PLANS}?${params.toString()}`);
  return pickItems(response).map(mapToTuitionPlan).filter((x) => x.id);
}

export async function getActiveTuitionPlans(branchId?: string): Promise<TuitionPlan[]> {
  const url = branchId
    ? `${ADMIN_ENDPOINTS.TUITION_PLANS_ACTIVE}?branchId=${encodeURIComponent(branchId)}`
    : ADMIN_ENDPOINTS.TUITION_PLANS_ACTIVE;
  const response = await get<any>(url);
  return pickItems(response).map(mapToTuitionPlan).filter((x) => x.id);
}

export async function getTuitionPlanDetail(id: string): Promise<TuitionPlan> {
  const response = await get<any>(ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));
  return mapToTuitionPlan(pickDetail(response));
}

export async function createTuitionPlan(payload: CreateTuitionPlan): Promise<CreateTuitionPlanResponse> {
  const response = await post<any>(ADMIN_ENDPOINTS.TUITION_PLANS, payload);
  return mapToTuitionPlan(pickDetail(response));
}

export async function updateTuitionPlan(
  id: string,
  payload: UpdateTuitionPlanRequest
): Promise<UpdateTuitionPlanResponse> {
  const response = await put<any>(ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id), payload);
  return mapToTuitionPlan(pickDetail(response));
}

export async function deleteTuitionPlan(id: string): Promise<void> {
  await del<any>(ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));
}

export async function toggleTuitionPlanStatus(
  id: string
): Promise<{ id: string; isActive: boolean }> {
  const response = await patch<any>(ADMIN_ENDPOINTS.TUITION_PLANS_TOGGLE_STATUS(id));
  const data = response?.data ?? response;
  return {
    id: String(data?.id ?? id),
    isActive: Boolean(data?.isActive),
  };
}

export async function getProgramsForBranch(branchId?: string): Promise<ProgramOption[]> {
  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "200",
  });

  if (branchId) {
    params.append("branchId", branchId);
  }

  const response = await get<any>(`${ADMIN_ENDPOINTS.PROGRAMS}?${params.toString()}`);

  return pickPrograms(response)
    .map((item: any) => ({
      id: String(item?.id ?? ""),
      name: String(item?.name ?? ""),
      branchId: item?.branchId ? String(item.branchId) : undefined,
      isActive: item?.isActive === undefined ? undefined : Boolean(item.isActive),
      isMakeup: item?.isMakeup === undefined ? undefined : Boolean(item.isMakeup),
    }))
    .filter((x: ProgramOption) => x.id);
}

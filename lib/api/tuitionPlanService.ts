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
  if (Array.isArray(payload?.data?.page?.items)) return payload.data.page.items;
  if (Array.isArray(payload?.data?.tuitionPlans?.items)) return payload.data.tuitionPlans.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.tuitionPlans)) return payload.data.tuitionPlans;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.page?.items)) return payload.page.items;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickPrograms(payload: any): any[] {
  if (Array.isArray(payload?.data?.programs?.items)) return payload.data.programs.items;
  if (Array.isArray(payload?.data?.page?.items)) return payload.data.page.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.programs)) return payload.data.programs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickDetail(payload: any): any {
  if (payload?.data?.tuitionPlan) return payload.data.tuitionPlan;
  if (payload?.data) return payload.data;
  if (payload?.tuitionPlan) return payload.tuitionPlan;
  return payload;
}

function pickNestedName(candidate: any): string {
  if (!candidate) return "";
  if (typeof candidate === "string") return candidate.trim();
  if (typeof candidate !== "object") return "";

  const value = candidate?.name ?? candidate?.branchName ?? candidate?.displayName ?? candidate?.title;
  return typeof value === "string" ? value.trim() : "";
}

function resolveBranchName(item: any): string {
  const direct = String(item?.branchName ?? item?.BranchName ?? item?.branchDisplayName ?? item?.branch_title ?? "").trim();
  if (direct) return direct;

  const nested = pickNestedName(item?.branch) || pickNestedName(item?.Branch) || pickNestedName(item?.branchInfo);
  return nested;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function toPositiveNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapToTuitionPlan(item: any): TuitionPlan {
  const isActive = item?.isActive === undefined ? item?.IsActive !== false : Boolean(item?.isActive);
  const statusValue = str(item?.status ?? item?.Status).toLowerCase();
  const totalSessions = toPositiveNumber(item?.totalSessions ?? item?.TotalSessions ?? item?.sessionCount);
  const tuitionAmount = toPositiveNumber(item?.tuitionAmount ?? item?.TuitionAmount);
  const explicitUnitPrice = toPositiveNumber(item?.unitPriceSession ?? item?.UnitPriceSession, NaN);

  return {
    id: str(item?.id ?? item?.Id),
    branchId: str(item?.branchId ?? item?.BranchId) || null,
    branchName: resolveBranchName(item) || null,
    programId: str(item?.programId ?? item?.ProgramId),
    programName: str(item?.programName ?? item?.ProgramName ?? item?.program?.name ?? item?.Program?.Name),
    levelId: str(item?.levelId ?? item?.LevelId),
    levelName: str(item?.levelName ?? item?.LevelName ?? item?.level?.name ?? item?.Level?.Name),
    name: str(item?.name ?? item?.Name),
    totalSessions,
    tuitionAmount,
    unitPriceSession:
      Number.isFinite(explicitUnitPrice) && explicitUnitPrice > 0
        ? explicitUnitPrice
        : totalSessions > 0
          ? Math.round(tuitionAmount / totalSessions)
          : 0,
    currency: str(item?.currency ?? item?.Currency, "VND") || "VND",
    status: statusValue === "inactive" || isActive === false ? "inactive" : "active",
    isActive,
    createdAt: str(item?.createdAt ?? item?.CreatedAt),
    updatedAt: str(item?.updatedAt ?? item?.UpdatedAt),
  };
}

function buildTuitionPlanQuery(options?: {
  pageNumber?: number;
  pageSize?: number;
  branchId?: string;
  programId?: string;
  levelId?: string;
  isActive?: boolean;
  status?: "active" | "inactive";
}) {
  const params = new URLSearchParams({
    pageNumber: String(options?.pageNumber ?? 1),
    pageSize: String(options?.pageSize ?? 100),
  });

  if (options?.branchId) params.append("branchId", options.branchId);
  if (options?.programId) params.append("programId", options.programId);
  if (options?.levelId) params.append("levelId", options.levelId);
  if (options?.isActive !== undefined) params.append("isActive", String(options.isActive));
  if (options?.status && options?.isActive === undefined) {
    params.append("isActive", String(options.status === "active"));
  }

  return params.toString();
}

export async function getTuitionPlans(options?: {
  pageNumber?: number;
  pageSize?: number;
  branchId?: string;
  programId?: string;
  levelId?: string;
  isActive?: boolean;
  status?: "active" | "inactive";
}): Promise<TuitionPlan[]> {
  const response = await get<any>(`${ADMIN_ENDPOINTS.TUITION_PLANS}?${buildTuitionPlanQuery(options)}`);
  return pickItems(response).map(mapToTuitionPlan).filter((item) => item.id);
}

export async function getActiveTuitionPlans(options?: {
  pageNumber?: number;
  pageSize?: number;
  branchId?: string;
  programId?: string;
  levelId?: string;
}): Promise<TuitionPlan[]>;
export async function getActiveTuitionPlans(branchId?: string): Promise<TuitionPlan[]>;
export async function getActiveTuitionPlans(
  optionsOrBranchId?: string | {
    pageNumber?: number;
    pageSize?: number;
    branchId?: string;
    programId?: string;
    levelId?: string;
  },
): Promise<TuitionPlan[]> {
  const options =
    typeof optionsOrBranchId === "string"
      ? { branchId: optionsOrBranchId }
      : optionsOrBranchId;
  const response = await get<any>(
    `${ADMIN_ENDPOINTS.TUITION_PLANS_ACTIVE}?${buildTuitionPlanQuery(options)}`,
  );
  return pickItems(response).map(mapToTuitionPlan).filter((item) => item.id);
}

export async function getTuitionPlanById(id: string): Promise<TuitionPlan | null> {
  const response = await get<any>(ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));
  const item = pickDetail(response);
  if (!item?.id && !item?.Id) return null;
  return mapToTuitionPlan(item);
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
  payload: UpdateTuitionPlanRequest,
): Promise<UpdateTuitionPlanResponse> {
  const response = await put<any>(ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id), payload);
  return mapToTuitionPlan(pickDetail(response));
}

export async function deleteTuitionPlan(id: string): Promise<void> {
  await del<any>(ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));
}

export async function toggleTuitionPlanStatus(
  id: string,
): Promise<{ id: string; isActive: boolean }> {
  const response = await patch<any>(ADMIN_ENDPOINTS.TUITION_PLANS_TOGGLE_STATUS(id));
  const data = pickDetail(response);
  return {
    id: str(data?.id ?? data?.Id, id),
    isActive: Boolean(data?.isActive ?? data?.IsActive),
  };
}

export async function getProgramsForBranch(branchId?: string): Promise<ProgramOption[]> {
  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "200",
  });

  if (branchId) params.append("branchId", branchId);

  const response = await get<any>(`${ADMIN_ENDPOINTS.PROGRAMS}?${params.toString()}`);

  return pickPrograms(response)
    .map((item: any) => ({
      id: str(item?.id ?? item?.Id),
      name: str(item?.name ?? item?.Name),
      branchId: item?.branchId || item?.BranchId ? str(item?.branchId ?? item?.BranchId) : undefined,
      isActive:
        item?.isActive === undefined && item?.IsActive === undefined
          ? undefined
          : Boolean(item?.isActive ?? item?.IsActive),
      isMakeup:
        item?.isMakeup === undefined && item?.IsMakeup === undefined
          ? undefined
          : Boolean(item?.isMakeup ?? item?.IsMakeup),
    }))
    .filter((item: ProgramOption) => item.id);
}

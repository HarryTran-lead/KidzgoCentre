import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { del, get, patch, post, put } from "@/lib/axios";
import type {
  CreateTuitionPlan,
  CreateTuitionPlanResponse,
  TuitionPlan,
  TuitionPlanModule,
  TuitionPlanSyllabusMapping,
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
  if (nested) return nested;

  return "";
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function num(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeModule(item: any): TuitionPlanModule {
  return {
    moduleId: str(item?.moduleId ?? item?.id ?? item?.ModuleId ?? item?.Id),
    moduleCode: str(item?.moduleCode ?? item?.code ?? item?.ModuleCode ?? item?.Code) || null,
    moduleName: str(item?.moduleName ?? item?.name ?? item?.ModuleName ?? item?.Name) || null,
    moduleOrder: num(item?.moduleOrder ?? item?.order ?? item?.orderIndex ?? item?.ModuleOrder ?? item?.Order),
    plannedSessionCount: num(item?.plannedSessionCount ?? item?.totalSessions ?? item?.sessionCount ?? item?.PlannedSessionCount),
  };
}

function normalizeModules(item: any): TuitionPlanModule[] {
  const rawModules: unknown[] = Array.isArray(item?.modules)
    ? item.modules
    : Array.isArray(item?.Modules)
      ? item.Modules
      : [];

  const modules = rawModules.map(normalizeModule).filter((module) => module.moduleId);
  if (modules.length > 0) return modules;

  const legacyModuleId = str(item?.moduleId ?? item?.ModuleId);
  if (!legacyModuleId) return [];

  return [{
    moduleId: legacyModuleId,
    moduleCode: str(item?.moduleCode ?? item?.ModuleCode) || null,
    moduleName: str(item?.moduleName ?? item?.module?.name ?? item?.ModuleName) || null,
    moduleOrder: num(item?.moduleOrder ?? item?.order ?? item?.ModuleOrder),
    plannedSessionCount: num(item?.plannedSessionCount ?? item?.totalSessions ?? item?.PlannedSessionCount),
  }];
}

function normalizeModuleIds(item: any, modules: TuitionPlanModule[]): string[] {
  const rawIds = Array.isArray(item?.moduleIds)
    ? item.moduleIds
    : Array.isArray(item?.ModuleIds)
      ? item.ModuleIds
      : [];

  const ids = rawIds.map((id: unknown) => str(id).trim()).filter(Boolean);
  if (ids.length > 0) return ids;

  return modules.map((module) => module.moduleId).filter(Boolean);
}

function mapToTuitionPlan(item: any): TuitionPlan {
  const modules = normalizeModules(item);
  const moduleIds = normalizeModuleIds(item, modules);
  const isActive = item?.isActive === undefined ? item?.IsActive !== false : Boolean(item?.isActive);
  const statusValue = str(item?.status ?? item?.Status).toLowerCase();

  return {
    id: String(item?.id ?? item?.Id ?? ""),
    branchId: String(item?.branchId ?? item?.BranchId ?? ""),
    branchName: resolveBranchName(item),
    programId: String(item?.programId ?? item?.ProgramId ?? ""),
    programName: String(item?.programName ?? item?.ProgramName ?? item?.program?.name ?? item?.Program?.Name ?? ""),
    levelId: String(item?.levelId ?? item?.LevelId ?? ""),
    levelName: String(item?.levelName ?? item?.LevelName ?? item?.level?.name ?? item?.Level?.Name ?? ""),
    syllabusId: str(item?.syllabusId ?? item?.SyllabusId) || null,
    syllabusCode: str(item?.syllabusCode ?? item?.syllabus?.code ?? item?.SyllabusCode) || null,
    syllabusVersion: item?.syllabusVersion ?? item?.syllabus?.version ?? item?.SyllabusVersion ?? null,
    syllabusTitle: str(item?.syllabusTitle ?? item?.syllabus?.title ?? item?.SyllabusTitle) || null,
    moduleIds,
    modules,
    moduleId: moduleIds[0] ?? null,
    moduleName: modules[0]?.moduleName ?? null,
    name: String(item?.name ?? item?.Name ?? ""),
    totalSessions: Number(item?.totalSessions ?? item?.sessionCount ?? item?.TotalSessions ?? 0),
    tuitionAmount: Number(item?.tuitionAmount ?? item?.TuitionAmount ?? 0),
    unitPriceSession: Number(item?.unitPriceSession ?? item?.UnitPriceSession ?? 0),
    currency: String(item?.currency ?? item?.Currency ?? "VND"),
    status: (statusValue === 'inactive' || isActive === false ? 'inactive' : 'active') as 'active' | 'inactive',
    isActive,
    createdAt: String(item?.createdAt ?? item?.CreatedAt ?? ""),
    updatedAt: String(item?.updatedAt ?? item?.UpdatedAt ?? ""),
    learningTicketTypeId: item?.learningTicketTypeId ?? item?.LearningTicketTypeId ?? null,
    learningTicketTypeCode: item?.learningTicketTypeCode ?? item?.LearningTicketTypeCode ?? null,
    learningTicketTypeName: item?.learningTicketTypeName ?? item?.LearningTicketTypeName ?? null,
  };
}

export async function getTuitionPlans(options?: {
  pageNumber?: number;
  pageSize?: number;
  branchId?: string;
  programId?: string;
  levelId?: string;
  moduleId?: string;
  isActive?: boolean;
  status?: 'active' | 'inactive';
}): Promise<TuitionPlan[]> {
  const params = new URLSearchParams({
    pageNumber: String(options?.pageNumber ?? 1),
    pageSize: String(options?.pageSize ?? 100),
  });

  if (options?.branchId) params.append("branchId", options.branchId);
  if (options?.programId) params.append("programId", options.programId);
  if (options?.levelId) params.append("levelId", options.levelId);
  if (options?.moduleId) params.append("moduleId", options.moduleId);
  if (options?.isActive !== undefined) params.append("isActive", String(options.isActive));
  if (options?.status && options?.isActive === undefined) {
    params.append("isActive", String(options.status === "active"));
  }

  const response = await get<any>(`${ADMIN_ENDPOINTS.TUITION_PLANS}?${params.toString()}`);
  return pickItems(response).map(mapToTuitionPlan).filter((x) => x.id);
}

export async function getTuitionPlanById(id: string): Promise<TuitionPlan | null> {
  const response = await get<any>(ADMIN_ENDPOINTS.TUITION_PLANS_BY_ID(id));
  const item = pickDetail(response);
  if (!item?.id && !item?.Id) return null;
  return mapToTuitionPlan(item);
}

export async function deactivateTuitionPlan(id: string): Promise<{ isSuccess: boolean; message?: string }> {
  return patch<{ isSuccess: boolean; message?: string }>(ADMIN_ENDPOINTS.TUITION_PLANS_DEACTIVATE(id), {});
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
    id: String(data?.id ?? data?.Id ?? id),
    isActive: Boolean(data?.isActive ?? data?.IsActive),
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
      id: String(item?.id ?? item?.Id ?? ""),
      name: String(item?.name ?? item?.Name ?? ""),
      branchId: item?.branchId || item?.BranchId ? String(item?.branchId ?? item?.BranchId) : undefined,
      isActive: item?.isActive === undefined && item?.IsActive === undefined ? undefined : Boolean(item?.isActive ?? item?.IsActive),
      isMakeup: item?.isMakeup === undefined && item?.IsMakeup === undefined ? undefined : Boolean(item?.isMakeup ?? item?.IsMakeup),
    }))
    .filter((x: ProgramOption) => x.id);
}

// ─── Package–Curriculum Mapping ───────────────────────────────────────────────

function pickSyllabusMappings(payload: any): any[] {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.syllabuses)) return payload.data.syllabuses;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.syllabuses)) return payload.syllabuses;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

function mapToSyllabusMapping(item: any): TuitionPlanSyllabusMapping {
  return {
    id: String(item?.id ?? item?.mappingId ?? ""),
    syllabusId: String(item?.syllabusId ?? ""),
    syllabusCode: String(item?.syllabusCode ?? item?.code ?? ""),
    syllabusTitle: String(item?.syllabusTitle ?? item?.title ?? ""),
    syllabusVersion: String(item?.syllabusVersion ?? item?.version ?? ""),
    levelName: String(item?.levelName ?? item?.level?.name ?? ""),
    programName: String(item?.programName ?? item?.program?.name ?? ""),
    isActive: Boolean(item?.isActive ?? true),
    effectiveFrom: item?.effectiveFrom ?? null,
    effectiveTo: item?.effectiveTo ?? null,
    createdAt: String(item?.createdAt ?? ""),
  };
}

export async function getTuitionPlanSyllabuses(tuitionPlanId: string): Promise<TuitionPlanSyllabusMapping[]> {
  const response = await get<any>(ADMIN_ENDPOINTS.TUITION_PLANS_SYLLABUSES(tuitionPlanId));
  return pickSyllabusMappings(response).map(mapToSyllabusMapping).filter((x) => x.syllabusId);
}

export async function addSyllabusToTuitionPlan(
  tuitionPlanId: string,
  payload: { syllabusId: string; effectiveFrom?: string | null; effectiveTo?: string | null; isActive?: boolean },
): Promise<TuitionPlanSyllabusMapping> {
  const response = await post<any>(ADMIN_ENDPOINTS.TUITION_PLANS_SYLLABUSES(tuitionPlanId), payload);
  const d = response?.data ?? response;
  return mapToSyllabusMapping(d);
}

export async function removeSyllabusFromTuitionPlan(
  tuitionPlanId: string,
  syllabusId: string,
): Promise<void> {
  await del<any>(ADMIN_ENDPOINTS.TUITION_PLANS_SYLLABUS_BY_ID(tuitionPlanId, syllabusId));
}

import {
  LEVEL_ENDPOINTS,
  MODULE_ENDPOINTS,
  STUDENT_PROGRESS_ENDPOINTS,
  ASSESSMENT_ENDPOINTS,
  TEACHER_EVALUATION_ENDPOINTS,
  PROMOTION_DECISION_ENDPOINTS,
  REMEDIAL_PLAN_ENDPOINTS,
} from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import type {
  LevelDto,
  ModuleDto,
  StudentProgressDto,
  StudentProgressDashboardDto,
  AssessmentDto,
  TeacherEvaluationDto,
  PromotionDecisionDto,
  RemedialPlanDto,
  CreateLevelRequest,
  UpdateLevelRequest,
  GetLevelsParams,
  CreateModuleRequest,
  UpdateModuleRequest,
  GetModulesParams,
  UpdateStudentProgressRequest,
  CreateAssessmentRequest,
  CreateTeacherEvaluationRequest,
  CreatePromotionDecisionRequest,
  CreateRemedialPlanRequest,
} from "@/types/academic-progression";

export interface AcademicServiceResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  status?: number;
  title?: string;
  detail?: string;
}

function extractError(raw: unknown): Pick<AcademicServiceResponse<null>, "message" | "title" | "detail"> {
  if (!raw || typeof raw !== "object") return { message: "Đã xảy ra lỗi" };
  // AxiosError: lấy response.data
  const axiosData = (raw as Record<string, unknown>).response;
  const r: Record<string, unknown> =
    axiosData && typeof axiosData === "object"
      ? ((axiosData as Record<string, unknown>).data as Record<string, unknown>) ?? (raw as Record<string, unknown>)
      : (raw as Record<string, unknown>);
  const detail = typeof r.detail === "string" ? r.detail : undefined;
  const title = typeof r.title === "string" ? r.title : undefined;
  const errors = Array.isArray(r.errors) ? r.errors : undefined;
  const firstErr = errors?.[0];
  const description = firstErr && typeof firstErr === "object" ? (firstErr as Record<string, unknown>).description as string : undefined;
  // HTTP status for friendlier message
  const status = typeof (axiosData as Record<string, unknown>)?.status === "number"
    ? (axiosData as Record<string, unknown>).status as number
    : undefined;
  const fallback = status === 500 ? "Lỗi máy chủ, vui lòng thử lại" : status === 404 ? "Không tìm thấy dữ liệu" : "Đã xảy ra lỗi";
  return {
    message: detail ?? description ?? title ?? fallback,
    title,
    detail,
  };
}

// ─── Levels ──────────────────────────────────────────────────────────────────

export async function getLevels(
  params?: GetLevelsParams
): Promise<AcademicServiceResponse<{ items: LevelDto[] }>> {
  try {
    const qs = new URLSearchParams();
    if (params?.programId) qs.set("programId", params.programId);
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params?.searchTerm) qs.set("searchTerm", params.searchTerm);
    const url = `${LEVEL_ENDPOINTS.BASE}${qs.toString() ? `?${qs}` : ""}`;
    const res = await get<{ isSuccess: boolean; data: { items: LevelDto[] } }>(url);
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: { items: [] }, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: { items: [] }, ...extractError(e) };
  }
}

export async function createLevel(
  body: CreateLevelRequest
): Promise<AcademicServiceResponse<LevelDto | null>> {
  try {
    const res = await post<{ isSuccess: boolean; data: LevelDto }>(LEVEL_ENDPOINTS.BASE, body);
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

export async function updateLevel(
  id: string,
  body: UpdateLevelRequest
): Promise<AcademicServiceResponse<LevelDto | null>> {
  try {
    const res = await put<{ isSuccess: boolean; data: LevelDto }>(LEVEL_ENDPOINTS.BY_ID(id), body);
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export async function getModules(
  params?: GetModulesParams
): Promise<AcademicServiceResponse<{ items: ModuleDto[] }>> {
  try {
    const qs = new URLSearchParams();
    if (params?.levelId) qs.set("levelId", params.levelId);
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params?.searchTerm) qs.set("searchTerm", params.searchTerm);
    const url = `${MODULE_ENDPOINTS.BASE}${qs.toString() ? `?${qs}` : ""}`;
    const res = await get<{ isSuccess: boolean; data: { items: ModuleDto[] } }>(url);
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: { items: [] }, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: { items: [] }, ...extractError(e) };
  }
}

export async function createModule(
  body: CreateModuleRequest
): Promise<AcademicServiceResponse<ModuleDto | null>> {
  try {
    const res = await post<{ isSuccess: boolean; data: ModuleDto }>(MODULE_ENDPOINTS.BASE, body);
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

export async function updateModule(
  id: string,
  body: UpdateModuleRequest
): Promise<AcademicServiceResponse<ModuleDto | null>> {
  try {
    const res = await put<{ isSuccess: boolean; data: ModuleDto }>(MODULE_ENDPOINTS.BY_ID(id), body);
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

// ─── Student Progress ────────────────────────────────────────────────────────

export async function getStudentProgress(
  studentId: string
): Promise<AcademicServiceResponse<{ items: StudentProgressDto[] }>> {
  try {
    const res = await get<{ isSuccess: boolean; data: { items: StudentProgressDto[] } }>(
      STUDENT_PROGRESS_ENDPOINTS.BY_STUDENT(studentId)
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: { items: [] }, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: { items: [] }, ...extractError(e) };
  }
}

export async function updateStudentProgress(
  body: UpdateStudentProgressRequest
): Promise<AcademicServiceResponse<StudentProgressDto | null>> {
  try {
    const res = await post<{ isSuccess: boolean; data: StudentProgressDto }>(
      STUDENT_PROGRESS_ENDPOINTS.UPDATE,
      body
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

export async function getStudentProgressDashboard(): Promise<
  AcademicServiceResponse<StudentProgressDashboardDto | null>
> {
  try {
    const res = await get<{ isSuccess: boolean; data: StudentProgressDashboardDto }>(
      STUDENT_PROGRESS_ENDPOINTS.DASHBOARD
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

// ─── Assessments ─────────────────────────────────────────────────────────────

export async function createAssessment(
  body: CreateAssessmentRequest
): Promise<AcademicServiceResponse<AssessmentDto | null>> {
  try {
    const res = await post<{ isSuccess: boolean; data: AssessmentDto }>(
      ASSESSMENT_ENDPOINTS.BASE,
      body
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

export async function getAssessmentsByStudent(
  studentId: string
): Promise<AcademicServiceResponse<{ items: AssessmentDto[] }>> {
  try {
    const res = await get<{ isSuccess: boolean; data: { items: AssessmentDto[] } }>(
      ASSESSMENT_ENDPOINTS.BY_STUDENT(studentId)
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: { items: [] }, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: { items: [] }, ...extractError(e) };
  }
}

// ─── Teacher Evaluations ─────────────────────────────────────────────────────

export async function createTeacherEvaluation(
  body: CreateTeacherEvaluationRequest
): Promise<AcademicServiceResponse<TeacherEvaluationDto | null>> {
  try {
    const res = await post<{ isSuccess: boolean; data: TeacherEvaluationDto }>(
      TEACHER_EVALUATION_ENDPOINTS.BASE,
      body
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

export async function getTeacherEvaluationsByStudent(
  studentId: string
): Promise<AcademicServiceResponse<{ items: TeacherEvaluationDto[] }>> {
  try {
    const res = await get<{ isSuccess: boolean; data: { items: TeacherEvaluationDto[] } }>(
      TEACHER_EVALUATION_ENDPOINTS.BY_STUDENT(studentId)
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: { items: [] }, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: { items: [] }, ...extractError(e) };
  }
}

// ─── Promotion Decisions ─────────────────────────────────────────────────────

export async function createPromotionDecision(
  body: CreatePromotionDecisionRequest
): Promise<AcademicServiceResponse<PromotionDecisionDto | null>> {
  try {
    const res = await post<{ isSuccess: boolean; data: PromotionDecisionDto }>(
      PROMOTION_DECISION_ENDPOINTS.BASE,
      body
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

// ─── Remedial Plans ──────────────────────────────────────────────────────────

export async function createRemedialPlan(
  body: CreateRemedialPlanRequest
): Promise<AcademicServiceResponse<RemedialPlanDto | null>> {
  try {
    const res = await post<{ isSuccess: boolean; data: RemedialPlanDto }>(
      REMEDIAL_PLAN_ENDPOINTS.BASE,
      body
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: null, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: null, ...extractError(e) };
  }
}

export async function getRemedialPlansByStudent(
  studentId: string
): Promise<AcademicServiceResponse<{ items: RemedialPlanDto[] }>> {
  try {
    const res = await get<{ isSuccess: boolean; data: { items: RemedialPlanDto[] } }>(
      REMEDIAL_PLAN_ENDPOINTS.BY_STUDENT(studentId)
    );
    if (res?.isSuccess && res.data) return { isSuccess: true, data: res.data };
    return { isSuccess: false, data: { items: [] }, ...extractError(res) };
  } catch (e) {
    return { isSuccess: false, data: { items: [] }, ...extractError(e) };
  }
}

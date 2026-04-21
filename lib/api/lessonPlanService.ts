import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import { uploadFile, isUploadSuccess } from "@/lib/api/fileService";
import { getAccessToken } from "@/lib/store/authToken";

type ApiLikeResponse = {
  success?: boolean;
  isSuccess?: boolean;
  data?: unknown;
  message?: string;
};

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
  error?: string;
  message?: string;
};

type PaginatedItems<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export interface ServiceResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  status?: number;
  title?: string;
  detail?: string;
  raw?: unknown;
}

export interface LessonPlanTemplate {
  id: string;
  programId: string;
  programName?: string;
  level: string;
  title: string;
  sessionIndex: number;
  syllabusMetadata?: string | null;
  syllabusContent?: string | null;
  sourceFileName?: string | null;
  attachment?: string | null;
  isActive?: boolean;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  usedCount?: number;
}

export interface GetLessonPlanTemplatesParams {
  programId?: string;
  level?: string;
  title?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateLessonPlanTemplateRequest {
  programId: string;
  level: string;
  title: string;
  sessionIndex: number;
  syllabusMetadata?: string | null;
  syllabusContent?: string | null;
  sourceFileName?: string | null;
  attachment?: string | null;
}

export interface UpdateLessonPlanTemplateRequest {
  level?: string | null;
  title?: string | null;
  sessionIndex?: number | null;
  syllabusMetadata?: string | null;
  syllabusContent?: string | null;
  sourceFileName?: string | null;
  attachment?: string | null;
  isActive?: boolean | null;
}

export interface ImportedProgramSummary {
  programId: string;
  programName?: string;
  importedSessions: number;
}

export interface ImportLessonPlanTemplatesRequest {
  file: File;
  programId?: string;
  level?: string;
  overwriteExisting?: boolean;
}

export interface ImportLessonPlanTemplatesResult {
  importedCount: number;
  programs: ImportedProgramSummary[];
}

export interface LessonPlan {
  id: string;
  classId: string;
  classCode?: string;
  classTitle?: string;
  sessionId: string;
  sessionTitle?: string;
  sessionDate?: string;
  templateId?: string | null;
  templateTitle?: string;
  templateLevel?: string;
  templateSessionIndex?: number;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
  submittedBy?: string | null;
  submittedByName?: string | null;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLessonPlanRequest {
  classId: string;
  sessionId: string;
  templateId?: string | null;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
}

export interface UpdateLessonPlanRequest {
  templateId?: string | null;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
}

export interface ClassLessonPlanSyllabusSession {
  sessionId: string;
  sessionIndex: number;
  sessionDate?: string | null;
  plannedTeacherId?: string | null;
  plannedTeacherName?: string | null;
  actualTeacherId?: string | null;
  actualTeacherName?: string | null;
  lessonPlanId?: string | null;
  templateId?: string | null;
  templateTitle?: string | null;
  templateSyllabusContent?: string | null;
  plannedContent?: string | null;
  actualContent?: string | null;
  actualHomework?: string | null;
  teacherNotes?: string | null;
  canEdit: boolean;
}

export interface ClassLessonPlanSyllabus {
  classId: string;
  classCode?: string;
  classTitle?: string;
  programId?: string;
  programName?: string;
  syllabusMetadata?: string | null;
  sessions: ClassLessonPlanSyllabusSession[];
}

export interface LessonPlanFileUploadResponse {
  url: string;
  fileName: string;
  size: number;
  folder: string;
  resourceType?: string;
}

export type LessonPlanUploadKind = "template" | "materials" | "media";

function isSuccess(response: ApiLikeResponse | undefined) {
  if (!response) return false;
  if (typeof response.isSuccess === "boolean") return response.isSuccess;
  if (typeof response.success === "boolean") return response.success;
  return true;
}

function unwrapData<T = unknown>(response: ApiLikeResponse | undefined): T | undefined {
  return response?.data as T | undefined;
}

function numberOr(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numberFromUnknown(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function stringOr(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function booleanOr(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeDateString(value: unknown) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^0001-01-01([t\s].*)?$/i.test(trimmed)) return undefined;
  if (trimmed.toLowerCase() === "null") return undefined;

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime()) && parsed.getUTCFullYear() <= 1) {
    return undefined;
  }

  return trimmed;
}

function dateOr(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDateString(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function normalizeNullableString(...values: unknown[]) {
  const value = stringOr(...values);
  return value || null;
}

function paginationFromCandidates<T>(root: any, candidates: string[]): PaginatedItems<T> {
  for (const candidate of candidates) {
    const container = root?.[candidate];
    if (container) {
      const items = Array.isArray(container?.items)
        ? (container.items as T[])
        : Array.isArray(container)
          ? (container as T[])
          : [];

      return {
        items,
        pageNumber: numberOr(container?.pageNumber, numberOr(root?.pageNumber, 1)),
        pageSize: numberOr(container?.pageSize, numberOr(root?.pageSize, items.length || 10)),
        totalCount: numberOr(container?.totalCount, items.length),
        totalPages: numberOr(
          container?.totalPages,
          Math.max(1, Math.ceil(numberOr(container?.totalCount, items.length) / Math.max(1, numberOr(container?.pageSize, items.length || 10))))
        ),
      };
    }
  }

  const items = Array.isArray(root?.items) ? (root.items as T[]) : Array.isArray(root) ? (root as T[]) : [];
  const pageSize = numberOr(root?.pageSize, items.length || 10);
  const totalCount = numberOr(root?.totalCount, items.length);

  return {
    items,
    pageNumber: numberOr(root?.pageNumber, 1),
    pageSize,
    totalCount,
    totalPages: numberOr(root?.totalPages, Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)))),
  };
}

function buildQuery<T extends object>(params?: T) {
  const query = new URLSearchParams();

  if (!params) return query.toString();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.append(key, String(value));
  });

  return query.toString();
}

function normalizeTemplate(item: any): LessonPlanTemplate {
  return {
    id: stringOr(item?.id),
    programId: stringOr(item?.programId),
    programName: stringOr(item?.programName) || undefined,
    level: stringOr(item?.level),
    title: stringOr(item?.title, item?.name, `Session ${numberOr(numberFromUnknown(item?.sessionIndex), 0)}`),
    sessionIndex: numberOr(numberFromUnknown(item?.sessionIndex)),
    syllabusMetadata: normalizeNullableString(item?.syllabusMetadata),
    syllabusContent: normalizeNullableString(item?.syllabusContent),
    sourceFileName: normalizeNullableString(item?.sourceFileName),
    attachment: normalizeNullableString(item?.attachment, item?.attachmentUrl, item?.fileUrl, item?.file?.url, item?.file?.path),
    isActive: typeof item?.isActive === "boolean" ? item.isActive : undefined,
    createdBy: stringOr(item?.createdBy) || undefined,
    createdByName:
      stringOr(item?.createdByName, item?.creatorName, item?.createdByUser?.fullName, item?.createdByUser?.name) || undefined,
    createdAt: dateOr(item?.createdAt),
    updatedAt: dateOr(item?.updatedAt, item?.modifiedAt, item?.lastUpdatedAt),
    usedCount: numberFromUnknown(item?.usedCount),
  };
}

function normalizeLessonPlan(item: any): LessonPlan {
  const session = item?.session ?? item?.classSession ?? item?.timetableSession;
  const lessonClass = item?.class ?? item?.classroom;
  const template = item?.template ?? item?.lessonPlanTemplate ?? item?.linkedTemplate;
  const submittedByUser =
    item?.submittedByUser ??
    item?.submittedByProfile ??
    item?.submittedByNavigation ??
    item?.submittedByAccount;
  const createdByUser =
    item?.createdByUser ??
    item?.createdByProfile ??
    item?.teacher ??
    item?.teacherProfile;

  return {
    id: stringOr(item?.id),
    classId: stringOr(item?.classId, lessonClass?.id),
    classCode: stringOr(item?.classCode, lessonClass?.classCode, lessonClass?.code) || undefined,
    classTitle:
      stringOr(item?.classTitle, item?.className, lessonClass?.classTitle, lessonClass?.title, lessonClass?.name) || undefined,
    sessionId: stringOr(item?.sessionId, session?.id),
    sessionTitle:
      stringOr(item?.sessionTitle, item?.sessionName, session?.sessionTitle, session?.title, session?.name) || undefined,
    sessionDate: dateOr(
      item?.sessionDate,
      item?.plannedDatetime,
      item?.plannedDateTime,
      item?.actualDatetime,
      session?.sessionDate,
      session?.plannedDatetime,
      session?.plannedDateTime,
      session?.actualDatetime
    ),
    templateId: normalizeNullableString(item?.templateId, template?.id),
    templateTitle: stringOr(item?.templateTitle, template?.title, template?.name) || undefined,
    templateLevel: stringOr(item?.templateLevel, template?.level) || undefined,
    templateSessionIndex: numberFromUnknown(item?.templateSessionIndex, template?.sessionIndex),
    plannedContent: normalizeNullableString(item?.plannedContent, item?.planContent, item?.expectedContent),
    actualContent: normalizeNullableString(item?.actualContent, item?.realContent, item?.deliveredContent),
    actualHomework: normalizeNullableString(item?.actualHomework, item?.homework, item?.actualHomeWork),
    teacherNotes: normalizeNullableString(item?.teacherNotes, item?.teacherNote, item?.note, item?.notes),
    submittedBy: normalizeNullableString(item?.submittedBy, item?.submittedById, submittedByUser?.id, item?.updatedBy, item?.createdBy),
    submittedByName:
      normalizeNullableString(
        item?.submittedByName,
        item?.submittedByUserName,
        submittedByUser?.fullName,
        submittedByUser?.name,
        item?.updatedByName,
        item?.createdByName,
        createdByUser?.fullName,
        createdByUser?.name,
        item?.teacherName
      ),
    submittedAt: dateOr(item?.submittedAt, item?.submissionDate, item?.submissionAt) || null,
    createdAt: dateOr(item?.createdAt),
    updatedAt: dateOr(item?.updatedAt, item?.modifiedAt, item?.lastUpdatedAt),
  };
}

function normalizeSyllabusSession(item: any): ClassLessonPlanSyllabusSession {
  return {
    sessionId: stringOr(item?.sessionId),
    sessionIndex: numberOr(numberFromUnknown(item?.sessionIndex)),
    sessionDate: dateOr(item?.sessionDate) || null,
    plannedTeacherId: normalizeNullableString(item?.plannedTeacherId),
    plannedTeacherName: normalizeNullableString(item?.plannedTeacherName),
    actualTeacherId: normalizeNullableString(item?.actualTeacherId),
    actualTeacherName: normalizeNullableString(item?.actualTeacherName),
    lessonPlanId: normalizeNullableString(item?.lessonPlanId),
    templateId: normalizeNullableString(item?.templateId),
    templateTitle: normalizeNullableString(item?.templateTitle),
    templateSyllabusContent: normalizeNullableString(item?.templateSyllabusContent),
    plannedContent: normalizeNullableString(item?.plannedContent),
    actualContent: normalizeNullableString(item?.actualContent),
    actualHomework: normalizeNullableString(item?.actualHomework),
    teacherNotes: normalizeNullableString(item?.teacherNotes),
    canEdit: booleanOr(item?.canEdit, false),
  };
}

function normalizeSyllabus(data: any): ClassLessonPlanSyllabus {
  return {
    classId: stringOr(data?.classId),
    classCode: stringOr(data?.classCode) || undefined,
    classTitle: stringOr(data?.classTitle) || undefined,
    programId: stringOr(data?.programId) || undefined,
    programName: stringOr(data?.programName) || undefined,
    syllabusMetadata: normalizeNullableString(data?.syllabusMetadata),
    sessions: Array.isArray(data?.sessions) ? data.sessions.map(normalizeSyllabusSession) : [],
  };
}

function normalizeImportedProgram(item: any): ImportedProgramSummary {
  return {
    programId: stringOr(item?.programId),
    programName: stringOr(item?.programName) || undefined,
    importedSessions: numberOr(numberFromUnknown(item?.importedSessions)),
  };
}

function extractErrorInfo(error: any) {
  const payload = (error?.response?.data || error?.data || {}) as ProblemDetails;
  const status = error?.response?.status ?? payload?.status;
  const title = payload?.title;
  const detail = payload?.detail;
  const message = stringOr(detail, payload?.error, payload?.message, title, error?.message, "Request failed");

  return {
    isSuccess: false as const,
    message,
    status,
    title,
    detail,
    raw: error?.response?.data ?? error,
  };
}

function successResponse<T>(data: T, response: ApiLikeResponse): ServiceResponse<T> {
  return {
    isSuccess: isSuccess(response),
    data,
    message: response?.message,
    raw: response,
  };
}

function errorResponse<T>(fallback: T, error: any): ServiceResponse<T> {
  return {
    ...extractErrorInfo(error),
    data: fallback,
  };
}

export async function getAllLessonPlanTemplates(
  params?: GetLessonPlanTemplatesParams
): Promise<ServiceResponse<{ templates: PaginatedItems<LessonPlanTemplate> }>> {
  try {
    const query = buildQuery(params);
    const url = `${ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES}${query ? `?${query}` : ""}`;
    const response = await get<ApiLikeResponse>(url);
    const data = unwrapData<any>(response);
    const pagination = paginationFromCandidates<any>(data, [
      "templates",
      "Templates",
      "lessonPlanTemplates",
      "LessonPlanTemplates",
    ]);

    return successResponse(
      {
        templates: {
          ...pagination,
          items: pagination.items.map(normalizeTemplate),
        },
      },
      response
    );
  } catch (error) {
    return errorResponse(
      {
        templates: {
          items: [],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1,
        },
      },
      error
    );
  }
}

export async function getLessonPlanTemplateById(id: string): Promise<ServiceResponse<LessonPlanTemplate | null>> {
  try {
    const response = await get<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id));
    const data = unwrapData<any>(response);
    const item = data?.lessonPlanTemplate ?? data?.template ?? data;

    return successResponse(item ? normalizeTemplate(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function createLessonPlanTemplate(
  data: CreateLessonPlanTemplateRequest
): Promise<ServiceResponse<LessonPlanTemplate | null>> {
  try {
    const response = await post<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES, data);
    const responseData = unwrapData<any>(response);
    const item = responseData?.lessonPlanTemplate ?? responseData?.template ?? responseData;

    return successResponse(item ? normalizeTemplate(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateLessonPlanTemplate(
  id: string,
  data: UpdateLessonPlanTemplateRequest
): Promise<ServiceResponse<LessonPlanTemplate | null>> {
  try {
    const response = await put<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id), data);
    const responseData = unwrapData<any>(response);
    const item = responseData?.lessonPlanTemplate ?? responseData?.template ?? responseData;

    return successResponse(item ? normalizeTemplate(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function importLessonPlanTemplates(
  payload: ImportLessonPlanTemplatesRequest
): Promise<ServiceResponse<ImportLessonPlanTemplatesResult | null>> {
  const token = getAccessToken();

  if (!token) {
    return {
      isSuccess: false,
      data: null,
      message: "Chua dang nhap.",
    };
  }

  try {
    const query = new URLSearchParams();

    if (payload.programId) query.append("programId", payload.programId);
    if (payload.level) query.append("level", payload.level);
    if (payload.overwriteExisting !== undefined) {
      query.append("overwriteExisting", String(payload.overwriteExisting));
    }

    const url = `${ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_IMPORT}${query.toString() ? `?${query.toString()}` : ""}`;
    const formData = new FormData();
    formData.append("file", payload.file);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        isSuccess: false,
        data: null,
        message: stringOr(data?.detail, data?.error, data?.message, data?.title, "Import file that bai."),
        status: typeof data?.status === "number" ? data.status : response.status,
        title: stringOr(data?.title) || undefined,
        detail: stringOr(data?.detail) || undefined,
        raw: data,
      };
    }

    const payloadData = data?.data ?? data;

    return {
      isSuccess: true,
      data: {
        importedCount: numberOr(numberFromUnknown(payloadData?.importedCount)),
        programs: Array.isArray(payloadData?.programs) ? payloadData.programs.map(normalizeImportedProgram) : [],
      },
      message: data?.message,
      raw: data,
    };
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function getClassLessonPlanSyllabus(
  classId: string
): Promise<ServiceResponse<ClassLessonPlanSyllabus | null>> {
  try {
    const response = await get<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS_CLASS_SYLLABUS(classId));
    const data = unwrapData<any>(response);

    return successResponse(data ? normalizeSyllabus(data) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function getLessonPlanById(id: string): Promise<ServiceResponse<LessonPlan | null>> {
  try {
    const response = await get<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS_BY_ID(id));
    const data = unwrapData<any>(response);
    const item = data?.lessonPlan ?? data?.plan ?? data;

    return successResponse(item ? normalizeLessonPlan(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function createLessonPlan(data: CreateLessonPlanRequest): Promise<ServiceResponse<LessonPlan | null>> {
  try {
    const response = await post<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS, data);
    const responseData = unwrapData<any>(response);
    const item = responseData?.lessonPlan ?? responseData?.plan ?? responseData;

    return successResponse(item ? normalizeLessonPlan(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function updateLessonPlan(
  id: string,
  data: UpdateLessonPlanRequest
): Promise<ServiceResponse<LessonPlan | null>> {
  try {
    const response = await put<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS_BY_ID(id), data);
    const responseData = unwrapData<any>(response);
    const item = responseData?.lessonPlan ?? responseData?.plan ?? responseData;

    return successResponse(item ? normalizeLessonPlan(item) : null, response);
  } catch (error) {
    return errorResponse(null, error);
  }
}

export async function uploadLessonPlanFile(
  kind: LessonPlanUploadKind,
  file: File,
  options?: { isVideo?: boolean }
): Promise<LessonPlanFileUploadResponse> {
  const folder =
    kind === "template"
      ? "lesson-plan/template"
      : kind === "materials"
        ? "lesson-plan/materials"
        : "lesson-plan/media";
  const resourceType = kind === "media" && booleanOr(options?.isVideo, false) ? "video" : "auto";
  const uploadResponse = await uploadFile(file, folder, resourceType);

  if (!isUploadSuccess(uploadResponse)) {
    throw new Error(stringOr(uploadResponse?.error, uploadResponse?.detail, uploadResponse?.title, "Tai file len that bai."));
  }

  return {
    url: stringOr(uploadResponse?.url),
    fileName: stringOr(uploadResponse?.fileName),
    size: numberOr(uploadResponse?.size),
    folder: stringOr(uploadResponse?.folder),
    resourceType,
  };
}

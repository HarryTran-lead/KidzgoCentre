/**
 * Lesson Plan + Lesson Plan Template API helper functions.
 *
 * The backend responses in this project are not fully consistent between
 * list/detail/create endpoints, so this service normalizes the data shape
 * before it reaches the UI.
 */

import { ADMIN_ENDPOINTS, FILE_ENDPOINTS } from "@/constants/apiURL";
import { del, get, patch, post, put } from "@/lib/axios";
import { getAccessToken } from "@/lib/store/authToken";

type ApiLikeResponse = {
  success?: boolean;
  isSuccess?: boolean;
  data?: unknown;
  message?: string;
};

type PaginatedItems<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export interface LessonPlanTemplate {
  id: string;
  programId: string;
  programName?: string;
  level: string;
  title: string;
  sessionIndex: number;
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
  attachment?: string | null;
}

export interface UpdateLessonPlanTemplateRequest {
  level?: string;
  title?: string;
  sessionIndex?: number;
  attachment?: string | null;
  isActive?: boolean;
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
  plannedContent?: string;
  actualContent?: string;
  actualHomework?: string;
  teacherNotes?: string;
  submittedBy?: string;
  submittedByName?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetLessonPlansParams {
  sessionId?: string;
  classId?: string;
  templateId?: string;
  submittedBy?: string;
  fromDate?: string;
  toDate?: string;
  includeDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateLessonPlanRequest {
  classId: string;
  sessionId: string;
  templateId?: string | null;
  plannedContent: string;
  actualContent?: string;
  actualHomework?: string;
  teacherNotes?: string;
}

export interface UpdateLessonPlanRequest {
  templateId?: string | null;
  plannedContent?: string;
  actualContent?: string;
  actualHomework?: string;
  teacherNotes?: string;
}

export interface UpdateLessonPlanActualRequest {
  actualContent?: string;
  actualHomework?: string;
  teacherNotes?: string;
}

export interface LessonPlanTemplateListResponse {
  isSuccess: boolean;
  data: {
    templates: PaginatedItems<LessonPlanTemplate>;
  };
  message?: string;
  raw?: unknown;
}

export interface LessonPlanTemplateResponse {
  isSuccess: boolean;
  data: LessonPlanTemplate | null;
  message?: string;
  raw?: unknown;
}

export interface LessonPlanListResponse {
  isSuccess: boolean;
  data: {
    lessonPlans: PaginatedItems<LessonPlan>;
  };
  message?: string;
  raw?: unknown;
}

export interface LessonPlanResponse {
  isSuccess: boolean;
  data: LessonPlan | null;
  message?: string;
  raw?: unknown;
}

export interface DeleteEntityResponse {
  isSuccess: boolean;
  message?: string;
  raw?: unknown;
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

function arrayFromCandidates<T>(root: any, candidates: string[]) {
  for (const candidate of candidates) {
    const direct = root?.[candidate];
    if (Array.isArray(direct)) {
      return direct as T[];
    }
    if (Array.isArray(direct?.items)) {
      return direct.items as T[];
    }
  }

  if (Array.isArray(root?.items)) {
    return root.items as T[];
  }

  if (Array.isArray(root)) {
    return root as T[];
  }

  return [] as T[];
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

function normalizeTemplate(item: any): LessonPlanTemplate {
  return {
    id: stringOr(item?.id),
    programId: stringOr(item?.programId),
    programName: stringOr(item?.programName) || undefined,
    level: stringOr(item?.level),
    title: stringOr(item?.title, item?.name, `Session ${numberOr(numberFromUnknown(item?.sessionIndex), 0)}`),
    sessionIndex: numberOr(numberFromUnknown(item?.sessionIndex)),
    attachment: stringOr(item?.attachment, item?.attachmentUrl, item?.fileUrl, item?.file?.url, item?.file?.path) || null,
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
    templateId: stringOr(item?.templateId, template?.id) || null,
    templateTitle: stringOr(item?.templateTitle, template?.title, template?.name) || undefined,
    templateLevel: stringOr(item?.templateLevel, template?.level) || undefined,
    templateSessionIndex: numberFromUnknown(item?.templateSessionIndex, template?.sessionIndex),
    plannedContent: stringOr(item?.plannedContent, item?.planContent, item?.expectedContent) || undefined,
    actualContent: stringOr(item?.actualContent, item?.realContent, item?.deliveredContent) || undefined,
    actualHomework: stringOr(item?.actualHomework, item?.homework, item?.actualHomeWork) || undefined,
    teacherNotes: stringOr(item?.teacherNotes, item?.teacherNote, item?.note, item?.notes) || undefined,
    submittedBy: stringOr(item?.submittedBy, item?.submittedById, submittedByUser?.id, item?.updatedBy, item?.createdBy) || undefined,
    submittedByName:
      stringOr(
        item?.submittedByName,
        item?.submittedByUserName,
        submittedByUser?.fullName,
        submittedByUser?.name,
        item?.updatedByName,
        item?.createdByName,
        createdByUser?.fullName,
        createdByUser?.name,
        item?.teacherName
      ) || undefined,
    submittedAt: dateOr(item?.submittedAt, item?.submissionDate, item?.submissionAt),
    createdAt: dateOr(item?.createdAt),
    updatedAt: dateOr(item?.updatedAt, item?.modifiedAt, item?.lastUpdatedAt),
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

function templateResponse(response: ApiLikeResponse): LessonPlanTemplateResponse {
  const data = unwrapData<any>(response);
  const item = data?.lessonPlanTemplate ?? data?.template ?? data;

  return {
    isSuccess: isSuccess(response),
    data: item ? normalizeTemplate(item) : null,
    message: response?.message,
    raw: response,
  };
}

function lessonPlanResponse(response: ApiLikeResponse): LessonPlanResponse {
  const data = unwrapData<any>(response);
  const item = data?.lessonPlan ?? data?.plan ?? data;

  return {
    isSuccess: isSuccess(response),
    data: item ? normalizeLessonPlan(item) : null,
    message: response?.message,
    raw: response,
  };
}

export async function getAllLessonPlanTemplates(
  params?: GetLessonPlanTemplatesParams
): Promise<LessonPlanTemplateListResponse> {
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

  return {
    isSuccess: isSuccess(response),
    data: {
      templates: {
        ...pagination,
        items: pagination.items.map(normalizeTemplate),
      },
    },
    message: response?.message,
    raw: response,
  };
}

export async function getLessonPlanTemplateById(id: string): Promise<LessonPlanTemplateResponse> {
  const response = await get<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id));
  return templateResponse(response);
}

export async function createLessonPlanTemplate(
  data: CreateLessonPlanTemplateRequest
): Promise<LessonPlanTemplateResponse> {
  const response = await post<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES, data);
  return templateResponse(response);
}

export async function updateLessonPlanTemplate(
  id: string,
  data: UpdateLessonPlanTemplateRequest
): Promise<LessonPlanTemplateResponse> {
  const response = await put<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id), data);
  return templateResponse(response);
}

export async function deleteLessonPlanTemplate(id: string): Promise<DeleteEntityResponse> {
  const response = await del<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id));
  return {
    isSuccess: isSuccess(response),
    message: response?.message,
    raw: response,
  };
}

export async function getAllLessonPlans(params?: GetLessonPlansParams): Promise<LessonPlanListResponse> {
  const query = buildQuery(params);
  const url = `${ADMIN_ENDPOINTS.LESSON_PLANS}${query ? `?${query}` : ""}`;
  const response = await get<ApiLikeResponse>(url);
  const data = unwrapData<any>(response);
  const pagination = paginationFromCandidates<any>(data, [
    "lessonPlans",
    "LessonPlans",
    "plans",
    "Plans",
  ]);

  return {
    isSuccess: isSuccess(response),
    data: {
      lessonPlans: {
        ...pagination,
        items: pagination.items.map(normalizeLessonPlan),
      },
    },
    message: response?.message,
    raw: response,
  };
}

export async function getLessonPlanById(id: string): Promise<LessonPlanResponse> {
  const response = await get<ApiLikeResponse>(`${ADMIN_ENDPOINTS.LESSON_PLANS}/${id}`);
  return lessonPlanResponse(response);
}

export async function createLessonPlan(data: CreateLessonPlanRequest): Promise<LessonPlanResponse> {
  const response = await post<ApiLikeResponse>(ADMIN_ENDPOINTS.LESSON_PLANS, data);
  return lessonPlanResponse(response);
}

export async function updateLessonPlan(
  id: string,
  data: UpdateLessonPlanRequest
): Promise<LessonPlanResponse> {
  const response = await put<ApiLikeResponse>(`${ADMIN_ENDPOINTS.LESSON_PLANS}/${id}`, data);
  return lessonPlanResponse(response);
}

export async function updateLessonPlanActual(
  id: string,
  data: UpdateLessonPlanActualRequest
): Promise<LessonPlanResponse> {
  const response = await patch<ApiLikeResponse>(`${ADMIN_ENDPOINTS.LESSON_PLANS}/${id}/actual`, data);
  return lessonPlanResponse(response);
}

export async function deleteLessonPlan(id: string): Promise<DeleteEntityResponse> {
  const response = await del<ApiLikeResponse>(`${ADMIN_ENDPOINTS.LESSON_PLANS}/${id}`);
  return {
    isSuccess: isSuccess(response),
    message: response?.message,
    raw: response,
  };
}

export async function uploadLessonPlanFile(
  kind: LessonPlanUploadKind,
  file: File,
  options?: { isVideo?: boolean }
): Promise<LessonPlanFileUploadResponse> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Chưa đăng nhập.");
  }

  const folder =
    kind === "template"
      ? "lesson-plan/template"
      : kind === "materials"
        ? "lesson-plan/materials"
        : "lesson-plan/media";
  const resourceType = kind === "media" && booleanOr(options?.isVideo, false) ? "video" : "auto";
  const endpoint = `${FILE_ENDPOINTS.UPLOAD}?folder=${encodeURIComponent(folder)}&resourceType=${encodeURIComponent(resourceType)}`;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      stringOr(data?.message, data?.error, data?.detail, data?.title, "Tải file lên thất bại.")
    );
  }

  return {
    url: stringOr(data?.url),
    fileName: stringOr(data?.fileName),
    size: numberOr(data?.size),
    folder: stringOr(data?.folder),
    resourceType: stringOr(data?.resourceType) || undefined,
  };
}

export function getTemplateItems(response: LessonPlanTemplateListResponse) {
  return response.data.templates.items;
}

export function getLessonPlanItems(response: LessonPlanListResponse) {
  return response.data.lessonPlans.items;
}

// Backward-compatible aliases for older imports.
export const listLessonPlanTemplates = getAllLessonPlanTemplates;
export const listLessonPlans = getAllLessonPlans;

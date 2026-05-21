/**
 * Class API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { CLASS_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put } from "@/lib/axios";
import {
  buildWeeklyRRule,
  type WeekdayCode,
  validateFutureStretchInput as validateFutureStretchInputCore,
} from "@/lib/schedulePattern";
import type { ApiResponse } from "@/types/apiResponse";
import type { ClassModuleProgressDto, ClassModuleProgressDetailDto } from "@/types/academic-progression";
import type {
  CreateClassRequest,
  UpdateClassRequest,
  CreateClassResponse,
  ClassApiDetail,
  PreviewSessionsRequest,
  PreviewSessionsResponse,
  ResyncFutureLessonsResponse,
} from "@/types/admin/classes";

export interface AddClassScheduleSegmentRequest {
  effectiveFrom: string;
  schedulePattern: string;
  effectiveTo?: string | null;
  generateSessions?: boolean;
  onlyFutureSessions?: boolean;
}

export interface ClassScheduleSegmentResult {
  id: string;
  classId: string;
  programId?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  schedulePattern: string;
  generatedSessionsCount?: number;
}

export type AddClassScheduleSegmentResponse = ApiResponse<ClassScheduleSegmentResult>;

export interface BuildFutureStretchPayloadInput {
  effectiveFrom: string;
  days: WeekdayCode[];
  effectiveTo?: string | null;
  generateSessions?: boolean;
  onlyFutureSessions?: boolean;
  startTime?: string;
  durationMinutes?: number;
}

export interface ValidateFutureStretchPayloadInput {
  effectiveFrom: string;
  days: WeekdayCode[];
  currentSessionsPerWeek?: number;
}

/**
 * Get all classes with optional pagination
 */
export async function getAllClasses(params?: {
  pageNumber?: number;
  pageSize?: number;
  branchId?: string;
  programId?: string;
  teacherId?: string;
  studentId?: string;
  levelId?: string;
  currentModuleId?: string;
  status?: string;
  searchTerm?: string;
  schedulePattern?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params?.branchId) queryParams.append("branchId", params.branchId);
  if (params?.programId) queryParams.append("programId", params.programId);
  if (params?.teacherId) queryParams.append("teacherId", params.teacherId);
  if (params?.studentId) queryParams.append("studentId", params.studentId);
  if (params?.levelId) queryParams.append("levelId", params.levelId);
  if (params?.currentModuleId) queryParams.append("currentModuleId", params.currentModuleId);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.searchTerm) queryParams.append("searchTerm", params.searchTerm);
  if (params?.schedulePattern) queryParams.append("schedulePattern", params.schedulePattern);

  const url = queryParams.toString()
    ? `${CLASS_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
    : CLASS_ENDPOINTS.GET_ALL;
  
  return get<any>(url);
}

export async function createClass(payload: CreateClassRequest): Promise<ApiResponse<CreateClassResponse>> {
  return post<ApiResponse<CreateClassResponse>>(CLASS_ENDPOINTS.CREATE, payload);
}

export async function previewSessions(payload: PreviewSessionsRequest): Promise<ApiResponse<PreviewSessionsResponse>> {
  return post<ApiResponse<PreviewSessionsResponse>>(CLASS_ENDPOINTS.PREVIEW_SESSIONS, payload);
}

export async function updateClass(id: string, payload: UpdateClassRequest): Promise<ApiResponse<CreateClassResponse>> {
  return put<ApiResponse<CreateClassResponse>>(CLASS_ENDPOINTS.UPDATE(id), payload);
}

export async function resyncFutureLessons(id: string): Promise<ApiResponse<ResyncFutureLessonsResponse>> {
  return post<ApiResponse<ResyncFutureLessonsResponse>>(CLASS_ENDPOINTS.RESYNC_FUTURE_LESSONS(id), {});
}

export async function getClassById(id: string): Promise<ApiResponse<ClassApiDetail>> {
  return get<ApiResponse<ClassApiDetail>>(CLASS_ENDPOINTS.GET_BY_ID(id));
}

export async function addClassScheduleSegment(
  id: string,
  payload: AddClassScheduleSegmentRequest
): Promise<AddClassScheduleSegmentResponse> {
  return post<AddClassScheduleSegmentResponse>(
    CLASS_ENDPOINTS.SCHEDULE_SEGMENTS(id),
    payload
  );
}

export function buildFutureStretchPayload(
  input: BuildFutureStretchPayloadInput
): AddClassScheduleSegmentRequest {
  return {
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    schedulePattern: buildWeeklyRRule({
      days: input.days,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
    }),
    generateSessions: input.generateSessions ?? true,
    onlyFutureSessions: input.onlyFutureSessions ?? true,
  };
}

export function validateFutureStretchPayload(
  input: ValidateFutureStretchPayloadInput
): string[] {
  return validateFutureStretchInputCore({
    effectiveFrom: input.effectiveFrom,
    days: input.days,
    currentSessionsPerWeek: input.currentSessionsPerWeek,
  });
}

export async function getClassModuleProgress(classId: string): Promise<ClassModuleProgressDto[]> {
  const response = await get<any>(CLASS_ENDPOINTS.MODULE_PROGRESS(classId));
  const items = Array.isArray(response?.data) ? response.data
    : Array.isArray(response?.data?.items) ? response.data.items
    : Array.isArray(response) ? response
    : [];
  return items;
}

export async function getClassModuleProgressByModule(
  classId: string,
  moduleId: string
): Promise<ClassModuleProgressDetailDto | null> {
  const response = await get<any>(CLASS_ENDPOINTS.MODULE_PROGRESS_BY_MODULE(classId, moduleId));
  return response?.data ?? response ?? null;
}

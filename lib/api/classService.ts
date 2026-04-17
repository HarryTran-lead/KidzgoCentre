/**
 * Class API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { CLASS_ENDPOINTS } from "@/constants/apiURL";
import { get, post } from "@/lib/axios";
import {
  buildWeeklyRRule,
  type WeekdayCode,
  validateFutureStretchInput as validateFutureStretchInputCore,
} from "@/lib/schedulePattern";
import type { ApiResponse } from "@/types/apiResponse";
import type { StudentClassResponse } from "@/types/student/class";

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
  schedulePattern?: string;
}): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
  if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  if (params?.branchId) queryParams.append("branchId", params.branchId);
  if (params?.schedulePattern) queryParams.append("schedulePattern", params.schedulePattern);

  const url = queryParams.toString()
    ? `${CLASS_ENDPOINTS.GET_ALL}?${queryParams.toString()}`
    : CLASS_ENDPOINTS.GET_ALL;
  
  return get<any>(url);
}

export async function getClassById(id: string): Promise<StudentClassResponse> {
  const endpoint = CLASS_ENDPOINTS.GET_BY_ID
    ? CLASS_ENDPOINTS.GET_BY_ID(id)
    : `/api/classes/${id}`;

  return get<StudentClassResponse>(endpoint);
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

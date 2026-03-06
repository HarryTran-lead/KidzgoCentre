/**
 * Lesson Plan API Helper Functions
 *
 * This file provides type-safe helper functions for lesson plan API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { ADMIN_ENDPOINTS } from '@/constants/apiURL';
import { get, post, put, del } from '@/lib/axios';

// Types based on the API documentation
export interface CreateLessonPlanRequest {
  classId: string;
  sessionId: string;
  templateId: string;
  plannedContent: string;
  actualContent: string;
  actualHomework: string;
  teacherNotes: string;
}

export interface UpdateLessonPlanRequest {
  plannedContent?: string;
  actualContent?: string;
  actualHomework?: string;
  teacherNotes?: string;
}

export interface LessonPlan {
  id: string;
  classId: string;
  sessionId: string;
  templateId: string;
  plannedContent: string;
  actualContent: string;
  actualHomework: string;
  teacherNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonPlanResponse {
  isSuccess: boolean;
  data: {
    lessonPlan: LessonPlan;
  };
  message?: string;
}

export interface LessonPlanListResponse {
  isSuccess: boolean;
  data: {
    lessonPlans: LessonPlan[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
  message?: string;
}

export interface ApiErrorResponse {
  isSuccess: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Create a new lesson plan
 */
export async function createLessonPlan(
  data: CreateLessonPlanRequest
): Promise<LessonPlanResponse> {
  return post<LessonPlanResponse>(ADMIN_ENDPOINTS.LESSON_PLANS, data);
}

/**
 * Get all lesson plans with optional filters
 */
export async function getAllLessonPlans(params?: {
  classId?: string;
  sessionId?: string;
  templateId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<LessonPlanListResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.classId) queryParams.append('classId', params.classId);
    if (params.sessionId) queryParams.append('sessionId', params.sessionId);
    if (params.templateId) queryParams.append('templateId', params.templateId);
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  }

  const url = `${ADMIN_ENDPOINTS.LESSON_PLANS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get<LessonPlanListResponse>(url);
}

/**
 * Get a lesson plan by ID
 */
export async function getLessonPlanById(
  id: string
): Promise<LessonPlanResponse> {
  return get<LessonPlanResponse>(`${ADMIN_ENDPOINTS.LESSON_PLANS}/${id}`);
}

/**
 * Update an existing lesson plan
 */
export async function updateLessonPlan(
  id: string,
  data: UpdateLessonPlanRequest
): Promise<LessonPlanResponse> {
  return put<LessonPlanResponse>(`${ADMIN_ENDPOINTS.LESSON_PLANS}/${id}`, data);
}

/**
 * Delete a lesson plan
 */
export async function deleteLessonPlan(
  id: string
): Promise<{ isSuccess: boolean; message?: string }> {
  return del<{ isSuccess: boolean; message?: string }>(`${ADMIN_ENDPOINTS.LESSON_PLANS}/${id}`);
}

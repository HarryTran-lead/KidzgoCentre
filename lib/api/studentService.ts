/**
 * Student API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { STUDENT_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import type { StudentClassesResponse } from "@/types/student/class";
type StudentClassesParams = { pageNumber?: number; pageSize?: number };

export async function getStudentClasses(
  params?: StudentClassesParams
): Promise<StudentClassesResponse> {
 const endpoint =
    typeof STUDENT_ENDPOINTS.GET_CLASSES === "function"
      ? STUDENT_ENDPOINTS.GET_CLASSES()
      : "/api/students/classes";

  return get<StudentClassesResponse>(endpoint, {
    params: params ?? {},
  });
}
/**
 * Student API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { STUDENT_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import type { StudentClassesResponse } from "@/types/student/class";

export async function getStudentClasses(
  studentId: string,
  params?: { pageNumber?: number; pageSize?: number }
): Promise<StudentClassesResponse> {
  return get<StudentClassesResponse>(STUDENT_ENDPOINTS.GET_CLASSES(studentId), {
    params,
  });
}
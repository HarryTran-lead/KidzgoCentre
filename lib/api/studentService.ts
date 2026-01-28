/**
 * Student API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { CLASS_ENDPOINTS, STUDENT_ENDPOINTS } from "@/constants/apiURL";import { get } from "@/lib/axios";
import type { StudentClassesResponse } from "@/types/student/class";
import type { StudentsResponse } from "@/types/student/student";

type StudentClassesParams = {
  pageNumber?: number;
  pageSize?: number;
  studentId?: string;
};

type StudentListParams = {
  searchTerm?: string;
  userId?: string;
  profileType?: string;
  isActive?: boolean;
  branchId?: string;
  pageNumber?: number;
  pageSize?: number;
};

export async function getStudentClasses(
  params?: StudentClassesParams
): Promise<StudentClassesResponse> {
  const endpoint =
    CLASS_ENDPOINTS.GET_ALL ?? "/api/classes";

  return get<StudentClassesResponse>(endpoint, {
    params: params ?? {},
  });
}

export async function getAllStudents(
  params?: StudentListParams
): Promise<StudentsResponse> {
  const endpoint = STUDENT_ENDPOINTS.GET_ALL ?? "/api/students";

  return get<StudentsResponse>(endpoint, {
    params: params ?? {},
  });
}


/**
 * Class API Helper Functions
 *
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { CLASS_ENDPOINTS } from "@/constants/apiURL";
import { get } from "@/lib/axios";
import type { StudentClassResponse } from "@/types/student/class";

export async function getClassById(id: string): Promise<StudentClassResponse> {
  const endpoint = CLASS_ENDPOINTS.GET_BY_ID
    ? CLASS_ENDPOINTS.GET_BY_ID(id)
    : `/api/classes/${id}`;

  return get<StudentClassResponse>(endpoint);
}
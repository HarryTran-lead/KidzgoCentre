/**
 * Dashboard API Helper Functions
 *
 * This file provides type-safe helper functions for dashboard/overview API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { OVERVIEW_ENDPOINTS } from '@/constants/apiURL';
import { get } from '@/lib/axios';
import type {
  AdminOverviewParams,
  AdminOverviewApiResponse,
} from '@/types/dashboard';

/**
 * Get admin dashboard overview data
 */
export async function getAdminOverview(
  params?: AdminOverviewParams
): Promise<AdminOverviewApiResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.classId) queryParams.append('classId', params.classId);
    if (params.studentProfileId) queryParams.append('studentProfileId', params.studentProfileId);
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
  }

  const url = OVERVIEW_ENDPOINTS.ADMIN;
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

  return get<AdminOverviewApiResponse>(fullUrl);
}

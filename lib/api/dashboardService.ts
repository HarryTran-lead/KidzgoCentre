/**
 * Dashboard API Helper Functions
 *
 * This file provides type-safe helper functions for dashboard/overview API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { OVERVIEW_ENDPOINTS, DASHBOARD_ENDPOINTS } from '@/constants/apiURL';
import { get } from '@/lib/axios';
import type {
  AdminOverviewParams,
  AdminOverviewApiResponse,
  DashboardQueryParams,
  DashboardOverallApiResponse,
  DashboardStudentApiResponse,
  DashboardAcademicApiResponse,
  DashboardFinanceApiResponse,
  DashboardHRApiResponse,
  DashboardLeadsApiResponse,
} from '@/types/dashboard';

// ==================== Helper ====================

function buildQueryString(params?: DashboardQueryParams): string {
  if (!params) return '';
  const qp = new URLSearchParams();
  if (params.branchId) qp.append('branchId', params.branchId);
  if (params.fromDate) qp.append('fromDate', params.fromDate);
  if (params.toDate) qp.append('toDate', params.toDate);
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
}

// ==================== New Dashboard APIs ====================

/**
 * GET /api/dashboard/overall – Tổng quan tất cả các phần
 */
export async function getDashboardOverall(
  params?: DashboardQueryParams
): Promise<DashboardOverallApiResponse> {
  const url = `${DASHBOARD_ENDPOINTS.OVERALL}${buildQueryString(params)}`;
  return get<DashboardOverallApiResponse>(url);
}

/**
 * GET /api/dashboard/student – Thống kê học viên
 */
export async function getDashboardStudent(
  params?: DashboardQueryParams
): Promise<DashboardStudentApiResponse> {
  const url = `${DASHBOARD_ENDPOINTS.STUDENT}${buildQueryString(params)}`;
  return get<DashboardStudentApiResponse>(url);
}

/**
 * GET /api/dashboard/academic – Điểm danh, bài tập, nghỉ phép, bù lớp
 */
export async function getDashboardAcademic(
  params?: DashboardQueryParams
): Promise<DashboardAcademicApiResponse> {
  const url = `${DASHBOARD_ENDPOINTS.ACADEMIC}${buildQueryString(params)}`;
  return get<DashboardAcademicApiResponse>(url);
}

/**
 * GET /api/dashboard/finance – Tài chính & hóa đơn
 */
export async function getDashboardFinance(
  params?: DashboardQueryParams
): Promise<DashboardFinanceApiResponse> {
  const url = `${DASHBOARD_ENDPOINTS.FINANCE}${buildQueryString(params)}`;
  return get<DashboardFinanceApiResponse>(url);
}

/**
 * GET /api/dashboard/hr – Nhân sự & bảng lương
 */
export async function getDashboardHR(
  params?: DashboardQueryParams
): Promise<DashboardHRApiResponse> {
  const url = `${DASHBOARD_ENDPOINTS.HR}${buildQueryString(params)}`;
  return get<DashboardHRApiResponse>(url);
}

/**
 * GET /api/dashboard/leads – Leads & kiểm tra xếp lớp
 */
export async function getDashboardLeads(
  params?: DashboardQueryParams
): Promise<DashboardLeadsApiResponse> {
  const url = `${DASHBOARD_ENDPOINTS.LEADS}${buildQueryString(params)}`;
  return get<DashboardLeadsApiResponse>(url);
}

// ==================== Legacy ====================

/**
 * Get admin dashboard overview data (legacy endpoint)
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


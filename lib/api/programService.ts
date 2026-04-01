/**
 * Program/Course Management API Helper Functions
 * 
 * This file provides helper functions for program management API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { ADMIN_ENDPOINTS } from '@/constants/apiURL';
import { get } from '@/lib/axios';
import type { Program } from '@/types/admin/programs';

export interface GetAllProgramsApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  data: {
    items: Program[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
  message?: string;
}

interface ProgramQueryOptions {
  branchId?: string;
  pageSize?: number;
}

function pickProgramItems(response: any): any[] {
  if (Array.isArray(response?.data?.items?.items)) {
    return response.data.items.items;
  }
  if (Array.isArray(response?.data?.programs?.items)) {
    return response.data.programs.items;
  }
  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }
  if (Array.isArray(response?.items?.items)) {
    return response.items.items;
  }
  if (Array.isArray(response?.data?.programs)) {
    return response.data.programs;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function mapProgram(item: any): Program {
  return {
    id: item.id || item.programId || item.program_id || item.code || '',
    code: item.code || item.programCode || item.program_code || null,
    name: item.name || item.programName || item.title || item.programTitle || '',
    isMakeup: item.isMakeup ?? item.is_makeup ?? null,
    isSupplementary: item.isSupplementary ?? item.is_supplementary ?? null,
    totalSessions: item.totalSessions || 0,
    defaultTuitionAmount: item.defaultTuitionAmount || 0,
    unitPriceSession: item.unitPriceSession || 0,
    description: item.description || null,
    branchId: item.branchId || null,
    isActive: item.isActive ?? true,
  };
}

async function fetchPrograms(
  endpoint: string,
  options?: ProgramQueryOptions
): Promise<Program[]> {
  const params = new URLSearchParams({
    pageNumber: '1',
    pageSize: String(options?.pageSize ?? 100),
  });

  if (options?.branchId) {
    params.append('branchId', options.branchId);
  }

  const response = await get<any>(`${endpoint}?${params.toString()}`);
  return pickProgramItems(response)
    .map(mapProgram)
    .filter((program: Program) => Boolean(program.id));
}

/**
 * Get all programs/courses for dropdown selection
 */
export async function getAllProgramsForDropdown(branchId?: string): Promise<Program[]> {
  try {
    return await fetchPrograms(ADMIN_ENDPOINTS.PROGRAMS, { branchId });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

export async function getProgramsForBranchDropdown(branchId: string): Promise<Program[]> {
  try {
    return await fetchPrograms(ADMIN_ENDPOINTS.PROGRAMS, { branchId, pageSize: 200 });
  } catch (error) {
    console.error('Error fetching programs by branch:', error);
    return [];
  }
}

export async function getActiveProgramsForDropdown(branchId?: string): Promise<Program[]> {
  try {
    return await fetchPrograms(ADMIN_ENDPOINTS.PROGRAMS_ACTIVE, { branchId });
  } catch (error) {
    console.error('Error fetching active programs:', error);
    return [];
  }
}

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

/**
 * Get all programs/courses for dropdown selection
 */
export async function getAllProgramsForDropdown(): Promise<Program[]> {
  try {
    const response = await get<any>(`${ADMIN_ENDPOINTS.PROGRAMS}?pageNumber=1&pageSize=100`);
    
    console.log('Programs API Response raw:', JSON.stringify(response, null, 2));
    
    let items: any[] = [];
    
    // Based on admin programs API format: json.data.programs.items
    if (Array.isArray(response?.data?.programs?.items)) {
      console.log('Case: data.programs.items');
      items = response.data.programs.items;
    } else if (Array.isArray(response?.data?.items)) {
      console.log('Case: data.items');
      items = response.data.items;
    } else if (Array.isArray(response?.data?.programs)) {
      console.log('Case: data.programs');
      items = response.data.programs;
    } else if (Array.isArray(response?.data)) {
      console.log('Case: data (direct array)');
      items = response.data;
    } else if (Array.isArray(response)) {
      console.log('Case: root array');
      items = response;
    }
    
    // Map to Program type
    const programs: Program[] = items.map((item: any) => ({
      id: item.id || item.code || '',
      code: item.code || null,
      name: item.name || '',
      level: item.level || '',
      totalSessions: item.totalSessions || 0,
      defaultTuitionAmount: item.defaultTuitionAmount || 0,
      unitPriceSession: item.unitPriceSession || 0,
      description: item.description || null,
      branchId: item.branchId || null,
      isActive: item.isActive ?? true,
    })).filter((p: Program) => p.id);
    
    console.log('Programs mapped:', programs);
    return programs;
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

/**
 * Document (Lesson Plan Template) Management API Helper Functions
 * 
 * This file provides type-safe helper functions for document management API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { ADMIN_ENDPOINTS } from '@/constants/apiURL';
import { get, post, put, del } from '@/lib/axios';
import type {
  GetAllDocumentsParams,
  GetAllDocumentsApiResponse,
  GetDocumentByIdApiResponse,
  CreateDocumentRequest,
  CreateDocumentApiResponse,
  UpdateDocumentRequest,
  UpdateDocumentApiResponse,
  DeleteDocumentApiResponse,
  LessonPlanTemplate,
} from '@/types/admin/document';

/**
 * Get all documents (lesson plan templates) with optional filters and pagination
 */
export async function getAllDocuments(params?: GetAllDocumentsParams): Promise<GetAllDocumentsApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.programId) queryParams.append('programId', params.programId);
    if (params.level) queryParams.append('level', params.level);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.includeDeleted !== undefined) queryParams.append('includeDeleted', params.includeDeleted.toString());
    
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    else if (params.page) queryParams.append('page', params.page.toString());
    
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    // else if (params.limit) queryParams.append('limit', params.limit.toString());
    
    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.gradeLevel) queryParams.append('gradeLevel', params.gradeLevel);
    if (params.subject) queryParams.append('subject', params.subject);
  }

  const url = `${ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return get(url);
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(id: string): Promise<GetDocumentByIdApiResponse> {
  return get(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id));
}

/**
 * Create a new document (lesson plan template)
 */
export async function createDocument(data: CreateDocumentRequest): Promise<CreateDocumentApiResponse> {
  return post(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES, data);
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, data: UpdateDocumentRequest): Promise<UpdateDocumentApiResponse> {
  return put(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id), data);
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<DeleteDocumentApiResponse> {
  return del(ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id));
}

// types/admin/document.ts

export type DocumentType = 
  | "syllabus" 
  | "lesson_plan" 
  | "worksheet" 
  | "exam" 
  | "material" 
  | "guide" 
  | "other";

export type DocumentStatus = "active" | "inactive" | "draft";

// Lesson Plan Template (Document) from API
export interface LessonPlanTemplate {
  id: string;
  programId?: string;
  programName?: string;
  level?: string;
  sessionIndex?: number;
  attachment?: string;
  isActive?: boolean;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  usedCount?: number;
  // Legacy fields
  title?: string;
  description?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  gradeLevel?: string;
  subject?: string;
  courseId?: string;
  courseName?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  content?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  updatedAt?: string;
  viewCount?: number;
  downloadCount?: number;
  isFeatured?: boolean;
}

// API Response types
export interface GetAllDocumentsParams {
  programId?: string;
  level?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  pageNumber?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  gradeLevel?: string;
  subject?: string;
}

// API response wrapper for templates
export interface TemplatesResponse {
  items: LessonPlanTemplate[];
}

export interface GetAllDocumentsApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  data: {
    templates: TemplatesResponse;
  };
  message?: string;
}

export interface GetDocumentByIdApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  data: LessonPlanTemplate;
  message?: string;
}

// UI-friendly request types (for form)
export interface CreateDocumentRequest {
  programId: string;
  level: string;
  sessionIndex: number;
  attachment?: string;
}

export interface CreateDocumentApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  data: LessonPlanTemplate;
  message?: string;
}

export interface UpdateDocumentRequest {
  level?: string;
  sessionIndex?: number;
  attachment?: string;
  isActive?: boolean;
}

export interface UpdateDocumentApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  data: LessonPlanTemplate;
  message?: string;
}

export interface DeleteDocumentApiResponse {
  success?: boolean;
  isSuccess?: boolean;
  message?: string;
}

// types/teacher/homework.ts

// Submission Status Types
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "REVIEWED" | "OVERDUE";

// ============ API Response Types ============

// Parameters for GET /api/homework
export interface FetchHomeworkParams {
  branchId?: string;
  classId?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

// API Response from homework endpoint
export interface HomeworkApiResponseData {
  homeworkAssignments?: {
    items: HomeworkSubmission[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface HomeworkApiResponse {
  isSuccess?: boolean;
  data: HomeworkSubmission[] | HomeworkApiResponseData;
  meta?: {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============ Data Models ============

// Student submission for an assignment (teacher view)
export interface HomeworkSubmission {
  id: string;
  submissionId: string;
  assignmentId: string;
  title: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  classId: string;
  classTitle: string;
  branchId?: string;
  branchName?: string;
  
  // Submission details
  submittedAt?: string;
  content?: string;
  attachments?: HomeworkAttachment[];
  
  // Status
  status: SubmissionStatus;
  isLate: boolean;
  
  // Grading
  score?: number;
  maxScore?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  
  // Assignment info
  dueAt: string;
  description?: string;
  skills?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Attachment in submission
export interface HomeworkAttachment {
  id: string;
  name: string;
  url: string;
  type: "PDF" | "DOC" | "DOCX" | "MP3" | "VIDEO" | "IMAGE" | "ZIP" | "OTHER";
  size?: string;
  sizeInBytes?: number;
  uploadedAt: string;
}

// ============ UI State Types ============

// Filter options for homework list
export interface HomeworkFilters {
  status?: SubmissionStatus | "ALL";
  classId?: string;
  searchQuery?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

// Stats for dashboard
export interface HomeworkStats {
  total: number;
  pending: number;
  submitted: number;
  reviewed: number;
  overdue: number;
  averageScore?: number;
}

// Class option for filter dropdown
export interface ClassOption {
  id: string;
  name: string;
  code?: string;
}

// Session option for dropdown
export interface SessionOption {
  id: string;
  name: string;
  date?: string;
}

// ============ Action Result Types ============

// Internal response from fetchHomework service
export interface HomeworkListResponse {
  data: HomeworkSubmission[];
  meta: {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export type FetchHomeworkResult = 
  | { ok: true; data: HomeworkListResponse }
  | { ok: false; error: string };

export type SaveGradeResult =
  | { ok: true; data: HomeworkSubmission }
  | { ok: false; error: string };

// Create Homework Types
export interface CreateHomeworkPayload {
  classId: string;
  sessionId?: string;
  title: string;
  description?: string;
  dueAt: string;
  book?: string;
  pages?: string;
  skills?: string;
  submissionType?: "FILE" | "TEXT" | "FILE_AND_TEXT";
  maxScore?: number;
  rewardStars?: number;
  missionId?: string;
  instructions?: string;
  expectedAnswer?: string;
  rubric?: string;
}

export type CreateHomeworkResult =
  | { ok: true; data: HomeworkSubmission }
  | { ok: false; error: string };

// Delete Homework Types
export type DeleteHomeworkResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

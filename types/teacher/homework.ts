// types/teacher/homework.ts

// Submission Status Types
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "REVIEWED" | "OVERDUE";

// Submission status from /api/homework/submissions API
export type SubmissionStatusFromApi =
  | "Assigned"
  | "Submitted"
  | "Graded"
  | "Late"
  | "Missing";

export type HomeworkSubmissionType =
  | "FILE"
  | "IMAGE"
  | "TEXT"
  | "LINK"
  | "QUIZ"
  | "MULTIPLE_CHOICE";

export type QuestionBankDifficulty = "Easy" | "Medium" | "Hard";

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

// Parameters for GET /api/homework/submissions
export interface FetchHomeworkSubmissionsParams {
  classId?: string;
  status?: number | string;
  pageNumber?: number;
  pageSize?: number;
}

export interface FetchQuestionBankParams {
  programId?: string;
  level?: QuestionBankDifficulty;
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

// Submission item from /api/homework/submissions API
export interface HomeworkSubmissionItem {
  id: string;
  homeworkAssignmentId: string;
  homeworkTitle: string;
  studentProfileId: string;
  studentName: string;
  status: SubmissionStatusFromApi;
  submittedAt: string | null;
  gradedAt: string | null;
  score: number | null;
  teacherFeedback: string | null;
  dueAt: string;
  createdAt: string;
}

export interface QuestionBankItem {
  id: string;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string | null;
  level?: QuestionBankDifficulty;
  programId?: string;
  programName?: string;
}

// Student submission for an assignment (teacher view)
export interface HomeworkSubmission {
  id: string;
  submissionId: string;
  assignmentId: string;
  title: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  classId?: string;
  classTitle: string;
  branchId?: string;
  branchName?: string;

  // Session/Buổi học info
  sessionId?: string;
  sessionName?: string;
  plannedDateTime?: string;

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
  submissionType?: string;

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
  plannedDateTime?: string;
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
  submissionType?: HomeworkSubmissionType;
  maxScore?: number;
  rewardStars?: number;
  timeLimitMinutes?: number;
  allowResubmit?: boolean;
  missionId?: string;
  instructions?: string;
  expectedAnswer?: string;
  rubric?: string;
  attachment?: string;
  // Multiple choice specific fields
  questions?: MultipleChoiceQuestion[];
}

export interface MultipleChoiceQuestion {
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export interface CreateHomeworkFromBankPayload {
  classId: string;
  programId: string;
  sessionId?: string;
  title: string;
  description?: string;
  dueAt: string;
  rewardStars?: number;
  timeLimitMinutes?: number;
  allowResubmit?: boolean;
  missionId?: string;
  instructions?: string;
  distribution: Array<{
    level: QuestionBankDifficulty;
    count: number;
  }>;
}

export type CreateHomeworkResult =
  | { ok: true; data: HomeworkSubmission }
  | { ok: false; error: string };

// Delete Homework Types
export type DeleteHomeworkResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

// Fetch Submissions Types
export type FetchHomeworkSubmissionsResult =
  | { ok: true; data: HomeworkSubmissionItem[] }
  | { ok: false; error: string };

export type FetchQuestionBankResult =
  | { ok: true; data: QuestionBankItem[] }
  | { ok: false; error: string };

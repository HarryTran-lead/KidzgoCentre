// types/student/homework.ts

// Assignment Status Types
export type AssignmentStatus = 
  | "SUBMITTED"    // 🟢 Đã nộp
  | "PENDING"      // 🟡 Chưa nộp
  | "MISSING"      // 🔴 Quá hạn chưa nộp
  | "LATE";        // 🟠 Nộp trễ

// Assignment Type
export type AssignmentType = 
  | "ESSAY"        // Bài viết
  | "FILE_UPLOAD"  // Upload file
  | "QUIZ"         // Trắc nghiệm
  | "PROJECT"      // Dự án
  | "PRESENTATION"; // Thuyết trình

// Attachment Type
export type AttachmentType = "PDF" | "DOC" | "DOCX" | "LINK" | "VIDEO" | "IMAGE";

// Assignment List Item
export interface AssignmentListItem {
  id: string;
  title: string;
  subject: string;
  className: string;
  assignedDate: string;
  dueDate: string;
  status: AssignmentStatus;
  type: AssignmentType;
  score?: number;
  maxScore?: number;
  submissionCount: number;
  hasAttachments: boolean;
  attachmentTypes?: AttachmentType[];
}

// Assignment Detail
export interface AssignmentDetail {
  // Header Info
  id: string;
  title: string;
  className: string;
  subject: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  status: AssignmentStatus;
  timeRemaining?: string; // "2 ngày 5 giờ" or "Quá hạn 3 ngày"
  
  // Content
  description: string;
  requirements: string[];
  rubric?: RubricCriteria[];
  
  // Attachments from teacher
  teacherAttachments?: Attachment[];
  
  // Submission
  submission?: Submission;
  submissionHistory?: Submission[];
  allowResubmit: boolean;
  maxResubmissions?: number;
  
  // Grading
  grading?: Grading;
  
  // System Info
  submittedAt?: string;
  gradedAt?: string;
  editCount: number;
}

// Rubric Criteria
export interface RubricCriteria {
  id: string;
  criteria: string;
  description: string;
  maxPoints: number;
  earnedPoints?: number;
}

// Attachment
export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  size?: string; // "2.5 MB"
  uploadedAt?: string;
}

// Submission
export interface Submission {
  id: string;
  submittedAt: string;
  status: "ON_TIME" | "LATE";
  content?: {
    text?: string;
    files?: Attachment[];
    links?: string[];
  };
  version: number;
}

// Grading
export interface Grading {
  score: number;
  maxScore: number;
  percentage: number;
  teacherComment?: string;
  aiSuggestions?: string[];
  gradedFiles?: Attachment[];
  rubricScores?: {
    criteriaId: string;
    score: number;
    comment?: string;
  }[];
}

// Stats for list page
export interface HomeworkStats {
  total: number;
  submitted: number;
  pending: number;
  missing: number;
  late: number;
  averageScore?: number;
}

// Filter Options
export interface HomeworkFilter {
  status?: AssignmentStatus[];
  subject?: string[];
  className?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  type?: AssignmentType[];
}

// Sort Options
export type SortOption = 
  | "DUE_DATE_ASC"
  | "DUE_DATE_DESC"
  | "ASSIGNED_DATE_ASC"
  | "ASSIGNED_DATE_DESC"
  | "STATUS"
  | "SUBJECT";

// Badge Config
export interface StatusBadgeConfig {
  variant: "success" | "warning" | "danger" | "info";
  label: string;
  icon?: string;
}

export type AssignmentStatusConfig = Record<AssignmentStatus, StatusBadgeConfig>;

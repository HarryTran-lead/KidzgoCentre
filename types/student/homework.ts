// types/student/homework.ts

export type AssignmentStatus = "SUBMITTED" | "PENDING" | "MISSING" | "LATE";

export type AssignmentType =
  | "ESSAY"
  | "FILE_UPLOAD"
  | "QUIZ"
  | "PROJECT"
  | "PRESENTATION";

export type AttachmentType = "PDF" | "DOC" | "DOCX" | "LINK" | "VIDEO" | "IMAGE";

export interface AssignmentListItem {
  id: string;
  title: string;
  subject: string;
  className: string;
  assignedDate: string;
  dueDate: string;
  status: AssignmentStatus;
  submissionType?: "FILE" | "IMAGE" | "TEXT" | "LINK" | "QUIZ" | "FILE_AND_TEXT";
  type: AssignmentType;
  score?: number;
  maxScore?: number;
  submissionCount: number;
  hasAttachments: boolean;
  attachmentTypes?: AttachmentType[];
}

export interface AssignmentDetail {
  id: string;
  title: string;
  className: string;
  subject: string;
  teacher: string;
  assignedDate: string;
  dueDate: string;
  status: AssignmentStatus;
  submissionType?: "FILE" | "IMAGE" | "TEXT" | "LINK" | "QUIZ" | "FILE_AND_TEXT";
  timeRemaining?: string;

  description: string;
  requirements: string[];
  rubric?: RubricCriteria[];

  teacherAttachments?: Attachment[];

  submission?: Submission;
  submissionHistory?: Submission[];
  allowResubmit: boolean;
  maxResubmissions?: number;

  grading?: Grading;

  submittedAt?: string;
  gradedAt?: string;
  editCount: number;
}

export interface RubricCriteria {
  id: string;
  criteria: string;
  description: string;
  maxPoints: number;
  earnedPoints?: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  size?: string;
  uploadedAt?: string;
}

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

export interface HomeworkStats {
  total: number;
  submitted: number;
  pending: number;
  missing: number;
  late: number;
  averageScore?: number;
}

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

export type SortOption =
  | "DUE_DATE_ASC"
  | "DUE_DATE_DESC"
  | "ASSIGNED_DATE_ASC"
  | "ASSIGNED_DATE_DESC"
  | "STATUS"
  | "SUBJECT";

export interface StatusBadgeConfig {
  variant: "success" | "warning" | "danger" | "info";
  label: string;
  icon?: string;
}

export type AssignmentStatusConfig = Record<AssignmentStatus, StatusBadgeConfig>;


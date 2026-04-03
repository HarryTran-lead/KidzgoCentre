// types/student/homework.ts

export type AssignmentStatus = "SUBMITTED" | "PENDING" | "MISSING" | "LATE" | "ASSIGNED";

export type AssignmentType =
  | "ESSAY"
  | "FILE_UPLOAD"
  | "QUIZ"
  | "PROJECT"
  | "PRESENTATION";

export type AttachmentType = "PDF" | "DOC" | "DOCX" | "LINK" | "VIDEO" | "IMAGE";

// API Response - matches /api/students/homework/my
export interface AssignmentListItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription: string;
  classId: string;
  classCode: string;
  classTitle: string;
  dueAt: string;
  book: string | null;
  pages: string | null;
  skills: string | null;
  submissionType: string;
  status: string;
  submittedAt: string | null;
  gradedAt: string | null;
  score: number | null;
  teacherFeedback?: string | null;
  aiFeedback?: string | null;
  isLate: boolean;
  isOverdue: boolean;
  // Legacy fields for compatibility
  title: string;
  subject: string;
  className: string;
  assignedDate: string;
  dueDate: string;
  type: AssignmentType;
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
  submissionType?: "FILE" | "IMAGE" | "TEXT" | "LINK" | "QUIZ" | "MULTIPLE_CHOICE" | "FILE_AND_TEXT";
  timeRemaining?: string;
  timeLimitMinutes?: number;
  description: string;
  instructions?: string;
  requirements: string[];
  rubric?: RubricCriteria[];
  questions?: HomeworkQuestion[];

  teacherAttachments?: Attachment[];

  isOverdue?: boolean;
  maxScore?: number;
  submission?: Submission;
  submissionHistory?: Submission[];
  allowResubmit: boolean;
  maxResubmissions?: number;

  grading?: Grading;
  review?: QuizReview;

  submittedAt?: string;
  gradedAt?: string;
  editCount: number;
  aiHintEnabled?: boolean;
  aiRecommendEnabled?: boolean;
  speakingMode?: string | null;
  targetWords?: string[];
  speakingExpectedText?: string | null;
}

export interface HomeworkQuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface HomeworkQuestion {
  id: string;
  questionText: string;
  questionType?: string;
  options: HomeworkQuestionOption[];
  explanation?: string;
  points?: number;
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
  correctCount?: number;
  wrongCount?: number;
  skippedCount?: number;
  totalPoints?: number;
  earnedPoints?: number;
  teacherComment?: string;
  aiSuggestions?: string[];
  gradedFiles?: Attachment[];
  aiFeedback?: string;
  rubricScores?: {
    criteriaId: string;
    score: number;
    comment?: string;
  }[];
}

export interface QuizReviewAnswer {
  questionId: string;
  questionText?: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  correctOptionId?: string;
  correctOptionText?: string;
  isCorrect?: boolean;
  earnedPoints?: number;
  maxPoints?: number;
  explanation?: string;
}

export interface QuizReview {
  showReview: boolean;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
  primaryActionLabel?: string;
  answerResults: QuizReviewAnswer[];
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

export interface HomeworkAiHintResult {
  aiUsed: boolean;
  summary?: string;
  hints: string[];
  grammarFocus: string[];
  vocabularyFocus: string[];
  encouragement?: string;
  warnings: string[];
}

export interface HomeworkRecommendationItem {
  questionBankItemId: string;
  questionText: string;
  questionType: string;
  options: string[];
  topic?: string | null;
  skill?: string | null;
  grammarTags: string[];
  vocabularyTags: string[];
  level?: string;
  points?: number;
  reason?: string;
}

export interface HomeworkAiRecommendationResult {
  aiUsed: boolean;
  summary?: string;
  focusSkill?: string;
  topics: string[];
  grammarTags: string[];
  vocabularyTags: string[];
  recommendedLevels: string[];
  practiceTypes: string[];
  warnings: string[];
  items: HomeworkRecommendationItem[];
}

export interface HomeworkSpeakingWordFeedback {
  word: string;
  heardAs?: string | null;
  issue: string;
  tip: string;
}

export interface HomeworkSpeakingConfidence {
  overall?: number;
  pronunciation?: number;
  fluency?: number;
  accuracy?: number;
  [key: string]: number | undefined;
}

export interface HomeworkSpeakingAnalysisResult {
  aiUsed: boolean;
  summary?: string;
  transcript?: string;
  overallScore?: number;
  pronunciationScore?: number;
  fluencyScore?: number;
  accuracyScore?: number;
  stars?: number;
  strengths: string[];
  issues: string[];
  mispronouncedWords: string[];
  wordFeedback: HomeworkSpeakingWordFeedback[];
  suggestions: string[];
  practicePlan: string[];
  confidence?: HomeworkSpeakingConfidence;
  warnings: string[];
}

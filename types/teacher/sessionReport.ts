export type SessionReportItem = {
  id?: string | null;
  sessionId?: string | null;
  studentProfileId?: string | null;
  teacherUserId?: string | null;
  classId?: string | null;
  reportDate?: string | null;
  feedback?: string | null;
  reason?: string | null;
  status?: "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateSessionReportRequest = {
  sessionId: string;
  studentProfileId: string;
  reportDate: string;
  feedback: string;
};

export type UpdateSessionReportRequest = {
  feedback: string;
};

export type RejectSessionReportRequest = {
  reason: string;
};

export type EnhanceSessionFeedbackRequest = {
  draft: string;
  sessionId?: string;
  studentProfileId?: string;
};

export type EnhanceSessionFeedbackResult = {
  enhancedFeedback?: string;
  originalFeedback?: string;
  isMock?: boolean;
};

export type SessionReportApiResponse = {
  success?: boolean;
  message?: string;
  data?: SessionReportItem | { item?: SessionReportItem };
};

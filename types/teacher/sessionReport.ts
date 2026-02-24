export type SessionReportItem = {
  id?: string | null;
  sessionId?: string | null;
  studentProfileId?: string | null;
  reportDate?: string | null;
  feedback?: string | null;
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

export type SessionReportApiResponse = {
  success?: boolean;
  message?: string;
  data?: SessionReportItem | { item?: SessionReportItem };
};
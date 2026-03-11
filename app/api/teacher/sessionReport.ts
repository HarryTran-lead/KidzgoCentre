import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";
import type {
  CreateSessionReportRequest,
  EnhanceSessionFeedbackRequest,
  EnhanceSessionFeedbackResult,
  RejectSessionReportRequest,
  SessionReportApiResponse,
  SessionReportItem,
  UpdateSessionReportRequest,
} from "@/types/teacher/sessionReport";

type SessionReportListApiResponse = {
  success?: boolean;
  message?: string;
  data?:
    | SessionReportItem[]
    | {
        items?: SessionReportItem[];
        sessionReports?:
          | SessionReportItem[]
          | {
              items?: SessionReportItem[];
            };
      };
};

type FetchSessionReportsParams = {
  sessionId?: string;
  studentProfileId?: string;
  teacherUserId?: string;
  classId?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
};

type EnhanceFeedbackApiResponse = {
  success?: boolean;
  isSuccess?: boolean;
  message?: string;
  data?: EnhanceSessionFeedbackResult;
};

function extractSessionReport(data?: SessionReportApiResponse["data"]): SessionReportItem | null {
  if (!data) return null;
  if ("item" in data && data.item) return data.item;
  return data as SessionReportItem;
}

function extractSessionReports(data?: SessionReportListApiResponse["data"]): SessionReportItem[] {
  if (!data) return [];

  if (Array.isArray(data)) return data;

  const payload = data as {
    items?: SessionReportItem[];
    sessionReports?: SessionReportItem[] | { items?: SessionReportItem[] };
  };

  if (Array.isArray(payload.items)) return payload.items;

  if (Array.isArray(payload.sessionReports)) return payload.sessionReports;

  if (
    payload.sessionReports &&
    typeof payload.sessionReports === "object" &&
    "items" in payload.sessionReports &&
    Array.isArray(payload.sessionReports.items)
  ) {
    return payload.sessionReports.items;
  }

  return [];
}

function normalizeCreatePayload(payload: CreateSessionReportRequest): any {
  const p: any = payload as any;
  return {
    ...p,
    SessionId: p.SessionId ?? p.sessionId,
    StudentProfileId: p.StudentProfileId ?? p.studentProfileId,
    ReportDate: p.ReportDate ?? p.reportDate,
    Feedback: p.Feedback ?? p.feedback,
  };
}

function normalizeUpdatePayload(payload: UpdateSessionReportRequest): any {
  const p: any = payload as any;
  return {
    ...p,
    Feedback: p.Feedback ?? p.feedback,
  };
}

function normalizeRejectPayload(payload: RejectSessionReportRequest): any {
  const p: any = payload as any;
  return {
    reason: p.reason ?? p.Reason,
  };
}

function ensureToken() {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }
  return token;
}

export async function createSessionReport(
  payload: CreateSessionReportRequest,
): Promise<SessionReportItem | null> {
  const token = ensureToken();

  const normalizedPayload = normalizeCreatePayload(payload);

  const res = await fetch(TEACHER_ENDPOINTS.SESSION_REPORTS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(normalizedPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Create session report error", res.status, text, normalizedPayload);
    throw new Error("Không thể tạo nhận xét buổi học.");
  }

  const json: SessionReportApiResponse = await res.json();
  return extractSessionReport(json?.data);
}

export async function updateSessionReport(
  reportId: string,
  payload: UpdateSessionReportRequest,
): Promise<SessionReportItem | null> {
  const token = ensureToken();

  const normalizedPayload = normalizeUpdatePayload(payload);

  const res = await fetch(TEACHER_ENDPOINTS.SESSION_REPORT_BY_ID(reportId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(normalizedPayload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Update session report error", res.status, text, normalizedPayload);
    throw new Error("Không thể cập nhật nhận xét buổi học.");
  }

  const json: SessionReportApiResponse = await res.json();
  return extractSessionReport(json?.data);
}

export async function fetchSessionReports(
  sessionReportParams?: string | FetchSessionReportsParams,
): Promise<SessionReportItem[]> {
  const token = ensureToken();

  const normalizedParams: FetchSessionReportsParams =
    typeof sessionReportParams === "string"
      ? { sessionId: sessionReportParams }
      : sessionReportParams ?? {};

  const query = new URLSearchParams();
  if (normalizedParams.sessionId) {
    query.set("sessionId", normalizedParams.sessionId);
  }
  if (normalizedParams.studentProfileId) {
    query.set("studentProfileId", normalizedParams.studentProfileId);
  }
  if (normalizedParams.teacherUserId) {
    query.set("teacherUserId", normalizedParams.teacherUserId);
  }
  if (normalizedParams.classId) {
    query.set("classId", normalizedParams.classId);
  }
  if (normalizedParams.fromDate) {
    query.set("fromDate", normalizedParams.fromDate);
  }
  if (normalizedParams.toDate) {
    query.set("toDate", normalizedParams.toDate);
  }
  if (normalizedParams.pageNumber) {
    query.set("pageNumber", String(normalizedParams.pageNumber));
  }
  if (normalizedParams.pageSize) {
    query.set("pageSize", String(normalizedParams.pageSize));
  }

  const url = query.toString()
    ? `${TEACHER_ENDPOINTS.SESSION_REPORTS}?${query.toString()}`
    : TEACHER_ENDPOINTS.SESSION_REPORTS;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch session reports error", res.status, text);
    throw new Error("Không thể tải danh sách nhận xét buổi học.");
  }

  const json: SessionReportListApiResponse = await res.json();
  return extractSessionReports(json?.data);
}

export async function getSessionReportById(reportId: string): Promise<SessionReportItem | null> {
  const token = ensureToken();

  const res = await fetch(TEACHER_ENDPOINTS.SESSION_REPORT_BY_ID(reportId), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Get session report detail error", res.status, text);
    throw new Error("Không thể tải chi tiết session report.");
  }

  const json: SessionReportApiResponse = await res.json();
  return extractSessionReport(json?.data);
}

async function postSessionReportAction(url: string, body?: unknown): Promise<SessionReportItem | null> {
  const token = ensureToken();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Session report action error", res.status, text, url);
    throw new Error("Không thể xử lý session report.");
  }

  const json: SessionReportApiResponse = await res.json();
  return extractSessionReport(json?.data);
}

export async function submitSessionReport(reportId: string): Promise<SessionReportItem | null> {
  return postSessionReportAction(TEACHER_ENDPOINTS.SESSION_REPORT_SUBMIT(reportId));
}

export async function approveSessionReport(reportId: string): Promise<SessionReportItem | null> {
  return postSessionReportAction(TEACHER_ENDPOINTS.SESSION_REPORT_APPROVE(reportId));
}

export async function rejectSessionReport(
  reportId: string,
  payload: RejectSessionReportRequest,
): Promise<SessionReportItem | null> {
  return postSessionReportAction(
    TEACHER_ENDPOINTS.SESSION_REPORT_REJECT(reportId),
    normalizeRejectPayload(payload),
  );
}

export async function publishSessionReport(reportId: string): Promise<SessionReportItem | null> {
  return postSessionReportAction(TEACHER_ENDPOINTS.SESSION_REPORT_PUBLISH(reportId));
}

export async function fetchTeacherMonthlySessionReports(
  teacherUserId: string,
  params: { year: number; month: number; pageNumber?: number; pageSize?: number },
): Promise<SessionReportItem[]> {
  const token = ensureToken();
  const query = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
    pageNumber: String(params.pageNumber ?? 1),
    pageSize: String(params.pageSize ?? 10),
  });

  const url = `${TEACHER_ENDPOINTS.SESSION_REPORT_TEACHER_MONTHLY(teacherUserId)}?${query.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch teacher monthly session reports error", res.status, text);
    throw new Error("Không thể tải session report theo tháng.");
  }

  const json: SessionReportListApiResponse = await res.json();
  return extractSessionReports(json?.data);
}

export async function enhanceSessionFeedback(
  payload: EnhanceSessionFeedbackRequest,
): Promise<EnhanceSessionFeedbackResult | null> {
  const token = ensureToken();

  const res = await fetch(TEACHER_ENDPOINTS.SESSION_REPORT_AI_ENHANCE_FEEDBACK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Enhance session feedback error", res.status, text);
    throw new Error("Không thể AI enhance feedback.");
  }

  const json: EnhanceFeedbackApiResponse = await res.json();
  return json?.data ?? null;
}


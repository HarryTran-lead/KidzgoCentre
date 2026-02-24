import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";
import type {
  CreateSessionReportRequest,
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
        sessionReports?: SessionReportItem[];
      };
};

function extractSessionReport(data?: SessionReportApiResponse["data"]): SessionReportItem | null {
  if (!data) return null;
  if ("item" in data && data.item) return data.item;
  return data as SessionReportItem;
}

function extractSessionReports(data?: SessionReportListApiResponse["data"]): SessionReportItem[] {
  if (!data) return [];

  if (Array.isArray(data)) return data;

  if (Array.isArray((data as any).items)) return (data as any).items;

  if (Array.isArray((data as any).sessionReports)) return (data as any).sessionReports;

  return [];
}

function normalizeCreatePayload(payload: CreateSessionReportRequest): any {
  const p: any = payload as any;
  return {
    // giữ các field cũ (nếu BE ignore thì OK)
    ...p,

    // map camelCase -> PascalCase để BE nhận đúng
    SessionId: p.SessionId ?? p.sessionId,
    StudentProfileId: p.StudentProfileId ?? p.studentProfileId,
    ReportDate: p.ReportDate ?? p.reportDate,

    // QUAN TRỌNG: BE validate "Feedback"
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

export async function createSessionReport(payload: CreateSessionReportRequest): Promise<SessionReportItem | null> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

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
    throw new Error("Không thể gửi nhận xét buổi học.");
  }

  const json: SessionReportApiResponse = await res.json();
  return extractSessionReport(json?.data);
}

export async function updateSessionReport(
  reportId: string,
  payload: UpdateSessionReportRequest,
): Promise<SessionReportItem | null> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

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

export async function fetchSessionReports(sessionId?: string): Promise<SessionReportItem[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
  }

  const query = new URLSearchParams();
  if (sessionId) {
    query.set("sessionId", sessionId);
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
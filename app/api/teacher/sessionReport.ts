import { TEACHER_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";
import type {
  CreateSessionReportRequest,
  SessionReportApiResponse,
  SessionReportItem,
  UpdateSessionReportRequest,
} from "@/types/teacher/sessionReport";

function extractSessionReport(data?: SessionReportApiResponse["data"]): SessionReportItem | null {
  if (!data) return null;
  if ("item" in data && data.item) return data.item;
  return data as SessionReportItem;
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
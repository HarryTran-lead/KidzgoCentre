import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type CreateSessionReportPayload = {
  SessionId?: string;
  sessionId?: string;

  StudentProfileId?: string;
  studentProfileId?: string;

  ReportDate?: string;
  reportDate?: string;

  Feedback?: string;
  feedback?: string;
};

function normalizeCreatePayload(payload: CreateSessionReportPayload) {
  return {
    SessionId: payload.SessionId ?? payload.sessionId,
    StudentProfileId: payload.StudentProfileId ?? payload.studentProfileId,
    ReportDate: payload.ReportDate ?? payload.reportDate,
    Feedback: payload.Feedback ?? payload.feedback,
  };
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = (await req.json()) as CreateSessionReportPayload;
    const normalizedPayload = normalizeCreatePayload(payload);

    // ✅ IMPORTANT: send payload FLAT (no { request: ... })
    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.CREATE), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
    });

    const text = await upstream.text();
    const data = text ? JSON.parse(text) : { success: upstream.ok };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Create session report error:", error);
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi khi tạo nhận xét buổi học" },
      { status: 500 },
    );
  }
}
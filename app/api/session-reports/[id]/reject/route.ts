import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type RejectSessionReportPayload = {
  reason?: string;
  comment?: string;
  content?: string;
  Reason?: string;
};

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeRejectPayload(payload: RejectSessionReportPayload) {
  const text = payload.reason ?? payload.comment ?? payload.content ?? payload.Reason;
  return {
    reason: text,
    comment: text,
    content: text,
  };
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = (await req.json()) as RejectSessionReportPayload;
    const normalizedPayload = normalizeRejectPayload(payload);

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.REJECT(id)), {
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
    console.error("Reject session report error:", error);
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi khi từ chối session report" },
      { status: 500 },
    );
  }
}

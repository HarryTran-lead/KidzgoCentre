import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type EnhanceFeedbackPayload = {
  draft?: string;
  sessionId?: string;
  studentProfileId?: string;
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = (await req.json()) as EnhanceFeedbackPayload;

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.AI_ENHANCE_FEEDBACK), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    const data = text ? JSON.parse(text) : { success: upstream.ok };
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("AI enhance session feedback error:", error);
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi khi AI enhance feedback" },
      { status: 500 },
    );
  }
}

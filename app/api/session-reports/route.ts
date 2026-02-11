import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type CreateSessionReportPayload = {
  sessionId?: string;
  studentProfileId?: string;
  reportDate?: string;
  feedback?: string;
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Chưa đăng nhập",
        },
        { status: 401 },
      );
    }

    const payload = (await req.json()) as CreateSessionReportPayload;

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.CREATE), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request: payload }),
    });

    const text = await upstream.text();
    const data = text ? JSON.parse(text) : { success: upstream.ok };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Create session report error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi tạo nhận xét buổi học",
      },
      { status: 500 },
    );
  }
}

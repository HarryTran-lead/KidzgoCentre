import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type UpdateSessionReportPayload = {
  Feedback?: string;
  feedback?: string;
};

function normalizeUpdatePayload(payload: UpdateSessionReportPayload) {
  return {
    ...payload,
    Feedback: payload.Feedback ?? payload.feedback,
  };
}

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;

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

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.REPORT_BY_ID(id)), {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const text = await upstream.text();
    const data = text ? JSON.parse(text) : { success: upstream.ok };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get session report detail error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi tải chi tiết nhận xét buổi học",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  const { id } = await params;

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

    const payload = (await req.json()) as UpdateSessionReportPayload;
    const normalizedPayload = normalizeUpdatePayload(payload);

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.REPORT_BY_ID(id)), {
      method: "PUT",
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
    console.error("Update session report error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi cập nhật nhận xét buổi học",
      },
      { status: 500 },
    );
  }
}


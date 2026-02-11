import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type UpdateSessionReportPayload = {
  feedback?: string;
};

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

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

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.UPDATE(id)), {
      method: "PUT",
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
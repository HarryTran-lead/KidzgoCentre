import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.PUBLISH(id)), {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
    });

    const text = await upstream.text();
    const data = text ? JSON.parse(text) : { success: upstream.ok };
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Publish session report error:", error);
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi khi publish session report" },
      { status: 500 },
    );
  }
}

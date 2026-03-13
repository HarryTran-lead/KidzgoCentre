import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type RouteParams = {
  params: Promise<{
    teacherUserId: string;
  }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  const { teacherUserId } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { search } = new URL(req.url);
    const upstreamUrl = `${buildApiUrl(
      BACKEND_SESSION_REPORT_ENDPOINTS.TEACHER_MONTHLY(teacherUserId),
    )}${search}`;

    const upstream = await fetch(upstreamUrl, {
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
    console.error("Get teacher monthly session reports error:", error);
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi khi tải session report theo tháng" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { BACKEND_SESSION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

interface GenerateFromPatternRequest {
  classId: string;
  roomId?: string;
  onlyFutureSessions?: boolean;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const body: GenerateFromPatternRequest = await req.json();

    if (!body.classId) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Thiếu classId" },
        { status: 400 }
      );
    }

    const upstream = await fetch(
      buildApiUrl(BACKEND_SESSION_ENDPOINTS.GENERATE_FROM_PATTERN),
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: body.classId,
          roomId: body.roomId || null,
          onlyFutureSessions: body.onlyFutureSessions ?? true,
        }),
      }
    );

    const text = await upstream.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : { isSuccess: upstream.ok, data: null };
    } catch {
      data = { isSuccess: upstream.ok, data: null };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Generate sessions from pattern error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi tạo lịch học tự động" },
      { status: 500 }
    );
  }
}

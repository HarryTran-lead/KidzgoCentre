import { NextResponse } from "next/server";
import { BACKEND_SESSION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_ENDPOINTS.CHANGE_TEACHER), {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    let data: unknown;

    try {
      data = text ? JSON.parse(text) : { isSuccess: upstream.ok, data: null };
    } catch {
      data = { isSuccess: upstream.ok, data: null };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Change session teacher error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi đổi giáo viên" },
      { status: 500 }
    );
  }
}
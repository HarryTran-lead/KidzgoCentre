import { NextResponse } from "next/server";
import { BACKEND_SESSION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_ENDPOINTS.UPDATE_BY_CLASS), {
      method: "PUT",
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
    console.error("Bulk update sessions by class error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi cập nhật hàng loạt session" },
      { status: 500 }
    );
  }
}

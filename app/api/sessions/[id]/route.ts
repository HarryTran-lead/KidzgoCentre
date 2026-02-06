import { NextResponse } from "next/server";
import { BACKEND_SESSION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_SESSION_ENDPOINTS.GET_BY_ID(id)), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : { isSuccess: upstream.ok, data: null };
    } catch {
      data = { isSuccess: upstream.ok, data: null };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get session by id error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi lấy session" },
      { status: 500 }
    );
  }
}

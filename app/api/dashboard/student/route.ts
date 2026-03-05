import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_DASHBOARD_ENDPOINTS } from "@/constants/apiURL";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    const url = buildApiUrl(BACKEND_DASHBOARD_ENDPOINTS.STUDENT);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Dashboard student error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Lỗi khi lấy dữ liệu dashboard học viên" },
      { status: 500 }
    );
  }
}

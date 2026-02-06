import { NextResponse } from "next/server";
import { BACKEND_MAKEUP_CREDIT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { MakeupCreditStudentsResponse } from "@/types/makeupCredit";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Chưa đăng nhập",
        },
        { status: 401 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.STUDENTS), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: MakeupCreditStudentsResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get makeup credit students error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách học viên có credit",
      },
      { status: 500 }
    );
  }
}
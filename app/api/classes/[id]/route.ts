import { NextResponse } from "next/server";
import { BACKEND_CLASS_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { StudentClassResponse } from "@/types/student/class";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
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

    const { id } = await ctx.params;
    const url = buildApiUrl(BACKEND_CLASS_ENDPOINTS.GET_BY_ID(id));

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: StudentClassResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get class detail error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy thông tin lớp học",
      },
      { status: 500 }
    );
  }
}
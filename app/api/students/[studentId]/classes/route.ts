import { NextResponse } from "next/server";
import { BACKEND_STUDENT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { StudentClassesResponse } from "@/types/student/class";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ studentId: string }> }
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

    const { studentId } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = buildApiUrl(BACKEND_STUDENT_ENDPOINTS.GET_CLASSES(studentId));
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: StudentClassesResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get student classes error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách lớp học",
      },
      { status: 500 }
    );
  }
}
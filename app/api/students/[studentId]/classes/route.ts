import { NextResponse } from "next/server";
import { BACKEND_CLASS_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";import type { StudentClassesResponse } from "@/types/student/class";

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
    const baseUrl = buildApiUrl(BACKEND_CLASS_ENDPOINTS.GET_ALL());
    const studentQuery = new URLSearchParams({ studentId });
    const combinedQuery = queryString
      ? `${studentQuery.toString()}&${queryString}`
      : studentQuery.toString();
    const fullUrl = combinedQuery ? `${baseUrl}?${combinedQuery}` : baseUrl;

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
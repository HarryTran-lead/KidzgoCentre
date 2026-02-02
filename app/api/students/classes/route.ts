import { NextResponse } from "next/server";
import { BACKEND_CLASS_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";import type { StudentClassesResponse } from "@/types/student/class";

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

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
const url = buildApiUrl(BACKEND_CLASS_ENDPOINTS.GET_ALL());    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });
  if (upstream.status === 403) {
      const studentClassesUrl = buildApiUrl("/students/classes");
      const fallbackUrl = queryString
        ? `${studentClassesUrl}?${queryString}`
        : studentClassesUrl;
      const fallback = await fetch(fallbackUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      });

      const fallbackData: StudentClassesResponse = await fallback.json();
      return NextResponse.json(fallbackData, { status: fallback.status });
    }

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
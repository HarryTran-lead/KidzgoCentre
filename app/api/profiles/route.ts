import { NextResponse } from "next/server";
import { BACKEND_STUDENT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { StudentsResponse } from "@/types/student/student";

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
    const url = buildApiUrl(BACKEND_STUDENT_ENDPOINTS.GET_ALL());
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        {
          success: false,
          data: { items: [] },
          message: "Thiếu cấu hình NEXT_PUBLIC_API_URL cho backend.",
        },
        { status: 500 }
      );
    }
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    const fallbackUrl = buildApiUrl("/students");
    const requestInit = {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    };

    let upstream = await fetch(fullUrl, requestInit);
    if (upstream.status === 404 && /^https?:\/\//i.test(fallbackUrl)) {
      const fallbackFullUrl = queryString ? `${fallbackUrl}?${queryString}` : fallbackUrl;
      upstream = await fetch(fallbackFullUrl, requestInit);
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    let data: StudentsResponse;

    if (contentType.includes("application/json")) {
      data = (await upstream.json()) as StudentsResponse;
    } else {
      const text = await upstream.text();
      const statusLabel = upstream.status ? ` (status ${upstream.status})` : "";
      data = {
        success: false,
        data: { items: [] },
        message: text || `Backend trả về dữ liệu không hợp lệ${statusLabel}.`,
      };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json(
      {
        success: false,
        data: { items: [] },
        message: "Đã xảy ra lỗi khi lấy danh sách học viên",
      },
      { status: 500 }
    );
  }
}
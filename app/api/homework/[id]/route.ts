import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

// Backend Homework Endpoints
const BACKEND_HOMEWORK_ENDPOINTS = {
  GET_BY_ID: (id: string) => `/homework/${id}`,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const url = buildApiUrl(BACKEND_HOMEWORK_ENDPOINTS.GET_BY_ID(id));

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();

    // Handle empty response
    if (!text) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Backend trả về response trống",
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get homework detail error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy chi tiết bài tập",
      },
      { status: 500 }
    );
  }
}

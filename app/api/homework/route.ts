import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

// Backend Homework Endpoints
const BACKEND_HOMEWORK_ENDPOINTS = {
  GET_ALL: '/homework',
  CREATE: '/homework',
};

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
    const url = buildApiUrl(BACKEND_HOMEWORK_ENDPOINTS.GET_ALL);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();
    
    // Debug: log the raw response
    
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
    console.error("Get homework error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách bài tập",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const url = buildApiUrl(BACKEND_HOMEWORK_ENDPOINTS.CREATE);

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Create homework error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi tạo bài tập",
      },
      { status: 500 }
    );
  }
}

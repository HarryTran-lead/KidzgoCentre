import { NextResponse } from "next/server";
import { BACKEND_LEAVE_REQUEST_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { LeaveRequestDetailResponse, LeaveRequestListResponse } from "@/types/leaveRequest";

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
    const url = buildApiUrl(BACKEND_LEAVE_REQUEST_ENDPOINTS.GET_ALL);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: LeaveRequestListResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get leave requests error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách đơn xin nghỉ",
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

    const payload = await req.json();
    const upstream = await fetch(buildApiUrl(BACKEND_LEAVE_REQUEST_ENDPOINTS.CREATE), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: LeaveRequestDetailResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Create leave request error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi tạo đơn xin nghỉ",
      },
      { status: 500 }
    );
  }
}
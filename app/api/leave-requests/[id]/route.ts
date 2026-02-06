import { NextResponse } from "next/server";
import { BACKEND_LEAVE_REQUEST_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { LeaveRequestActionResponse, LeaveRequestRecord } from "@/types/leaveRequest";
type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
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

    const upstream = await fetch(buildApiUrl(BACKEND_LEAVE_REQUEST_ENDPOINTS.GET_BY_ID(id)), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

   const text = await upstream.text();
    const fallbackData = { id } as LeaveRequestRecord;
    let data: LeaveRequestActionResponse;

    try {
      data = text
        ? (JSON.parse(text) as LeaveRequestActionResponse)
        : {
            success: upstream.ok,
            data: fallbackData,
            message: upstream.ok ? "Thành công" : "Yêu cầu thất bại",
          };
    } catch {
      data = {
        success: upstream.ok,
        data: fallbackData,
        message: upstream.ok ? "Thành công" : "Yêu cầu thất bại",
      };
    }
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get leave request error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy đơn xin nghỉ",
      },
      { status: 500 }
    );
  }
}
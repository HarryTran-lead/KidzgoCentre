import { NextResponse } from "next/server";
import { BACKEND_LEAVE_REQUEST_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { LeaveRequestActionResponse } from "@/types/leaveRequest";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(req: Request, { params }: RouteParams) {
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

    const upstream = await fetch(buildApiUrl(BACKEND_LEAVE_REQUEST_ENDPOINTS.APPROVE(params.id)), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: LeaveRequestActionResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Approve leave request error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi duyệt đơn xin nghỉ",
      },
      { status: 500 }
    );
  }
}
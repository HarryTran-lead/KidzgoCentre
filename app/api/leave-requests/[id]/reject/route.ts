import { NextResponse } from "next/server";
import { BACKEND_LEAVE_REQUEST_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { LeaveRequestActionResponse } from "@/types/leaveRequest";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(req: Request, { params }: RouteParams) {
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
    const bodyText = await req.text();

    const upstream = await fetch(buildApiUrl(BACKEND_LEAVE_REQUEST_ENDPOINTS.REJECT(id)), {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
            body: bodyText.trim().length > 0 ? bodyText : "{}",

    });

    const data: LeaveRequestActionResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Reject leave request error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi từ chối đơn xin nghỉ",
      },
      { status: 500 }
    );
  }
}
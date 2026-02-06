import { NextResponse } from "next/server";
import { BACKEND_LEAVE_REQUEST_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { LeaveRequestActionResponse, LeaveRequestRecord } from "@/types/leaveRequest";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const bodyText = await req.text();
    const fullUrl = buildApiUrl(BACKEND_LEAVE_REQUEST_ENDPOINTS.APPROVE(id));

    const upstream = await fetch(fullUrl, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: bodyText.trim().length > 0 ? bodyText : "{}", // ✅ quan trọng
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

    // Optional: log rõ upstream nếu fail
    if (!upstream.ok) {
      console.error("Upstream approve failed:", {
        status: upstream.status,
        contentType: upstream.headers.get("content-type"),
        preview: text?.slice(0, 300),
        fullUrl,
      });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Approve leave request error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi duyệt đơn xin nghỉ" },
      { status: 500 }
    );
  }
}

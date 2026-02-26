import { NextResponse } from "next/server";
import { BACKEND_TICKET_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { TicketDetailResponse } from "@/types/student/ticket";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
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

    const body = await req.json();
    const url = buildApiUrl(BACKEND_TICKET_ENDPOINTS.UPDATE_STATUS(params.id));

    const upstream = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: TicketDetailResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Update ticket status error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi cập nhật trạng thái đơn",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { BACKEND_TICKET_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { AddTicketCommentResponse } from "@/types/student/ticket";

export async function POST(
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

    const body = await req.json();
    const url = buildApiUrl(BACKEND_TICKET_ENDPOINTS.ADD_COMMENT(id));

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: AddTicketCommentResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Add ticket comment error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi thêm phản hồi",
      },
      { status: 500 }
    );
  }
}

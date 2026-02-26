import { NextResponse } from "next/server";
import { BACKEND_TICKET_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

export async function GET(
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

    const url = buildApiUrl(BACKEND_TICKET_ENDPOINTS.GET_SLA(params.id));

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get ticket SLA error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy thông tin SLA",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { buildApiUrl, AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { UserMeApiResponse } from "@/types/auth";

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

    const upstream = await fetch(buildApiUrl(AUTH_ENDPOINTS.ME), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
      },
    });

    const data: UserMeApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy thông tin người dùng",
      },
      { status: 500 }
    );
  }
} 
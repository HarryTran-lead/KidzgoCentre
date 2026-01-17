import { NextResponse } from "next/server";
import { buildApiUrl, AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { LogoutApiResponse } from "@/types/auth";

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

    const upstream = await fetch(buildApiUrl(AUTH_ENDPOINTS.LOGOUT), {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    const data: LogoutApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi đăng xuất",
      },
      { status: 500 }
    );
  }
}

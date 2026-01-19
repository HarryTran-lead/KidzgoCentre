import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { ResetPasswordRequest, ResetPasswordApiResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body: ResetPasswordRequest = await req.json();

    if (!body.token || !body.newPassword) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Token và mật khẩu mới là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.RESET_PASSWORD), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: ResetPasswordApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi đặt lại mật khẩu",
      },
      { status: 500 }
    );
  }
}
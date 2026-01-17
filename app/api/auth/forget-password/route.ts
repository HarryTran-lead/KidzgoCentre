import { NextResponse } from "next/server";
import { buildApiUrl, AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { ForgetPasswordRequest, ForgetPasswordApiResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body: ForgetPasswordRequest = await req.json();

    if (!body.email) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Email là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(AUTH_ENDPOINTS.FORGET_PASSWORD), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: ForgetPasswordApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Forget password error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi gửi email khôi phục mật khẩu",
      },
      { status: 500 }
    );
  }
}
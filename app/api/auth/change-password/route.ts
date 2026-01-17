import { NextResponse } from "next/server";
import { buildApiUrl, AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { ChangePasswordRequest, ChangePasswordApiResponse } from "@/types/auth";

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const body: ChangePasswordRequest = await req.json();

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

    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(AUTH_ENDPOINTS.CHANGE_PASSWORD), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const data: ChangePasswordApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi đổi mật khẩu",
      },
      { status: 500 }
    );
  }
}
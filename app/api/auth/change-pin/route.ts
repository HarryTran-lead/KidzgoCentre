import { NextResponse } from "next/server";
import { buildApiUrl, AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { ChangeUserPinRequest, ChangePinApiResponse } from "@/types/auth";

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const body: ChangeUserPinRequest = await req.json();

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

    if (!body.currentPin || !body.newPin) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "PIN hiện tại và PIN mới là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(AUTH_ENDPOINTS.CHANGE_PIN), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const data: ChangePinApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Change PIN error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi đổi PIN",
      },
      { status: 500 }
    );
  }
}
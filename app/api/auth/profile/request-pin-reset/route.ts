import { NextResponse } from "next/server";
import { buildApiUrl, AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { RequestParentPinResetRequest, RequestPinResetApiResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const body: RequestParentPinResetRequest = await req.json();

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

    if (!body.profileId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Profile ID là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(AUTH_ENDPOINTS.REQUEST_PIN_RESET), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const data: RequestPinResetApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Request PIN reset error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi yêu cầu đặt lại PIN",
      },
      { status: 500 }
    );
  }
}
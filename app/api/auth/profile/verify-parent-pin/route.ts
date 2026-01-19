import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { VerifyParentPinRequest, VerifyParentPinApiResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const body: VerifyParentPinRequest = await req.json();

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

    if (!body.profileId || !body.pin) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Profile ID và PIN là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.VERIFY_PARENT_PIN), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(body),
    });

    const data: VerifyParentPinApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Verify parent PIN error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi xác thực PIN",
      },
      { status: 500 }
    );
  }
}
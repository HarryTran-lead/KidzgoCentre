import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const body = await req.json();

    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    if (!body.profileId) {
      return NextResponse.json(
        { success: false, data: null, message: "Profile ID là bắt buộc" },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.REQUEST_PIN_RESET_ZALO_OTP), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Request PIN reset Zalo OTP error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi gửi OTP qua Zalo" },
      { status: 500 }
    );
  }
}

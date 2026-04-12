import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.challengeId || !body.otp) {
      return NextResponse.json(
        { success: false, data: null, message: "Challenge ID và OTP là bắt buộc" },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.VERIFY_PIN_RESET_ZALO_OTP), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Verify PIN reset Zalo OTP error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi xác minh OTP" },
      { status: 500 }
    );
  }
}

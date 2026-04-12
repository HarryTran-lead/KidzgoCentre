import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.token || !body.newPin) {
      return NextResponse.json(
        { success: false, data: null, message: "Token và PIN mới là bắt buộc" },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.RESET_PIN), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi đặt lại mã PIN" },
      { status: 500 }
    );
  }
}

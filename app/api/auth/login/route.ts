import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { LoginRequest, LoginApiResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body: LoginRequest = await req.json();

    // Validate request body
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Email và password là bắt buộc",
        },
        { status: 400 }
      );
    }

    const backendUrl = buildApiUrl(BACKEND_AUTH_ENDPOINTS.LOGIN);

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: LoginApiResponse = await upstream.json();

    // Always return 200 so the client can read the response body.
    // The client checks data.success / data.isSuccess to determine outcome.
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Login API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi đăng nhập",
      },
      { status: 500 }
    );
  }
}

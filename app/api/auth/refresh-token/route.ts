import { NextResponse } from "next/server";
import { buildApiUrl, AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { RefreshTokenApiResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const refreshToken =
      typeof body === "string" ? body : typeof body?.refreshToken === "string" ? body.refreshToken : "";

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Refresh token là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(AUTH_ENDPOINTS.REFRESH_TOKEN), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshToken),
    });

    const data: RefreshTokenApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi làm mới token",
      },
      { status: 500 }
    );
  }
}
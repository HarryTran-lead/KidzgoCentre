import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_AUTH_ENDPOINTS } from "@/constants/apiURL";
import type { GetProfilesApiResponse } from "@/types/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

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

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = buildApiUrl(BACKEND_AUTH_ENDPOINTS.GET_PROFILES);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    const data: GetProfilesApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách profiles",
      },
      { status: 500 }
    );
  }
}
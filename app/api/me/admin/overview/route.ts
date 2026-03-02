import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_OVERVIEW_ENDPOINTS } from "@/constants/apiURL";
import type { AdminOverviewApiResponse } from "@/types/dashboard";

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

    // Get query params from URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    const url = buildApiUrl(BACKEND_OVERVIEW_ENDPOINTS.ADMIN);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: AdminOverviewApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get admin overview error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy dữ liệu tổng quan",
      },
      { status: 500 }
    );
  }
}

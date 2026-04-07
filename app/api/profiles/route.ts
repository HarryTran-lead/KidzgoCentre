import { NextResponse } from "next/server";
import { BACKEND_PROFILE_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

/**
 * GET /api/profiles
 * List all profiles with optional filters.
 * Forwards to backend GET /profiles
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const baseUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.GET_ALL);
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await upstream.json()
      : { success: false, data: null, message: await upstream.text() };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get profiles error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi lấy danh sách hồ sơ" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Create a new profile (Parent or Student)
 * Forwards to backend POST /profiles
 */
export async function POST(req: Request) {
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

    const body = await req.json();
    const backendUrl = buildApiUrl(BACKEND_PROFILE_ENDPOINTS.CREATE);

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    let data;

    if (contentType.includes("application/json")) {
      data = await upstream.json();
    } else {
      const text = await upstream.text();
      data = {
        success: false,
        data: null,
        message: text || `Backend trả về dữ liệu không hợp lệ (status ${upstream.status}).`,
      };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Create profile error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi tạo profile",
      },
      { status: 500 }
    );
  }
}
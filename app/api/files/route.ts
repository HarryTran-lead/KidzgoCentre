import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_FILE_ENDPOINTS } from "@/constants/apiURL";

/**
 * DELETE /api/files?url=<url>
 * Delete a file from the backend by URL
 */
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, data: null, message: "Thiếu tham số url" },
        { status: 400 }
      );
    }

    const backendUrl = buildApiUrl(
      `${BACKEND_FILE_ENDPOINTS.DELETE}?url=${encodeURIComponent(url)}`
    );

    const upstream = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi xóa file" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/files/transform?url=<url>&width=<w>&height=<h>&format=<fmt>
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
    const backendUrl = buildApiUrl(
      `${BACKEND_FILE_ENDPOINTS.TRANSFORM}?${searchParams.toString()}`
    );

    const upstream = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("File transform error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi transform file" },
      { status: 500 }
    );
  }
}

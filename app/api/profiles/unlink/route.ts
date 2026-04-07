import { NextRequest, NextResponse } from "next/server";
import { BACKEND_PROFILE_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

/**
 * POST /api/profiles/unlink
 * Unlink a student profile from a parent profile.
 * Body: { parentProfileId, studentProfileId }
 * Forwards to backend POST /profiles/unlink
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, data: null, message: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const upstream = await fetch(buildApiUrl(BACKEND_PROFILE_ENDPOINTS.UNLINK), {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await upstream.json()
      : { success: false, data: null, message: await upstream.text() };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Unlink profiles error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi hủy liên kết hồ sơ" },
      { status: 500 }
    );
  }
}

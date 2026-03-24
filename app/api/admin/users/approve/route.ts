import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_USER_ENDPOINTS } from "@/constants/apiURL";

/**
 * PUT /api/admin/users/approve
 * Admin approves profiles created by staff.
 */
export async function PUT(req: Request) {
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

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawIds = Array.isArray(body?.profileId)
      ? body.profileId
      : Array.isArray(body?.profileIds)
      ? body.profileIds
      : body?.profileId
      ? [body.profileId]
      : [];

    const profileId = Array.from(
      new Set(
        rawIds
          .map((id: any) => String(id || "").trim())
          .filter(Boolean)
      )
    );

    if (profileId.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "profileId là bắt buộc",
        },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.APPROVE_PROFILES), {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileId }),
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await upstream.json()
      : { success: upstream.ok, message: await upstream.text() };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Approve profiles error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi duyệt profile",
      },
      { status: 500 }
    );
  }
}

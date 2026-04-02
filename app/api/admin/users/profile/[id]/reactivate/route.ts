import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_USER_ENDPOINTS } from "@/constants/apiURL";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * PATCH /api/admin/users/profile/{id}/reactivate
 * Admin reactivates an inactive profile.
 */
export async function PATCH(req: Request, { params }: Params) {
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

    const { id } = await params;

    let payload: unknown = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    let upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.PROFILE_REACTIVATE(id)), {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload ?? {}),
    });

    if (upstream.status === 404 || upstream.status === 405) {
      upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.PROFILE_REACTIVATE(id)), {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload ?? {}),
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await upstream.json()
      : { success: upstream.ok, message: await upstream.text() };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Profile reactivate error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi kích hoạt lại profile",
      },
      { status: 500 }
    );
  }
}

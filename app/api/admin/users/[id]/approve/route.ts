import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_USER_ENDPOINTS } from "@/constants/apiURL";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * PUT /api/admin/users/{id}/approve
 * Admin approves a profile created by staff (pending approval)
 */
export async function PUT(req: Request, { params }: Params) {
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

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.APPROVE(id)), {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? await upstream.json()
      : { success: upstream.ok, message: await upstream.text() };

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Approve profile error:", error);
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

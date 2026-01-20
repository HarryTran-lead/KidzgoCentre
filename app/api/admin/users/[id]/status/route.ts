import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_USER_ENDPOINTS } from "@/constants/apiURL";
import type { 
  UpdateUserStatusRequest,
  UpdateUserStatusApiResponse
} from "@/types/admin/user";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * PATCH /api/admin/users/{id}/status
 * Update user status (activate/deactivate)
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
    const body: UpdateUserStatusRequest = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.UPDATE_STATUS(id)), {
      method: "PATCH",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: UpdateUserStatusApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi cập nhật trạng thái người dùng",
      },
      { status: 500 }
    );
  }
}

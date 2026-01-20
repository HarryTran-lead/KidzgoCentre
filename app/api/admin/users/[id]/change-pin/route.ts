import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_USER_ENDPOINTS } from "@/constants/apiURL";
import type { 
  ChangeUserPinRequest,
  ChangeUserPinApiResponse
} from "@/types/admin/user";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * PUT /api/admin/users/{id}/change-pin
 * Change user PIN (for Admin to reset user's PIN)
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
    const body: ChangeUserPinRequest = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.CHANGE_PIN(id)), {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: ChangeUserPinApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Change user PIN error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi thay đổi mã PIN",
      },
      { status: 500 }
    );
  }
}

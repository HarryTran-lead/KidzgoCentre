import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_USER_ENDPOINTS } from "@/constants/apiURL";
import type { 
  GetUserByIdApiResponse,
  UpdateUserRequest,
  UpdateUserApiResponse,
  DeleteUserApiResponse
} from "@/types/admin/user";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/admin/users/{id}
 * Get user by ID
 */
export async function GET(req: Request, { params }: Params) {
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

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.GET_BY_ID(id)), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: GetUserByIdApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy thông tin người dùng",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/{id}
 * Update an existing user
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
    const body: UpdateUserRequest = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.UPDATE(id)), {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: UpdateUserApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi cập nhật người dùng",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/{id}
 * Delete a user by ID
 */
export async function DELETE(req: Request, { params }: Params) {
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

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.DELETE(id)), {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: DeleteUserApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi xóa người dùng",
      },
      { status: 500 }
    );
  }
}

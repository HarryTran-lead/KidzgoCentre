import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_USER_ENDPOINTS } from "@/constants/apiURL";
import type { 
  AssignBranchRequest,
  AssignBranchApiResponse
} from "@/types/admin/user";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * PATCH /api/admin/users/{id}/assign-branch
 * Assign a branch to a user
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
    const body: AssignBranchRequest = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_USER_ENDPOINTS.ASSIGN_BRANCH(id)), {
      method: "PATCH",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: AssignBranchApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Assign branch error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi gán chi nhánh cho người dùng",
      },
      { status: 500 }
    );
  }
}

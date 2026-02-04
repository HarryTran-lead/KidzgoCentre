import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { GetAllBranchesApiResponse } from "@/types/branch";

/**
 * GET /api/branches/all
 * Public endpoint for all roles to get branches
 * Different from /api/branches which requires admin role
 */
export async function GET(req: Request) {
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

    // Get query params from URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    
    // Use the /all endpoint from backend
    const url = buildApiUrl(`${BACKEND_BRANCH_ENDPOINTS.GET_ALL}/all`);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: GetAllBranchesApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get all branches (public) error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách chi nhánh",
      },
      { status: 500 }
    );
  }
}

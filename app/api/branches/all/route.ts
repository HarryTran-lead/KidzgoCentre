import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { GetAllBranchesApiResponse } from "@/types/branch";

/**
 * GET /api/branches/all
 * Public endpoint - accessible without authentication
 * Used by customers on contact form to select branches
 */
export async function GET(req: Request) {
  try {
    // Get query params from URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    
    // Use the /all endpoint from backend (public endpoint)
    const url = buildApiUrl(`${BACKEND_BRANCH_ENDPOINTS.GET_ALL}/all`);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // Optional: Include auth header if available (for logged-in users)
    // But don't require it (for public access)
    const authHeader = req.headers.get("authorization");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers,
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

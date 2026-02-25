import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { GetAllBranchesApiResponse } from "@/types/branch";

/**
 * GET /api/branches/public
 * Public endpoint for unauthenticated users to get active branches
 * Used in contact forms and public pages
 */
export async function GET(req: Request) {
  try {
    // Get query params from URL
    const { searchParams } = new URL(req.url);
    
    // Force isActive=true for public endpoint
    searchParams.set('isActive', 'true');
    const queryString = searchParams.toString();
    
    // Use the /all endpoint from backend
    const url = buildApiUrl(`${BACKEND_BRANCH_ENDPOINTS.GET_ALL}/all`);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // No Authorization header for public endpoint
    });

    const data: GetAllBranchesApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get branches (public) error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Không thể tải danh sách chi nhánh",
      },
      { status: 500 }
    );
  }
}

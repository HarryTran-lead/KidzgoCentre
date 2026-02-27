import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BLOG_ENDPOINTS } from "@/constants/apiURL";
import type { GetPublishedBlogsApiResponse } from "@/types/admin/blog";

/**
 * GET /api/blogs/published
 * Get all published blogs (public access - no authentication required)
 */
export async function GET(req: Request) {
  try {
    // Get query params from URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    
    const url = buildApiUrl(BACKEND_BLOG_ENDPOINTS.GET_PUBLISHED);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache to get fresh data
    });

    const data: GetPublishedBlogsApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get published blogs error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy danh sách bài viết",
      },
      { status: 500 }
    );
  }
}

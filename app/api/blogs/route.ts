import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BLOG_ENDPOINTS } from "@/constants/apiURL";
import type { 
  GetAllBlogsApiResponse,
  CreateBlogRequest,
  CreateBlogApiResponse 
} from "@/types/admin/blog";

/**
 * GET /api/blogs
 * Get all blogs with optional filters and pagination
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
    
    const url = buildApiUrl(BACKEND_BLOG_ENDPOINTS.GET_ALL);
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const upstream = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: GetAllBlogsApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get all blogs error:", error);
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

/**
 * POST /api/blogs
 * Create a new blog
 */
export async function POST(req: Request) {
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

    const body: CreateBlogRequest = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_BLOG_ENDPOINTS.CREATE), {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: CreateBlogApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Create blog error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi tạo bài viết",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BLOG_ENDPOINTS } from "@/constants/apiURL";
import type { 
  GetBlogByIdApiResponse,
  UpdateBlogRequest,
  UpdateBlogApiResponse,
  DeleteBlogApiResponse
} from "@/types/admin/blog";

/**
 * GET /api/blogs/[id]
 * Get blog by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const upstream = await fetch(buildApiUrl(BACKEND_BLOG_ENDPOINTS.GET_BY_ID(id)), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: GetBlogByIdApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Get blog by ID error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy thông tin bài viết",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blogs/[id]
 * Update blog by ID
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const body: UpdateBlogRequest = await req.json();

    const upstream = await fetch(buildApiUrl(BACKEND_BLOG_ENDPOINTS.UPDATE(id)), {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: UpdateBlogApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Update blog error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi cập nhật bài viết",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blogs/[id]
 * Delete blog by ID
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const upstream = await fetch(buildApiUrl(BACKEND_BLOG_ENDPOINTS.DELETE(id)), {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: DeleteBlogApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi xóa bài viết",
      },
      { status: 500 }
    );
  }
}

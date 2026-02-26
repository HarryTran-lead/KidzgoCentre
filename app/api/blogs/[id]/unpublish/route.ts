import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BLOG_ENDPOINTS } from "@/constants/apiURL";
import type { UnpublishBlogApiResponse } from "@/types/admin/blog";

/**
 * PATCH /api/blogs/[id]/unpublish
 * Unpublish a blog
 */
export async function PATCH(
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

    const upstream = await fetch(buildApiUrl(BACKEND_BLOG_ENDPOINTS.UNPUBLISH(id)), {
      method: "PATCH",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: UnpublishBlogApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Unpublish blog error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi gỡ xuất bản bài viết",
      },
      { status: 500 }
    );
  }
}

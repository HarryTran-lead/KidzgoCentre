import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_BLOG_ENDPOINTS } from "@/constants/apiURL";
import type { PublishBlogApiResponse } from "@/types/admin/blog";

/**
 * PATCH /api/blogs/[id]/publish
 * Publish a blog
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

    const upstream = await fetch(buildApiUrl(BACKEND_BLOG_ENDPOINTS.PUBLISH(id)), {
      method: "PATCH",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    const data: PublishBlogApiResponse = await upstream.json();

    return NextResponse.json(data, {
      status: upstream.status,
    });
  } catch (error) {
    console.error("Publish blog error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi xuất bản bài viết",
      },
      { status: 500 }
    );
  }
}

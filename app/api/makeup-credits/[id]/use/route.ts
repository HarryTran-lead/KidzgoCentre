import { NextResponse } from "next/server";
import { BACKEND_MAKEUP_CREDIT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { MakeupSuggestionsResponse } from "@/types/makeupCredit";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
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

    const payload = await req.json();
    const { id } = await ctx.params;

    const upstream = await fetch(buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.USE(id)), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: MakeupSuggestionsResponse = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Use makeup credit error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi sử dụng makeup credit",
      },
      { status: 500 }
    );
  }
}
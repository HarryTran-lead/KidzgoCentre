import { NextResponse } from "next/server";
import { BACKEND_MAKEUP_CREDIT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { MakeupCreditResponse } from "@/types/makeupCredit";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
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
    const upstream = await fetch(buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.EXPIRE(id)), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: MakeupCreditResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Expire makeup credit error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi hết hạn makeup credit",
      },
      { status: 500 }
    );
  }
}

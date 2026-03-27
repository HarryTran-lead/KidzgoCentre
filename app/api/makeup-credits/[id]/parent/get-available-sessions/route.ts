import { NextResponse } from "next/server";
import { BACKEND_MAKEUP_CREDIT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { MakeupSuggestionsResponse } from "@/types/makeupCredit";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: RouteParams) {
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

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    const primaryUrl = buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.AVAILABLE_SESSIONS(id));
    const fallbackUrl = buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.SUGGESTIONS(id));

    const requestUpstream = async (baseUrl: string) => {
      const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      const upstream = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      });

      return { upstream, fullUrl };
    };

    let { upstream } = await requestUpstream(primaryUrl);

    if (upstream.status === 404 || upstream.status === 405) {
      ({ upstream } = await requestUpstream(fallbackUrl));
    }

    const data: MakeupSuggestionsResponse = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get available makeup sessions error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: "Đã xảy ra lỗi khi lấy buổi học bù khả dụng",
      },
      { status: 500 }
    );
  }
}

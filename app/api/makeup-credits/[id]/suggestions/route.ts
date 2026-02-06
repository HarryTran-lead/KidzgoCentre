import { NextResponse } from "next/server";
import { BACKEND_MAKEUP_CREDIT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";
import type { MakeupSuggestionsResponse } from "@/types/makeupCredit";

type RouteParams = {
  params: { id: string };
};

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const makeupDate = searchParams.get("makeupDate"); // YYYY-MM-DD
    const timeOfDay = searchParams.get("timeOfDay");   // string

    const upstreamUrl = new URL(buildApiUrl(BACKEND_MAKEUP_CREDIT_ENDPOINTS.SUGGESTIONS(params.id)));

    if (makeupDate) upstreamUrl.searchParams.set("makeupDate", makeupDate);
    if (timeOfDay) upstreamUrl.searchParams.set("timeOfDay", timeOfDay);

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();
    let data: MakeupSuggestionsResponse;

    try {
      data = text ? (JSON.parse(text) as MakeupSuggestionsResponse) : ({ isSuccess: upstream.ok, data: null } as any);
    } catch {
      data = { isSuccess: upstream.ok, data: null } as any;
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Get makeup credit suggestions error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi lấy gợi ý makeup credit" },
      { status: 500 }
    );
  }
}

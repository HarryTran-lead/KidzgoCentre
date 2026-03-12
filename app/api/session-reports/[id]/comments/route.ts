import { NextResponse } from "next/server";
import { BACKEND_SESSION_REPORT_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

type AddSessionReportCommentPayload = {
  content?: string;
  comment?: string;
};

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function buildCommentsUrl(id: string) {
  return `${buildApiUrl(BACKEND_SESSION_REPORT_ENDPOINTS.REPORT_BY_ID(id))}/comments`;
}

function normalizeCommentPayload(payload: AddSessionReportCommentPayload) {
  return {
    content: payload.content ?? payload.comment ?? "",
  };
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = (await req.json()) as AddSessionReportCommentPayload;
    const upstream = await fetch(buildCommentsUrl(id), {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizeCommentPayload(payload)),
    });

    const text = await upstream.text();
    const data = text ? JSON.parse(text) : { success: upstream.ok };
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Add session report comment error:", error);
    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi khi thêm comment cho session report" },
      { status: 500 },
    );
  }
}

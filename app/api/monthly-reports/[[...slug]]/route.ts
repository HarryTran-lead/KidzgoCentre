import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

type RouteParams = {
  params: Promise<{
    slug?: string[];
  }>;
};

function isGenerateDraftPath(path: string): boolean {
  return path.endsWith("/generate-draft");
}

async function proxy(req: Request, { params }: RouteParams) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { slug = [] } = await params;
    const search = new URL(req.url).search;
    const path = slug.length > 0 ? `/${slug.join("/")}` : "";
    const targetUrl = `${buildApiUrl(`/monthly-reports${path}`)}${search}`;

    const isBodyMethod = req.method !== "GET" && req.method !== "HEAD";
    const shouldForwardBody = isBodyMethod && !isGenerateDraftPath(path);
    const rawBody = shouldForwardBody ? await req.text() : "";
    const hasForwardedBody = rawBody.trim().length > 0;

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Authorization: authHeader,
        ...(shouldForwardBody && hasForwardedBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(shouldForwardBody && hasForwardedBody ? { body: rawBody } : {}),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: unknown = { success: upstream.ok };

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: upstream.ok,
          message: text,
        };
      }
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Monthly report proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Đã xảy ra lỗi khi xử lý monthly report",
      },
      { status: 500 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;

import { NextResponse } from "next/server";
import { BACKEND_TEACHING_MATERIALS_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

function buildEmptyListResponse(req: Request) {
  const searchParams = new URL(req.url).searchParams;
  const pageNumber = Number(searchParams.get("pageNumber") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");

  return NextResponse.json({
    isSuccess: true,
    data: {
      materials: {
        items: [],
        pageNumber,
        totalPages: 1,
        totalCount: 0,
        hasPreviousPage: false,
        hasNextPage: false,
        pageSize,
      },
    },
  });
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const queryString = new URL(req.url).searchParams.toString();
    const upstreamBase = buildApiUrl(BACKEND_TEACHING_MATERIALS_ENDPOINTS.BASE);
    const upstreamUrl = queryString ? `${upstreamBase}?${queryString}` : upstreamBase;

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();
    const normalizedText = text.trim();

    if (!normalizedText) {
      if (upstream.ok) {
        return buildEmptyListResponse(req);
      }

      return NextResponse.json(
        {
          isSuccess: false,
          data: null,
          message: `Backend returned empty response (${upstream.status})`,
        },
        { status: upstream.status }
      );
    }

    try {
      return NextResponse.json(JSON.parse(normalizedText), { status: upstream.status });
    } catch {
      return NextResponse.json(
        {
          isSuccess: false,
          data: null,
          message: "Invalid upstream JSON",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Teaching materials proxy error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 }
    );
  }
}

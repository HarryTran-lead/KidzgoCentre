import { NextResponse } from "next/server";

import { BACKEND_NOTIFICATION_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

const EMPTY_HISTORY_RESPONSE = {
  isSuccess: true,
  data: {
    items: [],
  },
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const queryString = new URL(req.url).searchParams.toString();
    const upstreamBase = buildApiUrl(BACKEND_NOTIFICATION_ENDPOINTS.BROADCAST_HISTORY);
    const upstreamUrl = queryString ? `${upstreamBase}?${queryString}` : upstreamBase;

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();
    if (!text.trim()) {
      if (upstream.status === 403 || upstream.status === 204 || upstream.ok) {
        return NextResponse.json(EMPTY_HISTORY_RESPONSE, { status: 200 });
      }

      return NextResponse.json(
        { isSuccess: false, data: null, message: upstream.statusText || "Empty upstream response" },
        { status: upstream.status || 502 },
      );
    }

    try {
      return NextResponse.json(JSON.parse(text), { status: upstream.status });
    } catch {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Invalid upstream JSON" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Notification broadcast history proxy error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

type ProxyOptions = {
  req: Request;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  includeQuery?: boolean;
  body?: unknown;
};

export async function proxyJson({
  req,
  endpoint,
  method,
  includeQuery = false,
  body,
}: ProxyOptions) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const upstreamBase = buildApiUrl(endpoint);
    const queryString = new URL(req.url).searchParams.toString();
    const upstreamUrl =
      includeQuery && queryString ? `${upstreamBase}?${queryString}` : upstreamBase;

    const upstream = await fetch(upstreamUrl, {
      method,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await upstream.text();
    if (!text) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Empty upstream response" },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Invalid upstream JSON" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 }
    );
  }
}


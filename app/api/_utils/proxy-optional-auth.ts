import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

type ProxyOptionalAuthOptions = {
  req: Request;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  includeQuery?: boolean;
  body?: unknown;
};

export async function proxyJsonOptionalAuth({
  req,
  endpoint,
  method,
  includeQuery = false,
  body,
}: ProxyOptionalAuthOptions) {
  try {
    const authHeader = req.headers.get("authorization");
    const upstreamBase = buildApiUrl(endpoint);
    const queryString = new URL(req.url).searchParams.toString();
    const upstreamUrl =
      includeQuery && queryString ? `${upstreamBase}?${queryString}` : upstreamBase;

    const upstream = await fetch(upstreamUrl, {
      method,
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        "Content-Type": "application/json",
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await upstream.text();
    if (!text) {
      return NextResponse.json(
        { isSuccess: upstream.ok, data: null, message: "Empty upstream response" },
        { status: upstream.status }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json(
        { isSuccess: upstream.ok, data: null, message: text },
        { status: upstream.status }
      );
    }
  } catch (error) {
    console.error("Proxy optional auth error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 }
    );
  }
}

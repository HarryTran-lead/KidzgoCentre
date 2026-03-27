import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

type ProxyOptions = {
  req: Request;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

type ProxyPassthroughOptions = {
  req: Request;
  endpoint: string;
  includeQuery?: boolean;
};

export async function proxyPassthrough({
  req,
  endpoint,
  includeQuery = true,
}: ProxyPassthroughOptions) {
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

    const contentType = req.headers.get("content-type");
    const requestInit: RequestInit = {
      method: req.method,
      headers: {
        Authorization: authHeader,
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
    };

    if (!["GET", "HEAD"].includes(req.method.toUpperCase())) {
      const rawBody = await req.text();
      if (rawBody) {
        requestInit.body = rawBody;
      }
    }

    const upstream = await fetch(upstreamUrl, requestInit);
    const responseText = await upstream.text();
    const upstreamType = upstream.headers.get("content-type") ?? "";

    if (!responseText) {
      return new NextResponse(null, { status: upstream.status });
    }

    if (upstreamType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(responseText), {
          status: upstream.status,
        });
      } catch {
        return NextResponse.json(
          { isSuccess: false, data: null, message: "Invalid upstream JSON" },
          { status: 502 }
        );
      }
    }

    return new NextResponse(responseText, {
      status: upstream.status,
      headers: {
        "Content-Type": upstreamType || "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Proxy passthrough error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Proxy request failed" },
      { status: 500 }
    );
  }
}


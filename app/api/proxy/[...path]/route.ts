import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_BASE =
  process.env.BACKEND_API_BASE_URL ?? "https://kidzgo-be.onrender.com/api";

async function handler(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;

  const url = new URL(req.url);
  const targetUrl = `${BACKEND_BASE}/${path.join("/")}${url.search}`;

  // Copy headers, remove ones that can cause issues
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("connection");

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  // Forward body for non-GET/HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstreamRes = await fetch(targetUrl, init);

  // Return upstream response as-is (status + headers + body)
  const resHeaders = new Headers(upstreamRes.headers);
    resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");
  resHeaders.delete("transfer-encoding");
  const body = await upstreamRes.arrayBuffer();

  return new NextResponse(body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

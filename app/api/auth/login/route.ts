import { NextResponse } from "next/server";

const BE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.BACKEND_API_BASE_URL ??
  "https://kidzgo-be.onrender.com/api";
export async function POST(req: Request) {
  const body = await req.text(); // giữ raw body

  const upstream = await fetch(`${BE}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");
  resHeaders.delete("transfer-encoding");
  const resBody = await upstream.arrayBuffer();
  return new NextResponse(resBody, {
    status: upstream.status,
    headers: resHeaders,
  });
}

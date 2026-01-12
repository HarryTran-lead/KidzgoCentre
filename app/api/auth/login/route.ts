import { NextResponse } from "next/server";

const BE = "https://kidzgo-be.onrender.com/api";

export async function POST(req: Request) {
  const body = await req.text(); // giữ raw body

  const upstream = await fetch(`${BE}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });

  const resBody = await upstream.arrayBuffer();
  return new NextResponse(resBody, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

import { NextResponse } from "next/server";
import {
  BACKEND_TICKET_TYPE_COMPATIBILITY_ENDPOINTS,
  buildApiUrl,
} from "@/constants/apiURL";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, data: null, message: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = buildApiUrl(
    `${BACKEND_TICKET_TYPE_COMPATIBILITY_ENDPOINTS.MATRIX}${qs ? `?${qs}` : ""}`
  );

  const upstream = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await parseBody(upstream);
  return NextResponse.json(data, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

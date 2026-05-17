import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_LEVEL_ENDPOINTS } from "@/constants/apiURL";

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = buildApiUrl(`${BACKEND_LEVEL_ENDPOINTS.BASE}${qs ? `?${qs}` : ""}`);
  const upstream = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const body = await req.json();
  const upstream = await fetch(buildApiUrl(BACKEND_LEVEL_ENDPOINTS.BASE), {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

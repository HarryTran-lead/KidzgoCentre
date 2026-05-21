import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const upstream = await fetch(buildApiUrl(BACKEND_ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id)), {
    method: "GET",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const body = await req.json();
  const upstream = await fetch(buildApiUrl(BACKEND_ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id)), {
    method: "PUT",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const upstream = await fetch(buildApiUrl(BACKEND_ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_BY_ID(id)), {
    method: "DELETE",
    headers: { Authorization: authHeader },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

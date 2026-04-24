import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_FAQ_ENDPOINTS } from "@/constants/apiURL";

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

/**
 * PUT /api/faqs/[id]
 * Admin/ManagementStaff: update a FAQ item
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const upstream = await fetch(buildApiUrl(BACKEND_FAQ_ENDPOINTS.ITEM_BY_ID(id)), {
    method: "PUT",
    headers: { "Authorization": authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

/**
 * DELETE /api/faqs/[id]
 * Admin/ManagementStaff: soft-delete a FAQ item
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const { id } = await params;
  const upstream = await fetch(buildApiUrl(BACKEND_FAQ_ENDPOINTS.ITEM_BY_ID(id)), {
    method: "DELETE",
    headers: { "Authorization": authHeader, "Content-Type": "application/json" },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

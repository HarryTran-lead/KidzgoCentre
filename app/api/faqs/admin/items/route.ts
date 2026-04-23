import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_FAQ_ENDPOINTS } from "@/constants/apiURL";

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

/**
 * GET /api/faqs/admin/items
 * Admin/ManagementStaff: list FAQ items with filters + pagination
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = buildApiUrl(`${BACKEND_FAQ_ENDPOINTS.ADMIN_ITEMS}${qs ? `?${qs}` : ""}`);
  const upstream = await fetch(url, {
    method: "GET",
    headers: { "Authorization": authHeader, "Content-Type": "application/json" },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

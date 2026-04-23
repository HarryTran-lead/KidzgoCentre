import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_FAQ_ENDPOINTS } from "@/constants/apiURL";

// Reusable helper to parse response body
async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

/**
 * GET /api/faqs/categories
 * Public: list active categories that have published FAQs
 */
export async function GET(req: Request) {
  const upstream = await fetch(buildApiUrl(BACKEND_FAQ_ENDPOINTS.PUBLIC_CATEGORIES), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

/**
 * POST /api/faqs/categories
 * Admin/ManagementStaff: create a category
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const body = await req.json();
  const upstream = await fetch(buildApiUrl(BACKEND_FAQ_ENDPOINTS.CATEGORIES_CREATE), {
    method: "POST",
    headers: { "Authorization": authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

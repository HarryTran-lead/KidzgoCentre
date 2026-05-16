import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_SLOT_TYPE_ENDPOINTS } from "@/constants/apiURL";

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ success: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const upstream = await fetch(buildApiUrl(BACKEND_SLOT_TYPE_ENDPOINTS.TOGGLE_STATUS(id)), {
    method: "PATCH",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_STUDENT_PROGRESS_ENDPOINTS } from "@/constants/apiURL";

async function parseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

// GET /api/student-progress/dashboard
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
  }
  const upstream = await fetch(buildApiUrl(BACKEND_STUDENT_PROGRESS_ENDPOINTS.DASHBOARD), {
    method: "GET",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
  });
  const data = await parseBody(upstream);
  return NextResponse.json(data, { status: upstream.status });
}

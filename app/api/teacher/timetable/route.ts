import { NextResponse } from "next/server";
import { buildApiUrl } from "@/constants/apiURL";

const safeJson = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return {
      success: res.ok,
      data: null,
      message: text || "Dữ liệu phản hồi không hợp lệ",
    };
  }
};

const extractSessionCount = (payload: unknown): number => {
  if (!payload || typeof payload !== "object") return 0;

  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  const sessionCandidates = [
    data?.sessions,
    data?.items,
    root.sessions,
    root.items,
  ];

  for (const candidate of sessionCandidates) {
    if (Array.isArray(candidate)) return candidate.length;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items.length;
      if (Array.isArray(nested.data)) return nested.data.length;
    }
  }

  return 0;
};

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, data: null, message: "Chưa đăng nhập" },
      { status: 401 },
    );
  }

  const queryString = new URL(req.url).searchParams.toString();

  const teacherTimetableUrl = buildApiUrl(`/teacher/timetable${queryString ? `?${queryString}` : ""}`);
  const sessionsUrl = buildApiUrl(`/sessions${queryString ? `?${queryString}` : ""}`);

  try {
    const requestInit: RequestInit = {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    };

    const primary = await fetch(teacherTimetableUrl, requestInit);
    const primaryData = await safeJson(primary);
    const primarySessionCount = extractSessionCount(primaryData);

    if (primary.status !== 403 && primarySessionCount > 0) {
      return NextResponse.json(primaryData, { status: primary.status });
    }

    if (primary.status !== 403 && primary.ok && primarySessionCount === 0) {
      const fallback = await fetch(sessionsUrl, requestInit);
      const fallbackData = await safeJson(fallback);
      return NextResponse.json(fallbackData, { status: fallback.status });
    }

    const fallback = await fetch(sessionsUrl, requestInit);
    const fallbackData = await safeJson(fallback);
    return NextResponse.json(fallbackData, { status: fallback.status });
  } catch (error) {
    console.error("Teacher timetable proxy error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi tải danh sách buổi học" },
      { status: 500 },
    );
  }
}
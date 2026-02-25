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
    if (primary.status !== 403) {
      const data = await safeJson(primary);
      return NextResponse.json(data, { status: primary.status });
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
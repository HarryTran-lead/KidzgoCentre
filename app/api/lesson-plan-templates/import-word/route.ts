import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_ADMIN_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json(
        { success: false, data: null, message: "moduleId là bắt buộc" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, data: null, message: "Không tìm thấy file" },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const qs = new URLSearchParams(searchParams);
    const backendUrl = buildApiUrl(
      `${BACKEND_ADMIN_ENDPOINTS.LESSON_PLAN_TEMPLATES_IMPORT_WORD}?${qs.toString()}`
    );

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: backendFormData,
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Lesson plan template import-word error:", error);
    return NextResponse.json(
      { success: false, data: null, message: "Đã xảy ra lỗi khi import file Word" },
      { status: 500 }
    );
  }
}

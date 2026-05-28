import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const formData = await req.formData();
    const required = ["programId", "levelId", "code", "file"];
    for (const key of required) {
      const value = formData.get(key);
      if (!value) {
        return NextResponse.json(
          { isSuccess: false, data: null, message: `${key} là bắt buộc` },
          { status: 400 },
        );
      }
    }

    const backendFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value);
    }

    if (!backendFormData.get("asDraft")) {
      backendFormData.append("asDraft", "true");
    }

    const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.IMPORT_COMMIT);
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: backendFormData,
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Syllabus import-commit error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi commit import" },
      { status: 500 },
    );
  }
}

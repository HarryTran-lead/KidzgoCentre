import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const formData = await req.formData();
    const programId = formData.get("programId");
    const levelId = formData.get("levelId");
    const file = formData.get("file");

    if (!programId || !levelId || !(file instanceof Blob)) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "programId, levelId, file là bắt buộc" },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("programId", String(programId));
    backendFormData.append("levelId", String(levelId));
    backendFormData.append("file", file);

    const backendUrl = buildApiUrl(BACKEND_SYLLABUS_ENDPOINTS.IMPORT_PREVIEW);
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: backendFormData,
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Syllabus import-preview error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi preview import" },
      { status: 500 },
    );
  }
}

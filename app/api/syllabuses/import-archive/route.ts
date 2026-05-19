import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    const levelId = searchParams.get("levelId");
    const code = searchParams.get("code");
    const version = searchParams.get("version");
    const overwriteExisting = searchParams.get("overwriteExisting") ?? "true";

    if (!programId || !levelId || !code || !version) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "programId, levelId, code, version là bắt buộc" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Không tìm thấy file" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const query = new URLSearchParams({ programId, levelId, code, version, overwriteExisting });
    const backendUrl = buildApiUrl(`${BACKEND_SYLLABUS_ENDPOINTS.IMPORT_ARCHIVE}?${query}`);

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: backendFormData,
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Syllabus import-archive error:", error);
    return NextResponse.json({ isSuccess: false, data: null, message: "Đã xảy ra lỗi khi import file archive" }, { status: 500 });
  }
}

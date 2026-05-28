import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Chưa đăng nhập" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    const levelId = searchParams.get("levelId");
    const syllabusId = searchParams.get("syllabusId");
    const overwriteExisting = searchParams.get("overwriteExisting") ?? "true";
    const moduleId = searchParams.get("moduleId");

    if (!programId || !levelId || !syllabusId) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "programId, levelId và syllabusId là bắt buộc" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files");
    if (!files.length) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Không tìm thấy file nào" },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    for (const file of files) {
      if (file instanceof Blob) {
        backendFormData.append("files", file);
      }
    }

    const query = new URLSearchParams({ programId, levelId, syllabusId, overwriteExisting });
    if (moduleId) query.append("moduleId", moduleId);

    const backendUrl = buildApiUrl(`${BACKEND_SYLLABUS_ENDPOINTS.IMPORT_LESSON_PLAN_WORDS}?${query}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);
    let upstream: Response;
    try {
      upstream = await fetch(backendUrl, {
        method: "POST",
        headers: { Authorization: authHeader },
        body: backendFormData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    const isReset =
      error instanceof Error &&
      ((error as NodeJS.ErrnoException).code === "ECONNRESET" ||
        error.message.includes("socket hang up"));
    if (isAbort) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Backend không phản hồi (timeout)." },
        { status: 504 },
      );
    }
    if (isReset) {
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Mất kết nối tới server. Vui lòng thử lại." },
        { status: 503 },
      );
    }
    console.error("Syllabus import-lesson-plan-words error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi import lesson plan files" },
      { status: 500 },
    );
  }
}

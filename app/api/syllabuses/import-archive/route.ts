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
    const branchId = searchParams.get("branchId");
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
    if (branchId) {
      query.append("branchId", branchId);
    }
    const backendUrl = buildApiUrl(`${BACKEND_SYLLABUS_ENDPOINTS.IMPORT_ARCHIVE}?${query}`);

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

    const data = await upstream.json().catch(() => {
      if (upstream.status === 413) {
        return {
          isSuccess: false,
          data: null,
          title: "File quá lớn",
          detail: `File ZIP (${Math.ceil(file.size / 1024 / 1024)} MB) vượt quá giới hạn upload của server. Cần tăng request body limit ở proxy/backend hoặc giảm kích thước archive.`,
          message: "File ZIP vượt quá giới hạn upload của server.",
          status: 413,
        };
      }

      return {
        isSuccess: false,
        data: null,
        message: `Backend trả về lỗi ${upstream.status} nhưng không có JSON response.`,
        status: upstream.status,
      };
    });
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    const isReset = error instanceof Error && (
      (error as NodeJS.ErrnoException).code === "ECONNRESET" ||
      error.message.includes("socket hang up")
    );
    if (isAbort) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Backend không phản hồi (timeout)." }, { status: 504 });
    }
    if (isReset) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Mất kết nối tới server. Vui lòng thử lại." }, { status: 503 });
    }
    console.error("Syllabus import-archive error:", error);
    return NextResponse.json({ isSuccess: false, data: null, message: "Đã xảy ra lỗi khi import file archive" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { buildApiUrl, BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";

export const runtime = "nodejs";
export const maxDuration = 300;

type RequestInitWithDuplex = RequestInit & { duplex?: "half" };

async function readUpstreamBody(upstream: Response) {
  const text = await upstream.text().catch(() => "");
  if (!text) {
    return {
      isSuccess: false,
      data: null,
      message: `Backend trả về lỗi ${upstream.status} nhưng không có response body.`,
      status: upstream.status,
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      isSuccess: upstream.ok,
      data: upstream.ok ? text : null,
      message: upstream.ok ? undefined : text || `Backend trả về lỗi ${upstream.status}.`,
      status: upstream.status,
    };
  }
}

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

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Request upload không đúng multipart/form-data" }, { status: 400 });
    }

    if (!req.body) {
      return NextResponse.json({ isSuccess: false, data: null, message: "Không tìm thấy file upload" }, { status: 400 });
    }

    const query = new URLSearchParams({ programId, levelId, code, version, overwriteExisting });
    if (branchId) {
      query.append("branchId", branchId);
    }
    const backendUrl = buildApiUrl(`${BACKEND_SYLLABUS_ENDPOINTS.IMPORT_ARCHIVE}?${query}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300_000);
    let upstream: Response;
    try {
      const requestInit: RequestInitWithDuplex = {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": contentType,
        },
        body: req.body,
        signal: controller.signal,
        duplex: "half",
      };
      upstream = await fetch(backendUrl, requestInit);
    } finally {
      clearTimeout(timer);
    }

    const data = await readUpstreamBody(upstream);
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
    if (error instanceof TypeError && /fetch/i.test(error.message)) {
      return NextResponse.json({
        isSuccess: false,
        data: null,
        message: "Proxy không kết nối được tới backend import archive.",
        detail: "Kiểm tra backend HTTPS/CORS hoặc giới hạn upload của server/proxy production.",
      }, { status: 502 });
    }
    console.error("Syllabus import-archive error:", error);
    return NextResponse.json({ isSuccess: false, data: null, message: "Đã xảy ra lỗi khi import file archive" }, { status: 500 });
  }
}

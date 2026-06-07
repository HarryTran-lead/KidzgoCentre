import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { BACKEND_SYLLABUS_ENDPOINTS } from "@/constants/apiURL";

export const runtime = "nodejs";
export const maxDuration = 300;

const PRIVATE_BLOB_HOST_SUFFIX = ".private.blob.vercel-storage.com";
const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";
const SERVER_API_FALLBACK = "http://103.146.22.206:5000/api";

type ArchiveUpload = {
  blob: Blob;
  fileName: string;
  size: number;
};

type ArchiveJsonPayload = {
  archiveUrl?: unknown;
  fileUrl?: unknown;
  blobUrl?: unknown;
  url?: unknown;
  fileName?: unknown;
  contentType?: unknown;
};

class ImportArchiveRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function appendBackendEndpoint(baseUrl: string, endpoint: string): string {
  const base = normalizeBaseUrl(baseUrl);
  const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const normalizedEndpoint =
    /\/api$/i.test(base) && ep.startsWith("/api/")
      ? ep.replace(/^\/api/i, "")
      : ep;

  return `${base}${normalizedEndpoint}`;
}

function buildArchiveBackendUrl(endpoint: string, requestUrl: string): string {
  const requestOrigin = new URL(requestUrl).origin.toLowerCase();
  const candidates = [
    process.env.BACKEND_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    SERVER_API_FALLBACK,
  ];

  for (const candidate of candidates) {
    const base = normalizeBaseUrl(candidate ?? "");
    if (!base) continue;

    try {
      if (new URL(base).origin.toLowerCase() === requestOrigin) {
        continue;
      }
    } catch {
      continue;
    }

    return appendBackendEndpoint(base, endpoint);
  }

  return appendBackendEndpoint(SERVER_API_FALLBACK, endpoint);
}

function fallbackFileName(url: URL, fileName?: string): string {
  const explicit = str(fileName);
  if (explicit) return explicit;

  const lastSegment = decodeURIComponent(url.pathname.split("/").pop() || "");
  return lastSegment || "archive.zip";
}

function parseAllowedBlobUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ImportArchiveRequestError("archiveUrl không hợp lệ.", 400);
  }

  const host = url.hostname.toLowerCase();
  if (!host.endsWith(BLOB_HOST_SUFFIX) && !host.endsWith(PRIVATE_BLOB_HOST_SUFFIX)) {
    throw new ImportArchiveRequestError(
      "archiveUrl không thuộc Vercel Blob.",
      400,
      "Chỉ hỗ trợ URL từ Vercel Blob để tránh tải file từ nguồn không tin cậy.",
    );
  }

  return url;
}

function isPrivateBlobUrl(url: URL): boolean {
  return url.hostname.toLowerCase().endsWith(PRIVATE_BLOB_HOST_SUFFIX);
}

function sanitizeBlobPathname(url: URL): string {
  return url.pathname
    .trim()
    .split(/[?#]/, 1)[0]
    .replace(/^\/+/, "")
    .replace(/\.\./g, "");
}

async function blobFromPrivateBlob(url: URL, contentType: string): Promise<Blob> {
  const pathname = sanitizeBlobPathname(url);
  if (!pathname) {
    throw new ImportArchiveRequestError("archiveUrl không có pathname hợp lệ.", 400);
  }

  const candidates = Array.from(new Set([pathname, `/${pathname}`]));
  for (const candidate of candidates) {
    try {
      const result = await get(candidate, { access: "private" });
      if (!result?.stream) continue;

      const buffer = await new Response(result.stream).arrayBuffer();
      return new Blob([buffer], {
        type: result.blob.contentType || contentType || "application/zip",
      });
    } catch {
      // Try the next pathname shape.
    }
  }

  throw new ImportArchiveRequestError(
    "Không đọc được file ZIP từ Blob.",
    400,
    "Kiểm tra BLOB_READ_WRITE_TOKEN và URL Blob vừa upload.",
  );
}

async function blobFromPublicBlob(url: URL, contentType: string): Promise<Blob> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new ImportArchiveRequestError(
      "Không tải được file ZIP từ Blob.",
      400,
      `Blob trả về HTTP ${response.status}.`,
    );
  }

  const buffer = await response.arrayBuffer();
  return new Blob([buffer], {
    type: response.headers.get("content-type") || contentType || "application/zip",
  });
}

async function archiveFromJson(req: Request): Promise<ArchiveUpload> {
  const payload = (await req.json().catch(() => null)) as ArchiveJsonPayload | null;
  if (!payload || typeof payload !== "object") {
    throw new ImportArchiveRequestError("Payload import archive không hợp lệ.", 400);
  }

  const archiveUrl = str(payload.archiveUrl) || str(payload.fileUrl) || str(payload.blobUrl) || str(payload.url);
  if (!archiveUrl) {
    throw new ImportArchiveRequestError("Thiếu archiveUrl/fileUrl.", 400);
  }

  const url = parseAllowedBlobUrl(archiveUrl);
  const contentType = str(payload.contentType) || "application/zip";
  const blob = isPrivateBlobUrl(url)
    ? await blobFromPrivateBlob(url, contentType)
    : await blobFromPublicBlob(url, contentType);

  return {
    blob,
    fileName: fallbackFileName(url, str(payload.fileName)),
    size: blob.size,
  };
}

async function archiveFromMultipart(req: Request): Promise<ArchiveUpload> {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    throw new ImportArchiveRequestError("Không tìm thấy file.", 400);
  }

  const fileName =
    typeof (file as { name?: unknown }).name === "string"
      ? (file as { name: string }).name
      : "archive.zip";

  return {
    blob: file,
    fileName,
    size: file.size,
  };
}

async function readArchiveUpload(req: Request): Promise<ArchiveUpload> {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    return archiveFromJson(req);
  }

  return archiveFromMultipart(req);
}

function importErrorResponse(error: ImportArchiveRequestError): NextResponse {
  return NextResponse.json(
    {
      isSuccess: false,
      data: null,
      message: error.message,
      detail: error.detail,
      status: error.status,
    },
    { status: error.status },
  );
}

async function readUpstreamBody(upstream: Response, archiveSize?: number) {
  const text = await upstream.text().catch(() => "");
  if (!text) {
    if (upstream.status === 413 && archiveSize) {
      return {
        isSuccess: false,
        data: null,
        title: "File quá lớn",
        detail: `File ZIP (${Math.ceil(archiveSize / 1024 / 1024)} MB) vượt quá giới hạn upload của backend.`,
        message: "File ZIP vượt quá giới hạn upload của backend.",
        status: 413,
      };
    }

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
    if (upstream.status === 413 && archiveSize) {
      return {
        isSuccess: false,
        data: null,
        title: "File quá lớn",
        detail: text || `File ZIP (${Math.ceil(archiveSize / 1024 / 1024)} MB) vượt quá giới hạn upload của backend.`,
        message: "File ZIP vượt quá giới hạn upload của backend.",
        status: 413,
      };
    }

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
      return NextResponse.json(
        { isSuccess: false, data: null, message: "Chưa đăng nhập." },
        { status: 401 },
      );
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
        {
          isSuccess: false,
          data: null,
          message: "programId, levelId, code, version là bắt buộc.",
        },
        { status: 400 },
      );
    }

    const archive = await readArchiveUpload(req);
    const backendFormData = new FormData();
    backendFormData.append("file", archive.blob, archive.fileName);

    const query = new URLSearchParams({ programId, levelId, code, version, overwriteExisting });
    if (branchId) {
      query.append("branchId", branchId);
    }

    const backendUrl = buildArchiveBackendUrl(
      `${BACKEND_SYLLABUS_ENDPOINTS.IMPORT_ARCHIVE}?${query}`,
      req.url,
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300_000);
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

    const data = await readUpstreamBody(upstream, archive.size);
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    if (error instanceof ImportArchiveRequestError) {
      return importErrorResponse(error);
    }

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
    if (error instanceof TypeError && /fetch/i.test(error.message)) {
      return NextResponse.json({
        isSuccess: false,
        data: null,
        message: "Proxy không kết nối được tới backend import archive.",
        detail: "Kiểm tra backend HTTPS/CORS hoặc giới hạn upload của server/proxy production.",
      }, { status: 502 });
    }
    console.error("Syllabus import-archive error:", error);
    return NextResponse.json(
      { isSuccess: false, data: null, message: "Đã xảy ra lỗi khi import file archive." },
      { status: 500 },
    );
  }
}

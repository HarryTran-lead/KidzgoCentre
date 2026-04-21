import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { BACKEND_AUTH_ENDPOINTS, buildApiUrl } from "@/constants/apiURL";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = Number(process.env.BLOB_MAX_UPLOAD_BYTES ?? "209715200"); // 200MB default
const ALLOWED_CONTENT_TYPES = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
] as const;

function getBlobReadWriteToken(): string {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN ??
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN ??
    "";

  return token.trim();
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization")?.trim() ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

function safePathname(pathname: string): string {
  const normalized = pathname.trim().replace(/^\/+/, "");
  return normalized.replace(/\.\./g, "");
}

async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(buildApiUrl(BACKEND_AUTH_ENDPOINTS.ME), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return response.ok;
  } catch (error) {
    console.error("Blob upload auth check failed:", error);
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const blobToken = getBlobReadWriteToken();
  if (!blobToken) {
    return NextResponse.json(
      {
        error:
          "Thiếu biến môi trường BLOB_READ_WRITE_TOKEN trên deployment Vercel.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  // Require user auth only when generating a client token from browser requests.
  // Vercel's upload-completed callback does not carry user bearer token.
  if (body?.type === "blob.generate-client-token") {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const isAuthorized = await verifyAccessToken(token);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Không có quyền upload" }, { status: 403 });
    }
  }

  try {
    const jsonResponse = await handleUpload({
      token: blobToken,
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const normalizedPathname = safePathname(pathname);
        const metadata = (() => {
          if (!clientPayload) return {} as { folder?: string; resourceType?: string };
          try {
            return JSON.parse(clientPayload) as { folder?: string; resourceType?: string };
          } catch {
            return {} as { folder?: string; resourceType?: string };
          }
        })();

        if (!normalizedPathname) {
          throw new Error("Đường dẫn file không hợp lệ");
        }

        return {
          tokenPayload: JSON.stringify({
            folder: metadata.folder ?? "uploads",
            resourceType: metadata.resourceType ?? "auto",
            pathname: normalizedPathname,
          }),
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload completed", {
          url: blob.url,
          pathname: blob.pathname,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

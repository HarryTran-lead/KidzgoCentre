/**
 * File Management API Helper Functions
 *
 * Provides helper functions for uploading, deleting, and transforming files.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via the Authorization header from the browser.
 */

import { FILE_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";

const DIRECT_UPLOAD_MIN_MB = Number(process.env.NEXT_PUBLIC_DIRECT_UPLOAD_MIN_MB ?? "0");
const DIRECT_UPLOAD_MIN_BYTES = Math.max(0, DIRECT_UPLOAD_MIN_MB) * 1024 * 1024;

function isBlobUploadEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_VERCEL_BLOB !== "false";
}

function shouldFallbackToBackendWhenBlobFails(): boolean {
  return process.env.NEXT_PUBLIC_BLOB_FALLBACK_TO_BACKEND === "true";
}

function buildBlobPath(fileName: string, folder: string): string {
  const normalizedFolder = folder
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/-+/g, "-");

  const trimmedName = fileName.trim();
  const extMatch = trimmedName.match(/\.([a-zA-Z0-9]{1,10})$/);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
  const baseName = ext ? trimmedName.slice(0, -ext.length) : trimmedName;
  const safeBase = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 120);

  const safeName = `${safeBase || "file"}${ext}`;

  return normalizedFolder ? `${normalizedFolder}/${safeName}` : safeName;
}

async function uploadFileViaBackend(
  file: File,
  folder: string,
  resourceType: string,
): Promise<UploadFileResponse> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams({ folder, resourceType });
  const url = `${FILE_ENDPOINTS.UPLOAD}?${params.toString()}`;

  const response = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return data as UploadFileError;
  }

  return data as UploadFileSuccess;
}

async function uploadFileViaBlob(
  file: File,
  folder: string,
  resourceType: string,
): Promise<UploadFileSuccess> {
  if (typeof window === "undefined") {
    throw new Error("Direct upload chỉ hỗ trợ trên trình duyệt.");
  }

  const { upload } = await import("@vercel/blob/client");
  const token = getAccessToken();
  const clientPayload = JSON.stringify({
    folder,
    resourceType,
    authToken: token ?? "",
  });

  // NOTE: Use access: "public" if the Vercel Blob store is configured to allow public blobs.
  // If the store is "private-only", change this to "private" and serve files via a proxy route.
  // Store access level can be changed in: Vercel Dashboard → Storage → [Store] → Settings.
  const blobAccess = (process.env.NEXT_PUBLIC_BLOB_ACCESS_LEVEL ?? "public") as "public" | "private";

  const blob = await upload(buildBlobPath(file.name, folder), file, {
    access: blobAccess,
    handleUploadUrl: FILE_ENDPOINTS.BLOB_UPLOAD,
    clientPayload,
    multipart: file.size > 20 * 1024 * 1024,
    contentType: file.type || undefined,
  });

  return {
    url: blob.url,
    fileName: file.name,
    size: file.size,
    folder,
  };
}

// Backend returns this directly on success (HTTP 200)
export interface UploadFileSuccess {
  url: string;
  fileName: string;
  size: number;
  folder: string;
}

// Backend returns this on errors (via Results.BadRequest / Results.Problem)
export interface UploadFileError {
  error?: string;
  title?: string;
  detail?: string;
  status?: number;
}

export type UploadFileResponse = UploadFileSuccess | UploadFileError;

export function isUploadSuccess(r: UploadFileResponse): r is UploadFileSuccess {
  return typeof (r as UploadFileSuccess).url === "string";
}

export interface DeleteFileResponse {
  success: boolean;
  isSuccess?: boolean;
  data?: unknown;
  message?: string;
}

/**
 * Upload a file to the server.
 */
export async function uploadFile(
  file: File,
  folder = "uploads",
  resourceType = "auto"
): Promise<UploadFileResponse> {
  const shouldUseBlob = isBlobUploadEnabled() && file.size >= DIRECT_UPLOAD_MIN_BYTES;

  if (shouldUseBlob) {
    try {
      return await uploadFileViaBlob(file, folder, resourceType);
    } catch (error) {
      console.error("Blob direct upload failed:", error);

      if (!shouldFallbackToBackendWhenBlobFails()) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Upload qua Vercel Blob thất bại.",
          status: 400,
        };
      }

      console.warn("Fallback to backend upload is enabled.");
    }
  }

  return uploadFileViaBackend(file, folder, resourceType);
}

/**
 * Upload avatar image via dedicated avatar endpoint.
 * Validates file type and size (max 10MB) before upload.
 */
export async function uploadAvatar(
  file: File,
  options?: { targetProfileId?: string }
): Promise<UploadFileResponse> {
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { error: "Định dạng ảnh không hợp lệ. Chấp nhận: jpg, png, gif, webp, bmp, svg" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Ảnh vượt quá dung lượng cho phép (10MB)" };
  }

  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams();
  if (options?.targetProfileId) {
    params.set("targetProfileId", options.targetProfileId);
  }

  const endpoint = params.toString()
    ? `${FILE_ENDPOINTS.AVATAR}?${params.toString()}`
    : FILE_ENDPOINTS.AVATAR;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return data as UploadFileError;
  }
  return data as UploadFileSuccess;
}

/**
 * Delete a file by its URL.
 * @param url - The URL of the file to delete
 */
export async function deleteFile(url: string): Promise<DeleteFileResponse> {
  const token = getAccessToken();
  const params = new URLSearchParams({ url });
  const endpoint = `${FILE_ENDPOINTS.DELETE}?${params.toString()}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return response.json();
}

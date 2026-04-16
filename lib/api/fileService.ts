/**
 * File Management API Helper Functions
 *
 * Provides helper functions for uploading, deleting, and transforming files.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via the Authorization header from the browser.
 */

import { FILE_ENDPOINTS } from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";

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

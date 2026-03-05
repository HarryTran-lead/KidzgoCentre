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
 * @param file - The file to upload
 * @param folder - Destination folder (default: "uploads")
 * @param resourceType - Resource type (default: "auto")
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
    // Do NOT set Content-Type - browser sets it with the correct boundary for multipart
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return (
      data as UploadFileError
    )
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

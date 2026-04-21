import { MEDIA_ENDPOINTS } from "@/constants/apiURL";
import { del, get, post, put } from "@/lib/axios";
import { buildQueryString, type QueryParams } from "@/lib/api/queryString";
import { uploadFile } from "@/lib/api/fileService";
import type {
  CreateMediaRequest,
  FileUploadResponse,
  UpdateMediaRequest,
} from "@/types/media";

export type MediaQuery = QueryParams;

export async function getMediaList(params?: MediaQuery): Promise<any> {
  return get<any>(`${MEDIA_ENDPOINTS.BASE}${buildQueryString(params)}`);
}

export async function getMediaById(id: string): Promise<any> {
  return get<any>(MEDIA_ENDPOINTS.BY_ID(id));
}

export async function createMediaRecord(payload: CreateMediaRequest): Promise<any> {
  return post<any>(MEDIA_ENDPOINTS.BASE, payload);
}

export async function updateMediaRecord(id: string, payload: UpdateMediaRequest): Promise<any> {
  return put<any>(MEDIA_ENDPOINTS.BY_ID(id), payload);
}

export async function deleteMediaRecord(id: string): Promise<any> {
  return del<any>(MEDIA_ENDPOINTS.BY_ID(id));
}

export async function approveMediaRecord(id: string, payload: Record<string, unknown> = {}): Promise<any> {
  return post<any>(MEDIA_ENDPOINTS.APPROVE(id), payload);
}

export async function rejectMediaRecord(id: string, payload: Record<string, unknown> = {}): Promise<any> {
  return post<any>(MEDIA_ENDPOINTS.REJECT(id), payload);
}

export async function resubmitMediaRecord(id: string, payload: Record<string, unknown> = {}): Promise<any> {
  return post<any>(MEDIA_ENDPOINTS.RESUBMIT(id), payload);
}

export async function publishMediaRecord(id: string, payload: Record<string, unknown> = {}): Promise<any> {
  return post<any>(MEDIA_ENDPOINTS.PUBLISH(id), payload);
}

export async function uploadMediaFile(
  file: File,
  options?: { folder?: string; resourceType?: string }
): Promise<any> {
  return uploadFile(
    file,
    options?.folder ?? "uploads",
    options?.resourceType ?? "auto",
  ) as Promise<FileUploadResponse>;
}

export async function deleteStorageFile(url: string): Promise<any> {
  return del<any>(`${FILE_ENDPOINTS.DELETE}${buildQueryString({ url })}`);
}

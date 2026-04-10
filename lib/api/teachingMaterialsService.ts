import { TEACHING_MATERIALS_ENDPOINTS } from "@/constants/apiURL";
import { get, post, put, del } from "@/lib/axios";
import { getAccessToken } from "@/lib/store/authToken";
import type {
  ProblemDetails,
  TeachingMaterialBinaryResult,
  TeachingMaterialDetailResponse,
  TeachingMaterialItem,
  TeachingMaterialLessonBundleQuery,
  TeachingMaterialLessonBundleResponse,
  TeachingMaterialListPayload,
  TeachingMaterialListQuery,
  TeachingMaterialListResponse,
  TeachingMaterialUploadResponse,
  TeachingMaterialSlidesResponse,
  TeachingMaterialSlideNotesResponse,
  TeachingMaterialViewProgressResponse,
  TeachingMaterialViewProgressUpdate,
  TeachingMaterialViewProgressSummaryResponse,
  TeachingMaterialBookmarksResponse,
  TeachingMaterialBookmarkResponse,
  TeachingMaterialBookmarkCreate,
  TeachingMaterialAnnotationsResponse,
  TeachingMaterialAnnotationResponse,
  TeachingMaterialAnnotationCreate,
  TeachingMaterialAnnotationUpdate,
} from "@/types/teachingMaterials";

function buildQueryString(params?: { [key: string]: string | number | undefined | null }) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    query.append(key, String(value));
  }

  return query.toString();
}

export async function getTeachingMaterials(
  params?: TeachingMaterialListQuery
): Promise<TeachingMaterialListResponse> {
  const queryString = buildQueryString(
    params as { [key: string]: string | number | undefined | null } | undefined
  );
  const endpoint = queryString
    ? `${TEACHING_MATERIALS_ENDPOINTS.BASE}?${queryString}`
    : TEACHING_MATERIALS_ENDPOINTS.BASE;

  return get<TeachingMaterialListResponse>(endpoint);
}

export async function getTeachingMaterialById(
  id: string
): Promise<TeachingMaterialDetailResponse> {
  return get<TeachingMaterialDetailResponse>(TEACHING_MATERIALS_ENDPOINTS.BY_ID(id));
}

export async function getTeachingMaterialLessonBundle(
  params: TeachingMaterialLessonBundleQuery
): Promise<TeachingMaterialLessonBundleResponse> {
  const queryString = buildQueryString(
    params as unknown as { [key: string]: string | number | undefined | null }
  );
  return get<TeachingMaterialLessonBundleResponse>(
    `${TEACHING_MATERIALS_ENDPOINTS.LESSON_BUNDLE}?${queryString}`
  );
}

export async function uploadTeachingMaterials(
  formData: FormData
): Promise<TeachingMaterialUploadResponse> {
  const token = getAccessToken();
  const response = await fetch(TEACHING_MATERIALS_ENDPOINTS.UPLOAD, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw (
      payload ?? {
        title: "TeachingMaterial.UploadFailed",
        status: response.status,
        detail: "Upload failed",
      }
    );
  }

  return payload as TeachingMaterialUploadResponse;
}

function extractFileName(contentDisposition?: string | null) {
  if (!contentDisposition) {
    return undefined;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = contentDisposition.match(/filename=\"([^\"]+)\"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return undefined;
}

async function fetchTeachingMaterialBinary(
  endpoint: string
): Promise<TeachingMaterialBinaryResult> {
  const token = getAccessToken();
  const response = await fetch(endpoint, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as ProblemDetails | null;
    throw (
      errorPayload ?? {
        title: "TeachingMaterial.BinaryFailed",
        status: response.status,
        detail: "Unable to fetch file content",
      }
    );
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    fileName: extractFileName(response.headers.get("content-disposition")),
  };
}

export async function fetchTeachingMaterialPreview(endpoint: string) {
  return fetchTeachingMaterialBinary(endpoint);
}

export async function fetchTeachingMaterialDownload(endpoint: string) {
  return fetchTeachingMaterialBinary(endpoint);
}

export function createObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url?: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function triggerBrowserDownload(
  blob: Blob,
  fileName: string = "teaching-material"
) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export function pickTeachingMaterialItems(payload?: TeachingMaterialListPayload | null) {
  return payload?.materials?.items ?? [];
}

export function sortTeachingMaterialItems(items: TeachingMaterialItem[]) {
  return [...items].sort((left, right) => {
    const byProgram = String(left.programName ?? left.programId).localeCompare(
      String(right.programName ?? right.programId),
      "vi"
    );
    if (byProgram !== 0) return byProgram;

    const byUnit = Number(left.unitNumber ?? 0) - Number(right.unitNumber ?? 0);
    if (byUnit !== 0) return byUnit;

    const byLesson = Number(left.lessonNumber ?? 0) - Number(right.lessonNumber ?? 0);
    if (byLesson !== 0) return byLesson;

    return String(left.displayName ?? left.originalFileName ?? "").localeCompare(
      String(right.displayName ?? right.originalFileName ?? ""),
      "vi"
    );
  });
}

/* ═══════════════════════════════════════════════════════════
   Preview PDF (Office → PDF conversion)
   ═══════════════════════════════════════════════════════════ */

export async function fetchTeachingMaterialPreviewPdf(id: string) {
  return fetchTeachingMaterialBinary(TEACHING_MATERIALS_ENDPOINTS.PREVIEW_PDF(id));
}

/* ═══════════════════════════════════════════════════════════
   Slides
   ═══════════════════════════════════════════════════════════ */

export async function getTeachingMaterialSlides(id: string): Promise<TeachingMaterialSlidesResponse> {
  return get<TeachingMaterialSlidesResponse>(TEACHING_MATERIALS_ENDPOINTS.SLIDES(id));
}

export async function fetchTeachingMaterialSlidePreview(id: string, slideNumber: number) {
  return fetchTeachingMaterialBinary(TEACHING_MATERIALS_ENDPOINTS.SLIDE_PREVIEW(id, slideNumber));
}

export async function fetchTeachingMaterialSlideThumbnail(id: string, slideNumber: number) {
  return fetchTeachingMaterialBinary(TEACHING_MATERIALS_ENDPOINTS.SLIDE_THUMBNAIL(id, slideNumber));
}

export async function getTeachingMaterialSlideNotes(id: string, slideNumber: number): Promise<TeachingMaterialSlideNotesResponse> {
  return get<TeachingMaterialSlideNotesResponse>(TEACHING_MATERIALS_ENDPOINTS.SLIDE_NOTES(id, slideNumber));
}

/* ═══════════════════════════════════════════════════════════
   View Progress
   ═══════════════════════════════════════════════════════════ */

export async function updateViewProgress(id: string, data: TeachingMaterialViewProgressUpdate): Promise<TeachingMaterialViewProgressResponse> {
  return post<TeachingMaterialViewProgressResponse>(TEACHING_MATERIALS_ENDPOINTS.VIEW_PROGRESS(id), data);
}

export async function getViewProgress(id: string): Promise<TeachingMaterialViewProgressResponse> {
  return get<TeachingMaterialViewProgressResponse>(TEACHING_MATERIALS_ENDPOINTS.VIEW_PROGRESS(id));
}

export async function getViewProgressSummary(id: string): Promise<TeachingMaterialViewProgressSummaryResponse> {
  return get<TeachingMaterialViewProgressSummaryResponse>(TEACHING_MATERIALS_ENDPOINTS.VIEW_PROGRESS_SUMMARY(id));
}

/* ═══════════════════════════════════════════════════════════
   Bookmarks
   ═══════════════════════════════════════════════════════════ */

export async function createBookmark(id: string, data?: TeachingMaterialBookmarkCreate): Promise<TeachingMaterialBookmarkResponse> {
  return post<TeachingMaterialBookmarkResponse>(TEACHING_MATERIALS_ENDPOINTS.BOOKMARK(id), data ?? {});
}

export async function deleteBookmark(id: string): Promise<void> {
  return del(TEACHING_MATERIALS_ENDPOINTS.BOOKMARK(id));
}

export async function getBookmarks(params?: { pageNumber?: number; pageSize?: number }): Promise<TeachingMaterialBookmarksResponse> {
  const qs = buildQueryString(params as { [key: string]: string | number | undefined | null } | undefined);
  const endpoint = qs ? `${TEACHING_MATERIALS_ENDPOINTS.BOOKMARKS}?${qs}` : TEACHING_MATERIALS_ENDPOINTS.BOOKMARKS;
  return get<TeachingMaterialBookmarksResponse>(endpoint);
}

/* ═══════════════════════════════════════════════════════════
   Annotations
   ═══════════════════════════════════════════════════════════ */

export async function getAnnotations(id: string, params?: { slideNumber?: number; visibility?: string }): Promise<TeachingMaterialAnnotationsResponse> {
  const qs = buildQueryString(params as { [key: string]: string | number | undefined | null } | undefined);
  const endpoint = qs ? `${TEACHING_MATERIALS_ENDPOINTS.ANNOTATIONS(id)}?${qs}` : TEACHING_MATERIALS_ENDPOINTS.ANNOTATIONS(id);
  return get<TeachingMaterialAnnotationsResponse>(endpoint);
}

export async function createAnnotation(id: string, data: TeachingMaterialAnnotationCreate): Promise<TeachingMaterialAnnotationResponse> {
  return post<TeachingMaterialAnnotationResponse>(TEACHING_MATERIALS_ENDPOINTS.ANNOTATIONS(id), data);
}

export async function updateAnnotation(annotationId: string, data: TeachingMaterialAnnotationUpdate): Promise<TeachingMaterialAnnotationResponse> {
  return put<TeachingMaterialAnnotationResponse>(TEACHING_MATERIALS_ENDPOINTS.ANNOTATION_BY_ID(annotationId), data);
}

export async function deleteAnnotation(annotationId: string): Promise<void> {
  return del(TEACHING_MATERIALS_ENDPOINTS.ANNOTATION_BY_ID(annotationId));
}

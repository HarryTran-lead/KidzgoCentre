import type { ApiResponse } from "@/types/apiResponse";

export type TeachingMaterialFileType =
  | "Pdf"
  | "Presentation"
  | "Audio"
  | "Document"
  | "Image"
  | "Video"
  | "Spreadsheet"
  | "Archive"
  | "Other";

export type TeachingMaterialCategory =
  | "ProgramDocument"
  | "LessonSlide"
  | "LessonAsset"
  | "Supplementary"
  | "Other";

export interface TeachingMaterialItem {
  id: string;
  programId: string;
  programName?: string | null;
  programCode?: string | null;
  unitNumber?: number | null;
  lessonNumber?: number | null;
  lessonTitle?: string | null;
  relativePath?: string | null;
  displayName?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  fileExtension?: string | null;
  fileSize?: number | null;
  fileType?: TeachingMaterialFileType | string | null;
  category?: TeachingMaterialCategory | string | null;
  uploadedByUserId?: string | null;
  uploadedByName?: string | null;
  isEncrypted?: boolean | null;
  encryptionAlgorithm?: string | null;
  encryptionKeyVersion?: string | null;
  previewUrl?: string | null;
  downloadUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TeachingMaterialListQuery {
  programId?: string;
  unitNumber?: number;
  lessonNumber?: number;
  fileType?: string;
  category?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface TeachingMaterialListPayload {
  materials: {
    items: TeachingMaterialItem[];
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface TeachingMaterialLessonBundle {
  programId: string;
  programName?: string | null;
  programCode?: string | null;
  unitNumber: number;
  lessonNumber: number;
  lessonTitle?: string | null;
  primaryPresentation?: TeachingMaterialItem | null;
  presentations: TeachingMaterialItem[];
  audioFiles: TeachingMaterialItem[];
  imageFiles: TeachingMaterialItem[];
  videoFiles: TeachingMaterialItem[];
  documents: TeachingMaterialItem[];
  supplementaryFiles: TeachingMaterialItem[];
  otherFiles: TeachingMaterialItem[];
}

export interface TeachingMaterialLessonBundleQuery {
  programId: string;
  unitNumber: number;
  lessonNumber: number;
}

export interface TeachingMaterialUploadItem {
  id?: string | null;
  originalFileName?: string | null;
  displayName?: string | null;
  relativePath?: string | null;
  unitNumber?: number | null;
  lessonNumber?: number | null;
  lessonTitle?: string | null;
  fileType?: TeachingMaterialFileType | string | null;
  category?: TeachingMaterialCategory | string | null;
}

export interface TeachingMaterialUploadSkippedItem {
  fileName?: string | null;
  relativePath?: string | null;
  reason?: string | null;
}

export interface TeachingMaterialUploadPayload {
  programId?: string | null;
  programName?: string | null;
  importedCount: number;
  skippedCount: number;
  importedItems: TeachingMaterialUploadItem[];
  skippedItems: TeachingMaterialUploadSkippedItem[];
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
}

export interface TeachingMaterialBinaryResult {
  blob: Blob;
  contentType: string;
  fileName?: string;
}

/* ── Slides ──────────────────────────────────────────────── */

export interface TeachingMaterialSlide {
  slideNumber: number;
  width?: number;
  height?: number;
  previewUrl: string;
  thumbnailUrl: string;
  hasNotes?: boolean;
}

export interface TeachingMaterialSlidesPayload {
  materialId: string;
  displayName?: string | null;
  totalSlides: number;
  slides: TeachingMaterialSlide[];
}

export interface TeachingMaterialSlideNotesPayload {
  slideNumber: number;
  notes?: string | null;
}

/* ── View Progress ───────────────────────────────────────── */

export interface TeachingMaterialViewProgress {
  materialId: string;
  userId: string;
  progressPercent: number;
  lastSlideViewed?: number | null;
  totalTimeSeconds: number;
  firstViewedAt: string;
  lastViewedAt: string;
  viewCount: number;
  completed: boolean;
}

export interface TeachingMaterialViewProgressUpdate {
  progressPercent: number;
  lastSlideViewed?: number | null;
  totalTimeSeconds: number;
}

export interface TeachingMaterialViewProgressViewer {
  userId: string;
  userName?: string | null;
  avatarUrl?: string | null;
  progressPercent: number;
  lastSlideViewed?: number | null;
  totalTimeSeconds: number;
  viewCount: number;
  completed: boolean;
  lastViewedAt: string;
}

export interface TeachingMaterialViewProgressSummary {
  materialId: string;
  totalViewers: number;
  completedCount: number;
  averageProgressPercent: number;
  averageTimeSeconds: number;
  viewers: TeachingMaterialViewProgressViewer[];
}

/* ── Bookmarks ───────────────────────────────────────────── */

export interface TeachingMaterialBookmark {
  bookmarkId: string;
  materialId: string;
  displayName?: string | null;
  fileType?: string | null;
  programName?: string | null;
  unitNumber?: number | null;
  lessonNumber?: number | null;
  note?: string | null;
  createdAt: string;
}

export interface TeachingMaterialBookmarkCreate {
  note?: string | null;
}

export interface TeachingMaterialBookmarksPayload {
  items: TeachingMaterialBookmark[];
  totalCount: number;
}

/* ── Annotations ─────────────────────────────────────────── */

export type AnnotationType = "Note" | "Highlight" | "Pin";
export type AnnotationVisibility = "Private" | "Class" | "Public";

export interface TeachingMaterialAnnotation {
  id: string;
  slideNumber?: number | null;
  content: string;
  color?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  type: AnnotationType;
  visibility: AnnotationVisibility;
  createdByUserId: string;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeachingMaterialAnnotationCreate {
  slideNumber?: number | null;
  content: string;
  color?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  type?: AnnotationType;
  visibility?: AnnotationVisibility;
}

export interface TeachingMaterialAnnotationUpdate {
  content?: string;
  color?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  type?: AnnotationType;
  visibility?: AnnotationVisibility;
}

/* ── Response aliases ────────────────────────────────────── */

export type TeachingMaterialListResponse = ApiResponse<TeachingMaterialListPayload>;
export type TeachingMaterialDetailResponse = ApiResponse<TeachingMaterialItem>;
export type TeachingMaterialLessonBundleResponse = ApiResponse<TeachingMaterialLessonBundle>;
export type TeachingMaterialUploadResponse = ApiResponse<TeachingMaterialUploadPayload>;
export type TeachingMaterialSlidesResponse = ApiResponse<TeachingMaterialSlidesPayload>;
export type TeachingMaterialSlideNotesResponse = ApiResponse<TeachingMaterialSlideNotesPayload>;
export type TeachingMaterialViewProgressResponse = ApiResponse<TeachingMaterialViewProgress>;
export type TeachingMaterialViewProgressSummaryResponse = ApiResponse<TeachingMaterialViewProgressSummary>;
export type TeachingMaterialBookmarksResponse = ApiResponse<TeachingMaterialBookmarksPayload>;
export type TeachingMaterialBookmarkResponse = ApiResponse<TeachingMaterialBookmark>;
export type TeachingMaterialAnnotationsResponse = ApiResponse<TeachingMaterialAnnotation[]>;
export type TeachingMaterialAnnotationResponse = ApiResponse<TeachingMaterialAnnotation>;

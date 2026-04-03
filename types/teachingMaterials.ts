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

export type TeachingMaterialListResponse = ApiResponse<TeachingMaterialListPayload>;
export type TeachingMaterialDetailResponse = ApiResponse<TeachingMaterialItem>;
export type TeachingMaterialLessonBundleResponse = ApiResponse<TeachingMaterialLessonBundle>;
export type TeachingMaterialUploadResponse = ApiResponse<TeachingMaterialUploadPayload>;

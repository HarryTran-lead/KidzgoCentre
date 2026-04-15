export enum MediaType {
  Photo = "Photo",
  Video = "Video",
  Document = "Document",
}

export enum MediaContentType {
  Homework = "Homework",
  Report = "Report",
  Test = "Test",
  Album = "Album",
  ClassPhoto = "ClassPhoto",
}

export enum Visibility {
  ClassOnly = "ClassOnly",
  Personal = "Personal",
  PublicParent = "PublicParent",
}

export enum ApprovalStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

export enum MediaOwnershipScope {
  Personal = "Personal",
  Class = "Class",
  Branch = "Branch",
}

export interface MediaAsset {
  id: string;
  uploaderId: string;
  uploaderName: string;
  branchId: string;
  branchName: string;
  classId?: string;
  className?: string;
  studentProfileId?: string;
  studentName?: string;
  monthTag?: string; // Định dạng "YYYY-MM"
  type: MediaType;
  contentType: MediaContentType;
  url: string;
  caption?: string;
  visibility: Visibility;
  approvalStatus: ApprovalStatus;
  isPublished: boolean;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string; // ISO Date string
  createdAt: string;
  updatedAt: string;
}

export interface ParentAlbumItem {
  albumId: string; // "YYYY-MM" hoặc "general"
  title: string;
  type: MediaType;
  date: string;
  coverUrl: string;
  count: number;
}

export interface ParentMediaItem {
  id: string;
  albumId: string;
  title: string;
  type: MediaType;
  date: string;
  coverUrl: string;
  url: string;
  count: number;
}

export interface ParentMediaResponse {
  albums: ParentAlbumItem[];
  items: ParentMediaItem[];
}

// Dùng cho POST /api/media
export interface CreateMediaRequest {
  branchId: string;
  classId?: string;
  studentProfileId?: string;
  monthTag?: string;
  type: MediaType;
  contentType: MediaContentType;
  url: string;
  fileSize: number;
  ownershipScope: MediaOwnershipScope;
  visibility: Visibility;
  caption?: string;
  mimeType?: string;
  originalFileName?: string;
}

// Dùng cho PUT /api/media/{id}
export interface UpdateMediaRequest {
  classId?: string;
  studentProfileId?: string;
  monthTag?: string;
  contentType?: MediaContentType;
  caption?: string;
  visibility?: Visibility;
}

// Response khi upload file vật lý (POST /api/files/upload)
export interface FileUploadResponse {
  url: string;
  fileName: string;
  size: number;
  folder: string;
  resourceType: string; // image, video...
}
import { ApiResponse } from "../apiResponse";


// ==================== Request Interfaces ====================

// Create Blog Request
export interface CreateBlogRequest {
  title: string;
  summary: string;
  content: string;
  featuredImageUrl: string;
}

// Update Blog Request
export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  summary?: string;
  featuredImageUrl?: string;
}

// Get All Blogs Query Params
export interface GetAllBlogsParams {
  page?: number;
  limit?: number;
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isPublished?: boolean;
  authorId?: string;
  tags?: string[];
  sortBy?: "title" | "createdAt" | "updatedAt" | "publishedAt";
  sortOrder?: "asc" | "desc";
}

// ==================== Response Interfaces ====================

// Blog Entity
export interface Blog {
  id: string;
  title: string;
  summary: string;
  content: string;
  featuredImageUrl: string;
  createdBy?: string;
  createdByName?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  // Author information (may be included in detailed view)
  author?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

// Paginated Response
export interface PaginatedBlogsResponse {
  items: Blog[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

// Backend wrapper response (actual structure from API)
export interface BlogsDataWrapper {
  blogs: PaginatedBlogsResponse;
}

// ==================== API Response Interfaces ====================

// Get All Blogs Response (wrapped in blogs property)
export type GetAllBlogsApiResponse = ApiResponse<BlogsDataWrapper>;

// Get Blog By ID Response
export type GetBlogByIdApiResponse = ApiResponse<Blog>;

// Create Blog Response
export type CreateBlogApiResponse = ApiResponse<Blog>;

// Update Blog Response
export type UpdateBlogApiResponse = ApiResponse<Blog>;

// Delete Blog Response
export type DeleteBlogApiResponse = ApiResponse<{
  id: string;
  message: string;
}>;

// Publish Blog Response
export type PublishBlogApiResponse = ApiResponse<Blog>;

// Unpublish Blog Response
export type UnpublishBlogApiResponse = ApiResponse<Blog>;

// Get Published Blogs Response (wrapped in blogs property)
export type GetPublishedBlogsApiResponse = ApiResponse<BlogsDataWrapper>;

// ==================== Utility Types ====================

export type BlogFormData = Omit<CreateBlogRequest, "authorId">;

export type BlogTableData = Pick<
  Blog,
  "id" | "title" | "summary" | "createdByName" | "isPublished" | "publishedAt" | "createdAt" | "updatedAt"
>;

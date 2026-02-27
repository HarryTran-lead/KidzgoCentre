/**
 * Blog Management API Helper Functions
 * 
 * This file provides type-safe helper functions for blog management API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { BLOG_ENDPOINTS } from '@/constants/apiURL';
import { get, post, put, del, patch } from '@/lib/axios';
import type {
  GetAllBlogsParams,
  GetAllBlogsApiResponse,
  GetBlogByIdApiResponse,
  CreateBlogRequest,
  CreateBlogApiResponse,
  UpdateBlogRequest,
  UpdateBlogApiResponse,
  DeleteBlogApiResponse,
  PublishBlogApiResponse,
  UnpublishBlogApiResponse,
  GetPublishedBlogsApiResponse,
} from '@/types/admin/blog';

/**
 * Get all blogs with optional filters and pagination
 */
export async function getAllBlogs(params?: GetAllBlogsParams): Promise<GetAllBlogsApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    // Support both page/limit and pageNumber/pageSize
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    else if (params.page) queryParams.append('page', params.page.toString());
    
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    else if (params.limit) queryParams.append('limit', params.limit.toString());
    
    if (params.search) queryParams.append('search', params.search);
    if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params.authorId) queryParams.append('authorId', params.authorId);
    if (params.tags && params.tags.length > 0) queryParams.append('tags', params.tags.join(','));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  }

  const url = BLOG_ENDPOINTS.GET_ALL;
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
  
  return get<GetAllBlogsApiResponse>(fullUrl);
}

/**
 * Get blog by ID
 */
export async function getBlogById(id: string): Promise<GetBlogByIdApiResponse> {
  return get<GetBlogByIdApiResponse>(BLOG_ENDPOINTS.GET_BY_ID(id));
}

/**
 * Create a new blog
 */
export async function createBlog(data: CreateBlogRequest): Promise<CreateBlogApiResponse> {
  return post<CreateBlogApiResponse>(BLOG_ENDPOINTS.CREATE, data);
}

/**
 * Update an existing blog
 */
export async function updateBlog(id: string, data: UpdateBlogRequest): Promise<UpdateBlogApiResponse> {
  return put<UpdateBlogApiResponse>(BLOG_ENDPOINTS.UPDATE(id), data);
}

/**
 * Delete a blog by ID
 */
export async function deleteBlog(id: string): Promise<DeleteBlogApiResponse> {
  return del<DeleteBlogApiResponse>(BLOG_ENDPOINTS.DELETE(id));
}

/**
 * Publish a blog
 */
export async function publishBlog(id: string): Promise<PublishBlogApiResponse> {
  return patch<PublishBlogApiResponse>(BLOG_ENDPOINTS.PUBLISH(id), {});
}

/**
 * Unpublish a blog
 */
export async function unpublishBlog(id: string): Promise<UnpublishBlogApiResponse> {
  return patch<UnpublishBlogApiResponse>(BLOG_ENDPOINTS.UNPUBLISH(id), {});
}

/**
 * Get all published blogs
 */
export async function getPublishedBlogs(params?: GetAllBlogsParams): Promise<GetPublishedBlogsApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
    else if (params.page) queryParams.append('page', params.page.toString());
    
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    else if (params.limit) queryParams.append('limit', params.limit.toString());
    
    if (params.search) queryParams.append('search', params.search);
    if (params.tags && params.tags.length > 0) queryParams.append('tags', params.tags.join(','));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  }

  const url = BLOG_ENDPOINTS.GET_PUBLISHED;
  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;
  
  return get<GetPublishedBlogsApiResponse>(fullUrl);
}

// ==================== Additional Utility Functions ====================

/**
 * Get blogs by author
 */
export async function getBlogsByAuthor(
  authorId: string,
  params?: Omit<GetAllBlogsParams, 'authorId'>
): Promise<GetAllBlogsApiResponse> {
  return getAllBlogs({ ...params, authorId });
}

/**
 * Get published blogs only
 */
export async function getPublishedBlogsOnly(
  params?: Omit<GetAllBlogsParams, 'isPublished'>
): Promise<GetAllBlogsApiResponse> {
  return getAllBlogs({ ...params, isPublished: true });
}

/**
 * Get draft blogs only
 */
export async function getDraftBlogs(
  params?: Omit<GetAllBlogsParams, 'isPublished'>
): Promise<GetAllBlogsApiResponse> {
  return getAllBlogs({ ...params, isPublished: false });
}

/**
 * Get blogs by tags
 */
export async function getBlogsByTags(
  tags: string[],
  params?: Omit<GetAllBlogsParams, 'tags'>
): Promise<GetAllBlogsApiResponse> {
  return getAllBlogs({ ...params, tags });
}

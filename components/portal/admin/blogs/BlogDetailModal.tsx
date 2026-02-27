"use client";

import { X, Calendar, User, Tag, Eye } from "lucide-react";
import type { Blog } from "@/types/admin/blog";
import Image from "next/image";

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog | null;
}

export default function BlogDetailModal({
  isOpen,
  onClose,
  blog,
}: BlogDetailModalProps) {
  if (!isOpen || !blog) return null;

  const formattedDate = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa xuất bản";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          <h2 className="text-2xl font-bold text-white">Chi tiết bài viết</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Featured Image */}
          {blog.featuredImageUrl && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200">
              <Image
                src={blog.featuredImageUrl}
                alt={blog.title}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{blog.title}</h3>
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  blog.isPublished
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200"
                    : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200"
                }`}
              >
                {blog.isPublished ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} className="text-red-600" />
              <span className="font-medium">Tác giả:</span>
              <span>{blog.createdByName || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-red-600" />
              <span className="font-medium">Tạo lúc:</span>
              <span>{formattedDate}</span>
            </div>
            {blog.isPublished && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye size={16} className="text-red-600" />
                <span className="font-medium">Xuất bản:</span>
                <span>{publishedDate}</span>
              </div>
            )}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag size={16} className="text-red-600" />
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {blog.summary && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Tóm tắt</h4>
              <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-100">
                {blog.summary}
              </p>
            </div>
          )}

          {/* Content */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Nội dung</h4>
            <div className="prose prose-gray max-w-none">
              <div
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>
          </div>

          {/* Additional Info */}
          {blog.updatedAt && (
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Cập nhật lần cuối:{" "}
              {new Date(blog.updatedAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import type { Blog, CreateBlogRequest, UpdateBlogRequest } from "@/types/admin/blog";
import { createBlog, updateBlog } from "@/lib/api/blogService";
import { useToast } from "@/hooks/use-toast";

interface BlogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (blog: Blog) => void;
  blog?: Blog | null;
  mode: "create" | "edit";
}

export default function BlogFormModal({
  isOpen,
  onClose,
  onSuccess,
  blog,
  mode,
}: BlogFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    featuredImageUrl: "",
  });

  useEffect(() => {
    if (blog && mode === "edit") {
      setFormData({
        title: blog.title,
        summary: blog.summary,
        content: blog.content,
        featuredImageUrl: blog.featuredImageUrl,
      });
    } else {
      setFormData({
        title: "",
        summary: "",
        content: "",
        featuredImageUrl: "",
      });
    }
  }, [blog, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ tiêu đề và nội dung",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = mode === "create"
        ? await createBlog(formData as CreateBlogRequest)
        : await updateBlog(blog!.id, formData as UpdateBlogRequest);

      if (response.success || response.isSuccess) {
        toast({
          title: "Thành công",
          description: mode === "create" ? "Đã tạo bài viết mới" : "Đã cập nhật bài viết",
          variant: "success",
        });
        onSuccess(response.data);
        onClose();
      } else {
        toast({
          title: "Lỗi",
          description: response.message || "Không thể lưu bài viết",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi lưu bài viết",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          <h2 className="text-2xl font-bold text-white">
            {mode === "create" ? "Tạo bài viết mới" : "Chỉnh sửa bài viết"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                placeholder="Nhập tiêu đề bài viết..."
                required
                disabled={loading}
              />
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-2">
                Tóm tắt
              </label>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Nhập tóm tắt ngắn gọn..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Featured Image URL */}
            <div>
              <label htmlFor="featuredImageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                URL ảnh đại diện
              </label>
              <input
                id="featuredImageUrl"
                type="url"
                value={formData.featuredImageUrl}
                onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                placeholder="https://example.com/image.jpg"
                disabled={loading}
              />
              {formData.featuredImageUrl && (
                <div className="mt-3 relative h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.featuredImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage Error%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Nhập nội dung chi tiết bài viết..."
                rows={12}
                required
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">
                {formData.content.length} ký tự
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>{mode === "create" ? "Tạo bài viết" : "Lưu thay đổi"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

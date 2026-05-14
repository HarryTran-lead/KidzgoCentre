"use client";

import { useState, useEffect, useRef } from "react";
import { X, Save, Loader2, Upload, ImageIcon, Trash2, FileText } from "lucide-react";
import type { Blog, CreateBlogRequest, UpdateBlogRequest } from "@/types/admin/blog";
import { createBlog, updateBlog } from "@/lib/api/blogService";
import { uploadFile, isUploadSuccess } from "@/lib/api/fileService";
import { buildFileUrl } from "@/constants/apiURL";
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
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Lỗi",
        description: "Chỉ hỗ trợ định dạng JPG, PNG, WEBP, GIF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File ảnh không được vượt quá 10MB",
        variant: "destructive",
      });
      return;
    }

    setImageUploading(true);
    try {
      const result = await uploadFile(file, "blogs");
      if (isUploadSuccess(result)) {
        setFormData((prev) => ({ ...prev, featuredImageUrl: result.url }));
        toast({ title: "Thành công", description: "Tải ảnh lên thành công", variant: "success" });
      } else {
        const errMsg = result.detail || result.error || result.title || "Không thể tải ảnh lên";
        toast({
          title: "Lỗi upload ảnh",
          description: errMsg,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Lỗi", description: "Đã xảy ra lỗi khi tải ảnh", variant: "destructive" });
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-x-0  bg-linear-to-r from-red-600 via-red-500 to-red-700" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg border-2 border-red-400 bg-gradient-to-br from-red-500 to-red-600">
              <FileText size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {mode === "create" ? "Tạo bài viết mới" : "Chỉnh sửa bài viết"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading || imageUploading}
            className="cursor-pointer rounded-xl border border-red-400 bg-red-500/20 p-2 text-white transition-colors hover:bg-red-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
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
                className="w-full px-4 py-3 border border-red-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
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
                className="w-full px-4 py-3 border border-red-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-vertical"
                placeholder="Nhập tóm tắt ngắn gọn..."
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Featured Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ảnh đại diện
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden "
                onChange={handleImageChange}
                disabled={loading || imageUploading}
              />

              {formData.featuredImageUrl ? (
                /* Preview area when image is set */
                <div className="relative rounded-xl overflow-hidden border border-red-200 bg-gray-50">
                  <img
                    src={buildFileUrl(formData.featuredImageUrl)}
                    alt="Preview ảnh đại diện"
                    className="w-full h-36 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage Error%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || imageUploading}
                      className="flex items-center cursor-pointer gap-1.5 px-3 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 shadow hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      <Upload size={15} />
                      Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, featuredImageUrl: "" }))}
                      disabled={loading || imageUploading}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-sm font-medium text-white shadow hover:shadow-md transition disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload drop zone when no image */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || imageUploading}
                  className="w-full flex flex-col items-center cursor-pointer justify-center gap-2 px-6 py-6 border-2 border-dashed border-red-200 rounded-xl text-gray-500 hover:border-red-400 hover:text-red-500 hover:bg-red-50/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imageUploading ? (
                    <>
                      <Loader2 size={32} className="animate-spin text-red-500" />
                      <span className="text-sm font-medium text-red-500">Đang tải ảnh lên...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={28} />
                      <div className="text-center">
                        <p className="text-sm font-medium">Nhấn để chọn ảnh</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP, GIF · Tối đa 10MB</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg hover:shadow-md transition">
                        <Upload size={15} />
                        Chọn ảnh
                      </span>
                    </>
                  )}
                </button>
              )}

              {imageUploading && formData.featuredImageUrl && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Đang tải ảnh lên...
                </p>
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
                className="w-full px-4 py-3 border border-red-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-vertical"
                placeholder="Nhập nội dung chi tiết bài viết..."
                rows={6}
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
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-red-200 bg-gradient-to-r from-red-500/5 to-red-700/5">
          <button
            type="button"
            onClick={onClose}
            className="min-w-30 cursor-pointer rounded-xl border border-red-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || imageUploading}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex min-w-30 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || imageUploading}
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

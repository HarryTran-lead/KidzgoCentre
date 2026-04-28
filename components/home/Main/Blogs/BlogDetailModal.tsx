"use client";

import { X, Calendar, User, Tag, Clock } from "lucide-react";
import type { Blog } from "@/types/admin/blog";
import { motion, AnimatePresence } from "framer-motion";
import { buildFileUrl } from "@/constants/apiURL";

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog | null;
  locale?: string;
}

export default function BlogDetailModal({
  isOpen,
  onClose,
  blog,
  locale = "vi",
}: BlogDetailModalProps) {
  if (!blog) return null;

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : locale === "vi" ? "Hôm nay" : "Today";

  const readingTime = Math.ceil((blog.content?.length || 0) / 1000);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8"
            >
              {/* Header with Featured Image */}
              <div className="relative h-64 sm:h-80 overflow-hidden bg-gradient-to-br from-red-100 to-rose-100">
                {blog.featuredImageUrl ? (
                  <img
                    src={buildFileUrl(blog.featuredImageUrl)}
                    alt={blog.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
                >
                  <X size={24} className="text-gray-700" />
                </button>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {blog.tags && blog.tags.length > 0 && blog.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/90 text-red-600 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                    {blog.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{blog.createdByName || "Rex"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{readingTime} {locale === "vi" ? "phút đọc" : "min read"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-320px)] sm:max-h-[calc(90vh-384px)]">
                {/* Summary */}
                {blog.summary && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <p className="text-lg text-gray-700 leading-relaxed italic">
                      {blog.summary}
                    </p>
                  </div>
                )}

                {/* Main Content */}
                <div 
                  className="prose prose-lg max-w-none
                    prose-headings:text-gray-900 prose-headings:font-bold
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-ul:my-4 prose-ul:list-disc prose-ul:list-inside
                    prose-ol:my-4 prose-ol:list-decimal prose-ol:list-inside
                    prose-li:text-gray-700 prose-li:mb-2
                    prose-blockquote:border-l-4 prose-blockquote:border-red-500 
                    prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                    prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-code:text-red-600 prose-code:font-mono prose-code:text-sm"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Author Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-white font-bold text-lg">
                      {(blog.createdByName || "K")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{blog.createdByName || "KidzGo Admin"}</p>
                      <p className="text-sm text-gray-500">
                        {locale === "vi" ? "Tác giả" : "Author"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

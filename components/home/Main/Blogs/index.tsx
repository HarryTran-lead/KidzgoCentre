// components/home/Main/Blogs/index.tsx (CLIENT)
"use client";

import { ArrowRight, Calendar, User, Clock, BookOpen, Sparkles, TrendingUp, Eye, Heart, MessageCircle, Search, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, cubicBezier, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pickLocaleFromPath, DEFAULT_LOCALE, localizePath } from "@/lib/i18n";
import { EndPoint } from "@/lib/routes";
import type { Blog } from "@/types/admin/blog";
import { getPublishedBlogs } from "@/lib/api/blogService";
import { buildFileUrl } from "@/constants/apiURL";
import BlogDetailModal from "./BlogDetailModal";

export default function Blogs() {
  const pathname = usePathname() || "/";
  const locale = pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6; // Show 6 blogs per page (2 rows of 3)

  const handleBlogClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => setSelectedBlog(null), 200);
  };

  // Fetch published blogs on mount
  useEffect(() => {
    async function fetchBlogs() {
      try {
        setLoading(true);
        const response = await getPublishedBlogs({ page: 1, limit: 100 });
        
        console.log('Public Blogs Response:', response);
        console.log('response.data:', response.data);
        console.log('response.data?.blogs:', response.data?.blogs);
        
        if (response.success || response.isSuccess) {
          // Backend returns: response.data.blogs.items
          const blogsData = response.data?.blogs?.items || [];
          console.log('Blogs data extracted:', blogsData.length, 'items');
          setBlogs(blogsData);
        }
      } catch (error) {
        console.error("Error fetching published blogs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, []);

  // Debounce search term with 2 second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Extract unique tags from blogs
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogs.forEach(blog => {
      if (blog.tags && blog.tags.length > 0) {
        blog.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [blogs]);

  // Filter blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const matchesSearch = !debouncedSearchTerm || 
        blog.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (blog.summary && blog.summary.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      
      const matchesTag = selectedTag === "all" || (blog.tags && blog.tags.includes(selectedTag));
      
      return matchesSearch && matchesTag;
    });
  }, [debouncedSearchTerm, selectedTag, blogs]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return filteredBlogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBlogs, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, selectedTag]);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: cubicBezier(0.22, 1, 0.36, 1)
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, rotateX: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: cubicBezier(0.22, 1, 0.36, 1)
      }
    },
    hover: {
      y: -12,
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25
      }
    }
  };

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower === "tips" || tagLower === "kỹ năng" || tagLower.includes("kỹ năng")) {
      return { bg: "bg-pink-500/10", text: "text-pink-700", border: "border-pink-500/20" };
    }
    if (tagLower === "news" || tagLower === "tin tức" || tagLower.includes("tin")) {
      return { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/20" };
    }
    if (tagLower === "guide" || tagLower === "hướng dẫn" || tagLower.includes("hướng dẫn")) {
      return { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-500/20" };
    }
    if (tagLower === "activity" || tagLower === "hoạt động" || tagLower.includes("hoạt động")) {
      return { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/20" };
    }
    if (tagLower === "cambridge" || tagLower.includes("cambridge")) {
      return { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500/20" };
    }
    if (tagLower === "học bổng" || tagLower.includes("học bổng")) {
      return { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-500/20" };
    }
    return { bg: "bg-gray-500/10", text: "text-gray-700", border: "border-gray-500/20" };
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-pink-50 via-rose-50 to-pink-100 mt-30">
      {/* Main Content */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 -mt-40 bg-linear-to-b from-pink-50 via-rose-50 to-pink-100 rounded-t-3xl shadow-2xl">
        {/* Search & Filter */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-10 flex flex-col gap-4 md:flex-row md:justify-between items-center"
        >
          {/* Search */}
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={locale === "vi" ? "Tìm kiếm bài viết..." : "Search articles..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 bg-white text-base hover:border-pink-500/50 focus:border-pink-400 outline-none transition-all duration-300 shadow-sm"
            />
            {searchTerm !== debouncedSearchTerm && searchTerm !== "" && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Tag Filter */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
            <button
              onClick={() => setSelectedTag("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedTag === "all"
                  ? "bg-pink-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {locale === "vi" ? "Tất cả" : "All"}
            </button>
            {allTags.map((tag) => {
              const colors = getTagColor(tag);
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    selectedTag === tag
                      ? `${colors.bg} ${colors.text} border-2 ${colors.border} shadow-md`
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Results Count */}
        {debouncedSearchTerm && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <p className="text-sm text-gray-600">
              {locale === "vi" 
                ? `Tìm thấy ${filteredBlogs.length} bài viết${debouncedSearchTerm ? ` cho "${debouncedSearchTerm}"` : ""}`
                : `Found ${filteredBlogs.length} article${filteredBlogs.length !== 1 ? 's' : ''}${debouncedSearchTerm ? ` for "${debouncedSearchTerm}"` : ""}`
              }
            </p>
          </motion.div>
        )}

        {/* Blog Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredBlogs.length > 0 ? (
          <>
            <motion.div
              key={currentPage}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto"
            >
              {paginatedBlogs.map((blog, index) => {
                const primaryTag = blog.tags && blog.tags.length > 0 ? blog.tags[0] : "General";
                const colors = getTagColor(primaryTag);
                const formattedDate = blog.publishedAt 
                  ? new Date(blog.publishedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")
                  : locale === "vi" ? "Hôm nay" : "Today";
                
                return (
                  <motion.article
                  key={blog.id}
                  variants={cardVariants}
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                  onClick={() => handleBlogClick(blog)}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
                >
                  <div className="relative h-48 sm:h-56 overflow-hidden bg-linear-to-br from-pink-100 to-rose-100">
                    {blog.featuredImageUrl ? (
                      <Image
                        src={buildFileUrl(blog.featuredImageUrl)}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    {/* Fallback background when no image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-pink-300" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Tag */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border} backdrop-blur-sm`}>
                        {primaryTag}
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <motion.div
                      className="absolute inset-0 bg-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-pink-600 transition-colors">
                      {blog.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                      {blog.summary || ""}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{blog.createdByName || "Rex"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Read More */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlogClick(blog);
                      }}
                      className="inline-flex items-center gap-2 text-pink-600 font-semibold text-sm hover:gap-3 transition-all group/readmore"
                    >
                      <span>{locale === "vi" ? "Đọc thêm" : "Read more"}</span>
                      <ArrowRight className="w-4 h-4 group-hover/readmore:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.article>
                );
              })}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-4 mt-12"
              >
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  className="p-3 rounded-xl bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  aria-label={locale === "vi" ? "Trang trước" : "Previous page"}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                        currentPage === index
                          ? "bg-pink-600 text-white shadow-lg scale-110"
                          : "bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="p-3 rounded-xl bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  aria-label={locale === "vi" ? "Trang sau" : "Next page"}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Page Info */}
            {totalPages > 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-sm text-gray-600 mt-6"
              >
                {locale === "vi" 
                  ? `Hiển thị ${currentPage * itemsPerPage + 1}-${Math.min((currentPage + 1) * itemsPerPage, filteredBlogs.length)} trong ${filteredBlogs.length} bài viết`
                  : `Showing ${currentPage * itemsPerPage + 1}-${Math.min((currentPage + 1) * itemsPerPage, filteredBlogs.length)} of ${filteredBlogs.length} articles`
                }
              </motion.p>
            )}
          </>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-pink-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {locale === "vi" ? "Không tìm thấy bài viết" : "No articles found"}
            </h3>
            <p className="text-gray-500">
              {locale === "vi" 
                ? "Thử tìm kiếm với từ khóa khác hoặc chọn chủ đề khác"
                : "Try searching with different keywords or select another topic"
              }
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom Decoration SVG */}
      <div className="z-20  relative w-full overflow-hidden bg-[#fce8f3]" style={{ marginTop: 0, lineHeight: 0 }}>
        <Image
          src="/image/hero-deluxe-end.svg"
          alt=""
          width={1512}
          height={317}
          className="w-full h-auto"
          style={{ display: 'block', verticalAlign: 'bottom' }}
        />
      </div>

      {/* Blog Detail Modal */}
      <BlogDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        blog={selectedBlog}
        locale={locale}
      />
    </div>
  );
}


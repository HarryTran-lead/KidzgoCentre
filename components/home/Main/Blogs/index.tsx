// components/home/Main/Blogs/index.tsx (CLIENT)
"use client";

import { BLOGS } from "@/lib/data/data";
import { ArrowRight, Calendar, User, Clock, BookOpen, Sparkles, TrendingUp, Eye, Heart, MessageCircle, Search, Tag } from "lucide-react";
import { motion, cubicBezier } from "framer-motion";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pickLocaleFromPath, DEFAULT_LOCALE, localizePath } from "@/lib/i18n";
import { EndPoint } from "@/lib/routes";

export default function Blogs() {
  const pathname = usePathname() || "/";
  const locale = pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Extract unique tags from blogs
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    BLOGS.forEach(blog => {
      if (blog.tag) tags.add(blog.tag);
    });
    return Array.from(tags);
  }, []);

  // Filter blogs
  const filteredBlogs = useMemo(() => {
    return BLOGS.filter(blog => {
      const matchesSearch = !searchTerm || 
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTag = selectedTag === "all" || blog.tag === selectedTag;
      
      return matchesSearch && matchesTag;
    });
  }, [searchTerm, selectedTag]);

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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-pink-100 mt-30">
      {/* Main Content */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 -mt-40 bg-gradient-to-b from-pink-50 via-rose-50 to-pink-100 rounded-t-3xl shadow-2xl">
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
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-base hover:border-pink-500/50 focus:border-pink-400 outline-none transition-all duration-300 shadow-sm"
            />
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

        {/* Blog Grid */}
        {filteredBlogs.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto"
          >
            {filteredBlogs.map((blog, index) => {
              const colors = getTagColor(blog.tag);
              return (
                <motion.article
                  key={index}
                  variants={cardVariants}
                  onHoverStart={() => setHoveredCard(index)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  {/* Image */}
                  <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-pink-100 to-rose-100">
                    <Image
                      src={blog.img}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Tag */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border} backdrop-blur-sm`}>
                        {blog.tag}
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
                      {blog.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>5 phút</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>1.2k</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Hôm nay</span>
                      </div>
                    </div>

                    {/* Read More */}
                    <Link
                      href={localizePath(EndPoint.HOME, locale) + "#blog"}
                      className="inline-flex items-center gap-2 text-pink-600 font-semibold text-sm hover:gap-3 transition-all group/readmore"
                    >
                      <span>{locale === "vi" ? "Đọc thêm" : "Read more"}</span>
                      <ArrowRight className="w-4 h-4 group-hover/readmore:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
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
    </div>
  );
}


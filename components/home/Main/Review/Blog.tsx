// components/sections/Blog.tsx (CLIENT)
"use client";

import { BLOGS } from "@/lib/data/data";
import { SURFACE_BORDER } from "@/lib/theme/theme";
import { Newspaper, ArrowRight, Calendar, User, Clock, BookOpen, Sparkles, TrendingUp, Eye, Heart, MessageCircle } from "lucide-react";
import { motion, cubicBezier } from "framer-motion";
import { useState } from "react";

export default function Blog() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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
        staggerChildren: 0.2,
        delayChildren: 0.3
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
      y: -15,
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25
      }
    }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    // Hỗ trợ cả tiếng Anh và tiếng Việt
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

  const getReadTime = () => {
    const times = ["5 phút", "8 phút", "12 phút", "15 phút"];
    return times[Math.floor(Math.random() * times.length)];
  };

  return (
    <section 
      id="blog" 
      className="py-28 pb-0 scroll-mt-24 bg-gradient-to-b from-blue-50 via-cyan-50 to-blue-100 relative z-30 overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
        
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-blue-300/10 via-cyan-300/10 to-blue-300/10 rounded-full blur-3xl"
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-gradient-to-r from-cyan-300/10 via-blue-300/10 to-cyan-300/10 rounded-full blur-3xl"
          animate={{
            rotate: [360, 180, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header section */}
        <motion.div 
          className="mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-3 mb-4"
              >
                
                
              </motion.div>

              <motion.h2 
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter"
                variants={fadeInUp}
              >
                <span className="block text-gray-900">Bài viết</span>
                <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 bg-clip-text text-transparent relative inline-block">
                  <motion.span animate={floatingAnimation}>
                    Nổi bật
                  </motion.span>
                  <motion.div
                    className="absolute -top-6 -right-8"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <BookOpen className="w-8 h-8 text-yellow-400" />
                  </motion.div>
                </span>
              </motion.h2>
              
              <motion.p 
                className="mt-6 text-xl text-slate-600 max-w-2xl"
                variants={fadeInUp}
              >
                Cập nhật kiến thức, phương pháp và kinh nghiệm học tiếng Anh hiệu quả cho trẻ em
              </motion.p>
            </div>

            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.a
                href="#"
                className="group/cta relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 text-white font-bold shadow-xl shadow-pink-500/30 overflow-hidden"
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Xem tất cả bài viết</span>
                <motion.div
                  className="relative z-10"
                  variants={{
                    hover: { x: 5, rotate: 90 }
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowRight size={20} />
                </motion.div>
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: "-100%" }}
                  variants={{
                    hover: { x: "100%" }
                  }}
                  transition={{ duration: 0.7 }}
                />
                
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-400/50 via-pink-500/50 to-rose-500/50 blur-xl opacity-0"
                  variants={{
                    hover: { opacity: 1 }
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            </motion.div>
          </div>
        </motion.div>

        {/* Blog grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {BLOGS.map((post, index) => {
            const tagColor = getTagColor(post.tag);
            
            return (
              <motion.article
                key={post.title}
                className="group relative"
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                whileHover="hover"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                custom={index}
                transition={{ delay: index * 0.1 }}
              >
                {/* Card container */}
                <div className="relative rounded-3xl bg-white overflow-hidden h-full border border-gray-200/50 shadow-lg shadow-gray-200/20 group-hover:shadow-2xl group-hover:shadow-pink-200/20 transition-all duration-500">
                  {/* Image container with overlay */}
                  <div className="relative h-56 lg:h-64 overflow-hidden">
                    <motion.img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 mix-blend-overlay"></div>
                    
                    {/* Tag badge */}
                    <motion.div
                      className="absolute top-4 left-4"
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 500, damping: 25, delay: index * 0.2 + 0.3 }}
                    >
                      <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full ${tagColor.bg} ${tagColor.text} border ${tagColor.border} text-xs font-bold backdrop-blur-sm`}>
                        {post.tag}
                      </span>
                    </motion.div>
                    
                    {/* Featured badge for first post */}
                    {index === 0 && (
                      <motion.div
                        className="absolute top-4 right-4"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs font-bold shadow-lg">
                          <TrendingUp size={12} />
                          Đang Hot
                        </span>
                      </motion.div>
                    )}
                    
                    {/* Date overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90">
                      <Calendar size={14} />
                      <span className="text-sm font-medium">1{index + 2}/12/2024</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 lg:p-8">
                    {/* Meta info */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span className="font-medium">Quản trị viên</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{getReadTime()}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <motion.h3 
                      className="text-xl lg:text-2xl font-bold mb-4 leading-tight group-hover:text-rose-600 transition-colors duration-300"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="bg-gradient-to-r from-gray-900 to-gray-700 group-hover:from-rose-600 group-hover:to-pink-600 bg-clip-text text-transparent transition-all duration-300">
                        {post.title}
                      </span>
                    </motion.h3>

                    {/* Excerpt */}
                    <p className="text-slate-600 mb-6 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 mb-8">
                      {[
                        { icon: Eye, count: Math.floor(Math.random() * 1000) + 500, label: "lượt xem" },
                        { icon: Heart, count: Math.floor(Math.random() * 200) + 50, label: "thích" },
                        { icon: MessageCircle, count: Math.floor(Math.random() * 50) + 10, label: "bình luận" }
                      ].map((stat, statIndex) => (
                        <motion.div
                          key={stat.label}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: statIndex * 0.1 + 0.5 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <stat.icon size={14} className="text-slate-500" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">{stat.count}</span>
                            <span className="text-slate-500 ml-1">{stat.label}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Read more button */}
                    <motion.div className="relative">
                      <motion.a
                        href="#"
                        className="group/btn relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold border-2 border-pink-200 shadow-md hover:shadow-lg hover:border-pink-400 transition-all duration-300 overflow-hidden"
                        whileHover="hover"
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10 group-hover/btn:text-white transition-colors duration-300">Đọc tiếp</span>
                        <motion.div
                          className="relative z-10"
                          variants={{
                            hover: { x: 4 }
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <ArrowRight size={18} className="text-pink-600 group-hover/btn:text-white transition-colors duration-300" />
                        </motion.div>
                        
                        {/* Hover gradient background */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500"
                          initial={{ x: "-100%" }}
                          variants={{
                            hover: { x: 0 }
                          }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                        
                        {/* Glow effect */}
                        <motion.div
                          className="absolute -inset-1 bg-gradient-to-r from-pink-400/40 to-rose-400/40 blur-md opacity-0"
                          variants={{
                            hover: { opacity: 1 }
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.a>
                    </motion.div>
                  </div>

                  {/* Hover effects */}
                  <motion.div
                    className="absolute inset-0 border-2 border-transparent group-hover:border-rose-200/50 rounded-3xl transition-all duration-500 pointer-events-none"
                    initial={false}
                    animate={{
                      scale: hoveredCard === index ? 1 : 0.98
                    }}
                  />
                  
                  {/* Corner accent */}
                  <motion.div
                    className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-pink-400/10 to-rose-400/10 blur-xl"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>

                {/* Floating elements for featured post */}
                {index === 0 && (
                  <>
                    <motion.div
                      className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-rose-400"
                      animate={{
                        y: [0, -20, 0],
                        x: [0, 10, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-4 -right-4 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                      animate={{
                        y: [0, 20, 0],
                        x: [0, -10, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    />
                  </>
                )}
              </motion.article>
            );
          })}
        </div>

       
      </div>
      
      {/* Hero deluxe end SVG decoration */}
      <div className="relative mt-20 w-full h-auto">
        <img 
          src="/image/hero-deluxe-end.svg" 
          alt="Hero decoration" 
          className="w-full h-auto"
          style={{ display: 'block' }}
        />
      </div>
    </section>
  );
}
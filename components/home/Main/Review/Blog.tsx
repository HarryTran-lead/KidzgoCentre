// components/sections/Blog.tsx (CLIENT) - Phiên bản dễ thương
"use client";

import { BLOGS } from "@/lib/data/data";
import { SURFACE_BORDER } from "@/lib/theme/theme";
import { ArrowRight, Calendar, User, Clock, BookOpen, Sparkles, TrendingUp, Eye, Heart, MessageCircle, Star, PartyPopper, Rainbow, Music, Gamepad2 } from "lucide-react";
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
    hidden: { opacity: 0, y: 60, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: cubicBezier(0.22, 1, 0.36, 1)
      }
    },
    hover: {
      y: -10,
      rotateZ: 2,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15
      }
    }
  };

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower === "tips" || tagLower === "kỹ năng") {
      return { bg: "bg-pink-400", text: "text-white" };
    }
    if (tagLower === "news" || tagLower === "tin tức") {
      return { bg: "bg-blue-400", text: "text-white" };
    }
    if (tagLower === "guide" || tagLower === "hướng dẫn") {
      return { bg: "bg-green-400", text: "text-white" };
    }
    if (tagLower === "activity" || tagLower === "hoạt động") {
      return { bg: "bg-yellow-400", text: "text-white" };
    }
    return { bg: "bg-purple-400", text: "text-white" };
  };

  return (
    <section 
      id="blog" 
      className=" scroll-mt-24 relative z-30 overflow-hidden"
      style={{ 
        backgroundColor: '#f0f9ff',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(255, 200, 124, 0.15) 0%, transparent 20%),
          radial-gradient(circle at 90% 80%, rgba(168, 230, 207, 0.15) 0%, transparent 20%)
        `
      }}
    >
      {/* Cute background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cute shapes */}
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-pink-200/30 to-orange-200/30"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-gradient-to-r from-blue-200/20 to-green-200/20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 mt-20">
        {/* Header section với hình ảnh dễ thương */}
        <motion.div 
          className="mb-12 text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-black text-center mb-6"
            variants={fadeInUp}
          >
            <span className="block text-gray-800">Bản tin</span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Của Bé Yêu
            </span>
          </motion.h2>
          
          <motion.p 
            className="mt-6 text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium mb-8"
            variants={fadeInUp}
          >
            Khám phá những câu chuyện vui, hoạt động thú vị và bí kíp học tiếng Anh siêu dễ thương!
          </motion.p>
          
          
        </motion.div>

        {/* Blog grid - Cute design */}
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
                {/* Card container với hình dạng dễ thương */}
                <div className="relative rounded-3xl bg-gradient-to-b from-white to-white/90 overflow-hidden h-full border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:border-pink-300">
                  {/* Cute top decoration */}
                  <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-t-3xl" />
                  
                  {/* Image container với khung dễ thương */}
                  <div className="relative h-48 overflow-hidden m-4 mt-6 rounded-2xl border-4 border-white shadow-lg">
                    <motion.img
                      src={post.img}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />
                    
                    {/* Cute overlay với emoji */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    
                    {/* Tag badge dễ thương */}
                    <motion.div
                      className="absolute top-3 left-3"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 500, damping: 25, delay: index * 0.2 }}
                    >
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tagColor.bg} ${tagColor.text} shadow-lg`}>
                        <span className="font-bold text-sm">{post.tag}</span>
                      </div>
                    </motion.div>
                    
                    {/* Date */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full">
                      <span className="text-sm font-bold text-gray-800">1{index + 2}/12</span>
                    </div>
                  </div>

                  {/* Content - Thiết kế dễ thương */}
                  <div className="p-6">
                    {/* Title với hiệu ứng gradient */}
                    <motion.h3 
                      className="text-xl font-black mb-3 leading-tight group-hover:text-pink-600 transition-colors duration-300 min-h-[56px]"
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="bg-gradient-to-r from-gray-900 to-gray-700 group-hover:from-pink-600 group-hover:to-purple-600 bg-clip-text text-transparent transition-all duration-300">
                        {post.title}
                      </span>
                    </motion.h3>

                    {/* Excerpt với background cute */}
                    <div className="mb-5">
                      <p className="text-gray-700 leading-relaxed text-sm bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-pink-50 to-blue-50 p-3 rounded-xl border border-gray-100">
                      {[
                        { count: Math.floor(Math.random() * 1000) + 500, label: "xem" },
                        { count: Math.floor(Math.random() * 200) + 50, label: "thích" },
                        { count: Math.floor(Math.random() * 50) + 10, label: "bình luận" }
                      ].map((stat, statIndex) => (
                        <div
                          key={stat.label}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-gray-900 text-sm">{stat.count}</span>
                          </div>
                          <span className="text-gray-600 text-xs">{stat.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Read more button dễ thương */}
                    <motion.div className="relative">
                      <motion.a
                        href="#"
                        className="group/btn relative inline-flex items-center justify-center gap-3 w-full py-3.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${['#ff6b9d', '#6b8cff', '#6bffb8', '#ffc46b'][index % 4]}, ${
                            ['#ff8ebb', '#8ba3ff', '#8bffd1', '#ffd48b'][index % 4]
                          })`
                        }}
                        whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Đọc ngay nào!
                        </span>
                        <motion.div
                          className="relative z-10"
                          animate={{
                            x: [0, 4, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <ArrowRight size={20} />
                        </motion.div>
                        
                        {/* Sparkle effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.7 }}
                        />
                      </motion.a>
                    </motion.div>
                  </div>

                  {/* Cute corner decorations */}
                  <motion.div
                    className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-r from-pink-400/20 to-purple-400/20"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  <motion.div
                    className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-r from-blue-400/20 to-green-400/20"
                    animate={{
                      rotate: -360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>

              </motion.article>
            );
          })}
        </div>

        {/* CTA dễ thương */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.a
            href="#"
            className="group relative inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden text-lg"
            whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center gap-3">
              Xem tất cả câu chuyện vui của bé
            </span>
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.7 }}
            />
          </motion.a>

        </motion.div>
      </div>

      {/* Hero deluxe end separator */}
      <div className="relative w-full mt-20">
        <img 
          src="/image/hero-deluxe-end.svg" 
          alt="Hero deluxe end"
          className="w-full h-auto"
        />
      </div>
    </section>
  );
}
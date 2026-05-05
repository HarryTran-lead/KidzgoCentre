"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { Newspaper, Sparkles, Zap, Compass, Rocket, ChevronDown, Circle, Hexagon, Triangle, TrendingUp, Users, BookOpen, Calendar } from "lucide-react";
import { BLOGS } from "@/lib/data/data";
import { DEFAULT_LOCALE, pickLocaleFromPath } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";

export default function BannerBlog() {
  const pathname = usePathname() || "/";
  const locale = pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE;
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const bannerRef = useRef<HTMLElement>(null);
  
  // Mouse follow values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  // Extract unique tags from blogs
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    BLOGS.forEach(blog => {
      if (blog.tag) tags.add(blog.tag);
    });
    return Array.from(tags);
  }, []);

  // Get recent posts count (last 30 days)
  const recentPostsCount = useMemo(() => {
    return BLOGS.length;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const effectStart = 0;
      const effectEnd = 400;
      const progress = Math.min(1, (scrollY - effectStart) / (effectEnd - effectStart));
      
      const newScale = Math.max(0.8, 1 - progress * 0.2);
      const newOpacity = Math.max(0.3, 1 - progress * 0.7);
      
      setScale(newScale);
      setOpacity(newOpacity);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setMousePosition({ x, y });
      mouseX.set(x);
      mouseY.set(y);
    }
  };

  // Scroll to blog section
  const scrollToBlogs = () => {
    const blogSection = document.getElementById('blog-section');
    if (blogSection) {
      blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Animated geometric shapes data
  const shapes = [
    { Icon: Circle, size: 60, left: "10%", top: "20%", duration: 20, delay: 0 },
    { Icon: Hexagon, size: 40, left: "85%", top: "15%", duration: 25, delay: 2 },
    { Icon: Triangle, size: 30, left: "15%", top: "70%", duration: 18, delay: 1 },
    { Icon: Circle, size: 25, left: "75%", top: "80%", duration: 22, delay: 3 },
    { Icon: Hexagon, size: 50, left: "90%", top: "50%", duration: 28, delay: 4 },
    { Icon: Triangle, size: 20, left: "5%", top: "45%", duration: 15, delay: 2.5 },
  ];

  // Floating particles with different colors
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 6,
    size: 2 + Math.random() * 4,
    color: `rgba(255, ${150 + Math.random() * 105}, ${50 + Math.random() * 100}, ${0.1 + Math.random() * 0.3})`
  }));

  // Grid lines animation
  const gridLines = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    position: `${(i + 1) * 8.33}%`,
    delay: i * 0.5,
  }));

  // Blog stats data
  const blogStats = [
    { 
      value: BLOGS.length, 
      suffix: "+", 
      label: locale === "vi" ? "Bài viết" : "Articles", 
      icon: BookOpen
    },
    { 
      value: allTags.length, 
      suffix: "", 
      label: locale === "vi" ? "Chủ đề" : "Topics", 
      icon: Compass
    },
    { 
      value: null, 
      label: locale === "vi" ? "Cập nhật" : "Updates", 
      icon: TrendingUp,
      customValue: "24/7"
    },
  ];

  return (
    <header 
      ref={bannerRef}
      onMouseMove={handleMouseMove}
      className="blogs-banner relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-rose-600 pb-24 sm:pb-28 sticky top-0 z-10"
      style={{ opacity }}
    >
      {/* Modern Animated Background */}

      {/* Animated Gradient Orbs with Mouse Follow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `
            radial-gradient(circle at ${50 + mousePosition.x * 30}% ${50 + mousePosition.y * 20}%, 
            rgba(251, 146, 60, 0.25) 0%, 
            rgba(244, 114, 182, 0.15) 30%,
            transparent 70%),
            radial-gradient(circle at ${70 - mousePosition.x * 20}% ${30 + mousePosition.y * 15}%, 
            rgba(255, 200, 100, 0.2) 0%,
            transparent 60%)
          `
        }}
        transition={{ type: "spring", stiffness: 50, damping: 25 }}
      />

      {/* Rotating Geometric Shapes */}
      {shapes.map((shape, idx) => (
        <motion.div
          key={idx}
          className="absolute opacity-20 pointer-events-none"
          style={{ left: shape.left, top: shape.top }}
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: shape.duration, repeat: Infinity, ease: "linear" },
            scale: { duration: shape.duration / 2, repeat: Infinity, ease: "easeInOut" },
            delay: shape.delay
          }}
        >
          <shape.Icon size={shape.size} className="text-white/40" strokeWidth={1.5} />
        </motion.div>
      ))}

      {/* Animated Grid Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {gridLines.map((line) => (
          <React.Fragment key={line.id}>
            <motion.div
              className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
              style={{ left: line.position }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: line.delay, duration: 1 }}
            />
            <motion.div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ top: line.position }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: line.delay + 0.3, duration: 1 }}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Animated Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
            animate={{
              y: [0, -200, 0],
              x: [0, Math.sin(particle.id) * 100, 0],
              opacity: [0, 0.8, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Animated Wave SVG at bottom */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none">
        <svg className="w-full h-auto" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <motion.path
            d="M0,64L80,69C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            fill="rgba(255,255,255,0.08)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,80L80,85C160,90,320,100,480,95C640,90,800,70,960,65C1120,60,1280,70,1360,75L1440,80L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            fill="rgba(255,255,255,0.05)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [1, 1.03, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
        </svg>
      </div>

      {/* Animated Border Glow */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
        animate={{
          opacity: [0.3, 0.8, 0.3],
          scaleX: [0.95, 1, 0.95],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-8 mt-20 mb-20">
        <motion.div 
          className="grid gap-8 lg:grid-cols-5 lg:items-center"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.3s ease-out, opacity 0.3s ease-out' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* LEFT SIDE */}
          <div className="flex flex-col justify-center space-y-4 sm:space-y-6 lg:col-span-3">
            {/* Animated Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 self-start"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-semibold border border-white/30 shadow-lg">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={18} />
                </motion.div>
                {locale === "vi" ? "Bản Tin Mới" : "Latest News"}
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Rocket size={14} />
                </motion.div>
              </span>
            </motion.div>

            {/* Title with Letter Animation */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-[40px] font-black text-white leading-tight mb-3 drop-shadow-lg">
                {locale === "vi" ? (
                  <>
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="inline-block mr-2"
                    >
                      Bản Tin
                    </motion.span>
                    {" & "}
                    <motion.span 
                      className="text-amber-300 inline-block"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        textShadow: [
                          "0 0 0px rgba(251, 146, 60, 0)",
                          "0 0 20px rgba(251, 146, 60, 0.8)",
                          "0 0 40px rgba(251, 146, 60, 0.4)",
                          "0 0 0px rgba(251, 146, 60, 0)"
                        ]
                      }}
                      transition={{ duration: 2, delay: 0.2 }}
                    >
                      Bài Viết
                    </motion.span>
                  </>
                ) : (
                  <>
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="inline-block mr-2"
                    >
                      Latest News
                    </motion.span>
                    {" & "}
                    <motion.span 
                      className="text-amber-300 inline-block"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        textShadow: [
                          "0 0 0px rgba(251, 146, 60, 0)",
                          "0 0 20px rgba(251, 146, 60, 0.8)",
                          "0 0 40px rgba(251, 146, 60, 0.4)",
                          "0 0 0px rgba(251, 146, 60, 0)"
                        ]
                      }}
                      transition={{ duration: 2, delay: 0.2 }}
                    >
                      Articles
                    </motion.span>
                  </>
                )}
              </h1>
              <motion.div 
                className="h-1.5 w-24 bg-amber-300 rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: 96 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </div>

            {/* Subtitle */}
            <motion.p 
              className="text-sm sm:text-base md:text-[15px] text-white leading-relaxed max-w-xl font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {locale === "vi" 
                ? "Cập nhật tin tức, mẹo học tập và thông tin hữu ích từ Rex. Đừng bỏ lỡ những bài viết mới nhất!"
                : "Stay updated with news, learning tips and useful information from Rex. Don't miss our latest articles!"
              }
            </motion.p>

            {/* Blog Stats with 3D hover effect */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {blogStats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="group relative bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20 overflow-hidden cursor-pointer"
                  whileHover={{ 
                    scale: 1.05,
                    y: -5,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="relative">
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                      {stat.customValue || `${stat.value}${stat.suffix}`}
                    </div>
                    <div className="text-xs sm:text-sm text-white/90 font-medium flex items-center gap-1">
                      <stat.icon size={12} className="group-hover:rotate-12 transition-transform" />
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Read Blogs Button with Down Arrow */}
            <motion.button
              onClick={scrollToBlogs}
              className="group relative cursor-pointer mt-4 px-8 py-3.5 bg-white text-red-600 rounded-xl font-bold flex items-center gap-3 w-fit shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Animated background shine */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
              
              <span className="relative flex items-center gap-2">
                <Newspaper size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                {locale === "vi" ? "Đọc Bài Viết" : "Read Articles"}
              </span>
              
              {/* Animated down arrow */}
              <motion.div
                className="relative"
                animate={{ 
                  y: [0, 8, 0],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ChevronDown size={20} className="group-hover:scale-110 transition-transform" />
              </motion.div>

              {/* Pulsing ring around button on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-white/50"
                initial={{ scale: 1, opacity: 0 }}
                whileHover={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            
          </div>

          {/* RIGHT SIDE - Enhanced 3D Sticker with Mouse Follow */}
          <div className="hidden lg:flex items-center justify-end lg:col-span-2">
            <div className="relative w-full max-w-sm h-80 flex items-center justify-center">
              {/* Glow effect behind sticker with mouse follow */}
              <motion.div
                className="absolute inset-0 bg-rose-400 rounded-full blur-3xl"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 0.6, 0.3],
                  x: mousePosition.x * 20,
                  y: mousePosition.y * 20,
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Main Sticker with 3D tilt effect */}
              <motion.div
                className="relative cursor-pointer"
                style={{
                  rotateX: useTransform(springY, [-1, 1], [15, -15]),
                  rotateY: useTransform(springX, [-1, 1], [-15, 15]),
                }}
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{
                  opacity: 1,
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                  y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                }}
                whileHover={{ scale: 1.1 }}
              >
                <Image
                  src="/sticker/1.png"
                  alt="Blog Sticker"
                  width={200}
                  height={200}
                  className="drop-shadow-2xl"
                />
                {/* Rotating ring effect */}
                <motion.div
                  className="absolute inset-0 border-2 border-white/30 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ width: 220, height: 220, left: -10, top: -10 }}
                />
                
                {/* Rotating dashed ring */}
                <motion.div
                  className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  style={{ width: 240, height: 240, left: -20, top: -20 }}
                />
              </motion.div>

              {/* Floating icons around sticker with mouse follow */}
              {[
                { Icon: BookOpen, delay: 0, x: -90, y: -40, floatRange: 15, color: "text-blue-300" },
                { Icon: TrendingUp, delay: 0.5, x: 90, y: -30, floatRange: 12, color: "text-green-300" },
                { Icon: Users, delay: 1, x: -80, y: 50, floatRange: 18, color: "text-yellow-300" },
                { Icon: Calendar, delay: 1.5, x: 85, y: 60, floatRange: 14, color: "text-purple-300" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-white/20 backdrop-blur-md p-2.5 rounded-full border border-white/30"
                  style={{ x: item.x, y: item.y }}
                  animate={{
                    y: [item.y, item.y - item.floatRange, item.y],
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    delay: item.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.2, rotate: 180 }}
                >
                  <item.Icon size={20} className={item.color} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating scroll indicator at bottom edge */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        onClick={scrollToBlogs}
      >
        <div className="text-white/60 text-xs font-medium">
          {locale === "vi" ? "Xem Bài Viết" : "View Articles"}
        </div>
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <motion.div
            className="w-1.5 h-2 bg-white/60 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </header>
  );
}

// Add React import for Fragment
import React from "react";
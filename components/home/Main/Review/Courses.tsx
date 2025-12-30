// components/sections/Courses.tsx (CLIENT)
"use client";

import { COURSES } from "@/lib/data/data";
import { SURFACE_BORDER } from "@/lib/theme/theme";
import { Clock, ArrowRight, Star, Users, TrendingUp } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Courses() {
  // Scroll-based animations
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  
  // Parallax effects
  const stickerUpY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const stickerDownY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const opacityProgress = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section
      id="courses"
      className="py-24 md:py-32 scroll-mt-24 bg-white relative z-30 overflow-hidden"
      style={{
        backgroundImage: "url('/image/timeline-end-green-front.svg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom center",
        backgroundSize: "100% auto",
      }}
      ref={sectionRef}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-32 right-10 w-96 h-96 bg-gradient-to-tr from-blue-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        {/* New floating orb */}
        <motion.div 
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
          animate={{
            scale: [1, 1.3, 1],
            borderRadius: ["50%", "40%", "50%"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-pink-400/30 to-rose-400/30 rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 10) % 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >

          
          <motion.h2 
            className="mt-8 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Khóa Học{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                Nổi Bật
              </span>

            </span>
          </motion.h2>
          
          <motion.p 
            className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Khám phá các khóa học được thiết kế đặc biệt để đưa bạn từ con số 0 đến thành thạo
          </motion.p>
        </motion.div>

        {/* Courses Grid */}
        <div className="space-y-20 md:space-y-24 lg:space-y-28 mb-80">
          {COURSES.map((c, index) => {
            const isEven = index % 2 === 0;
            const stickerId = (index % 20) + 1;
            
            return (
              <motion.div
                key={c.title}
                className={`grid md:grid-cols-2 gap-8 lg:gap-12 items-center ${!isEven ? "md:flex-row-reverse" : ""}`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
              >
                {/* Sticker Image - Larger size */}
                <motion.div 
                  className={`relative ${!isEven ? "md:order-2" : ""}`}
                  initial={{ opacity: 0, scale: 0.8, rotate: isEven ? -5 : 5 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: index * 0.15 + 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    rotate: isEven ? 2 : -2,
                    transition: { duration: 0.3 }
                  }}
                >
                  <motion.img
                    src={`/sticker/${stickerId}.png`}
                    alt={c.title}
                    className="w-full h-auto max-h-[500px] object-contain drop-shadow-2xl"
                    style={{ 
                      y: isEven ? stickerUpY : stickerDownY,
                      filter: "drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15))"
                    }}
                  />
                  
                  {/* Glow effect behind sticker */}
                  <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${
                    isEven ? "from-amber-400/30 via-pink-400/30 to-rose-400/30" : "from-blue-400/30 via-purple-400/30 to-pink-400/30"
                  } blur-3xl rounded-full scale-110`} />
                </motion.div>

                {/* Content Card */}
                <motion.div 
                  className={`${!isEven ? "md:order-1" : ""}`}
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.15 + 0.2 }}
                >
                  <motion.div
                    className={`relative rounded-3xl bg-white/90 backdrop-blur-sm border p-8 lg:p-10 h-full flex flex-col justify-center group ${
                      c.highlight
                        ? "border-rose-200 shadow-2xl shadow-rose-500/10"
                        : "border-slate-200 shadow-xl shadow-slate-500/5"
                    } hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 overflow-hidden`}
                    whileHover={{ 
                      y: -8,
                      scale: 1.02,
                      borderColor: c.highlight ? "rgb(253, 164, 175)" : "rgb(148, 163, 184)"
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Background gradient layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-white/80 z-0" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                      c.highlight 
                        ? "from-pink-500/5 via-rose-500/5 to-amber-500/5" 
                        : "from-blue-500/5 via-purple-500/5 to-pink-500/5"
                    } opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0`} />
                    
                    {/* Animated border gradient */}
                    <motion.div 
                      className="absolute inset-0 rounded-3xl p-[1.5px] z-0"
                      initial={{ background: "linear-gradient(90deg, transparent, transparent)" }}
                      whileHover={{ 
                        background: c.highlight 
                          ? "linear-gradient(90deg, #fbbf24, #ec4899, #f43f5e)" 
                          : "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)"
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-white" />
                    </motion.div>

                    {/* Floating elements */}
                    <motion.div 
                      className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${
                        c.highlight ? "bg-rose-500/10" : "bg-blue-500/10"
                      } z-0`}
                      animate={{
                        y: [0, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: index * 0.5,
                      }}
                    />
                    
                    <div className="relative z-10">
                      {/* Badge */}
                      <motion.div 
                        className="inline-flex items-center gap-2 mb-6"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
                      >
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                          c.highlight
                            ? "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700"
                            : "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        }`}>
                          {c.level}
                        </span>
                        {c.highlight && (
                          <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-sm font-semibold">
                            <TrendingUp size={12} className="inline mr-1" /> Bán chạy
                          </span>
                        )}
                      </motion.div>

                      {/* Title */}
                      <motion.h3 
                        className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.15 + 0.4 }}
                        whileHover={{ 
                          scale: 1.02,
                          backgroundImage: c.highlight 
                            ? "linear-gradient(90deg, #f59e0b, #ec4899, #f43f5e)" 
                            : "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
                        }}
                      >
                        <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:text-transparent group-hover:bg-clip-text transition-all duration-500">
                          {c.title}
                        </span>
                      </motion.h3>

                      {/* Info grid */}
                      <motion.div 
                        className="grid grid-cols-2 gap-4 mb-8"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.15 + 0.5 }}
                      >
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className={`p-2 rounded-lg ${
                            c.highlight ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                          }`}>
                            <Clock size={18} />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500">Thời lượng</div>
                            <div className="font-semibold">{c.time}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className={`p-2 rounded-lg ${
                            c.highlight ? "bg-amber-100 text-amber-600" : "bg-purple-100 text-purple-600"
                          }`}>
                            <Users size={18} />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500">Học viên</div>
                            <div className="font-semibold">500+</div>
                          </div>
                        </div>
                      </motion.div>

                      {/* CTA Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.15 + 0.6 }}
                      >
                        <motion.a
                          href="#contact"
                          className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg group/btn ${
                            c.highlight
                              ? "bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 hover:shadow-2xl hover:shadow-rose-500/30"
                              : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:shadow-2xl hover:shadow-purple-500/30"
                          }`}
                          whileHover={{ 
                            scale: 1.05,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
                          }}
                          whileTap={{ scale: 0.95 }}
                          animate={{
                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                          }}
                          transition={{
                            backgroundPosition: {
                              duration: 5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }
                          }}
                          style={{
                            backgroundSize: "200% 200%",
                          }}
                        >
                          <span className="text-base">Đăng ký ngay</span>
                          <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform duration-300" />
                        </motion.a>
                      </motion.div>
                    </div>

                    {/* Corner accent */}
                    <motion.div 
                      className={`absolute -bottom-6 -left-6 w-32 h-32 rounded-full ${
                        c.highlight ? "bg-gradient-to-br from-amber-400/20 to-rose-400/20" : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
                      } z-0`}
                      animate={{
                        rotate: [0, 90, 180, 270, 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      
    </section>
  );
}
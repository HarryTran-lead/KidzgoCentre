// components/sections/Courses.tsx (CLIENT) - Phiên bản theo thiết kế mới
"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Courses() {
  // Dữ liệu 4 khóa học chính
  const courseCards = [
    {
      ageGroup: "3-5 tuổi",
      title: "Bé Khởi Đầu",
      method: "Học qua chơi",
      classSize: "8-10 bé",
      sessions: "2 buổi",
      teachers: ["Cô Lily (UK)", "Sonny (US)"],
      color: "pink",
      headerColor: "bg-gradient-to-r from-rose-300 to-pink-300",
      pillColor: "bg-pink-100 text-pink-700",
      illustration: "/sticker/kid1.png" // Hình minh họa bé
    },
    {
      ageGroup: "6-8 tuổi",
      title: "Bé Khám Phá",
      method: "Du lịch ảo",
      classSize: "10-12 bé",
      sessions: "3 buổi",
      teachers: ["Thầy Tom"],
      color: "blue",
      headerColor: "bg-gradient-to-r from-sky-300 to-blue-300",
      pillColor: "bg-blue-100 text-blue-700",
      illustration: "/sticker/kid2.png" // Hình minh họa bé
    },
    {
      ageGroup: "7-9 tuổi",
      title: "Bé Sáng Tạo",
      method: "Dự án sáng tạo",
      classSize: "10-12 bé",
      sessions: "3 buổi",
      teachers: ["Cô Emma (UK)", "Thầy David"],
      color: "purple",
      headerColor: "bg-gradient-to-r from-violet-300 to-purple-300",
      pillColor: "bg-purple-100 text-purple-700",
      illustration: "/sticker/kid3.png" // Hình minh họa bé
    },
    {
      ageGroup: "9-12 tuổi",
      title: "Bé Dẫn Đầu",
      method: "Lãnh đạo nhóm",
      classSize: "12-15 bé",
      sessions: "4 buổi",
      teachers: ["Thầy Tom", "Cô Emma (UK)"],
      color: "green",
      headerColor: "bg-gradient-to-r from-emerald-300 to-green-300",
      pillColor: "bg-green-100 text-green-700",
      illustration: "/sticker/kid4.png" // Hình minh họa bé
    }
  ];

  return (
    <section 
      id="courses" 
      className="programs-page pt-20 pb-20 scroll-mt-24 relative z-30 overflow-hidden min-h-screen bg-white"
      style={{}}
    >
      {/* Animated gradient shadow - Using CSS animations for better performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-red-300 to-red-400 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse-scale"
        />
        <div 
          className="absolute bottom-32 right-10 w-96 h-96 bg-gradient-to-tr from-red-400 to-rose-300 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse-scale-sm"
        />
        <div 
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-red-400 to-red-300 rounded-full mix-blend-multiply blur-3xl opacity-15 animate-pulse-scale-md"
        />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="block text-gray-800">
              Lớp Học Siêu Vui
            </span>
            <span className="bg-gradient-to-r from-red-500 via-red-600 to-rose-600 bg-clip-text text-transparent mt-2">Dành Cho Bé Yêu</span>
          </motion.h2>
        </motion.div>

        {/* Main Content Grid - 2x2 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {courseCards.map((course, index) => (
            <motion.div
              key={index}
              className="group rounded-2xl overflow-hidden border-0 hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ scale: 1.02, y: -4 }}
              style={{
                boxShadow: "0 10px 30px rgba(220, 38, 38, 0.1)"
              }}
            >
                {/* Card Header with premium red gradient */}
                <div className="bg-linear-to-r from-red-500 via-rose-500 to-red-600 px-8 py-6 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-500"></div>
                  <h3 className="text-2xl lg:text-3xl font-black text-white relative z-10">{course.title}</h3>
                </div>

                {/* Card Content */}
                <div className="p-8 space-y-6">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left side - Info pills and teachers */}
                    <div className="flex-1 space-y-5">
                      {/* Pill buttons - Modernized */}
                      <div className="flex flex-wrap gap-2.5">
                        <span className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide hover:from-red-200 hover:to-rose-200 transition-all duration-300 cursor-default shadow-sm">
                          {course.ageGroup}
                        </span>
                        <span className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide hover:from-red-200 hover:to-rose-200 transition-all duration-300 cursor-default shadow-sm">
                          {course.method}
                        </span>
                        <span className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide hover:from-red-200 hover:to-rose-200 transition-all duration-300 cursor-default shadow-sm">
                          {course.classSize}
                        </span>
                        <span className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide hover:from-red-200 hover:to-rose-200 transition-all duration-300 cursor-default shadow-sm">
                          {course.sessions}
                        </span>
                      </div>

                      {/* Teachers - Enhanced typography */}
                      <div className="space-y-2.5 pt-3 border-t border-red-100">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-widest">Giáo Viên Hướng Dẫn</p>
                        {course.teachers.map((teacher, teacherIndex) => (
                          <div key={teacherIndex} className="text-gray-700 font-semibold text-sm leading-relaxed">
                            {teacher}
                          </div>
                        ))}
                        {course.teachers.length < 2 && (
                          <div className="text-gray-400 text-xs italic">Và nhiều giáo viên khác...</div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Illustration */}
                    <div className="flex-shrink-0 lg:w-96 lg:h-96 relative">
                      <div className="relative w-full h-64 lg:h-full rounded-2xl overflow-hidden bg-linear-to-br from-red-100/50 via-rose-50/50 to-red-50/50 border border-red-200/40 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-500">
                        {/* Main illustration - Kids stickers */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{
                              y: [0, -10, 0],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-full h-full scale-125"
                          >
                            <Image 
                              src={course.illustration} 
                              alt={course.title} 
                              width={400} 
                              height={400}
                              className="object-contain w-full h-full"
                            />
                          </motion.div>
                        </div>
                        
                        {/* Decorative stickers - Clouds */}
                        <motion.div
                          className="absolute top-2 right-2 w-16 h-16 lg:w-20 lg:h-20 opacity-60"
                          animate={{
                            x: [0, 5, 0],
                            y: [0, -5, 0]
                          }}
                          transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Image src="/draw/cloud.png" alt="cloud" width={80} height={80} />
                        </motion.div>
                        
                        {/* Sun sticker */}
                        <motion.div
                          className="absolute top-4 left-4 w-12 h-12 lg:w-16 lg:h-16 opacity-70"
                          animate={{
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        >
                          <Image src="/draw/sun.png" alt="sun" width={64} height={64} />
                        </motion.div>
                        
                        {/* Rainbow sticker */}
                        <motion.div
                          className="absolute bottom-4 right-4 w-10 h-10 lg:w-14 lg:h-14 opacity-50"
                          animate={{
                            rotate: [0, -15, 15, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Image src="/draw/rainbow.png" alt="rainbow" width={56} height={56} />
                        </motion.div>
                        
                        {/* Flower sticker */}
                        <motion.div
                          className="absolute bottom-2 left-2 w-8 h-8 lg:w-12 lg:h-12 opacity-60"
                          animate={{
                            y: [0, -8, 0],
                            rotate: [0, 180, 360]
                          }}
                          transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Image src="/draw/flower.png" alt="flower" width={48} height={48} />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
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
      className="pt-20 pb-20 scroll-mt-24 relative z-30 overflow-hidden min-h-screen"
      style={{ 
        backgroundImage: 'url(/image/background1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay để đảm bảo nội dung dễ đọc */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none z-0"></div>
      {/* Background decorative elements - Clouds and stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 opacity-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image src="/draw/cloud.png" alt="cloud" width={128} height={128} />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 opacity-20"
          animate={{
            y: [0, -15, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image src="/draw/cloud.png" alt="cloud" width={96} height={96} />
        </motion.div>
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
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Lớp Học Siêu Vui
            </span>
            <span className="block text-gray-800 mt-2">Dành Cho Bé Yêu</span>
          </motion.h2>
        </motion.div>

        {/* Main Content Grid - 2x2 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {courseCards.map((course, index) => (
            <motion.div
              key={index}
              className={`rounded-3xl shadow-xl overflow-hidden border-2 hover:shadow-2xl transition-shadow ${
                course.color === "pink" 
                  ? "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200" 
                  : course.color === "blue"
                  ? "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200"
                  : course.color === "purple"
                  ? "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200"
                  : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ scale: 1.02 }}
            >
                {/* Card Header with colored background */}
                <div className={`${course.headerColor} px-6 py-4`}>
                  <h3 className="text-2xl font-black text-gray-900">{course.title}</h3>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side - Info pills and teachers */}
                    <div className="flex-1 space-y-4">
                      {/* Pill buttons */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`${course.pillColor} px-4 py-2 rounded-full text-sm font-semibold`}>
                          {course.ageGroup}
                        </span>
                        <span className={`${course.pillColor} px-4 py-2 rounded-full text-sm font-semibold`}>
                          {course.method}
                        </span>
                        <span className={`${course.pillColor} px-4 py-2 rounded-full text-sm font-semibold`}>
                          {course.classSize}
                        </span>
                        <span className={`${course.pillColor} px-4 py-2 rounded-full text-sm font-semibold`}>
                          {course.sessions}
                        </span>
                      </div>

                      {/* Teachers */}
                      <div className="space-y-2">
                        {course.teachers.map((teacher, teacherIndex) => (
                          <div key={teacherIndex} className="text-gray-700 font-medium">
                            {teacher}
                          </div>
                        ))}
                        {course.teachers.length < 2 && (
                          <div className="text-gray-400 text-sm italic">Và nhiều giáo viên khác...</div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Illustration */}
                    <div className="flex-shrink-0 lg:w-80 lg:h-80 relative">
                      <div className={`relative w-full h-64 lg:h-full rounded-2xl overflow-hidden ${
                        course.color === "pink" 
                          ? "bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50" 
                          : course.color === "blue"
                          ? "bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-50"
                          : course.color === "purple"
                          ? "bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-50"
                          : "bg-gradient-to-br from-emerald-100 via-green-50 to-teal-50"
                      }`}>
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
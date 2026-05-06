// components/sections/Courses.tsx (CLIENT) - Phiên bản sáng tạo và phá cách
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
      gradient: "from-rose-500 to-pink-500",
      lightGradient: "from-rose-50 to-pink-50",
      pillColor: "bg-pink-100 text-pink-700",
      borderColor: "border-pink-200",
      illustration: "/sticker/kid1.png"
    },
    {
      ageGroup: "6-8 tuổi",
      title: "Bé Khám Phá",
      method: "Du lịch ảo",
      classSize: "10-12 bé",
      sessions: "3 buổi",
      teachers: ["Thầy Tom"],
      color: "blue",
      gradient: "from-sky-500 to-blue-500",
      lightGradient: "from-sky-50 to-blue-50",
      pillColor: "bg-blue-100 text-blue-700",
      borderColor: "border-blue-200",
      illustration: "/sticker/kid2.png"
    },
    {
      ageGroup: "7-9 tuổi",
      title: "Bé Sáng Tạo",
      method: "Dự án sáng tạo",
      classSize: "10-12 bé",
      sessions: "3 buổi",
      teachers: ["Cô Emma (UK)", "Thầy David"],
      color: "purple",
      gradient: "from-violet-500 to-purple-500",
      lightGradient: "from-violet-50 to-purple-50",
      pillColor: "bg-purple-100 text-purple-700",
      borderColor: "border-purple-200",
      illustration: "/sticker/kid3.png"
    },
    {
      ageGroup: "9-12 tuổi",
      title: "Bé Dẫn Đầu",
      method: "Lãnh đạo nhóm",
      classSize: "12-15 bé",
      sessions: "4 buổi",
      teachers: ["Thầy Tom", "Cô Emma (UK)"],
      color: "green",
      gradient: "from-emerald-500 to-green-500",
      lightGradient: "from-emerald-50 to-green-50",
      pillColor: "bg-green-100 text-green-700",
      borderColor: "border-green-200",
      illustration: "/sticker/kid4.png"
    }
  ];

  return (
    <section 
      id="courses" 
      className="programs-page pt-20 pb-20 scroll-mt-24 relative z-30 overflow-hidden min-h-screen bg-white"
    >
      {/* Animated gradient shadow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-red-300 to-red-400 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse-scale" />
        <div className="absolute bottom-32 right-10 w-96 h-96 bg-gradient-to-tr from-red-400 to-rose-300 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse-scale-sm" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-red-400 to-red-300 rounded-full mix-blend-multiply blur-3xl opacity-15 animate-pulse-scale-md" />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header với hiệu ứng độc đáo */}
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
            <span className="bg-gradient-to-r from-red-500 via-red-600 to-rose-600 bg-clip-text text-transparent mt-2">
              Dành Cho Bé Yêu
            </span>
          </motion.h2>
          
          {/* Decorative line */}
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-full mx-auto mt-6"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </motion.div>

        {/* Main Content Grid - 2x2 Grid Layout với card độc đáo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {courseCards.map((course, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {/* Card với hiệu ứng nổi bật */}
              <div 
                className={`relative rounded-3xl overflow-hidden bg-white border-2 ${course.borderColor} 
                           transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]`}
                style={{
                  boxShadow: `0 20px 40px -12px ${course.color === 'pink' ? 'rgba(236, 72, 153, 0.15)' : 
                              course.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                              course.color === 'purple' ? 'rgba(139, 92, 246, 0.15)' :
                              'rgba(16, 185, 129, 0.15)'}`
                }}
              >
                {/* Corner decorations */}
                <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${course.gradient} opacity-10 rounded-bl-3xl`} />
                <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl ${course.gradient} opacity-10 rounded-tr-3xl`} />

                {/* Card Header with unique design */}
                <div className={`relative px-8 pt-8 pb-4`}>
                  {/* Age badge - floating design */}
                  <div className={`inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r ${course.gradient} 
                                  text-white text-xs font-bold tracking-wider shadow-lg transform -rotate-2`}>
                    {course.ageGroup}
                  </div>
                  
                  {/* Title with underline effect */}
                  <h3 className="text-3xl lg:text-4xl font-black text-gray-800 mb-2 relative inline-block">
                    {course.title}
                    <span className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${course.gradient} 
                                    transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                  </h3>
                </div>

                {/* Card Content */}
                <div className="px-8 pb-8">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side - Info pills và teachers */}
                    <div className="flex-1 space-y-5">
                      {/* Pill buttons với thiết kế 3D */}
                      <div className="flex flex-wrap gap-2.5">
                        {[
                          { icon: "🎮", label: course.method },
                          { icon: "👥", label: course.classSize },
                          { icon: "📅", label: course.sessions }
                        ].map((item, idx) => (
                          <motion.span
                            key={idx}
                            whileHover={{ y: -2, scale: 1.05 }}
                            className={`group/pill inline-flex items-center gap-2 px-4 py-2 rounded-full 
                                       bg-gradient-to-r ${course.lightGradient} ${course.pillColor.replace('bg-pink-100', '').replace('bg-blue-100', '').replace('bg-purple-100', '').replace('bg-green-100', '')}
                                       text-sm font-bold tracking-wide cursor-default shadow-md hover:shadow-lg transition-all duration-300`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </motion.span>
                        ))}
                      </div>

                      {/* Teachers section với avatar style */}
                      <div className="space-y-3 pt-4 border-t-2 border-dashed border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white text-sm">
                            👩‍🏫
                          </div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đội ngũ giáo viên</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {course.teachers.map((teacher, teacherIndex) => (
                            <motion.div
                              key={teacherIndex}
                              whileHover={{ scale: 1.05 }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg 
                                         bg-gradient-to-r ${course.lightGradient} border ${course.borderColor}`}
                            >
                              <span className="text-sm">⭐</span>
                              <span className="text-gray-700 font-semibold text-sm">{teacher}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Thêm button "Đăng ký ngay" nhỏ */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r ${course.gradient} 
                                   text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300
                                   flex items-center justify-center gap-2`}
                      >
                        <span>🎯</span>
                        <span>Đăng ký ngay</span>
                        <span>→</span>
                      </motion.button>
                    </div>

                    {/* Right side - Illustration với hiệu ứng độc đáo */}
                    <div className="flex-shrink-0 lg:w-80 relative">
                      <div className={`relative w-full h-72 rounded-2xl overflow-hidden 
                                     bg-gradient-to-br ${course.lightGradient} border-2 ${course.borderColor}
                                     shadow-inner`}>
                        {/* Main illustration với animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{
                              y: [0, -15, 0],
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-full h-full scale-110"
                          >
                            <Image 
                              src={course.illustration} 
                              alt={course.title} 
                              width={350} 
                              height={350}
                              className="object-contain w-full h-full drop-shadow-2xl"
                            />
                          </motion.div>
                        </div>
                        
                        {/* Decorative elements */}
                        <motion.div
                          className="absolute top-2 right-2 w-14 h-14 opacity-70"
                          animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        >
                          <Image src="/draw/cloud.png" alt="cloud" width={56} height={56} />
                        </motion.div>
                        
                        <motion.div
                          className="absolute top-4 left-4 w-10 h-10 opacity-80"
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        >
                          <Image src="/draw/sun.png" alt="sun" width={40} height={40} />
                        </motion.div>
                        
                        <motion.div
                          className="absolute bottom-4 right-4 w-10 h-10 opacity-60"
                          animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Image src="/draw/rainbow.png" alt="rainbow" width={40} height={40} />
                        </motion.div>
                        
                        <motion.div
                          className="absolute bottom-4 left-4 w-8 h-8 opacity-70"
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <Image src="/draw/flower.png" alt="flower" width={32} height={32} />
                        </motion.div>

                        {/* Sparkle effects */}
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                            style={{
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                            }}
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.7,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${course.gradient} opacity-0 group-hover:opacity-5 
                                transition-opacity duration-500 pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        @keyframes pulse-scale-sm {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.08); opacity: 0.25; }
        }
        @keyframes pulse-scale-md {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.12); opacity: 0.2; }
        }
        .animate-pulse-scale {
          animation: pulse-scale 6s ease-in-out infinite;
        }
        .animate-pulse-scale-sm {
          animation: pulse-scale-sm 5s ease-in-out infinite;
        }
        .animate-pulse-scale-md {
          animation: pulse-scale-md 7s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
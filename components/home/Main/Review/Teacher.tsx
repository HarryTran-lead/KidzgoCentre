// components/home/Main/Review/Teacher.tsx (CLIENT)
"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, ChevronLeft, ChevronRight, Star, Award, Heart, Sparkles } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Dữ liệu giáo viên mẫu - thêm thông tin kid-friendly
const TEACHERS = [
  {
    id: 1,
    name: "Cô Lily",
    location: "Apollo Phạm Tuấn Tài",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    country: "UK",
    experience: "10+ năm",
    specialty: "Cambridge Starters-Movers",
    color: "from-pink-400 to-purple-400",
  },
  {
    id: 2,
    name: "Cô Sunny",
    location: "Apollo Times City",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    country: "US",
    experience: "8+ năm",
    specialty: "Giao tiếp phản xạ",
    color: "from-yellow-400 to-orange-400",
  },
  {
    id: 3,
    name: "Thầy Tom",
    location: "Apollo Vũ Tông Phan",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    country: "Australia",
    experience: "12+ năm",
    specialty: "Cambridge Flyers",
    color: "from-blue-400 to-green-400",
  },
  {
    id: 4,
    name: "Cô Emma",
    location: "Apollo Phạm Tuấn Tài",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    country: "UK",
    experience: "9+ năm",
    specialty: "IELTS cho trẻ em",
    color: "from-purple-400 to-pink-400",
  },
  {
    id: 5,
    name: "Thầy David",
    location: "Apollo Times City",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    country: "UK",
    experience: "15+ năm",
    specialty: "Tiếng Anh học thuật",
    color: "from-green-400 to-blue-400",
  }
];

const AUTO_MS = 5000;

export default function Teacher() {
  const teachers = useMemo(() => TEACHERS.filter(Boolean), []);
  const [idx, setIdx] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  useEffect(() => {
    if (teachers.length === 0) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % teachers.length), AUTO_MS);
    return () => clearInterval(t);
  }, [teachers.length]);

  if (teachers.length === 0) return null;

  const prev = () => setIdx((p) => (p - 1 + teachers.length) % teachers.length);
  const next = () => setIdx((p) => (p + 1) % teachers.length);

  const getVisibleCards = () => {
    const visible: number[] = [];
    for (let i = 0; i < 4; i++) {
      visible.push((idx + i) % teachers.length);
    }
    return visible;
  };

  return (
    <section 
      id="teachers" 
      className="py-16 pb-0 scroll-mt-24 relative z-30 overflow-hidden"
      style={{ 
        backgroundImage: 'url(/image/background1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Overlay để đảm bảo nội dung dễ đọc */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none z-0"></div>

      {/* Mouse follow gradient */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-pink-200/20 via-yellow-200/20 to-blue-200/20 blur-3xl pointer-events-none"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* Floating Stickers từ thư mục draw/ */}
      {/* Book sticker - Top left */}
      <motion.img
        src="/draw/book.png"
        alt="Book"
        className="absolute top-20 left-10 w-56 h-56 md:w-72 md:h-72 pointer-events-none z-20"
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{
          opacity: 1,
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0],
          y: [0, -20, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.5 },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Sun sticker - Top right */}
      <motion.img
        src="/draw/sun.png"
        alt="Sun"
        className="absolute top-16 right-8 w-60 h-60 md:w-80 md:h-80 pointer-events-none z-20"
        initial={{ opacity: 0, scale: 0, rotate: 180 }}
        animate={{
          opacity: 1,
          scale: [1, 1.15, 1],
          rotate: [0, 360],
          x: [0, 10, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.7 },
          scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Rainbow sticker - Middle left */}
      <motion.img
        src="/draw/rainbow.png"
        alt="Rainbow"
        className="absolute top-1/2 left-4 w-52 h-52 md:w-68 md:h-68 pointer-events-none z-20"
        initial={{ opacity: 0, scale: 0, x: -100 }}
        animate={{
          opacity: 1,
          scale: [1, 1.1, 1],
          x: [0, 15, 0],
          y: [0, -15, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.9 },
          scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Flower sticker - Middle right */}
      <motion.img
        src="/draw/flower.png"
        alt="Flower"
        className="absolute top-1/2 right-6 w-56 h-56 md:w-72 md:h-72 pointer-events-none z-20"
        initial={{ opacity: 0, scale: 0, rotate: -90 }}
        animate={{
          opacity: 1,
          scale: [1, 1.12, 1],
          rotate: [0, 15, -15, 0],
          y: [0, -18, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 1.1 },
          scale: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Cloud sticker - Bottom left */}
      <motion.img
        src="/draw/cloud.png"
        alt="Cloud"
        className="absolute bottom-20 left-12 w-56 h-56 md:w-72 md:h-72 pointer-events-none z-20"
        initial={{ opacity: 0, scale: 0, x: -50 }}
        animate={{
          opacity: 1,
          scale: [1, 1.08, 1],
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 1.3 },
          scale: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Pencil sticker - Bottom right */}
      <motion.img
        src="/draw/pencil.png"
        alt="Pencil"
        className="absolute bottom-16 right-10 w-60 h-60 md:w-80 md:h-80 pointer-events-none z-20"
        initial={{ opacity: 0, scale: 0, rotate: 90 }}
        animate={{
          opacity: 1,
          scale: [1, 1.1, 1],
          rotate: [0, -20, 20, 0],
          y: [0, -12, 0],
        }}
        transition={{
          opacity: { duration: 0.8, delay: 1.5 },
          scale: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 2.7, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header với hình ảnh dễ thương */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h3 
            className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r p-2 from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent text-center mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Thầy Cô Siêu Vui Tính!
          </motion.h3>
          
          <motion.p 
            className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto mb-6 font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Gặp gỡ các thầy cô bản ngữ yêu trẻ con nhất!
          </motion.p>
          
          
        </motion.div>

        {/* Main cards container */}
        <motion.div 
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Left Arrow - Cute design */}
          <motion.button
            onClick={prev}
            className="absolute left-2 sm:left-4 z-30 p-4 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 shadow-xl hover:shadow-2xl transition-all"
            aria-label="Previous"
            whileHover={{ scale: 1.2, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              x: [0, -5, 0],
            }}
            transition={{
              x: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </motion.button>

          {/* Cards Container */}
          <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden px-12 sm:px-16 lg:px-20">
            <div className="flex items-center justify-center gap-6 sm:gap-8 lg:gap-10">
              {getVisibleCards().map((teacherIndex, displayIndex) => {
                const teacher = teachers[teacherIndex];
                
                return (
                  <motion.div
                    key={`${teacher.id}-${idx}`}
                    className="relative w-[250px] h-[450px] overflow-visible flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      y: 0,
                      rotate: displayIndex === 0 ? 0 : displayIndex === 3 ? 0 : displayIndex === 1 ? -3 : 3,
                    }}
                    transition={{ 
                      duration: 0.5, 
                      delay: displayIndex * 0.1, 
                      ease: "backOut" 
                    }}
                    whileHover={{ 
                      scale: 1.08, 
                      y: -20,
                      rotate: 0,
                      transition: { duration: 0.3 }
                    }}
                  >
                    {/* Card with cute shape */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${teacher.color} rounded-[40px] shadow-2xl`} />
                    
                    {/* Card border with pattern */}
                    <div className="absolute -inset-2 rounded-[44px] bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-30" />
                    
                    
                    {/* Main card content */}
                    <div className="relative w-full h-full rounded-[40px] overflow-hidden border-4 border-white">
                      {/* Teacher image with cute frame */}
                      <div className="relative h-48 overflow-hidden">
                        <motion.img
                          src={teacher.image}
                          alt={teacher.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        />
                        {/* Cute overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        
                        {/* Love button */}
                        <motion.button
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                        </motion.button>
                      </div>
                      
                      {/* Card content */}
                      <div className="p-6 bg-gradient-to-b from-white via-white/95 to-white/90">
                        {/* Teacher name with cute badge */}
                        <div className="mb-3">
                          <h4 className="text-2xl font-black text-gray-800">{teacher.name}</h4>
                        </div>
                        
                        {/* Location with cute icon */}
                        <div className="mb-4">
                          <p className="text-gray-700 font-medium">{teacher.location}</p>
                        </div>
                        
                        {/* Country & Experience */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full text-sm font-bold text-gray-800 border border-pink-300">
                            {teacher.country}
                          </span>
                          <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full text-sm font-bold text-gray-800 border border-yellow-300 flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            {teacher.experience}
                          </span>
                        </div>
                        
                        {/* Achievement badge */}
                        <motion.div
                          className="mb-4"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <Award className="w-5 h-5 text-white" />
                            <span className="text-white font-bold">{teacher.achievement}</span>
                          </div>
                        </motion.div>
                        
                        {/* Specialty */}
                        <div className="text-center">
                          <p className="text-gray-800 font-bold text-sm bg-gradient-to-r from-pink-50 to-purple-50 py-2 rounded-lg border border-pink-200">
                            Chuyên: {teacher.specialty}
                          </p>
                        </div>
                      </div>
                      
                      {/* Cute bottom decoration */}
                      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-b-[36px]" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow - Cute design */}
          <motion.button
            onClick={next}
            className="absolute right-2 sm:right-4 z-30 p-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-xl hover:shadow-2xl transition-all"
            aria-label="Next"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              x: [0, 5, 0],
            }}
            transition={{
              x: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.button>
        </motion.div>

        {/* Cute navigation dots */}
        <motion.div 
          className="flex items-center justify-center gap-3 mt-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {teachers.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIdx(i)}
              className={`text-3xl transition-all duration-300 ${
                i === idx
                  ? "scale-125"
                  : "opacity-50 hover:opacity-100 hover:scale-110"
              }`}
              aria-label={`Go to teacher ${i + 1}`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              animate={
                i === idx ? {
                  y: [0, -10, 0],
                  rotate: [0, 360],
                } : {}
              }
              transition={
                i === idx ? {
                  y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" }
                } : {}
              }
            >
              <div className={`w-3 h-3 rounded-full transition-all ${
                i === idx ? 'bg-amber-600 w-8' : 'bg-amber-300/60'
              }`} />
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
// components/home/Main/Review/Teacher.tsx (CLIENT)
"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, ChevronLeft, ChevronRight, Star, Award } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Dữ liệu giáo viên mẫu
const TEACHERS = [
  {
    id: 1,
    name: "Cô Lily",
    location: "Apollo Phạm Tuấn Tài",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    country: "UK",
    experience: "10+ năm",
    specialty: "Cambridge Starters-Movers"
  },
  {
    id: 2,
    name: "Cô Sunny",
    location: "Apollo Times City",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    country: "US",
    experience: "8+ năm",
    specialty: "Giao tiếp phản xạ"
  },
  {
    id: 3,
    name: "Thầy Tom",
    location: "Apollo Vũ Tông Phan",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    country: "Australia",
    experience: "12+ năm",
    specialty: "Cambridge Flyers"
  },
  {
    id: 4,
    name: "Cô Emma",
    location: "Apollo Phạm Tuấn Tài",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    country: "UK",
    experience: "9+ năm",
    specialty: "IELTS cho trẻ em"
  },
  {
    id: 5,
    name: "Thầy David",
    location: "Apollo Times City",
    achievement: "15/15 Khiên Movers",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    country: "UK",
    experience: "15+ năm",
    specialty: "Tiếng Anh học thuật"
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

  // Tính toán vị trí các cards (hiển thị 4 cards cùng lúc)
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
      className="py-20 pb-0 scroll-mt-24 relative z-30 overflow-hidden"
      style={{ backgroundColor: '#fefbe8' }}
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-200/20 to-amber-200/10 rounded-full"
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
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-amber-200/20 to-yellow-200/10 rounded-full"
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
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300/40 rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 10) % 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Mouse follow gradient */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-yellow-200/10 via-amber-200/10 to-yellow-200/10 blur-3xl pointer-events-none"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with animations */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h3 
            className="text-3xl md:text-4xl lg:text-5xl font-black flex items-center justify-center gap-3 text-gray-800 mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-amber-600" />
            </motion.div>
            Đội Ngũ Giáo Viên
          </motion.h3>
          <motion.p 
            className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Giáo viên bản ngữ giàu kinh nghiệm, tận tâm với từng học viên
          </motion.p>
        </motion.div>

        <motion.div 
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Arrows */}
          <motion.button
            onClick={prev}
            className="absolute left-2 sm:left-4 z-30 p-3 sm:p-4 rounded-full bg-white/90 shadow-lg hover:shadow-xl transition border-2 border-amber-200"
            aria-label="Previous"
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </motion.button>

          {/* Cards Container - Hiển thị 4 cards cùng lúc */}
          <div className="relative w-full h-[450px] sm:h-[480px] flex items-center justify-center overflow-hidden px-12 sm:px-16 lg:px-20">
            <div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-5">
              {getVisibleCards().map((teacherIndex, displayIndex) => {
                const teacher = teachers[teacherIndex];
                
                return (
                  <motion.div
                    key={`${teacher.id}-${idx}`}
                    className="relative w-[220px] sm:w-[240px] lg:w-[260px] h-[420px] sm:h-[450px] overflow-hidden rounded-[28px] shadow-1xl bg-white flex-shrink-0 border border-gray-100/50"
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{ duration: 0.5, delay: displayIndex * 0.1, ease: [0.25, 0.9, 0.3, 1] }}
                    whileHover={{ 
                      scale: 1.03, 
                      y: -8,
                      transition: { duration: 0.3 },
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}
                  >
                  {/* Decorative top border */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 z-10" />
                  
                  {/* Teacher Image */}
                  <div className="relative w-full h-[250px] sm:h-[280px] overflow-hidden">
                    <motion.img
                      src={teacher.image}
                      alt={teacher.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.08, transition: { duration: 0.6 } }}
                    />
                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-amber-500/10" />
                    
                    {/* Country Badge - Enhanced */}
                    <motion.div 
                      className="absolute top-4 right-4 px-4 py-2 bg-white/95 backdrop-blur-md rounded-full text-xs font-bold text-gray-800 shadow-xl border border-gray-200/50"
                      whileHover={{ scale: 1.1 }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {teacher.country}
                      </span>
                    </motion.div>
                    
                    {/* Experience Badge - Enhanced */}
                    <motion.div 
                      className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-xl flex items-center gap-1.5 border border-amber-400/30"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      {teacher.experience}
                    </motion.div>
                  </div>

                  {/* Card Content - Enhanced */}
                  <div className="p-4 sm:p-5 bg-gradient-to-b from-white to-gray-50/50 flex flex-col flex-1">
                    {/* Achievement Button - Enhanced */}
                    <motion.div
                      className="w-full mb-3"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Award className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">{teacher.achievement}</span>
                      </button>
                    </motion.div>

                    {/* Teacher Name - Enhanced */}
                    <h4 className="text-lg sm:text-xl font-black text-gray-900 mb-2 text-center">
                      {teacher.name}
                    </h4>

                    {/* Location - Enhanced */}
                    <div className="mb-3">
                      <p className="text-gray-700 text-xs sm:text-sm text-center font-semibold leading-snug line-clamp-2">
                        {teacher.location}
                      </p>
                    </div>

                   
                  </div>

                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-[28px] pointer-events-none opacity-0"
                    whileHover={{ opacity: 1 }}
                    style={{
                      background: "radial-gradient(circle at center, rgba(251, 191, 36, 0.1) 0%, transparent 70%)"
                    }}
                  />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.button
            onClick={next}
            className="absolute right-2 sm:right-4 z-30 p-3 sm:p-4 rounded-full bg-white/90 shadow-lg hover:shadow-xl transition border-2 border-amber-200"
            aria-label="Next"
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </motion.button>
        </motion.div>

        {/* Dots */}
        <motion.div 
          className="flex items-center justify-center gap-2 mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {teachers.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-3 rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-8 bg-amber-600 shadow-lg"
                  : "w-3 bg-amber-300/60 hover:bg-amber-400/80"
              }`}
              aria-label={`Go to teacher ${i + 1}`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: i === idx ? [1, 1.1, 1] : 1,
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          ))}
        </motion.div>
      </div>

      
    </section>
  );
}


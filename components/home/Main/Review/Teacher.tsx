// components/home/Main/Review/Teacher.tsx (CLIENT)
"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Dữ liệu giáo viên
const TEACHERS = [
  {
    id: "1",
    name: "Cô Lily",
    role: "Cambridge Starters-Movers",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 10+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Phạm Tuấn Tài",
  },
  {
    id: "2",
    name: "Cô Sunny",
    role: "Giao tiếp phản xạ",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    bio: "🇺🇸 US • 8+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Times City",
  },
  {
    id: "3",
    name: "Thầy Tom",
    role: "Cambridge Flyers",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    bio: "🇦🇺 Australia • 12+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Vũ Tông Phan",
  },
  {
    id: "4",
    name: "Cô Emma",
    role: "IELTS cho trẻ em",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 9+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Phạm Tuấn Tài",
  },
  {
    id: "5",
    name: "Thầy David",
    role: "Tiếng Anh học thuật",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 15+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Times City",
  }
];

const AUTO_MS = 5000;

export default function Teacher() {
  const teachers = useMemo(() => TEACHERS.filter(Boolean), []);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const titleRef = useRef<HTMLDivElement>(null);

  // Intersection Observer cho title header
  useEffect(() => {
    const titleObserverOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };

    const titleObserverCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsTitleVisible(true);
        }
      });
    };

    const titleObserver = new IntersectionObserver(titleObserverCallback, titleObserverOptions);

    if (titleRef.current) {
      titleObserver.observe(titleRef.current);
    }

    return () => {
      titleObserver.disconnect();
    };
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (teachers.length === 0) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % teachers.length), AUTO_MS);
    return () => clearInterval(t);
  }, [teachers.length]);

  if (teachers.length === 0) return null;

  const prev = () => setIdx((p) => (p - 1 + teachers.length) % teachers.length);
  const next = () => setIdx((p) => (p + 1) % teachers.length);

  const getPos = (i: number) => {
    const n = teachers.length;
    const rel = (i - idx + n) % n;
    if (rel === 0) return "center";
    if (rel === 1) return "right";
    if (rel === n - 1) return "left";
    return "hidden";
  };

  const cardStyles = {
    center: {
      scale: 1,
      x: 0,
      zIndex: 30,
      opacity: 1,
      filter: "blur(0px)",
    },
    left: {
      scale: 0.8,
      x: -360,
      zIndex: 20,
      opacity: 0.85,
      filter: "blur(1px)",
    },
    right: {
      scale: 0.8,
      x: 360,
      zIndex: 20,
      opacity: 0.85,
      filter: "blur(1px)",
    },
    hidden: {
      scale: 0.7,
      x: 0,
      zIndex: 10,
      opacity: 0,
      filter: "blur(6px)",
    },
  } as const;

  return (
    <section 
      id="teachers" 
      className="teacher-page py-16 pb-0 scroll-mt-24 relative z-30 overflow-hidden bg-white"
      style={{ 
        backgroundImage: 'url(/image/background1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/50 to-transparent pointer-events-none z-0"></div>

      {/* Animated gradient shadow - Using CSS animations for better performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-red-300 to-red-400 rounded-full mix-blend-multiply blur-3xl opacity-35 animate-pulse-scale"
        />
        <div 
          className="absolute bottom-32 right-10 w-96 h-96 bg-gradient-to-tr from-red-400 to-rose-300 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse-scale-sm"
        />
        <div 
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-red-400 to-red-300 rounded-full mix-blend-multiply blur-3xl opacity-25 animate-pulse-scale-md"
        />
      </div>

      {/* Title Section */}
      <div ref={titleRef} className="relative z-10 text-center mb-0">
        <h1 className={`text-4xl md:text-5xl font-black drop-shadow-lg mb-2 transition-all duration-1000 ${
          isTitleVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}>
          <span className="text-black">Thầy Cô</span> <span className="text-red-600">Siêu Vui Tính</span>
        </h1>
        <p className={`text-lg text-gray-700 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${
          isTitleVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10'
        }`}>
          Đội ngũ giáo viên giàu kinh nghiệm và đam mê giáo dục
        </p>
      </div>

      {/* Team Carousel */}
      <div className="mx-auto max-w-6xl px-6 relative z-10 mt-10">
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
            className="absolute left-0 sm:-left-20 z-30 p-2 sm:p-3 rounded-full bg-red-600/90 shadow-md hover:shadow-lg transition cursor-pointer"
            aria-label="Previous"
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </motion.button>

          <div className="relative w-full max-w-6xl h-[400px] sm:h-[440px] lg:h-[500px] flex items-center justify-center">
            {teachers.map((teacher, i) => {
              const pos = getPos(i);
              const style = cardStyles[pos];
              return (
                <motion.div
                  key={teacher.id}
                  className="absolute w-[300px] sm:w-[380px] lg:w-[420px] h-[360px] sm:h-[420px] lg:h-[480px] overflow-hidden rounded-[32px] shadow-xl"
                  animate={style}
                  transition={{ duration: 0.6, ease: [0.25, 0.9, 0.3, 1] }}
                  style={{ pointerEvents: pos === "center" ? "auto" : "none" }}
                  whileHover={pos === "center" ? { scale: 1.05, transition: { duration: 0.3 } } : {}}
                >
                  <motion.img
                    src={teacher.image}
                    alt={teacher.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    initial={{ scale: 1 }}
                    whileHover={pos === "center" ? { scale: 1.1, transition: { duration: 0.5 } } : {}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Info Overlay */}
                  {pos === "center" && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h3 className="text-xl sm:text-2xl font-bold mb-1">{teacher.name}</h3>
                      <p className="text-sm sm:text-base text-red-300 font-semibold mb-2">{teacher.role}</p>
                      <p className="text-xs sm:text-sm text-white/80 whitespace-pre-line">{teacher.bio}</p>
                    </motion.div>
                  )}

                  {pos === "center" && (
                    <motion.div
                      className="absolute inset-0 border-2 border-red-300/60 rounded-[32px]"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.button
            onClick={next}
            className="absolute right-0 sm:-right-20 z-30 p-2 sm:p-3 rounded-full bg-red-600/90 shadow-md hover:shadow-lg transition cursor-pointer"
            aria-label="Next"
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === idx
                  ? "w-6 bg-red-600 shadow-lg"
                  : "w-2 bg-gray-300 hover:bg-red-300/60"
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
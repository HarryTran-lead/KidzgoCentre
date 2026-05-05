// components/sections/Gallery.tsx  (CLIENT)
"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import ngoisaoIcon from "@/public/image/ngoisao.png";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { GALLERY } from "@/lib/data/data";
import "@/styles/animations.css";

const AUTO_MS = 4000;

export default function Gallery() {
  const images = useMemo(() => GALLERY.filter(Boolean), []);
  const [idx, setIdx] = useState(0);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [showMouseGradient, setShowMouseGradient] = useState(false);
  
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setShowMouseGradient(true);
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (images.length === 0) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % images.length), AUTO_MS);
    return () => clearInterval(t);
  }, [images.length]);

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

  if (images.length === 0) return null;

  const prev = () => setIdx((p) => (p - 1 + images.length) % images.length);
  const next = () => setIdx((p) => (p + 1) % images.length);

  const getPos = (i: number) => {
    const n = images.length;
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
      id="gallery" 
      className="gallery-page py-20 pb-0 scroll-mt-24  bg-[#8ED462] relative z-30 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient orbs - Using CSS animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-white/5 rounded-full animate-float-up-down"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-white/5 rounded-full animate-float-down-up"
        />
      </div>

      {/* Floating particles - Reduced from 20 to 8 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float-particle"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 13) % 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Mouse follow gradient - Optional for better performance */}
      {showMouseGradient && (
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-white/5 via-white/5 to-white/5 blur-3xl pointer-events-none"
          style={{
            x: springX,
            y: springY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
      )}

      <div className="mx-auto max-w-6xl px-6 relative z-10">
        {/* Header */}
        <div ref={titleRef} className="text-center mb-10 relative">
          <h2 className={`text-4xl md:text-5xl font-black relative mb-4 transition-all duration-1000 ${
            isTitleVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            <span className="text-white drop-shadow-lg">
              Lớp học & CLB{" "}
              <span className="bg-linear-to-r from-red-600 via-red-500 to-rose-600 bg-clip-text text-transparent relative inline-block p-2">
                Tiếng Anh Rex
                <img src={ngoisaoIcon.src} alt="star" className="absolute -top-2 -right-4 w-4 h-4 animate-spin" />
              </span>
            </span>
          </h2>
          
          <p className={`text-lg text-white/90 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${
            isTitleVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            Khoảnh khắc học tập – vui chơi – ngoại khóa.
          </p>
        </div>

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
            {images.map((src, i) => {
              const pos = getPos(i);
              const style = cardStyles[pos];
              return (
                <motion.div
                  key={src}
                  className="absolute w-[300px] sm:w-[380px] lg:w-[620px] h-[220px] sm:h-[280px] lg:h-[340px] overflow-hidden rounded-[32px] shadow-xl"
                  animate={style}
                  transition={{ duration: 0.6, ease: [0.25, 0.9, 0.3, 1] }}
                  style={{ pointerEvents: pos === "center" ? "auto" : "none" }}
                  whileHover={pos === "center" ? { scale: 1.05, transition: { duration: 0.3 } } : {}}
                >
                  <motion.img
                    src={src}
                    alt={`Rex gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    initial={{ scale: 1 }}
                    whileHover={pos === "center" ? { scale: 1.1, transition: { duration: 0.5 } } : {}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
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
          className="flex items-center justify-center gap-2 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {images.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === idx
                  ? "w-6 bg-red-600 shadow-lg"
                  : "w-2 bg-white hover:bg-red-300/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
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

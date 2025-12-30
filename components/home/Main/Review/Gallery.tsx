// components/sections/Gallery.tsx  (CLIENT)
"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { GALLERY } from "@/lib/data/data";

const AUTO_MS = 4000;

export default function Gallery() {
  const images = useMemo(() => GALLERY.filter(Boolean), []);
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
    if (images.length === 0) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % images.length), AUTO_MS);
    return () => clearInterval(t);
  }, [images.length]);

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
      className="py-20 pb-0 scroll-mt-24 bg-[#8ED462] relative z-30 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-white/5 rounded-full"
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
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-white/10 to-white/5 rounded-full"
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
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 10) % 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.8, 0.2],
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
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-white/5 via-white/5 to-white/5 blur-3xl pointer-events-none"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 relative z-10">
        {/* Header with animations */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <motion.h3 
              className="text-3xl font-black flex items-center gap-2 text-white"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <ImageIcon className="w-6 h-6 text-white" />
              </motion.div>
              Lớp học & CLB Tiếng Anh KidzGo
            </motion.h3>
            <motion.p 
              className="text-white/90"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Khoảnh khắc học tập – vui chơi – ngoại khóa.
            </motion.p>
          </div>
          <motion.div 
            className="hidden sm:flex items-center gap-2 text-sm text-white/80"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.span 
              className="h-2 w-2 rounded-full bg-white inline-block"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span>
              {idx + 1}/{images.length}
            </span>
          </motion.div>
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
            className="absolute left-0 sm:-left-8 z-30 p-2 sm:p-3 rounded-full bg-white/90 shadow-md hover:shadow-lg transition"
            aria-label="Previous"
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
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
                    alt={`KidzGo gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    initial={{ scale: 1 }}
                    whileHover={pos === "center" ? { scale: 1.1, transition: { duration: 0.5 } } : {}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                  {pos === "center" && (
                    <motion.div
                      className="absolute inset-0 border-2 border-white/20 rounded-[32px]"
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
            className="absolute right-0 sm:-right-8 z-30 p-2 sm:p-3 rounded-full bg-white/90 shadow-md hover:shadow-lg transition"
            aria-label="Next"
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          </motion.button>
        </motion.div>

        {/* Dots */}
        <motion.div 
          className="flex items-center justify-center gap-2 mt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {images.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-6 bg-white shadow-lg"
                  : "w-2 bg-white/40 hover:bg-white/60"
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

      {/* Wave shape bottom decoration - matching Programs.tsx background colors */}
      <div className="relative w-full overflow-hidden" style={{ marginBottom: '0', lineHeight: 0 }}>
        <svg 
          viewBox="0 0 1440 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
          style={{ display: 'block', verticalAlign: 'bottom' }}
        >
          {/* Smooth wave with color #fefbe8 */}
          <path 
            d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z" 
            fill="#fefbe8"
            stroke="none"
            style={{ shapeRendering: 'geometricPrecision' }}
          />
        </svg>
      </div>
    </section>
  );
}

// components/sections/Gallery.tsx  (CLIENT)
"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { GALLERY } from "@/lib/data/data";

const AUTO_MS = 4000;

export default function Gallery() {
  const images = useMemo(() => GALLERY.filter(Boolean), []);
  const [idx, setIdx] = useState(0);

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
    <section id="gallery" className="py-20 scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-rose-600" /> Lớp học & CLB Tiếng Anh KidzGo
            </h3>
            <p className="text-slate-600">Khoảnh khắc học tập – vui chơi – ngoại khóa.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 inline-block" />
            <span>
              {idx + 1}/{images.length}
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 sm:-left-8 z-30 p-2 sm:p-3 rounded-full bg-white/90 shadow-md hover:shadow-lg transition"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          </button>

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
                >
                  <img
                    src={src}
                    alt={`KidzGo gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                </motion.div>
              );
            })}
          </div>

          <button
            onClick={next}
            className="absolute right-0 sm:-right-8 z-30 p-2 sm:p-3 rounded-full bg-white/90 shadow-md hover:shadow-lg transition"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-6 bg-gradient-to-r from-pink-500 to-rose-500 shadow"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { TESTIMONIALS, GALLERY } from "@/lib/data/data";
import { Star, ChevronLeft, ChevronRight, Quote, Award, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AUTO_MS = 6000;

export default function Testimonials() {
  const slides = useMemo(
    () =>
      TESTIMONIALS.map((t, i) => ({
        ...t,
        avatar: GALLERY[i % GALLERY.length] || "/image/Banner6.JPG",
      })),
    []
  );

  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  useEffect(() => {
    if (slides.length === 0) return;
    const t = setInterval(() => {
      setDirection(1);
      setIdx((p) => (p + 1) % slides.length);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const navigate = (newIdx: number) => {
    setDirection(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
  };

  const prev = () => navigate((idx - 1 + slides.length) % slides.length);
  const next = () => navigate((idx + 1) % slides.length);

  const slide = slides[idx];

  // Gradient backgrounds for each testimonial
  const gradients = [
    "from-indigo-500 via-purple-500 to-pink-500",
    "from-amber-500 via-orange-500 to-rose-500",
    "from-emerald-500 via-teal-500 to-cyan-500",
    "from-rose-500 via-pink-500 to-purple-500",
    "from-blue-500 via-indigo-500 to-violet-500",
  ];

  return (
    <section className="py-24 md:py-32 scroll-mt-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-linear-to-b from-white via-rose-50/30 to-white -z-10"></div>
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header with modern design */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
              <div className="absolute inset-0 bg-pink-500/20 blur-sm"></div>
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Phản hồi từ học viên
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Cảm nhận thực tế từ{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                  phụ huynh & học viên
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-amber-500/20 blur-xl -z-10"></span>
              </span>
            </span>
          </h2>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Không chỉ là điểm số, mà còn là sự thay đổi trong tư duy và niềm yêu thích tiếng Anh
          </p>
        </div>

        {/* Main testimonial slider */}
        <div className="relative">
          {/* Large background quote */}
          <div className="absolute -top-10 -left-10 text-[300px] opacity-5 text-pink-500 -z-10 select-none">
            <Quote className="w-full h-full" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="relative">
              {/* Floating decorative elements */}
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-linear-to-br from-pink-500/10 to-rose-500/10 rounded-2xl blur-xl"></div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
              
              <div className="relative backdrop-blur-sm bg-white/60 rounded-3xl border border-white/50 shadow-2xl p-8 md:p-10">
                {/* Quote icon */}
                <div className="absolute -top-4 -left-4 w-16 h-16 rounded-2xl bg-linear-to-br from-pink-500 to-rose-500 grid place-items-center shadow-xl">
                  <Quote className="w-8 h-8 text-white" />
                </div>
                
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={slide.name}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction * -50 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    {/* Rating stars */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="relative">
                          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 blur-sm opacity-50"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quote text */}
                    <div className="relative">
                      <p className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed">
                        "{slide.quote}"
                      </p>
                      <div className="absolute -bottom-4 -right-4 text-8xl text-pink-500/20">"</div>
                    </div>
                    
                    {/* Student info */}
                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{slide.name}</h3>
                          <p className="text-gray-600">{slide.score}</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200/50">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-700">Thành tích xuất sắc</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Avatar and navigation */}
            <div className="relative">
              {/* Avatar card */}
              <div className="relative group">
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${gradients[idx % gradients.length]} blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
                
                {/* Main avatar image */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/50 shadow-2xl bg-linear-to-br from-white to-gray-50">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={slide.avatar}
                      src={slide.avatar}
                      alt={slide.name}
                      className="w-full h-[400px] object-cover"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                  </AnimatePresence>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  {/* Current index badge */}
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg grid place-items-center">
                    <span className="text-xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      {idx + 1}
                    </span>
                  </div>
                </div>
                
                {/* Navigation controls */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={prev}
                    className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 grid place-items-center group/nav"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 group-hover/nav:text-pink-600 transition-colors" />
                  </button>
                  
                  {/* Thumbnails */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg">
                    {slides.map((s, i) => {
                      const active = i === idx;
                      return (
                        <button
                          key={s.name}
                          onClick={() => navigate(i)}
                          className={`relative w-8 h-8 rounded-full transition-all duration-300 ${
                            active 
                              ? 'scale-125 ring-2 ring-pink-500 ring-offset-2' 
                              : 'hover:scale-110'
                          }`}
                          aria-label={`Chọn ${s.name}`}
                        >
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                          />
                          {active && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={next}
                    className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 grid place-items-center group/nav"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover/nav:text-pink-600 transition-colors" />
                  </button>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-full blur-xl -z-10"></div>
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-linear-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl -z-10"></div>
            </div>
          </div>

          
        </div>
      </div>
    </section>
  );
}
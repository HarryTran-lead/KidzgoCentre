"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { TESTIMONIALS, GALLERY } from "@/lib/data/data";
import { Star, ChevronLeft, ChevronRight, Quote, Award, Sparkles, Heart, MessageCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ACCENT_TEXT } from "@/lib/theme/theme";

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
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  useEffect(() => {
    if (slides.length === 0 || isHovered) return;
    const t = setInterval(() => {
      setDirection(1);
      setIdx((p) => (p + 1) % slides.length);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [slides.length, isHovered]);

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

  if (slides.length === 0) return null;

  const navigate = (newIdx: number) => {
    setDirection(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
  };

  const prev = () => navigate((idx - 1 + slides.length) % slides.length);
  const next = () => navigate((idx + 1) % slides.length);

  const slide = slides[idx];

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const gradients = [
    "from-pink-500 via-rose-500 to-amber-500",
    "from-emerald-500 via-teal-500 to-cyan-500",
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-blue-500 via-indigo-500 to-violet-500",
    "from-amber-500 via-orange-500 to-rose-500",
  ];

  return (
    <section
      className="pt-20 md:pt-28 pb-32 md:pb-40 scroll-mt-24 relative overflow-hidden bg-[#8ED462] z-30 mt-[-10px]"
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-full"
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
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full"
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
      <div className="absolute inset-0 overflow-hidden">
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
        className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-amber-500/5 blur-3xl pointer-events-none"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={titleRef} className="text-center mb-20 relative">
          <h2 className={`text-4xl md:text-5xl font-black relative mb-4 transition-all duration-1000 ${
            isTitleVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            <span className="text-white drop-shadow-lg">
              Câu chuyện{" "}
              <span className={`${ACCENT_TEXT} relative inline-block p-2`}>
                thành công
                <Star className="absolute -top-2 -right-4 w-4 h-4 text-yellow-500 animate-spin" />
              </span>
            </span>
          </h2>
          
          <p className={`text-lg text-white/90 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${
            isTitleVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            Hàng nghìn phụ huynh đã tin tưởng và chứng kiến sự tiến bộ vượt bậc của con em
          </p>
        </div>

        {/* Main testimonial slider */}
        <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          {/* Background decorative elements */}
          <div className="absolute -top-20 -left-20 text-[400px] opacity-[0.03] text-white select-none">
            <Quote className="w-full h-full" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              {/* Card glow effect */}
              <div className={`absolute -inset-4 bg-gradient-to-r ${gradients[idx % gradients.length]} rounded-3xl opacity-20 blur-2xl -z-10`} />

              <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/30 shadow-2xl p-8 md:p-10 overflow-hidden group">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[url('/image/pattern.svg')] bg-repeat bg-[length:100px_100px]"></div>
                </div>


                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={slide.name}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: direction * -60, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="space-y-8 relative z-10"
                  >
                    {/* Rating with animation */}
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.1 }}
                            className="relative"
                          >
                            <Star className="w-7 h-7 text-amber-300 fill-amber-300" />
                            <motion.div
                              className="absolute inset-0 bg-amber-300 blur-md"
                              animate={{ opacity: [0.3, 0.8, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          </motion.div>
                        ))}
                      </div>
                      <motion.div
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-sm font-semibold text-white">5.0/5.0</span>
                      </motion.div>
                    </div>

                    {/* Quote text with gradient highlight */}
                    <div className="relative">
                      <motion.p
                        className="text-2xl md:text-3xl lg:text-4xl font-medium text-white leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <span className="bg-gradient-to-r from-white via-white/90 to-white bg-clip-text text-transparent">
                          "{slide.quote}"
                        </span>
                      </motion.p>
                      <motion.div
                        className="absolute -bottom-8 -right-8 text-9xl text-white/10"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        "
                      </motion.div>
                    </div>

                    {/* Student info with badges */}
                    <motion.div
                      className="pt-8 border-t border-white/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-white">{slide.name}</h3>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-2 h-2 rounded-full bg-emerald-400"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-emerald-300" />
                            <p className="text-lg text-white/80">{slide.score}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* Corner accents */}
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-white/20 rounded-tr-3xl"
                  animate={{ borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-white/20 rounded-bl-3xl"
                  animate={{ borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                />
              </div>
            </motion.div>

            {/* Right: Avatar Gallery */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Main avatar card */}
              <div className="relative group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                {/* Glow ring */}
                <motion.div
                  className={`absolute -inset-6 rounded-3xl bg-gradient-to-r ${gradients[idx % gradients.length]} opacity-30 blur-xl`}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Avatar container */}
                <div className="relative rounded-3xl overflow-hidden border-4 border-white/40 shadow-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.avatar}
                      className="relative"
                      initial={{ opacity: 0, filter: "blur(10px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(10px)" }}
                      transition={{ duration: 0.6 }}
                    >
                      <img
                        src={slide.avatar}
                        alt={slide.name}
                        className="w-full h-[500px] object-cover"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Progress indicator */}
                      <div className="absolute top-6 left-6 flex items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg grid place-items-center">
                          <span className="text-xl font-black text-white">{idx + 1}</span>
                        </div>
                        <div className="text-white">
                          <div className="text-sm opacity-80">Testimonial</div>
                          <div className="text-lg font-bold">{slide.name.split(' ')[0]}</div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation controls */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                  <motion.button
                    onClick={prev}
                    className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 grid place-items-center group/nav"
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeft className="w-6 h-6 text-white group-hover/nav:text-amber-300 transition-colors" />
                  </motion.button>

                  {/* Thumbnail carousel */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                    {slides.map((s, i) => {
                      const active = i === idx;
                      return (
                        <motion.button
                          key={s.name}
                          onClick={() => navigate(i)}
                          className="relative"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            active 
                              ? 'border-white scale-110' 
                              : 'border-white/30 hover:border-white/60'
                          }`}>
                            <img
                              src={s.avatar}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                            {active && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-rose-500/30"
                                layoutId="activeThumb"
                              />
                            )}
                          </div>
                          {active && (
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    onClick={next}
                    className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 grid place-items-center group/nav"
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight className="w-6 h-6 text-white group-hover/nav:text-amber-300 transition-colors" />
                  </motion.button>
                </div>
              </div>

              
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
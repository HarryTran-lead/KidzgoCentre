"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, UsersRound } from "lucide-react";

// Dữ liệu giáo viên
const TEACHERS = [
  {
    id: "1",
    name: "Cô Lily",
    role: "Cambridge Starters-Movers",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 10+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Phạm Tuấn Tài",
  },
  {
    id: "2",
    name: "Cô Sunny",
    role: "Giao tiếp phản xạ",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    bio: "🇺🇸 US • 8+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Times City",
  },
  {
    id: "3",
    name: "Thầy Tom",
    role: "Cambridge Flyers",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    bio: "🇦🇺 Australia • 12+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Vũ Tông Phan",
  },
  {
    id: "4",
    name: "Cô Emma",
    role: "IELTS cho trẻ em",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 9+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Phạm Tuấn Tài",
  },
  {
    id: "5",
    name: "Thầy David",
    role: "Tiếng Anh học thuật",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "🇬🇧 UK • 15+ năm kinh nghiệm\n⭐ 15/15 Khiên Movers\n📍 Apollo Times City",
  },
];

const AUTO_MS = 5000;

export default function Teacher() {
  const teachers = useMemo(() => TEACHERS.filter(Boolean), []);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const titleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsTitleVisible(true);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.2,
      },
    );

    if (titleRef.current) {
      titleObserver.observe(titleRef.current);
    }

    return () => {
      titleObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (teachers.length === 0) return;

    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % teachers.length);
    }, AUTO_MS);

    return () => clearInterval(timer);
  }, [teachers.length]);

  if (teachers.length === 0) return null;

  const prev = () => {
    setIdx((current) => (current - 1 + teachers.length) % teachers.length);
  };

  const next = () => {
    setIdx((current) => (current + 1) % teachers.length);
  };

  const getPos = (i: number) => {
    const n = teachers.length;
    const rel = (i - idx + n) % n;

    if (rel === 0) return "center";
    if (rel === 1) return "right";
    if (rel === 2) return "farRight";
    if (rel === n - 1) return "left";
    if (rel === n - 2) return "farLeft";
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
      scale: 0.72,
      x: -265,
      zIndex: 20,
      opacity: 0.78,
      filter: "blur(1.2px)",
    },
    right: {
      scale: 0.72,
      x: 265,
      zIndex: 20,
      opacity: 0.78,
      filter: "blur(1.2px)",
    },
    farLeft: {
      scale: 0.56,
      x: -470,
      zIndex: 10,
      opacity: 0.52,
      filter: "blur(2px)",
    },
    farRight: {
      scale: 0.56,
      x: 470,
      zIndex: 10,
      opacity: 0.52,
      filter: "blur(2px)",
    },
    hidden: {
      scale: 0.5,
      x: 0,
      zIndex: 0,
      opacity: 0,
      filter: "blur(6px)",
    },
  } as const;

  return (
    <section
      id="teachers"
      className="teacher-page relative z-30 overflow-visible bg-white pb-24 pt-12 scroll-mt-24 sm:pb-28 sm:pt-14 lg:pb-32 lg:pt-16"
      style={{
        backgroundImage: "url(/image/background1.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="pointer-events-none absolute left-0 top-0 z-0 w-full -translate-y-[99%] leading-none">
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-[86px] w-full sm:h-[104px] lg:h-[116px]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,70 C180,25 360,110 540,70 C720,30 900,105 1080,70 C1260,35 1350,50 1440,35 L1440,120 L0,120 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/85 via-white/60 to-white/20" />

      {/* Title Section */}
      <div
        ref={titleRef}
        className={[
          "relative z-10 mx-auto mb-8 max-w-3xl px-4 text-center sm:mb-10",
          "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isTitleVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0",
        ].join(" ")}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/85 px-4 py-2 text-xs font-bold uppercase text-[#111827] shadow-sm shadow-red-100/60 backdrop-blur">
          <UsersRound className="size-4 text-red-600" />
          Đội ngũ giáo viên
        </div>

        <h2 className="text-3xl font-black tracking-tight text-[#111827] sm:text-4xl lg:text-[2.65rem]">
          Đồng hành cùng{" "}
          <span className="bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            học viên Rex
          </span>
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Đội ngũ giáo viên tận tâm, giàu kinh nghiệm và luôn theo sát quá trình
          học của từng học viên.
        </p>
      </div>

      {/* Team Carousel */}
      <div className="relative z-10 mx-auto mt-4 max-w-6xl px-6 sm:mt-6">
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          {/* Arrows */}
          <motion.button
            onClick={prev}
            className="absolute left-0 z-30 cursor-pointer rounded-full bg-red-600/90 p-2 shadow-md transition hover:shadow-lg sm:-left-20 sm:p-3"
            aria-label="Previous"
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </motion.button>

          <div className="relative flex h-[330px] w-full max-w-6xl items-center justify-center sm:h-[380px] lg:h-[430px]">
            {teachers.map((teacher, i) => {
              const pos = getPos(i);
              const style = cardStyles[pos];

              return (
                <motion.div
                  key={teacher.id}
                  className="absolute h-[300px] w-[240px] overflow-hidden rounded-[24px] shadow-xl sm:h-[340px] sm:w-[280px] lg:h-[400px] lg:w-[340px]"
                  animate={style}
                  transition={{ duration: 0.6, ease: [0.25, 0.9, 0.3, 1] }}
                  style={{
                    pointerEvents: pos === "center" ? "auto" : "none",
                  }}
                  whileHover={
                    pos === "center"
                      ? { scale: 1.05, transition: { duration: 0.3 } }
                      : {}
                  }
                >
                  <motion.img
                    src={teacher.image}
                    alt={teacher.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    initial={{ scale: 1 }}
                    whileHover={
                      pos === "center"
                        ? { scale: 1.1, transition: { duration: 0.5 } }
                        : {}
                    }
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {pos === "center" && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <h3 className="mb-1 text-lg font-bold sm:text-xl">
                        {teacher.name}
                      </h3>

                      <p className="mb-2 text-xs font-semibold text-red-300 sm:text-sm">
                        {teacher.role}
                      </p>

                      <p className="whitespace-pre-line text-[11px] leading-5 text-white/80 sm:text-xs">
                        {teacher.bio}
                      </p>
                    </motion.div>
                  )}

                  {pos === "center" && (
                    <motion.div
                      className="absolute inset-0 rounded-[24px] border-2 border-red-300/60"
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
            className="absolute right-0 z-30 cursor-pointer rounded-full bg-red-600/90 p-2 shadow-md transition hover:shadow-lg sm:-right-20 sm:p-3"
            aria-label="Next"
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </motion.button>
        </motion.div>

        {/* Dots */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          {teachers.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
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
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

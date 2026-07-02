"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMessages } from "@/lib/dict";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import SectionTitle from "./SectionTitle";
import SectionWaveTop from "./SectionWaveTop";

const AUTO_MS = 5000;

type TeacherItem = {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
};

export default function Teacher() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const teacherText = getMessages(locale).teacherSection;
  const teachers = useMemo(
    () => teacherText.items.filter(Boolean) as TeacherItem[],
    [teacherText.items],
  );
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
      className="teacher-page relative z-30 overflow-visible pb-24 pt-12 scroll-mt-24 sm:pb-28 sm:pt-14 lg:pb-32 lg:pt-16"
      style={{
        backgroundColor: "#f9e6d7",
      }}
    >
      <SectionWaveTop fill="#f9e6d7" />

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
        <SectionTitle
          leading={teacherText.title.leading}
          accent={teacherText.title.accent}
        />

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {teacherText.description}
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-4 max-w-6xl px-6 sm:mt-6">
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          <motion.button
            onClick={prev}
            className="absolute left-0 z-30 cursor-pointer rounded-full bg-red-600/90 p-2 shadow-md transition hover:shadow-lg sm:-left-20 sm:p-3"
            aria-label={teacherText.controls.previous}
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
            aria-label={teacherText.controls.next}
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </motion.button>
        </motion.div>

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
                  : "w-2 bg-white hover:bg-white/85"
              }`}
              aria-label={`${teacherText.controls.goToTeacher} ${i + 1}`}
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

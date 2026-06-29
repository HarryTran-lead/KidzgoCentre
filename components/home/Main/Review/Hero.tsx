"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Book,
  Info,
  MessageCircleHeart,
  ShieldCheck,
  Users,
  Trophy,
  Heart,
  Star,
} from "lucide-react";
import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";
import { EndPoint } from "@/lib/routes";

/** ICON & IMAGE giữ ở component (từ ngữ tách ở dict) */
const ICONS = [Book, Sparkles, Users, Trophy, Heart];
const IMAGES = ["/image/Banner.png"];

const QUICK_ACTIONS = [
  { label: "Thông tin trung tâm", href: "#about", icon: Info },
  { label: "Các khóa học", href: "#courses", icon: Book },
  { label: "Tại sao chọn Rex", href: "#why-rex", icon: ShieldCheck },
  { label: "Tư vấn học thử miễn phí", href: "#trial", icon: Sparkles },
  { label: "Đội ngũ giáo viên", href: "#teachers", icon: Users },
  {
    label: "Feedback phụ huynh/học viên",
    href: "#feedback",
    icon: MessageCircleHeart,
  },
];

/** Bộ hiệu ứng cho 3 dòng tiêu đề */
const TITLE_ANIMS: [string, string, string][] = [
  ["anim-fadeDown", "anim-zoomPop", "anim-fadeUp"],
  ["anim-slideLeft", "anim-pop", "anim-slideRight"],
  ["anim-flipX", "anim-fadeUp", "anim-rise"],
  ["anim-rise", "anim-skewIn", "anim-rise"],
  ["anim-fadeDown", "anim-pop", "anim-fadeUp"],
];

/* ===== PRNG deterministic để tránh hydration mismatch ===== */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeParticles(n: number, rand: () => number) {
  return Array.from({ length: n }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    delay: rand() * 3,
    dur: 5 + rand() * 4,
  }));
}
function makeStars(n: number, rand: () => number) {
  return Array.from({ length: n }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    delay: rand() * 2,
    dur: 2 + rand() * 2,
    size: 14 + rand() * 14,
  }));
}

type Props = { locale?: Locale | string };

export default function Hero({ locale }: Props) {
  const params = useParams<{ locale?: string }>();
  const urlLocale = params?.locale;
  // Ưu tiên prop -> param -> DEFAULT_LOCALE
  const resolvedLocale = useMemo(
    () => (locale ?? urlLocale ?? DEFAULT_LOCALE) as Locale,
    [locale, urlLocale],
  );
  const msg = useMemo(() => getMessages(resolvedLocale), [resolvedLocale]);

  const idx = 0;
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [scrollScale, setScrollScale] = useState(1);

  /** Bật animation đồng loạt sau khi mount để tránh "khựng" */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  // Scroll effect: fade out và scale down Hero content khi scroll xuống (throttled)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const heroSection = document.getElementById("hero");
          if (!heroSection) return;
          const scrollY = window.scrollY;
          const heroHeight = heroSection.offsetHeight;
          const progressEnd = heroHeight * 0.5;
          const scrollProgress = Math.min(1, scrollY / progressEnd);
          setScrollOpacity(Math.max(0.8, 1 - scrollProgress * 0.2));
          setScrollScale(Math.max(0.7, 1 - scrollProgress * 0.3));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /** Tạo mảng particles/stars bằng PRNG có seed cố định (SSR == CSR) */
  const rngParticles = useMemo(() => mulberry32(20241104), []);
  const rngStars = useMemo(() => mulberry32(20241104 ^ 0x9e3779b9), []);
  const particles = useMemo(
    () => makeParticles(8, rngParticles),
    [rngParticles],
  );
  const stars = useMemo(() => makeStars(6, rngStars), [rngStars]);

  // Build slides từ dict + icon + image
  const slides = msg.hero.slides.slice(0, 1).map((s, i) => ({
    ...s,
    icon: ICONS[i % ICONS.length],
    image: IMAGES[i % IMAGES.length],
  }));

  const slide = slides[idx];

  return (
    <section
      id="hero"
      data-ready={ready ? "true" : "false"}
      className={`landing-page fixed inset-0 min-h-screen flex items-center overflow-hidden z-10 ${
        ready ? "opacity-100" : "opacity-0"
      } transition-opacity duration-200`}
    >
      {/* BGs */}
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.image}
              alt=""
              fill
              priority={i === idx}
              sizes="100vw"
              className={`w-full h-full object-cover object-center ${
                i === idx ? "animate-kenburns a-paused" : ""
              }`}
            />
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/85 via-slate-900/60 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-slate-950/30" />
          </div>
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-pink-300 via-white to-amber-300 rounded-full animate-float a-paused opacity-60"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              boxShadow: "0 0 12px rgba(236, 72, 153, 0.4)",
            }}
          />
        ))}
      </div>

      {/* Stars twinkle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stars.map((s, i) => (
          <Star
            key={i}
            className="absolute text-amber-200/60 animate-twinkle a-paused drop-shadow-lg"
            size={s.size}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
              filter: "drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className="relative z-20 flex h-full w-full items-center px-5 pt-28 sm:px-8 lg:px-12 lg:pt-32 xl:px-16 2xl:px-20 transition-all duration-300"
        style={{
          opacity: Math.max(0.8, scrollOpacity),
          transform: `scale(${scrollScale})`,
          perspective: "1200px",
        }}
      >
        <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-center gap-5 md:min-h-[calc(100vh-9rem)] md:pr-[360px] lg:pr-[380px]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/90 shadow-lg shadow-black/10 backdrop-blur-md">
              <Sparkles className="size-4 text-amber-200" />
              Rex English Center
            </div>

            {/* Titles */}
            <div className="mb-5 space-y-2 md:mb-6">
              {slide.title.map((line: string, i: number) => (
                <h1
                  key={`t-${idx}-${i}`}
                  className={`font-black leading-tight tracking-tight ${
                    i === 1
                      ? "bg-linear-to-r from-pink-200 via-rose-200 to-orange-200 bg-clip-text text-transparent drop-shadow-xl"
                      : "text-white"
                  } text-3xl sm:text-4xl md:text-5xl lg:text-6xl ${
                    TITLE_ANIMS[idx % TITLE_ANIMS.length][i]
                  } a-paused`}
                  style={{
                    animation:
                      i === 0
                        ? "slideInLeft 1s ease-out both"
                        : i === 1
                          ? "scaleRotate 1.2s ease-out 0.3s both"
                          : "slideInRight 1s ease-out 0.6s both",
                    animationPlayState: ready ? "running" : "paused",
                    textShadow:
                      "0 4px 30px rgba(0,0,0,0.7), 0 0 60px rgba(236, 72, 153, 0.3)",
                    letterSpacing: "0",
                  }}
                >
                  {line}
                </h1>
              ))}
            </div>

            {/* Desc */}
            <p
              key={`d-${idx}`}
              className="mx-auto mb-5 max-w-2xl text-sm font-medium leading-relaxed text-white/90 animate-fadeBlurIn a-paused sm:text-base md:mb-7 md:text-lg lg:text-xl"
              style={{
                animationDelay: "0.8s",
                textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                letterSpacing: "0",
              }}
            >
              {slide.desc}
            </p>

            {/* Features */}
            <div
              key={`f-${idx}`}
              className="mb-7 flex flex-wrap justify-center gap-2 md:mb-8 md:gap-3"
            >
              {slide.features.map((ft: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-gradient-to-r from-pink-500/15 to-orange-500/10 border border-pink-300/30 text-white text-xs font-semibold shadow-md hover:bg-pink-500/25 hover:border-pink-300/50 transition-all duration-300 animate-flipIn a-paused hover:scale-105 cursor-pointer will-change-transform"
                  style={{ animationDelay: `${1 + i * 0.15}s` }}
                >
                  {ft}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div
              key={`cta-wrap-${idx}`}
              className="mt-1 flex flex-col flex-wrap justify-center gap-4 sm:flex-row md:gap-5"
            >
              <a
                key={`cta-2-${idx}`}
                href="#contact"
                className="inline-flex items-center justify-center px-6 py-3 md:px-9 md:py-4 rounded-xl bg-white/15 backdrop-blur-xl border border-white/40 font-bold text-white text-sm md:text-base hover:bg-white/25 hover:border-white/60 hover:scale-[1.03] shadow-lg transition-all duration-300 animate-bounceIn a-paused group cursor-pointer"
                style={{ animationDelay: "1.4s" }}
              >
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                  {msg.hero.cta.consult}
                </span>
              </a>

              <a
                key={`cta-1-${idx}`}
                href="#courses"
                className="inline-flex items-center justify-center px-6 py-3 md:px-9 md:py-4 rounded-xl text-white font-bold text-sm md:text-base bg-linear-to-r from-pink-600 via-rose-500 to-orange-500 hover:from-pink-700 hover:via-rose-600 hover:to-orange-600 shadow-lg hover:shadow-pink-600/50 hover:scale-[1.03] transition-all duration-300 animate-bounceIn a-paused border border-pink-400/40 group relative overflow-hidden cursor-pointer will-change-transform"
                style={{ animationDelay: "1.6s" }}
              >
                <span className="relative z-10 inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                  {msg.hero.cta.joinNow}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-500"
                  style={{ transform: "translateX(-100%)" }}
                />
              </a>
            </div>
          </div>

          <aside className="w-full max-h-[calc(100vh-11rem)] max-w-md overflow-y-auto rounded-3xl border border-red-100/80 bg-white/94 p-4 shadow-2xl shadow-red-950/25 backdrop-blur-md sm:p-5 md:absolute md:right-0 md:top-1/2 md:mt-0 md:w-[320px] md:-translate-y-1/2 lg:w-[330px] xl:w-[350px]">
            {" "}
            <div className="mb-4 text-left">
              {" "}
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                {" "}
                Khám phá Rex{" "}
              </p>{" "}
              <h2 className="mt-1 text-xl font-black text-[#111827]">
                {" "}
                Chọn nhu cầu của bạn{" "}
              </h2>{" "}
            </div>{" "}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {" "}
              {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => {
                const actionHref =
                  href === "#trial"
                    ? localizePath(EndPoint.CONTACT, resolvedLocale)
                    : href;

                return (
                  <a
                    key={href}
                    href={actionHref}
                    className="quick-action-btn group flex min-h-12 items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-bold text-[#111827] shadow-sm transform-gpu transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-xl hover:shadow-red-600/25 active:translate-y-0 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-white/90 group-hover:text-white ">
                      <Icon size={18} strokeWidth={2.4} className="group-hover:text-red-600"/>
                    </span>

                    <span className="leading-snug">{label}</span>
                  </a>
                );
              })}{" "}
            </div>{" "}
          </aside>
        </div>
      </div>

      {/* Global tiny animations */}
      <style jsx global>{`
      .quick-action-btn {
  will-change: transform, box-shadow, background-color;
}
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-twinkle {
          animation: twinkle 2.6s ease-in-out infinite;
          display: inline-block;
          transform-origin: center;
          will-change: transform, opacity;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
          display: inline-block;
          transform-origin: center;
          will-change: transform;
        }

        /* Pause-by-default, run when data-ready=true */
        .a-paused {
          animation-play-state: paused !important;
        }
        [data-ready="true"] .a-paused {
          animation-play-state: running !important;
        }
      `}</style>

      {/* Local styles / keyframes */}
      <style jsx>{`
        .hero-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: rgba(236, 72, 153, 0.15);
          backdrop-filter: blur(12px);
          border: 2px solid rgba(244, 114, 182, 0.35);
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
          color: white;
          font-weight: bold;
          cursor: pointer;
        }
        .hero-nav:hover {
          transform: translateY(-50%) scale(1.1);
          background: rgba(236, 72, 153, 0.25);
          border-color: rgba(244, 114, 182, 0.5);
          box-shadow: 0 8px 30px rgba(236, 72, 153, 0.25);
        }
        .hero-nav:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes kenburns {
          0% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1.12);
          }
        }
        .animate-kenburns {
          animation: kenburns 8s linear forwards;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10%,
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-90vh) translateX(40px);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float linear infinite;
          will-change: transform, opacity;
        }

        @keyframes fadeDown {
          from {
            opacity: 0;
            transform: translateY(-36px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(36px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-80px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(80px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleRotate {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-5deg);
          }
          50% {
            transform: scale(1.1) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }
        @keyframes pop {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          60% {
            transform: scale(1.06);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes zoomPop {
          0% {
            opacity: 0;
            transform: scale(0.8) rotate(-2deg);
          }
          60% {
            transform: scale(1.08) rotate(1deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }
        @keyframes rotateIn {
          from {
            opacity: 0;
            transform: rotate(-180deg) scale(0.6);
          }
          to {
            opacity: 1;
            transform: rotate(0) scale(1);
          }
        }
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes skewIn {
          from {
            opacity: 0;
            transform: skewY(6deg) translateY(20px);
          }
          to {
            opacity: 1;
            transform: skewY(0) translateY(0);
          }
        }
        @keyframes flipInX {
          from {
            opacity: 0;
            transform: scaleX(0.85);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeBlurIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeBlurIn {
          animation: fadeBlurIn 1s ease-out both;
          will-change: opacity, transform;
        }

        @keyframes flipIn {
          from {
            opacity: 0;
            transform: scaleX(0.8);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }
        @keyframes bounceInSmooth {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.85);
          }
          40% {
            opacity: 1;
            transform: translateY(-8px) scale(1.05);
          }
          70% {
            transform: translateY(3px) scale(0.98);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
        @keyframes dropIn {
          0% {
            opacity: 0;
            transform: translateY(-90px) scale(0.85) rotate(-6deg);
          }
          55% {
            opacity: 1;
            transform: translateY(6px) scale(1.06) rotate(1deg);
          }
          75% {
            transform: translateY(-3px) scale(0.98);
          }
          100% {
            transform: translateY(0) scale(1) rotate(0);
          }
        }

        .anim-fadeDown {
          animation: fadeDown 0.8s ease-out both;
          will-change: opacity, transform;
        }
        .anim-fadeUp {
          animation: fadeUp 0.8s ease-out 0.15s both;
          will-change: opacity, transform;
        }
        .anim-slideLeft {
          animation: slideLeft 0.8s ease-out both;
          will-change: opacity, transform;
        }
        .anim-slideRight {
          animation: slideRight 0.8s ease-out both;
          will-change: opacity, transform;
        }
        .anim-pop {
          animation: pop 0.8s ease-out 0.1s both;
          will-change: opacity, transform;
        }
        .anim-zoomPop {
          animation: zoomPop 1s ease-out 0.1s both;
          will-change: opacity, transform;
        }
        .anim-rotateIn {
          animation: rotateIn 0.7s ease-out both;
          will-change: opacity, transform;
        }
        .anim-rise {
          animation: rise 0.9s ease-out 0.12s both;
          will-change: opacity, transform;
        }
        .anim-skewIn {
          animation: skewIn 0.9s ease-out 0.12s both;
          will-change: opacity, transform;
        }
        .anim-flipX {
          animation: flipInX 0.9s ease-out both;
          will-change: opacity, transform;
        }
        .anim-fadeIn {
          animation: fadeIn 0.9s ease-out 0.25s both;
          will-change: opacity;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-flipIn {
          animation: flipIn 0.8s ease-out both;
          will-change: transform, opacity;
        }
        .animate-bounceIn {
          animation: bounceInSmooth 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity;
          transform-origin: center;
        }

        /* Icon drop + ripple */
        .animate-dropIn {
          animation: dropIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity;
          transform-origin: center bottom;
        }

        /* Mobile: đưa 2 nút xuống đáy cùng baseline với dots */
        @media (max-width: 639px) {
          .hero-nav {
            top: auto;
            bottom: calc(16px + env(safe-area-inset-bottom));
            transform: none;
            width: 40px;
            height: 40px;
            z-index: 30;
          }
          .hero-prev {
            left: 12px;
            right: auto;
          }
          .hero-next {
            right: 12px;
            left: auto;
          }
          .hero-dots {
            bottom: calc(16px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </section>
  );
}

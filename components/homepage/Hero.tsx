"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Book,
  Users,
  Trophy,
  Heart,
  Star,
} from "lucide-react";
import { useParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { useMsg } from "@/lib/dict";

/** ICON & IMAGE giữ ở component (từ ngữ tách ở dict) */
const ICONS = [Book, Sparkles, Users, Trophy, Heart];
const IMAGES = [
  "/image/Banner1.JPG", // ảnh đầu từ public/image/Banner1.JPG
  "/image/Banner6.JPG",
  "/image/Banner3.JPG",
  "/image/Banner4.JPG",
  "/image/Banner5.JPG",
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
    delay: rand() * 5,
    dur: 6 + rand() * 6,
  }));
}
function makeStars(n: number, rand: () => number) {
  return Array.from({ length: n }, () => ({
    left: rand() * 100,
    top: rand() * 100,
    delay: rand() * 3,
    dur: 2 + rand() * 3,
    size: 12 + rand() * 20,
  }));
}

type Props = { locale?: Locale | string };

export default function Hero({ locale }: Props) {
  const params = useParams();
  const urlLocale = (params as any)?.locale as string | undefined;
  const msg = useMsg(locale ?? urlLocale);

  const [idx, setIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  /** Bật animation đồng loạt sau khi mount để tránh “khựng” */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true))
    );
    return () => cancelAnimationFrame(id);
  }, []);

  /** Tạo mảng particles/stars bằng PRNG có seed cố định (SSR == CSR) */
  const rngParticles = useMemo(() => mulberry32(20241104), []);
  const rngStars = useMemo(() => mulberry32(20241104 ^ 0x9e3779b9), []);
  const particles = useMemo(
    () => makeParticles(16, rngParticles),
    [rngParticles]
  );
  const stars = useMemo(() => makeStars(12, rngStars), [rngStars]);

  // Build slides từ dict + icon + image
  const slides = msg.hero.slides.map((s, i) => ({
    ...s,
    icon: ICONS[i % ICONS.length],
    image: IMAGES[i % IMAGES.length],
  }));

  const next = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIdx((s) => (s + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  };
  const prev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIdx((s) => (s - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  };
  const go = (i: number) => {
    if (isAnimating || i === idx) return;
    setIsAnimating(true);
    setIdx(i);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const slide = slides[idx];
  const Icon = slide.icon;

  // Auto slide
  useEffect(() => {
    if (isAnimating) return;
    const t = setTimeout(() => {
      next();
    }, 5000); // 5s
    return () => clearTimeout(t);
  }, [idx, isAnimating]);

  return (
    <section
      data-ready={ready ? "true" : "false"}
      className={`relative min-h-screen flex items-center overflow-hidden ${
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
            <img
              src={s.image}
              alt=""
              loading={i === idx ? "eager" : "lazy"}
              decoding="async"
              className={`w-full h-full object-cover object-center ${
                i === idx ? "animate-kenburns a-paused" : ""
              }`}
            />
            <div className="absolute inset-0 bg-linear-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-slate-900/40" />
          </div>
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/30 rounded-full animate-float a-paused"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      {/* Stars twinkle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stars.map((s, i) => (
          <Star
            key={i}
            className="absolute text-amber-300/40 animate-twinkle a-paused"
            size={s.size}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto">
          <div
            key={`icon-${idx}`}
            className="icon-drop inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-5 animate-dropIn a-paused"
          >
            <Icon className="w-7 h-7 md:w-8 md:h-8 text-amber-300" />
          </div>

          <div
            key={`badge-${idx}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-6 md:mb-7 anim-rotateIn a-paused"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow a-paused" />
            <span className="text-xs md:text-sm font-semibold text-amber-100">
              {slide.badge}
            </span>
          </div>

          {/* Titles */}
          <div className="space-y-1.5 md:space-y-2.5 mb-5 md:mb-7">
            {slide.title.map((line: string, i: number) => (
              <h1
                key={`t-${idx}-${i}`}
                className={`font-extrabold leading-tight ${
                  i === 1
                    ? "bg-linear-to-r from-pink-300 via-rose-300 to-amber-300 bg-clip-text text-transparent"
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
                  textShadow: "0 0 40px rgba(0,0,0,0.5)",
                }}
              >
                {line}
              </h1>
            ))}
          </div>

          {/* Desc */}
          <p
            key={`d-${idx}`}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-6 md:mb-7 animate-fadeBlurIn a-paused"
            style={{
              animationDelay: "0.8s",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {slide.desc}
          </p>

          {/* Features */}
          <div
            key={`f-${idx}`}
            className="flex flex-wrap justify-center gap-2.5 md:gap-3.5 mb-8 px-4"
          >
            {slide.features.map((ft: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-white/15 backdrop-blur border border-white/20 text-white text-xs md:text-sm font-semibold shadow-xl hover:bg-white/25 transition animate-flipIn a-paused"
                style={{ animationDelay: `${1 + i * 0.15}s` }}
              >
                {ft}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div
            key={`cta-wrap-${idx}`}
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 px-4"
          >
            <a
              key={`cta-1-${idx}`}
              href="#courses"
              className="inline-flex items-center justify-center px-6 py-3 md:px-9 md:py-4 rounded-xl text-white font-bold text-sm md:text-base bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 shadow-2xl hover:shadow-pink-500/40 hover:scale-[1.03] transition animate-bounceIn a-paused"
              style={{ animationDelay: "1.4s" }}
            >
              <span className="inline-flex items-center gap-2">
                {msg.hero.cta.joinNow}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </a>

            <a
              key={`cta-2-${idx}`}
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-3 md:px-9 md:py-4 rounded-xl bg-white/15 backdrop-blur border border-white/30 font-bold text-white text-sm md:text-base hover:bg-white hover:text-slate-900 hover:scale-[1.03] shadow-2xl transition animate-bounceIn a-paused"
              style={{ animationDelay: "1.6s" }}
            >
              {msg.hero.cta.consult}
            </a>
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={prev}
        disabled={isAnimating}
        aria-label="Previous slide"
        className="hero-nav hero-prev sm:left-4"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
      </button>
      <button
        onClick={next}
        disabled={isAnimating}
        aria-label="Next slide"
        className="hero-nav hero-next right-4"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
      </button>

      {/* Dots */}
      <div className="hero-dots absolute bottom-4 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            disabled={isAnimating}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 md:h-2.5 rounded-full transition-all duration-500 ${
              i === idx
                ? "w-8 md:w-10 bg-linear-to-r from-pink-400 to-amber-400 shadow"
                : "w-2.5 md:w-3 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Global tiny animations */}
      <style jsx global>{`
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
          width: 50px;
          height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          transition: all 0.25s ease;
        }
        .hero-nav:hover {
          transform: translateY(-50%) scale(1.06);
          background: rgba(255, 255, 255, 0.2);
        }
        .hero-nav:disabled {
          opacity: 0.6;
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
            transform: translateX(-100px) rotateY(-15deg);
          }
          to {
            opacity: 1;
            transform: translateX(0) rotateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px) rotateY(15deg);
          }
          to {
            opacity: 1;
            transform: translateX(0) rotateY(0);
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
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
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
            transform: perspective(600px) rotateX(-90deg);
          }
          to {
            opacity: 1;
            transform: perspective(600px) rotateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            filter: blur(10px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }
        @keyframes fadeBlurIn {
          from {
            opacity: 0;
            filter: blur(10px);
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }
        .animate-fadeBlurIn {
          animation: fadeBlurIn 1s ease-out both;
        }

        @keyframes flipIn {
          from {
            opacity: 0;
            transform: perspective(400px) rotateX(-90deg);
          }
          to {
            opacity: 1;
            transform: perspective(400px) rotateX(0);
          }
        }
        @keyframes bounceInSmooth {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            filter: blur(8px);
          }
          40% {
            opacity: 1;
            transform: translateY(-6px) scale(1.05);
            filter: blur(0);
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
            filter: blur(6px);
          }
          55% {
            opacity: 1;
            transform: translateY(6px) scale(1.06) rotate(1deg);
            filter: blur(0);
          }
          75% {
            transform: translateY(-3px) scale(0.98);
          }
          100% {
            transform: translateY(0) scale(1) rotate(0);
          }
        }
        @keyframes landingRipple {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.45);
          }
          100% {
            box-shadow: 0 0 0 18px rgba(255, 255, 255, 0);
          }
        }

        .anim-fadeDown {
          animation: fadeDown 0.8s ease-out both;
        }
        .anim-fadeUp {
          animation: fadeUp 0.8s ease-out 0.15s both;
        }
        .anim-slideLeft {
          animation: slideLeft 0.8s ease-out both;
        }
        .anim-slideRight {
          animation: slideRight 0.8s ease-out both;
        }
        .anim-pop {
          animation: pop 0.8s ease-out 0.1s both;
        }
        .anim-zoomPop {
          animation: zoomPop 1s ease-out 0.1s both;
        }
        .anim-rotateIn {
          animation: rotateIn 0.7s ease-out both;
        }
        .anim-rise {
          animation: rise 0.9s ease-out 0.12s both;
        }
        .anim-skewIn {
          animation: skewIn 0.9s ease-out 0.12s both;
        }
        .anim-flipX {
          animation: flipInX 0.9s ease-out both;
        }
        .anim-fadeIn {
          animation: fadeIn 0.9s ease-out 0.25s both;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-flipIn {
          animation: flipIn 0.8s ease-out both;
        }
        .animate-bounceIn {
          animation: bounceInSmooth 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity;
          transform-origin: center;
        }

        /* Icon drop + ripple */
        .animate-dropIn {
          animation: dropIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity, filter;
          transform-origin: center bottom;
        }
        .icon-drop {
          position: relative;
        }
        .icon-drop::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -4px;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          animation: landingRipple 0.9s ease-out 0.55s both;
          pointer-events: none;
        }

        /* Mobile: đưa 2 nút xuống đáy cùng baseline với dots */
        @media (max-width: 639px) {
          .hero-nav {
            top: auto;
            bottom: calc(16px + env(safe-area-inset-bottom));
            transform: none;
            width: 44px;
            height: 44px;
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

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MessageCircleQuestion } from "lucide-react";
import { categories, faqsByLocale } from "./data";
import { DEFAULT_LOCALE, pickLocaleFromPath } from "@/lib/i18n";
import { getMessagesFromPath } from "@/lib/dict";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function BannerFAQ() {
  const pathname = usePathname() || "/";
  const locale = pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE;
  const faqs = faqsByLocale(locale);
  const msg = getMessagesFromPath(pathname).faqs;
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Scale down và fade out chậm hơn khi scroll từ 0 đến 400px
      const effectStart = 0;
      const effectEnd = 400;
      const progress = Math.min(1, (scrollY - effectStart) / (effectEnd - effectStart));
      
      // Scale từ 1 đến 0.8 (chậm hơn)
      const newScale = Math.max(0.8, 1 - progress * 0.2);
      // Opacity từ 1 đến 0.3 (mờ dần)
      const newOpacity = Math.max(0.3, 1 - progress * 0.7);
      
      setScale(newScale);
      setOpacity(newOpacity);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className="relative overflow-hidden bg-linear-to-br from-blue-600 via-sky-500 to-cyan-400 pb-16 sm:pb-20 sticky top-0 z-10 "
      style={{ opacity }}
    >
      {/* Backgrounds */}
      <div className="absolute inset-0 opacity-10 ">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-8 mt-40 mb-20">
        <div className="grid gap-8 lg:grid-cols-5 lg:items-center" style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.3s ease-out, opacity 0.3s ease-out' }}>
          {/* LEFT */}
          <div className="flex flex-col justify-center space-y-4 sm:space-y-6 lg:col-span-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 self-start">
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-semibold border border-white/30 shadow-lg">
                <MessageCircleQuestion size={18} className="animate-pulse" />
                {msg.header.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-[40px] font-black text-white leading-tight mb-3 drop-shadow-lg">
                {msg.header.title.main}{" "}
                <span className="text-amber-300">
                  {msg.header.title.accent}
                </span>
              </h1>
              <div className="h-1.5 w-24 bg-yellow-300 rounded-full shadow-lg" />
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-[15px] text-white leading-relaxed max-w-xl font-medium">
              {msg.header.subtitle}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {faqs.length}+
                </div>
                <div className="text-xs sm:text-sm text-white font-medium">
                  {msg.stats.questions}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {categories.length - 1}
                </div>
                <div className="text-xs sm:text-sm text-white font-medium">
                  {msg.stats.topics}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-1">
                  24/7
                </div>
                <div className="text-xs sm:text-sm text-white font-medium">
                  {msg.stats.support}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Sticker with Animation */}
          <div className="hidden lg:flex items-center justify-end lg:col-span-2">
            <div className="relative w-full max-w-sm h-80 flex items-center justify-center">
              {/* Sticker - Center with floating animation */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{
                  opacity: 1,
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.3,
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                  y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                }}
              >
                <Image
                  src="/sticker/1.png"
                  alt="Sticker"
                  width={200}
                  height={200}
                  className="drop-shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

    </header>
  );
}


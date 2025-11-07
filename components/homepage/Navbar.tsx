"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, LogIn } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";
import { LOGO, CTA_GRAD } from "@/lib/theme/theme";
import LanguageToggle from "@/components/ui/button/LanguageToggle";
import {
  pickLocaleFromPath,
  type Locale,
  DEFAULT_LOCALE,
  localizePath,
} from "@/lib/i18n";
import { useMsg } from "@/lib/dict";
import { EndPoint } from "@/lib/routes";

type NavItem = { id: string; label: string; icon: string };

function useScrollSpy(ids: string[], offset = 100) {
  const [active, setActive] = useState<string>("hero");
  useEffect(() => {
    const onScroll = () => {
      const found = ids.find((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= offset && r.bottom >= offset;
      });
      if (found) setActive(found);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids, offset]);
  return active;
}

function smoothTo(id: string, pad = 88) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.pageYOffset - pad;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  const locale = useMemo(
    () => (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as Locale,
    [pathname]
  );
  const msg = useMsg(locale);

  // tạo NAV_ITEMS theo ngôn ngữ:
  const NAV_ITEMS = useMemo(
    () => [
      { id: "roadmap", label: msg.nav.roadmap, icon: "🎯" },
      { id: "courses", label: msg.nav.courses, icon: "📚" },
      { id: "programs", label: msg.nav.programs, icon: "🎓" },
      { id: "gallery", label: msg.nav.gallery, icon: "📸" },
      { id: "blog", label: msg.nav.blog, icon: "📝" },
      { id: "faqs", label: msg.nav.faqs, icon: "💬" },
      { id: "contact", label: msg.nav.contact, icon: "☎️" },
    ],
    [msg]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ⬇️ cập nhật deps để đổi ngôn ngữ vẫn đúng
  const ids = useMemo(
    () => ["hero", ...NAV_ITEMS.map((n) => n.id)],
    [NAV_ITEMS]
  );
  const activeId = useScrollSpy(ids, 100);
  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((n) => n.id === activeId)
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const setItemRef = useCallback(
    (index: number) => (el: HTMLAnchorElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);

  // ✨ thêm flag để tránh animate lần đầu & chỉ render khi đo xong
  const [indReady, setIndReady] = useState(false);
  const didMount = useRef(false);

  function measureRect(el: HTMLElement | null) {
    const wrap = containerRef.current;
    if (!el || !wrap) return { tx: 0, ty: 0, tw: 0, th: 0 };
    const a = el.getBoundingClientRect();
    const b = wrap.getBoundingClientRect();
    return {
      tx: Math.round(a.left - b.left),
      ty: Math.round(a.top - b.top),
      tw: Math.round(a.width),
      th: Math.round(a.height),
    };
  }

  function moveIndicatorToIndex(index: number, instant = false) {
    const rect = measureRect(itemRefs.current[index]);
    if (instant) {
      x.set(rect.tx);
      y.set(rect.ty);
      w.set(rect.tw);
      h.set(rect.th);
      return;
    }
    const spring = {
      type: "spring" as const,
      stiffness: 120,
      damping: 28,
      mass: 1.05,
    };
    animate(x, [rect.tx], spring);
    animate(y, [rect.ty], spring);
    animate(w, [rect.tw], spring);
    animate(h, [rect.th], spring);
  }

  // ⬇️ lần đầu: set vị trí ngay lập tức & bật hiển thị indicator
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      moveIndicatorToIndex(Math.max(0, activeIndex), true); // instant
      setIndReady(true);
      didMount.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⬇️ từ lần sau mới animate
  useEffect(() => {
    if (!didMount.current) return;
    moveIndicatorToIndex(Math.max(0, activeIndex));
  }, [activeIndex]);

  useEffect(() => {
    const onResize = () => moveIndicatorToIndex(Math.max(0, activeIndex), true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/55 backdrop-blur-xl shadow-md border-b border-transparent"
            : "bg-white/95 backdrop-blur-sm border-b border-pink-100"
        }`}
      >
        {/* Responsive paddings: 16 / 20 / 24 / 48 / 64 / 80 px */}
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-6 xl:px-12 2xl:px-0">
          {/* Responsive heights: 56 / 64 / 72 / 80 px */}
          <div className="relative flex items-center justify-between gap-3 sm:gap-4 md:gap-6 h-14 md:h-14 lg:h-15 xl:h-16">
            {/* Logo */}
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                smoothTo("hero");
              }}
              className="flex items-center shrink-0"
            >
              <Image
                src={LOGO}
                alt="KidzGo logo"
                width={900}
                height={900}
                priority
                className="h-12 md:h-13 lg:h-13 xl:h-15 mb-0.5 w-auto"
              />
            </a>

            {/* CENTER MENU (desktop, lg+) */}
            <div className="hidden xl:block absolute inset-x-0">
              <div className="flex justify-center pointer-events-none">
                <div
                  ref={containerRef}
                  className="relative inline-flex items-center gap-1 rounded-xl bg-white ring-1 ring-slate-200 p-1 pointer-events-auto"
                  style={{ isolation: "isolate" }}
                >
                  {indReady && (
                    <motion.span
                      className="absolute top-0 left-0 rounded-lg pointer-events-none overflow-hidden"
                      initial={false} // tránh animate lần đầu
                      style={{
                        x,
                        y,
                        width: w,
                        height: h,
                        willChange: "transform, width, height",
                      }}
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-pink-400/10 via-fuchsia-400/10 to-yellow-400/10" />
                      <div className="absolute inset-0 bg-linear-to-br from-white/0 to-white/20 backdrop-blur-sm" />
                      <div className="absolute inset-0 ring-1 ring-pink-300/30 rounded-lg" />
                      <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </motion.span>
                  )}

                  {NAV_ITEMS.map((item, i) => {
                    const isActive = i === activeIndex;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          smoothTo(item.id);
                        }}
                        ref={setItemRef(i)}
                        className={`relative inline-flex h-10 items-center rounded-lg px-3
                          text-[14px] overflow-visible transition-colors duration-300
                          ${
                            isActive
                              ? "text-rose-700"
                              : "text-slate-700 hover:text-rose-600 hover:bg-rose-50/60"
                          }
                       
                          after:content-[''] after:absolute after:left-1 after:right-1 after:bottom-0.5
                          after:h-[1.5px] after:rounded-full after:bg-linear-to-r after:from-yellow-400 after:via-pink-400 after:to-purple-400
                          after:opacity-0 after:scale-x-0 after:origin-center
                          after:transition-transform after:duration-300 after:ease-out
                          hover:after:opacity-100 hover:after:scale-x-100
                          focus-visible:after:opacity-100 focus-visible:after:scale-x-100
                        `}
                      >
                        <span className="relative z-10 inline-flex items-center gap-1.5">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Auth buttons */}
            <div className="hidden xl:flex items-center gap-2 md:gap-3 shrink-0 z-10">
              <LanguageToggle />
              <Link
                href={localizePath(EndPoint.LOGIN, locale)}
                className="group inline-flex items-center gap-2 h-10 px-3 rounded-xl 
                border border-slate-200 font-semibold text-[13px] md:text-sm text-slate-700 
                bg-white shadow-sm transition-all duration-300
                hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md hover:scale-[1.02]"
              >
                <LogIn className="w-4 h-4 text-slate-500 group-hover:text-rose-500 transition-colors duration-300" />
                <span>{msg.auth.login}</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="xl:hidden p-2 rounded-xl hover:bg-pink-50"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet overlay */}
      <div
        className={`fixed inset-0 z-60 xl:hidden transition-all duration-500 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <aside
          className={`absolute top-0 right-0 h-full 
              w-[300px] sm:w-[360px] md:w-[400px] lg:w-[440px]
            bg-white shadow-2xl transition-transform duration-500 ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="h-14 md:h-16 px-4 sm:px-5 md:px-6 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={LOGO}
                alt="KidzGo logo"
                width={900}
                height={900}
                className="h-12 sm:h-13 md:h-14 w-auto"
                priority
              />
              <div className="ml-2 mt-2">
                <LanguageToggle />
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-2 mt-2 rounded-lg hover:bg-slate-100"
              aria-label="Đóng menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <hr className=" border-b border-slate-100 mb-1" />

          {/* Body */}
          <div className="p-3 sm:p-4 md:p-5 space-y-2 overflow-y-auto h-[calc(100%-56px)] md:h-[calc(100%-64px)]">
            {NAV_ITEMS.map((item, i) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  smoothTo(item.id);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 sm:gap-3.5 md:gap-4
                  min-h-[52px] md:min-h-14 px-3 sm:px-3.5 md:px-4
                  rounded-xl border transition-all
                  ${
                    activeIndex === i
                      ? "bg-linear-to-r from-yellow-50 via-pink-50 to-purple-50 border-pink-300 shadow-sm"
                      : "border-slate-100 hover:bg-pink-50"
                  }
                `}
                style={{
                  animation: open
                    ? `slideInRight 0.25s ease-out ${i * 0.05}s both`
                    : "none",
                }}
              >
                <span className="text-[18px] sm:text-[20px] md:text-[22px]">
                  {item.icon}
                </span>
                <span className="font-semibold text-slate-700 text-[14px] sm:text-[15px] md:text-[16px]">
                  {item.label}
                </span>
                {activeIndex === i && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-linear-to-r from-pink-400 to-purple-400 animate-pulse" />
                )}
              </a>
            ))}

            <hr className="border border-slate-100 my-4 md:my-3" />

            {/* Auth buttons trong drawer */}
            <div className="grid grid-cols-1">
              <Link
                href={localizePath(EndPoint.LOGIN, locale)}
                className={`flex items-center justify-center gap-2 h-11 rounded-xl  ${CTA_GRAD} 
             text-white font-semibold text-sm
             transition-all duration-200`}
                onClick={() => setOpen(false)}
              >
                <LogIn className="w-4 h-4" />
                <span>{msg.auth.login}</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

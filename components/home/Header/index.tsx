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
import { Menu, X, LogIn, ChevronRight, Sparkles } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";
import { LOGO } from "@/lib/theme/theme";
import LanguageToggle from "@/components/ui/button/LanguageToggle";
import {
  pickLocaleFromPath,
  type Locale,
  DEFAULT_LOCALE,
  localizePath,
} from "@/lib/i18n";
import { getMessages } from "@/lib/dict";
import { EndPoint } from "@/lib/routes";

type NavItem =
  | { id: string; label: string; kind: "section" }
  | { id: string; label: string; kind: "route"; href: string };

function useScrollSpy(ids: string[], offset = 100) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    if (ids.length === 0) return;
    const onScroll = () => {
      const found = ids.find((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= offset && r.bottom >= offset;
      });
      setActive(found || "");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids, offset]);
  return active;
}

function getHeaderOffsetPx() {
  if (typeof window === "undefined") return 64;
  const v = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--app-header-h"
    )
  );
  return Number.isFinite(v) ? v : 64;
}

function smoothTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const pad = getHeaderOffsetPx();
  const y = el.getBoundingClientRect().top + window.scrollY - pad;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const lastScrollY = useRef(0);
  const navVariants = useMemo(
    () => ({
      default: {
        borderRadius: 9999,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 10px 40px -12px rgba(0,0,0,0.08)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(0,0,0,0.08)",
      },
      scrolled: {
        borderRadius: 0,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.08)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(0,0,0,0.04)",
      },
    }),
    []
  );

  const pathname = usePathname();
  const locale = useMemo(
    () => (pickLocaleFromPath(pathname) ?? DEFAULT_LOCALE) as Locale,
    [pathname]
  );
  const msg = getMessages(locale);
  const safeNav = msg.nav as Record<string, string>;

  const NAV_ITEMS: NavItem[] = useMemo(
    () => [
      {
        id: "home",
        label: msg.nav.home,
        kind: "route",
        href: localizePath(EndPoint.HOME, locale),
      },

      {
        id: "faqs",
        label: msg.nav.faqs,
        kind: "route",
        href: localizePath(EndPoint.FAQS, locale),
      },
      {
        id: "bantin",
        label: msg.nav.bantin,
        kind: "route",
        href: localizePath(EndPoint.BLOGS, locale),
      },
      {
        id: "contact",
        label: msg.nav.contact,
        kind: "route",
        href: localizePath(EndPoint.CONTACT, locale),
      },
    ],
    [msg, locale]
  );

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) < 1) return;
      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homePath = localizePath(EndPoint.HOME, locale);
  const isHomePage =
    pathname === homePath || pathname === `${homePath}/` || pathname === "/";

  const sectionIds = useMemo(
    () => NAV_ITEMS.filter((n) => n.kind === "section").map((n) => n.id),
    [NAV_ITEMS]
  );
  const activeSectionId = useScrollSpy(isHomePage ? sectionIds : [], 120);

  const activeKey = useMemo(() => {
    if (pathname.includes("/contact")) return "contact";
    if (pathname.includes("/faqs")) return "faqs";
    if (pathname.includes("/blogs")) return "bantin";
    if (pathname.includes("/pricing")) return "pricing";
    return activeSectionId;
  }, [pathname, activeSectionId]);

  const activeIndex = useMemo(() => {
    const idx = NAV_ITEMS.findIndex((n) => n.id === activeKey);
    return idx === -1 ? 0 : idx;
  }, [NAV_ITEMS, activeKey]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const setItemRef = useCallback(
    (index: number) => (el: HTMLAnchorElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  const x = useMotionValue(0);
  const w = useMotionValue(0);
  const [indReady, setIndReady] = useState(false);
  const didMount = useRef(false);

  function measureRect(el: HTMLElement | null) {
    const wrap = containerRef.current;
    if (!el || !wrap) return { tx: 0, tw: 0 };
    const a = el.getBoundingClientRect();
    const b = wrap.getBoundingClientRect();
    return {
      tx: Math.round(a.left - b.left),
      tw: Math.round(a.width),
    };
  }

  function moveIndicatorToIndex(index: number, instant = false) {
    const rect = measureRect(itemRefs.current[index]);
    if (instant) {
      x.set(rect.tx);
      w.set(rect.tw);
      return;
    }
    const spring = {
      type: "spring" as const,
      stiffness: 280,
      damping: 25,
      mass: 0.8,
    };
    animate(x, [rect.tx], spring);
    animate(w, [rect.tw], spring);
  }

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      moveIndicatorToIndex(Math.max(0, activeIndex), true);
      setIndReady(true);
      didMount.current = true;
    });
  }, []);

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
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const setVar = () => {
      const rect = el.getBoundingClientRect();
      const safeTop =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--safe-top"
          )
        ) || 0;
      const h = Math.ceil(rect.height + safeTop);
      document.documentElement.style.setProperty("--app-header-h", `${h}px`);
    };

    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener("resize", setVar, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, []);

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        ref={navRef}
        initial={false}
        animate={scrolled ? "scrolled" : "default"}
        variants={navVariants}
        transition={{
          duration: 0.6,
          ease: [0.32, 0.72, 0, 1],
        }}
        className={`fixed z-50 will-change-transform transition-[transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "top-0 left-0 right-0 translate-x-0 translate-y-0 bg-white/95 backdrop-blur-xl backdrop-saturate-150 shadow-sm border-b border-white/40 rounded-none max-w-full"
            : "top-6 left-1/2 -translate-x-1/2 translate-y-0 w-[calc(100%-3rem)] max-w-7xl bg-white/90 backdrop-blur-lg backdrop-saturate-125 border border-white/50 rounded-2xl shadow-lg"
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative"
            >
            <a
              href={homePath + "#hero"}
              onClick={(e) => {
                if (isHomePage) {
                  e.preventDefault();
                  smoothTo("hero");
                }
              }}
                className="flex items-center group"
            >
              <Image
                src={LOGO}
                alt="KidzGo logo"
                  width={160}
                  height={48}
                priority
                  className="h-12 w-auto transition-all duration-300 group-hover:drop-shadow-lg"
              />

            </a>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center">
                <div
                  ref={containerRef}
                  className="relative inline-flex items-center gap-0.5 px-1.5 pb-2.5 py-2"
                >
                  {indReady && (
                    <motion.div
                      className="absolute top-2 left-0 h-[calc(100%-16px)] bg-gradient-to-r from-pink-400/20 to-rose-400/20 rounded-xl border border-pink-100/50 shadow-sm"
                      initial={false}
                      style={{
                        x,
                        width: w,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 25,
                        mass: 0.8,
                      }}
                    />
                  )}
                  
                  {NAV_ITEMS.map((item, i) => {
                    const isActive = i === activeIndex;

                    if (item.kind === "section") {
                      const sectionHref = homePath + "#" + item.id;
                      return (
                        <motion.a
                          key={item.id}
                          href={sectionHref}
                          onClick={(e) => {
                            if (isHomePage) {
                              e.preventDefault();
                              smoothTo(item.id);
                            }
                          }}
                          ref={setItemRef(i)}
                          className={`
                            relative z-10 px-4 py-2.5 mx-1 text-sm font-medium rounded-xl
                            transition-all duration-300 ease-out
                            group/nav-item whitespace-nowrap
                            ${isActive 
                              ? "text-pink-600 font-semibold"
                              : "text-gray-800 hover:text-pink-600"
                            }
                          `}
                          whileHover={{ 
                            scale: 1.03
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="relative inline-block whitespace-nowrap">
                          {item.label}
                            <span
                              className={`
                                absolute left-0 right-0 -bottom-1 h-0.5 rounded-full
                                bg-gradient-to-r from-pink-500 to-rose-500
                                transform origin-left transition-all duration-300 ease-out
                                ${isActive 
                                  ? "scale-x-100 opacity-100" 
                                  : "scale-x-0 opacity-0 group-hover/nav-item:scale-x-100 group-hover/nav-item:opacity-100"
                                }
                              `}
                            />
                          </span>
                        </motion.a>
                      );
                    }

                    return (
                      <motion.a
                        key={item.id}
                        href={item.href}
                        ref={setItemRef(i)}
                        className={`
                          relative z-10 px-4 py-2.5 mx-0.5 text-sm font-medium rounded-xl
                          transition-all duration-300 ease-out
                          group/nav-item whitespace-nowrap
                          ${isActive 
                            ? "text-pink-600 font-semibold"
                            : "text-gray-800 hover:text-pink-600"
                          }
                        `}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative inline-block whitespace-nowrap">
                        {item.label}
                          <span
                            className={`
                              absolute left-0 right-0 -bottom-1 h-0.5 rounded-full
                              bg-gradient-to-r from-pink-500 to-rose-500
                              transform origin-left transition-all duration-300 ease-out
                              ${isActive 
                                ? "scale-x-100 opacity-100" 
                                : "scale-x-0 opacity-0 group-hover/nav-item:scale-x-100 group-hover/nav-item:opacity-100"
                              }
                            `}
                          />
                        </span>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.08, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <LanguageToggle />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={localizePath(EndPoint.LOGIN, locale)}
                  className="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-pink-500/25 active:shadow-inner"
                >
                  {/* Button glow effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    {msg.auth.login}
                  </span>
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-3 hover:bg-gray-100/50 rounded-xl transition-colors relative group"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Button background effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">
                {open ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        transition={{ duration: 0.2 }}
        className="lg:hidden fixed inset-0 z-50"
      >
        {/* Backdrop */}
        <motion.div 
          initial={false}
          animate={{ opacity: open ? 0.5 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-linear-to-br from-gray-900/30 to-pink-900/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        
        {/* Menu Panel */}
        <motion.div
          initial={false}
          animate={{
            x: open ? 0 : "100%",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white/20"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
            <div className="flex items-center gap-3">
            <Image
              src={LOGO}
              alt="KidzGo logo"
                width={140}
                height={42}
                className="h-10 w-auto"
              />
              <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>
            <motion.button
              onClick={() => setOpen(false)}
              className="p-3 hover:bg-gray-100/50 rounded-xl transition-colors relative group"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">
                <X className="w-5 h-5 text-gray-700" />
              </span>
            </motion.button>
          </div>
          
          <div className="p-6 h-[calc(100%-80px)] overflow-y-auto">
            <div className="mb-6">
              <div className="inline-block">
              <LanguageToggle />
              </div>
            </div>
            
            <div className="space-y-2 mb-8">
              {NAV_ITEMS.map((item, i) => {
                const isActive = i === activeIndex;
                
                if (item.kind === "section") {
                  const sectionHref = homePath + "#" + item.id;
                  return (
                    <motion.a
                      key={item.id}
                      href={sectionHref}
                      onClick={(e) => {
                        if (isHomePage) {
                          e.preventDefault();
                          smoothTo(item.id);
                        }
                        setOpen(false);
                      }}
                      className={`
                        flex items-center justify-between px-5 py-4 rounded-xl
                        text-gray-800 transition-all duration-300
                        group/mobile-item relative overflow-hidden
                        ${isActive 
                          ? "bg-gradient-to-r from-pink-50 to-rose-50 text-transparent bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text" 
                          : "hover:bg-gray-50/80"
                        }
                      `}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Background effect */}
                      <span className={`
                        absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5
                        opacity-0 group-hover/mobile-item:opacity-100
                        transition-opacity duration-300
                      `} />
                      
                      <span className="relative flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          isActive 
                            ? "bg-gradient-to-r from-pink-400 to-rose-400 scale-125" 
                            : "bg-gray-300 group-hover/mobile-item:bg-pink-300"
                        }`} />
                        <span className={`font-medium ${
                          isActive 
                            ? "" 
                            : "group-hover/mobile-item:text-transparent group-hover/mobile-item:bg-clip-text group-hover/mobile-item:bg-gradient-to-r group-hover/mobile-item:from-pink-500 group-hover/mobile-item:to-rose-500"
                        }`}>
                          {item.label}
                        </span>
                      </span>
                      
                      <span className="relative">
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                          isActive 
                            ? "text-pink-500 transform translate-x-0.5" 
                            : "text-gray-400 group-hover/mobile-item:text-pink-400 group-hover/mobile-item:translate-x-0.5"
                        }`} />
                      </span>
                    </motion.a>
                  );
                }

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                      className={`
                        flex items-center justify-between px-5 py-4 rounded-xl
                        text-gray-800 transition-all duration-300
                        group/mobile-item relative overflow-hidden
                        ${isActive 
                          ? "bg-gradient-to-r from-pink-50 to-rose-50 text-transparent bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text" 
                          : "hover:bg-gray-50/80"
                        }
                      `}
                    >
                      {/* Background effect */}
                      <span className={`
                        absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5
                        opacity-0 group-hover/mobile-item:opacity-100
                        transition-opacity duration-300
                      `} />
                      
                      <span className="relative flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          isActive 
                            ? "bg-gradient-to-r from-pink-400 to-rose-400 scale-125" 
                            : "bg-gray-300 group-hover/mobile-item:bg-pink-300"
                        }`} />
                        <span className={`font-medium ${
                          isActive 
                            ? "" 
                            : "group-hover/mobile-item:text-transparent group-hover/mobile-item:bg-clip-text group-hover/mobile-item:bg-gradient-to-r group-hover/mobile-item:from-pink-500 group-hover/mobile-item:to-rose-500"
                        }`}>
                          {item.label}
                        </span>
                      </span>
                      
                      <span className="relative">
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                          isActive 
                            ? "text-pink-500 transform translate-x-0.5" 
                            : "text-gray-400 group-hover/mobile-item:text-pink-400 group-hover/mobile-item:translate-x-0.5"
                        }`} />
                      </span>
                  </Link>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100/50">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
              <Link
                href={localizePath(EndPoint.LOGIN, locale)}
                  className="group relative flex items-center justify-center gap-3 w-full py-4 
                    bg-gradient-to-r from-pink-500 to-rose-500 
                    hover:from-pink-600 hover:to-rose-600 
                    text-white font-semibold rounded-xl 
                    transition-all duration-300 shadow-lg hover:shadow-xl"
                  onClick={() => setOpen(false)}
                >
                  {/* Button glow */}
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 rounded-xl blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                  
                  <span className="relative flex items-center gap-3">
                    <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    <span className="tracking-wide">{msg.auth.login}</span>
                  </span>
                  
                  {/* Arrow animation */}
                  <span className="relative ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    →
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
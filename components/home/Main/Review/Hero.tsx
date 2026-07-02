"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Book,
  ShieldCheck,
  Users,
  Trophy,
  Heart,
  Star,
  User,
  Mail,
  Phone,
  Building2,
  Send,
  ChevronDown,
  Check,
} from "lucide-react";
import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/dict";
import { EndPoint } from "@/lib/routes";
import { createLeadPublic } from "@/lib/api/leadService";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import { useToast } from "@/hooks/use-toast";
import type { Branch } from "@/types/branch";

const ICONS = [Book, Sparkles, Users, Trophy, Heart];
const IMAGES = ["/image/Banner.jpg"];

const QUICK_ACTION_ITEMS = [
  {
    key: "about",
    href: "#about",
    iconImage: "/icons/paper.png",
    tone: {
      from: "#ef0013",
      to: "#ff4b5c",
      bg: "rgba(239, 0, 19, 0.2)",
      border: "rgba(255, 97, 109, 0.52)",
      glow: "rgba(239, 0, 19, 0.34)",
    },
  },
  {
    key: "courses",
    href: "#courses",
    iconImage: "/icons/book.png",
    tone: {
      from: "#2563eb",
      to: "#38bdf8",
      bg: "rgba(37, 99, 235, 0.2)",
      border: "rgba(96, 165, 250, 0.52)",
      glow: "rgba(37, 99, 235, 0.34)",
    },
  },
  {
    key: "whyRex",
    href: "#why-rex",
    iconImage: "/icons/checked.png",
    tone: {
      from: "#16a34a",
      to: "#4ade80",
      bg: "rgba(22, 163, 74, 0.2)",
      border: "rgba(74, 222, 128, 0.52)",
      glow: "rgba(22, 163, 74, 0.34)",
    },
  },
  {
    key: "trial",
    href: "#trial",
    iconImage: "/icons/fire.png",
    tone: {
      from: "#f59e0b",
      to: "#f97316",
      bg: "rgba(245, 158, 11, 0.22)",
      border: "rgba(251, 191, 36, 0.56)",
      glow: "rgba(245, 158, 11, 0.38)",
    },
  },
  {
    key: "teachers",
    href: "#teachers",
    iconImage: "/icons/customer.png",
    tone: {
      from: "#7c3aed",
      to: "#a855f7",
      bg: "rgba(124, 58, 237, 0.22)",
      border: "rgba(168, 85, 247, 0.52)",
      glow: "rgba(124, 58, 237, 0.36)",
    },
  },
  {
    key: "feedback",
    href: "#feedback",
    iconImage: "/icons/comunication.png",
    tone: {
      from: "#db2777",
      to: "#fb7185",
      bg: "rgba(219, 39, 119, 0.22)",
      border: "rgba(251, 113, 133, 0.54)",
      glow: "rgba(219, 39, 119, 0.36)",
    },
  },
] as const;

const QUICK_BTN_LAYOUT = {
  railWidth: 410,
  closedSize: 56,
  sidePadding: 16,
  iconSlot: 46,
  gap: 11,
  labelSafety: 16,
  minOpenWidth: 176,
  maxOpenWidth: 374,
  hoverHandOffset: 18,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimateLabelWidth(label: string) {
  let width = 0;

  for (const char of label) {
    if (char === " ") {
      width += 5;
    } else if ("ilI.,:;!|".includes(char)) {
      width += 5.5;
    } else if ("tfrj".includes(char)) {
      width += 6.2;
    } else if ("mwMW".includes(char)) {
      width += 11.8;
    } else if (/[A-ZÀ-Ỵ]/.test(char)) {
      width += 9;
    } else if (/[0-9]/.test(char)) {
      width += 7.8;
    } else {
      width += 7.9;
    }
  }

  return Math.ceil(width);
}

function getQuickButtonMetrics(label: string) {
  const estimatedLabelWidth = estimateLabelWidth(label);

  const openWidth = clampNumber(
    QUICK_BTN_LAYOUT.sidePadding * 2 +
      QUICK_BTN_LAYOUT.iconSlot +
      QUICK_BTN_LAYOUT.gap +
      estimatedLabelWidth +
      QUICK_BTN_LAYOUT.labelSafety,
    QUICK_BTN_LAYOUT.minOpenWidth,
    QUICK_BTN_LAYOUT.maxOpenWidth,
  );

  const labelWidth =
    openWidth -
    QUICK_BTN_LAYOUT.sidePadding * 2 -
    QUICK_BTN_LAYOUT.iconSlot -
    QUICK_BTN_LAYOUT.gap;

  return {
    openWidth,
    labelWidth,
  };
}

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
  const { toast } = useToast();

  const resolvedLocale = useMemo(
    () => (locale ?? urlLocale ?? DEFAULT_LOCALE) as Locale,
    [locale, urlLocale],
  );

  const msg = getMessages(resolvedLocale);
  const heroText = msg.hero;

  const idx = 0;
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [scrollScale, setScrollScale] = useState(1);
  const [scrollProgressValue, setScrollProgressValue] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true)),
    );

    return () => cancelAnimationFrame(id);
  }, []);

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

          setScrollProgressValue(scrollProgress);
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

  const quickRailOpacity = Math.max(0, 1 - scrollProgressValue * 1.35);
  const quickRailScale = Math.max(0.7, 1 - scrollProgressValue * 0.3);
  const quickDockScale = Math.max(0.9, 1 - scrollProgressValue * 0.12);
  const quickDockTranslateY = scrollProgressValue * 18;

  const rngParticles = useMemo(() => mulberry32(20241104), []);
  const rngStars = useMemo(() => mulberry32(20241104 ^ 0x9e3779b9), []);

  const particles = useMemo(
    () => makeParticles(8, rngParticles),
    [rngParticles],
  );

  const stars = useMemo(() => makeStars(6, rngStars), [rngStars]);

  const slides = heroText.slides.slice(0, 1).map((s, i) => ({
    ...s,
    icon: ICONS[i % ICONS.length],
    image: IMAGES[i % IMAGES.length],
  }));

  const slide = slides[idx];

  const quickActions = QUICK_ACTION_ITEMS.map((item) => ({
    ...item,
    label: heroText.quickActions[item.key],
  }));

  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    branchPreference: "",
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const quickRailRef = useRef<HTMLElement | null>(null);
  const [hoveredQuickIndex, setHoveredQuickIndex] = useState<number | null>(
    null,
  );
  const [hoverHandTop, setHoverHandTop] = useState<number | null>(null);

  const hoveredQuickAction =
    hoveredQuickIndex !== null ? quickActions[hoveredQuickIndex] : null;

  const hoveredQuickMetrics = hoveredQuickAction
    ? getQuickButtonMetrics(hoveredQuickAction.label)
    : null;

  const showQuickHand = (target: HTMLElement, index: number) => {
    const rail = quickRailRef.current;
    if (!rail) return;

    const railRect = rail.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    setHoveredQuickIndex(index);
    setHoverHandTop(targetRect.top - railRect.top + targetRect.height / 2);
  };

  const hideQuickHand = () => {
    setHoveredQuickIndex(null);
    setHoverHandTop(null);
  };

  useEffect(() => {
    let mounted = true;

    const fetchBranches = async () => {
      try {
        const response = await getAllBranchesPublic({ isActive: true });

        if (!mounted) return;

        if ((response.success || response.isSuccess) && response.data) {
          setBranches(response.data.branches || []);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        if (mounted) {
          setIsLoadingBranches(false);
        }
      }
    };

    fetchBranches();

    return () => {
      mounted = false;
    };
  }, []);

  const handleQuickRailPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;

    if (!target.closest(".quick-rail-btn")) {
      hideQuickHand();
    }
  };

  const [branchOpen, setBranchOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  const filteredBranches = useMemo(() => {
    const keyword = branchSearch.trim().toLowerCase();

    if (!keyword) return branches;

    return branches.filter((branch) =>
      branch.name.toLowerCase().includes(keyword),
    );
  }, [branchSearch, branches]);

  const selectedBranch = useMemo(
    () =>
      branches.find((branch) => branch.id === form.branchPreference) ?? null,
    [branches, form.branchPreference],
  );

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };

  const handleSelectBranch = (branchId: string) => {
    setForm((f) => ({ ...f, branchPreference: branchId }));
    setBranchOpen(false);
    setBranchSearch("");
  };

  const getSubmitErrorMessage = (error: unknown) => {
    const responseError = error as {
      response?: {
        data?: {
          message?: string;
          detail?: string;
          title?: string;
        };
      };
      message?: string;
    };

    return (
      responseError?.response?.data?.message ||
      responseError?.response?.data?.detail ||
      responseError?.response?.data?.title ||
      responseError?.message ||
      heroText.form.errorToastDescription
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setSubmitted(false);

    try {
      const response = await createLeadPublic({
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        branchPreference: form.branchPreference || undefined,
      });

      if (response.success) {
        setForm({
          contactName: "",
          email: "",
          phone: "",
          branchPreference: "",
        });
        setBranchSearch("");
        setBranchOpen(false);
        setSubmitted(true);

        toast({
          title: heroText.form.successToastTitle,
          description: heroText.form.successToastDescription,
          variant: "success",
        });

        return;
      }

      toast({
        title: heroText.form.errorToastTitle,
        description: response.message || heroText.form.errorToastDescription,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: heroText.form.errorToastTitle,
        description: getSubmitErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="hero"
      data-ready={ready ? "true" : "false"}
      className={`landing-page fixed inset-0 z-10 flex min-h-screen items-center overflow-hidden ${
        ready ? "opacity-100" : "opacity-0"
      } transition-opacity duration-200`}
    >
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
              quality={100}
              sizes="100vw"
              className={`h-full w-full object-cover object-center ${
                i === idx ? "animate-kenburns a-paused" : ""
              }`}
            />

            <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-slate-950/30" />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {particles.map((p, i) => (
          <div
            key={i}
            className="a-paused absolute h-2 w-2 animate-float rounded-full bg-gradient-to-r from-pink-300 via-white to-amber-300 opacity-60"
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

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map((s, i) => (
          <Star
            key={i}
            className="a-paused absolute animate-twinkle text-amber-200/60 drop-shadow-lg"
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

      <nav
        ref={quickRailRef}
        aria-label={heroText.quickMenu.ariaLabel}
        onPointerMove={handleQuickRailPointerMove}
        onMouseLeave={hideQuickHand}
        onBlur={(e) => {
          const nextFocus = e.relatedTarget as Node | null;

          if (!nextFocus || !e.currentTarget.contains(nextFocus)) {
            hideQuickHand();
          }
        }}
        className="quick-rail absolute right-4 top-1/2 z-30 hidden flex-col items-end gap-2 lg:flex xl:right-6 2xl:right-8"
        style={{
          opacity: quickRailOpacity,
          transform: `translateY(-50%) scale(${quickRailScale})`,
          transformOrigin: "right center",
          pointerEvents: quickRailOpacity < 0.08 ? "none" : "auto",
        }}
      >
        <div
          className={`quick-rail-label ${
            hoveredQuickIndex !== null ? "is-compact" : ""
          }`}
        >
          <div
            className={`quick-rail-hand quick-rail-hand-menu ${
              hoveredQuickIndex !== null ? "is-hidden" : ""
            }`}
            aria-hidden="true"
          >
            👉
          </div>

          <span className="quick-rail-text">
            <span className="quick-rail-title">{heroText.quickMenu.title}</span>

            <span className="quick-rail-desc">
              <span>{heroText.quickMenu.line1}</span>
              <span>{heroText.quickMenu.line2}</span>
            </span>
          </span>
        </div>

        {hoveredQuickIndex !== null &&
          hoverHandTop !== null &&
          hoveredQuickMetrics && (
            <div
              className="quick-rail-hover-hand"
              style={
                {
                  top: `${hoverHandTop}px`,
                  "--quick-hover-hand-right": `${
                    hoveredQuickMetrics.openWidth +
                    QUICK_BTN_LAYOUT.hoverHandOffset
                  }px`,
                } as React.CSSProperties
              }
              aria-hidden="true"
            >
              <span>👉</span>
            </div>
          )}

        {quickActions.map(({ label, href, iconImage, tone }, i) => {
          const metrics = getQuickButtonMetrics(label);

          const actionHref =
            href === "#trial"
              ? localizePath(EndPoint.CONTACT, resolvedLocale)
              : href;

          return (
            <a
              key={href}
              href={actionHref}
              onMouseEnter={(e) => showQuickHand(e.currentTarget, i)}
              onMouseLeave={hideQuickHand}
              onFocus={(e) => showQuickHand(e.currentTarget, i)}
              className="quick-rail-btn group a-paused relative flex h-[56px] min-w-[56px] animate-railIn overflow-hidden rounded-full text-white backdrop-blur-md transition-all duration-300 ease-out"
              style={
                {
                  animationDelay: `${0.9 + i * 0.08}s`,
                  "--quick-from": tone.from,
                  "--quick-to": tone.to,
                  "--quick-bg": tone.bg,
                  "--quick-border": tone.border,
                  "--quick-glow": tone.glow,
                  "--quick-open-width": `${metrics.openWidth}px`,
                  "--quick-label-width": `${metrics.labelWidth}px`,
                  "--quick-side-padding": `${QUICK_BTN_LAYOUT.sidePadding}px`,
                  "--quick-icon-slot": `${QUICK_BTN_LAYOUT.iconSlot}px`,
                  "--quick-gap": `${QUICK_BTN_LAYOUT.gap}px`,
                } as React.CSSProperties
              }
            >
              <span className="quick-rail-btn-inner">
                <span className="quick-real-icon-wrap" aria-hidden="true">
                  <span className="quick-real-icon-chip">
                    <Image
                      src={iconImage}
                      alt=""
                      width={28}
                      height={28}
                      className="quick-real-icon"
                    />
                  </span>
                </span>

                <span className="quick-rail-btn-label">{label}</span>
              </span>
            </a>
          );
        })}
      </nav>

      <div
        className="relative z-20 flex h-full w-full items-center justify-center px-4 pb-24 pt-20 transition-all duration-300 sm:px-6 sm:pb-28 sm:pt-24 lg:px-12 lg:pb-0 lg:pt-28 xl:px-16 2xl:px-20"
        style={{
          opacity: Math.max(0.8, scrollOpacity),
          transform: `scale(${scrollScale})`,
          perspective: "1200px",
        }}
      >
        <div className="mx-auto flex w-full max-w-[380px] flex-col items-center justify-center gap-4 sm:max-w-md sm:gap-5">
          <div
            className="a-paused w-full animate-rise rounded-3xl border border-red-100/80 bg-white/95 p-5 shadow-2xl shadow-red-950/30 backdrop-blur-md sm:p-7"
            style={{ animationDelay: "0.25s" }}
          >
            <div className="mb-5 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-red-600">
                {heroText.form.badge}
              </p>

              <h1 className="mt-1 text-[22px] font-black leading-snug text-[#111827] sm:text-[26px]">
                {slide.title.join(" ")}
              </h1>

              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                {slide.desc}
              </p>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-red-50 px-4 py-6 text-center">
                <ShieldCheck className="size-8 text-red-600" />

                <p className="text-sm font-bold text-[#111827]">
                  {heroText.form.successTitle}
                </p>

                <p className="text-xs text-slate-500">
                  {heroText.form.successDescription}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-left">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <User size={14} className="text-red-500" />
                    {heroText.form.nameLabel}
                  </span>

                  <input
                    required
                    type="text"
                    value={form.contactName}
                    onChange={handleChange("contactName")}
                    placeholder={heroText.form.namePlaceholder}
                    className="form-input"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-left">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <Mail size={14} className="text-red-500" />
                    {heroText.form.emailLabel}
                  </span>

                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder={heroText.form.emailPlaceholder}
                    className="form-input"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-left">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <Phone size={14} className="text-red-500" />
                    {heroText.form.phoneLabel}
                  </span>

                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    placeholder={heroText.form.phonePlaceholder}
                    className="form-input"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-left">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                    <Building2 size={14} className="text-red-500" />
                    {heroText.form.branchLabel}
                  </span>

                  <div
                    className="relative"
                    onBlur={(e) => {
                      const nextFocus = e.relatedTarget as Node | null;

                      if (!nextFocus || !e.currentTarget.contains(nextFocus)) {
                        setBranchOpen(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setBranchOpen((v) => !v);
                        setBranchSearch("");
                      }}
                      className={`form-input form-select-trigger ${
                        branchOpen ? "is-open" : ""
                      }`}
                    >
                      <span
                        className={
                          selectedBranch ? "text-slate-700" : "text-slate-400"
                        }
                      >
                        {selectedBranch?.name ||
                          heroText.form.branchPlaceholder}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform duration-200 ${
                          branchOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {branchOpen && (
                      <div className="form-select-menu form-select-menu-up">
                        <input
                          autoFocus
                          value={branchSearch}
                          onChange={(e) => setBranchSearch(e.target.value)}
                          placeholder={heroText.form.branchPlaceholder}
                          className="form-select-search"
                        />

                        <div className="form-select-list">
                          {isLoadingBranches ? (
                            <div className="form-select-empty">
                              <Check size={16} />
                              <span>{heroText.form.branchLoading}</span>
                            </div>
                          ) : filteredBranches.length > 0 ? (
                            filteredBranches.map((branch) => {
                              const active =
                                form.branchPreference === branch.id;

                              return (
                                <button
                                  key={branch.id}
                                  type="button"
                                  onClick={() => handleSelectBranch(branch.id)}
                                  className={`form-select-option ${
                                    active ? "is-active" : ""
                                  }`}
                                >
                                  <span>{branch.name}</span>

                                  {active && (
                                    <Check
                                      size={18}
                                      className="form-select-check"
                                    />
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="form-select-empty">
                              <Check size={16} />
                              <span>{heroText.form.branchEmpty}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-pink-600 via-rose-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-pink-600/50 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {submitting
                    ? heroText.form.submitLoading
                    : heroText.cta.consult}

                  <Send
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <nav
        aria-label={heroText.quickMenu.title}
        className="quick-mobile-dock lg:hidden"
        style={{
          opacity: quickRailOpacity,
          transform: `translateY(${quickDockTranslateY}px) scale(${quickDockScale})`,
          transformOrigin: "center bottom",
          pointerEvents: quickRailOpacity < 0.08 ? "none" : "auto",
        }}
      >
        <div className="quick-mobile-list">
          {quickActions.map(({ label, href, iconImage, tone }) => {
            const actionHref =
              href === "#trial"
                ? localizePath(EndPoint.CONTACT, resolvedLocale)
                : href;

            return (
              <a
                key={href}
                href={actionHref}
                aria-label={label}
                title={label}
                className="quick-mobile-item"
                style={
                  {
                    "--quick-from": tone.from,
                    "--quick-to": tone.to,
                    "--quick-bg": tone.bg,
                    "--quick-border": tone.border,
                    "--quick-glow": tone.glow,
                  } as React.CSSProperties
                }
              >
                <span
                  className="quick-real-icon-wrap quick-real-icon-wrap-mobile"
                  aria-hidden="true"
                >
                  <span className="quick-real-icon-chip quick-real-icon-chip-mobile">
                    <Image
                      src={iconImage}
                      alt=""
                      width={24}
                      height={24}
                      className="quick-real-icon"
                    />
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </nav>

      <style jsx global>{`
        .form-input {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #ffffff;
          padding: 0 1rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: #111827;
          outline: none;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.2s ease;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .form-input:focus,
        .form-input.is-open {
          border-color: #ff3045;
          border: 2px solid #ff3045;
          background: #ffffff;
        }

        .form-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }

        .form-select-menu {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 999;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid #eef0f3;
          background: #ffffff;
          box-shadow:
            0 -18px 40px rgba(15, 23, 42, 0.12),
            0 -2px 8px rgba(15, 23, 42, 0.08);
        }

        .form-select-menu-up {
          bottom: calc(100% + 10px);
          top: auto;
          transform-origin: bottom center;
        }

        .form-select-list {
          max-height: 150px;
          overflow-y: auto;
          padding: 4px;
        }

        .form-select-search {
          width: calc(100% - 12px);
          height: 42px;
          margin: 6px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 0 0.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #111827;
          outline: none;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .form-select-search::placeholder {
          color: #9ca3af;
        }

        .form-select-search:focus {
          border-color: #ff3045;
          box-shadow: 0 0 0 3px rgba(255, 48, 69, 0.1);
        }

        .form-select-option,
        .form-select-empty {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border-radius: 6px;
          padding: 0.6rem 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #6b7280;
          transition:
            background-color 0.18s ease,
            color 0.18s ease;
        }

        .form-select-option:hover {
          background: #f8fafc;
          color: #111827;
        }

        .form-select-option.is-active {
          background: #fff1f2;
          color: #ff3045;
        }

        .form-select-check {
          flex-shrink: 0;
          color: #ff3045;
        }

        .form-select-empty {
          color: #9ca3af;
          cursor: default;
        }

        .quick-rail {
          width: ${QUICK_BTN_LAYOUT.railWidth}px;
          transition:
            opacity 0.24s ease,
            transform 0.24s ease;
          will-change: opacity, transform;
        }

        .quick-rail-btn {
          box-sizing: border-box;
          width: ${QUICK_BTN_LAYOUT.closedSize}px;
          padding-inline: 0;
          border-radius: 999px;
          border: 1px solid var(--quick-border);
          background: linear-gradient(
            135deg,
            var(--quick-bg),
            rgba(255, 255, 255, 0.1)
          );
          box-shadow:
            0 12px 26px rgba(15, 23, 42, 0.22),
            0 0 0 1px rgba(255, 255, 255, 0.08) inset,
            0 0 22px var(--quick-glow);
          will-change: width, background-color, transform;
          isolation: isolate;
          overflow: hidden;
        }

        .quick-rail-btn::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.18),
            rgba(255, 255, 255, 0.03)
          );
          opacity: 0.95;
          z-index: 0;
        }

        .quick-rail-btn::after {
          content: "";
          position: absolute;
          top: -20%;
          left: -130%;
          width: 72%;
          height: 140%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.28),
            transparent
          );
          transform: rotate(18deg);
          transition: left 0.55s ease;
          z-index: 1;
        }

        .quick-rail-btn > * {
          position: relative;
          z-index: 2;
        }

        .quick-rail-btn:hover,
        .quick-rail-btn:focus-visible {
          width: var(--quick-open-width);
          border-radius: 999px;
          border-color: rgba(255, 255, 255, 0.52);
          background: linear-gradient(
            135deg,
            var(--quick-from),
            var(--quick-to)
          );
          box-shadow:
            0 18px 36px var(--quick-glow),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset;
          transform: translateX(-2px) translateY(-1px);
        }

        .quick-rail-btn:hover::after,
        .quick-rail-btn:focus-visible::after {
          left: 145%;
        }

        .quick-rail-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-width: 0;
          transition:
            justify-content 0.24s ease,
            padding 0.24s ease;
        }

        .quick-rail-btn:hover .quick-rail-btn-inner,
        .quick-rail-btn:focus-visible .quick-rail-btn-inner {
          justify-content: flex-start;
          padding-left: var(--quick-side-padding);
          padding-right: var(--quick-side-padding);
          gap: var(--quick-gap);
        }

        .quick-real-icon-wrap {
          position: relative;
          display: inline-flex;
          width: var(--quick-icon-slot, 46px);
          height: 38px;
          flex: 0 0 var(--quick-icon-slot, 46px);
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.18));
        }

        .quick-real-icon-chip {
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: transparent;
          box-shadow:
            0 0 0 1px transparent inset,
            0 0 0 rgba(0, 0, 0, 0);
          transition:
            background 0.24s ease,
            box-shadow 0.24s ease,
            transform 0.24s ease;
        }

        .quick-real-icon-chip-mobile {
          width: 34px;
          height: 34px;
        }

        .quick-rail-btn:hover .quick-real-icon-chip,
        .quick-rail-btn:focus-visible .quick-real-icon-chip {
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 10px 22px rgba(15, 23, 42, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.9) inset,
            0 0 0 1px rgba(15, 23, 42, 0.03);
          transform: scale(1.04);
        }

        .quick-mobile-item:hover .quick-real-icon-chip,
        .quick-mobile-item:focus-visible .quick-real-icon-chip {
          background: rgba(255, 255, 255, 0.94);
          box-shadow:
            0 8px 18px rgba(15, 23, 42, 0.18),
            0 0 0 1px rgba(255, 255, 255, 0.85) inset;
          transform: scale(1.04);
        }

        .quick-real-icon {
          width: 28px;
          height: 28px;
          object-fit: contain;
          animation: quickIconFloat 2.6s ease-in-out infinite;
          transform-origin: center;
          transition:
            transform 0.25s ease,
            filter 0.25s ease;
        }

        .quick-mobile-item .quick-real-icon {
          width: 24px;
          height: 24px;
        }

        .quick-rail-btn:hover .quick-real-icon,
        .quick-rail-btn:focus-visible .quick-real-icon,
        .quick-mobile-item:hover .quick-real-icon,
        .quick-mobile-item:focus-visible .quick-real-icon {
          transform: scale(1.12) rotate(-4deg);
          filter: saturate(1.08) brightness(1.03);
        }

        .quick-rail-btn-label {
          flex: 0 0 var(--quick-label-width);
          width: var(--quick-label-width);
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-align: left;
          text-overflow: clip;
          font-size: 14px;
          font-weight: 850;
          line-height: 1.15;
          letter-spacing: -0.01em;
          opacity: 0;
          transition:
            max-width 0.3s ease,
            opacity 0.24s ease;
        }

        .quick-rail-btn:hover .quick-rail-btn-label,
        .quick-rail-btn:focus-visible .quick-rail-btn-label {
          max-width: var(--quick-label-width);
          opacity: 1;
        }

        .quick-real-icon-wrap-mobile {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
        }

        .quick-rail-label {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          width: 270px;
          margin-bottom: 10px;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.38);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.22),
            rgba(255, 255, 255, 0.1)
          );
          padding: 14px 16px;
          color: #ffffff;
          box-shadow:
            0 18px 42px rgba(15, 23, 42, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(16px);
          transition:
            gap 0.22s ease,
            padding 0.22s ease;
        }

        .quick-rail-label.is-compact {
          gap: 0;
        }

        .quick-rail-label::before {
          content: "";
          position: absolute;
          inset: -1px;
          z-index: -1;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(255, 48, 69, 0.8),
            rgba(255, 255, 255, 0.18)
          );
          opacity: 0.45;
        }

        .quick-rail-hand {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          line-height: 1;
          filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.18));
          animation: quickHandPointRight 1.25s ease-in-out infinite;
        }

        .quick-rail-hand-menu {
          width: 34px;
          flex: 0 0 34px;
          overflow: hidden;
          transition:
            opacity 0.18s ease,
            transform 0.18s ease,
            width 0.22s ease,
            flex-basis 0.22s ease;
        }

        .quick-rail-hand-menu.is-hidden {
          opacity: 0;
          transform: scale(0.72);
          width: 0;
          flex-basis: 0;
        }

        .quick-rail-hover-hand {
          position: absolute;
          right: var(--quick-hover-hand-right);
          z-index: 5;
          transform: translateY(-50%);
          transition:
            top 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            right 0.26s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }

        .quick-rail-hover-hand span {
          display: block;
          font-size: 32px;
          line-height: 1;
          filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.25));
          animation: quickHandPointRight 1s ease-in-out infinite;
        }

        .quick-rail-text {
          display: flex;
          flex-direction: column;
          line-height: 1.12;
        }

        .quick-rail-title {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        .quick-rail-desc {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 5px;
          margin-left: -2px;
          font-size: 11.5px;
          line-height: 1.18;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.82);
        }

        .quick-mobile-dock {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 35;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(92, 18, 24, 0.54);
          box-shadow:
            0 18px 42px rgba(15, 23, 42, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(16px);
          transition:
            opacity 0.24s ease,
            transform 0.24s ease;
        }

        .quick-mobile-list {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 10px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
        }

        .quick-mobile-list::-webkit-scrollbar {
          display: none;
        }

        .quick-mobile-item {
          position: relative;
          display: inline-flex;
          width: 48px;
          height: 48px;
          min-width: 48px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          scroll-snap-align: center;
          border-radius: 999px;
          border: 1px solid var(--quick-border);
          background: linear-gradient(
            135deg,
            var(--quick-bg),
            rgba(255, 255, 255, 0.1)
          );
          color: #ffffff;
          box-shadow:
            0 10px 20px rgba(15, 23, 42, 0.18),
            0 0 20px var(--quick-glow),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transition:
            background-color 0.18s ease,
            transform 0.18s ease,
            border-color 0.18s ease,
            box-shadow 0.18s ease;
          isolation: isolate;
        }

        .quick-mobile-item::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.18),
            rgba(255, 255, 255, 0.03)
          );
          z-index: 0;
        }

        .quick-mobile-item > * {
          position: relative;
          z-index: 1;
        }

        .quick-mobile-item:hover,
        .quick-mobile-item:focus-visible {
          background: linear-gradient(
            135deg,
            var(--quick-from),
            var(--quick-to)
          );
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .quick-mobile-item:active {
          transform: scale(0.94);
          background: linear-gradient(
            135deg,
            var(--quick-from),
            var(--quick-to)
          );
          border-color: rgba(255, 255, 255, 0.45);
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .quick-mobile-dock {
            left: 50%;
            right: auto;
            bottom: 18px;
            width: min(520px, calc(100vw - 48px));
            transform-origin: center bottom;
            translate: -50% 0;
          }

          .quick-mobile-list {
            justify-content: flex-start;
            gap: 12px;
            padding: 12px;
          }

          .quick-mobile-item {
            width: 52px;
            height: 52px;
            min-width: 52px;
          }

          .quick-real-icon-wrap-mobile {
            width: 32px;
            height: 32px;
            flex: 0 0 32px;
          }
        }

        @keyframes quickIconFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-2px) rotate(-2deg);
          }
        }

        @keyframes quickHandPointRight {
          0%,
          100% {
            transform: translateX(-2px) scale(1);
          }

          50% {
            transform: translateX(6px) scale(1.06);
          }
        }

        @keyframes railIn {
          from {
            opacity: 0;
            transform: translateX(24px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-railIn {
          animation: railIn 0.6s ease-out both;
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

        .animate-twinkle {
          animation: twinkle 2.6s ease-in-out infinite;
          display: inline-block;
          transform-origin: center;
          will-change: transform, opacity;
        }

        .a-paused {
          animation-play-state: paused !important;
        }

        [data-ready="true"] .a-paused {
          animation-play-state: running !important;
        }
      `}</style>

      <style jsx>{`
        @keyframes kenburns {
          0% {
            transform: scale(1);
          }

          100% {
            transform: scale(1.03);
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

        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-rise {
          animation: rise 0.8s ease-out both;
          will-change: opacity, transform;
        }
      `}</style>
    </section>
  );
}

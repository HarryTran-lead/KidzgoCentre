"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { COURSES } from "@/lib/data/data";
import {
  ArrowRight,
  Baby,
  BookOpen,
  GraduationCap,
  Grid2X2,
  Headphones,
  Laptop,
  LayoutList,
  Mic2,
  Sparkles,
} from "lucide-react";
import { getMessages } from "@/lib/dict";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import SectionTitle from "./SectionTitle";
import SectionWaveTop from "./SectionWaveTop";

type ViewMode = "grid" | "list";

type CourseTheme =
  | "rose"
  | "amber"
  | "sky"
  | "emerald"
  | "violet"
  | "orange"
  | "cyan";

type CourseItem = {
  id?: string | number;
  slug?: string;
  title?: string;
  desc?: string;
  description?: string;
  content?: string;
  level?: string;
  time?: string;
  badge?: string;
  href?: string;
  cta?: string;
  highlight?: boolean;
  theme?: CourseTheme;
};

const COURSE_ICONS = [
  Baby,
  GraduationCap,
  BookOpen,
  Headphones,
  Laptop,
  Mic2,
  Sparkles,
];

const COURSE_THEME_ORDER: CourseTheme[] = [
  "rose",
  "amber",
  "sky",
  "emerald",
  "violet",
  "orange",
  "cyan",
];

const COURSE_THEME_CLASSES: Record<
  CourseTheme,
  {
    border: string;
    ring: string;
    glow: string;
    gradient: string;
    icon: string;
    iconHover: string;
    bubbleOne: string;
    bubbleTwo: string;
    titleHover: string;
    badge: string;
    ctaText: string;
    ctaHover: string;
  }
> = {
  rose: {
    border: "border-rose-200/95",
    ring: "ring-rose-100/90",
    glow: "hover:border-rose-300 hover:shadow-rose-200/80",
    gradient: "bg-gradient-to-br from-white via-white to-rose-50/80",
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    iconHover: "group-hover:bg-rose-600 group-hover:text-white",
    bubbleOne: "bg-rose-100/80",
    bubbleTwo: "bg-rose-100/70",
    titleHover: "group-hover:text-rose-700",
    badge: "bg-rose-50 text-rose-700 ring-rose-100",
    ctaText: "text-rose-700",
    ctaHover: "hover:bg-rose-600 hover:text-white hover:shadow-rose-600/25",
  },
  amber: {
    border: "border-amber-300/95",
    ring: "ring-amber-100/90",
    glow: "hover:border-amber-400 hover:shadow-amber-200/85",
    gradient: "bg-gradient-to-br from-white via-white to-amber-50/80",
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    iconHover: "group-hover:bg-amber-500 group-hover:text-white",
    bubbleOne: "bg-amber-100/80",
    bubbleTwo: "bg-amber-100/70",
    titleHover: "group-hover:text-amber-700",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    ctaText: "text-amber-700",
    ctaHover: "hover:bg-amber-500 hover:text-white hover:shadow-amber-600/25",
  },
  sky: {
    border: "border-indigo-200/95",
    ring: "ring-indigo-100/90",
    glow: "hover:border-indigo-300 hover:shadow-indigo-200/80",
    gradient: "bg-gradient-to-br from-white via-white to-indigo-50/85",
    icon: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    iconHover: "group-hover:bg-indigo-600 group-hover:text-white",
    bubbleOne: "bg-indigo-100/80",
    bubbleTwo: "bg-indigo-100/70",
    titleHover: "group-hover:text-indigo-700",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    ctaText: "text-indigo-700",
    ctaHover:
      "hover:bg-indigo-600 hover:text-white hover:shadow-indigo-600/25",
  },
  emerald: {
    border: "border-emerald-200/95",
    ring: "ring-emerald-100/90",
    glow: "hover:border-emerald-300 hover:shadow-emerald-200/80",
    gradient: "bg-gradient-to-br from-white via-white to-emerald-50/80",
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    iconHover: "group-hover:bg-emerald-600 group-hover:text-white",
    bubbleOne: "bg-emerald-100/80",
    bubbleTwo: "bg-emerald-100/70",
    titleHover: "group-hover:text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    ctaText: "text-emerald-700",
    ctaHover:
      "hover:bg-emerald-600 hover:text-white hover:shadow-emerald-600/25",
  },
  violet: {
    border: "border-violet-200/95",
    ring: "ring-violet-100/90",
    glow: "hover:border-violet-300 hover:shadow-violet-200/80",
    gradient: "bg-gradient-to-br from-white via-white to-violet-50/80",
    icon: "bg-violet-50 text-violet-600 ring-violet-100",
    iconHover: "group-hover:bg-violet-600 group-hover:text-white",
    bubbleOne: "bg-violet-100/80",
    bubbleTwo: "bg-violet-100/70",
    titleHover: "group-hover:text-violet-700",
    badge: "bg-violet-50 text-violet-700 ring-violet-100",
    ctaText: "text-violet-700",
    ctaHover: "hover:bg-violet-600 hover:text-white hover:shadow-violet-600/25",
  },
  orange: {
    border: "border-orange-200/95",
    ring: "ring-orange-100/90",
    glow: "hover:border-orange-300 hover:shadow-orange-200/80",
    gradient: "bg-gradient-to-br from-white via-white to-orange-50/80",
    icon: "bg-orange-50 text-orange-600 ring-orange-100",
    iconHover: "group-hover:bg-orange-500 group-hover:text-white",
    bubbleOne: "bg-orange-100/80",
    bubbleTwo: "bg-orange-100/70",
    titleHover: "group-hover:text-orange-700",
    badge: "bg-orange-50 text-orange-700 ring-orange-100",
    ctaText: "text-orange-700",
    ctaHover: "hover:bg-orange-500 hover:text-white hover:shadow-orange-600/25",
  },
  cyan: {
    border: "border-teal-200/95",
    ring: "ring-teal-100/90",
    glow: "hover:border-teal-300 hover:shadow-teal-200/80",
    gradient: "bg-gradient-to-br from-white via-white to-teal-50/85",
    icon: "bg-teal-50 text-teal-600 ring-teal-100",
    iconHover: "group-hover:bg-teal-600 group-hover:text-white",
    bubbleOne: "bg-teal-100/80",
    bubbleTwo: "bg-teal-100/70",
    titleHover: "group-hover:text-teal-700",
    badge: "bg-teal-50 text-teal-700 ring-teal-100",
    ctaText: "text-teal-700",
    ctaHover: "hover:bg-teal-600 hover:text-white hover:shadow-teal-600/25",
  },
};

const COURSE_CTA_BASE_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white/95 px-4 text-[14px] font-bold shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]";

const COURSE_LIST_CTA_CLASS =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-[15px] border border-slate-200 bg-white/95 px-3 text-[13px] font-bold shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]";

export default function Courses() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const isVietnamese = locale === "vi";
  const coursesText = getMessages(locale).coursesSection;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const courses = useMemo(() => {
    const normalizedCourses = (COURSES as CourseItem[]).map((course, index) => {
      const Icon = COURSE_ICONS[index % COURSE_ICONS.length];
      const theme =
        course.theme ?? COURSE_THEME_ORDER[index % COURSE_THEME_ORDER.length];
      const localizedCourse = coursesText.items[index];

      return {
        id: course.id ?? course.slug ?? course.title ?? index,
        title:
          localizedCourse?.title ??
          course.title ??
          coursesText.defaults.title,
        desc:
          localizedCourse?.desc ??
          course.desc ??
          course.description ??
          course.content ??
          coursesText.defaults.desc,
        badge:
          localizedCourse?.badge ??
          course.badge ??
          coursesText.defaults.badge,
        href: course.href ?? "#contact",
        cta:
          localizedCourse?.cta ??
          course.cta ??
          coursesText.defaults.cta,
        highlight: course.highlight ?? false,
        theme,
        Icon,
      };
    });

    const displayOrder = [0, 1, 3, 2, 4, 5, 6];

    return displayOrder
      .map((courseIndex) => normalizedCourses[courseIndex])
      .filter((course): course is (typeof normalizedCourses)[number] =>
        Boolean(course),
      );
  }, [coursesText]);

  const renderGridCourseCard = ({
    id,
    title,
    desc,
    badge,
    href,
    cta,
    highlight,
    theme,
    Icon,
  }: (typeof courses)[number]) => {
    const themeClass = COURSE_THEME_CLASSES[theme];

    return (
      <article
        key={id}
        className={[
          "course-card group relative flex min-h-[315px] w-full flex-col overflow-hidden border-[1.5px] rounded-3xl bg-white/92 p-5 shadow-md backdrop-blur-sm ring-1 ring-inset",
          "md:w-[calc((100%_-_1.25rem)/2)] xl:w-[calc((100%_-_3.75rem)/4)]",
          "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-xl",
          themeClass.border,
          themeClass.ring,
          themeClass.glow,
          highlight ? "ring-2 ring-amber-200/80" : "",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute inset-0",
            themeClass.gradient,
          ].join(" ")}
        />

        <div
          className={[
            "pointer-events-none absolute -right-9 -top-9 size-24 rounded-full transition-transform duration-500 group-hover:scale-125",
            themeClass.bubbleOne,
          ].join(" ")}
        />

        <div
          className={[
            "pointer-events-none absolute -bottom-10 -left-10 size-24 rounded-full transition-transform duration-500 group-hover:scale-125",
            themeClass.bubbleTwo,
          ].join(" ")}
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div
              className={[
                "flex size-12 items-center justify-center rounded-[18px] ring-1 shadow-sm transition-all duration-500",
                themeClass.icon,
                themeClass.iconHover,
              ].join(" ")}
            >
              <Icon size={22} strokeWidth={2.4} />
            </div>

            <span
              className={[
                "inline-flex max-w-[180px] items-center rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] ring-1",
                themeClass.badge,
              ].join(" ")}
            >
              {badge}
            </span>
          </div>

          <h3
            className={[
              "text-[21px] font-black leading-tight text-[#111827] transition-colors duration-300 sm:text-[23px]",
              themeClass.titleHover,
            ].join(" ")}
          >
            {title}
          </h3>

          <p className="mt-3 text-[14px] leading-6 text-slate-600">{desc}</p>

          <div className="mt-auto pt-4">
            <a
              href={href}
              className={[
                COURSE_CTA_BASE_CLASS,
                "w-full",
                themeClass.ctaText,
                themeClass.ctaHover,
              ].join(" ")}
            >
              {cta}
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </div>
        </div>
      </article>
    );
  };

  return (
    <section
      id="courses"
      className="courses-page relative z-40 -mt-px overflow-visible pb-32 pt-12 scroll-mt-24 sm:pb-36 sm:pt-14 lg:pb-40 lg:pt-16"
      style={{
        backgroundColor: "#d9f1ff",
        backgroundImage: `
          url('/image/timeline-end-green-front.svg'),
          radial-gradient(circle at 16% 34%, rgba(125, 211, 252, 0.18) 0%, transparent 28%),
          radial-gradient(circle at 88% 82%, rgba(168, 230, 207, 0.24) 0%, transparent 22%)
        `,
        backgroundRepeat: "no-repeat, no-repeat, no-repeat",
        backgroundPosition: "bottom center, left top, right bottom",
        backgroundSize: "100% auto, auto, auto",
      }}
    >
      <SectionWaveTop fill="#d9f1ff" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <div className="hidden lg:block" />

          <div className="mx-auto max-w-3xl text-center">
            <SectionTitle
              leading={coursesText.title.leading}
              accent={coursesText.title.accent}
            />

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {coursesText.description}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end lg:pt-1">
            <div
              className={[
                "relative inline-flex h-12 items-center rounded-[22px] border border-red-100 bg-white/90 p-1.5 shadow-lg shadow-red-100/70 backdrop-blur-md",
                isVietnamese ? "min-w-[264px]" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-1.5 top-1.5 h-9 rounded-[16px] bg-red-600 shadow-lg",
                  "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isVietnamese ? "w-[124px]" : "w-[86px]",
                  viewMode === "grid"
                    ? "translate-x-0"
                    : isVietnamese
                      ? "translate-x-[128px]"
                      : "translate-x-[90px]",
                ].join(" ")}
              />

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={[
                  "relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-[16px] text-xs font-black",
                  isVietnamese ? "w-[124px]" : "w-[86px]",
                  "transition-colors duration-300",
                  viewMode === "grid"
                    ? "text-white"
                    : "text-slate-700 hover:text-red-700",
                ].join(" ")}
              >
                <Grid2X2 size={15} strokeWidth={2.4} />
                {coursesText.viewMode.grid}
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={[
                  "relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-[16px] text-xs font-black",
                  isVietnamese ? "w-[124px]" : "w-[86px]",
                  "transition-colors duration-300",
                  viewMode === "list"
                    ? "text-white"
                    : "text-slate-700 hover:text-red-700",
                ].join(" ")}
              >
                <LayoutList size={15} strokeWidth={2.4} />
                {coursesText.viewMode.list}
              </button>
            </div>
          </div>
        </div>

        <div key={viewMode} className="course-view-panel">
          {viewMode === "grid" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-center gap-5">
                {courses.slice(0, 3).map(renderGridCourseCard)}
              </div>

              <div className="flex flex-wrap justify-center gap-5">
                {courses.slice(3).map(renderGridCourseCard)}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {courses.map(
                ({
                  id,
                  title,
                  desc,
                  badge,
                  href,
                  cta,
                  highlight,
                  theme,
                  Icon,
                }) => {
                  const themeClass = COURSE_THEME_CLASSES[theme];

                  return (
                    <article
                      key={id}
                      className={[
                        "course-list-card group relative overflow-hidden border-[1.5px] bg-white/92 p-4 shadow-md backdrop-blur-sm ring-1 ring-inset",
                        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-xl",
                        themeClass.border,
                        themeClass.ring,
                        themeClass.glow,
                        highlight ? "ring-2 ring-amber-200/80" : "",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "pointer-events-none absolute inset-0",
                          themeClass.gradient,
                        ].join(" ")}
                      />

                      <div
                        className={[
                          "pointer-events-none absolute -right-9 -top-9 size-20 rounded-full",
                          themeClass.bubbleOne,
                        ].join(" ")}
                      />

                      <div
                        className={[
                          "pointer-events-none absolute -bottom-10 -left-10 size-20 rounded-full",
                          themeClass.bubbleTwo,
                        ].join(" ")}
                      />

                      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div
                          className={[
                            "flex size-10 shrink-0 items-center justify-center rounded-[16px] ring-1 shadow-sm transition-all duration-500",
                            themeClass.icon,
                            themeClass.iconHover,
                          ].join(" ")}
                        >
                          <Icon size={20} strokeWidth={2.4} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ring-1",
                                themeClass.badge,
                              ].join(" ")}
                            >
                              {badge}
                            </span>
                          </div>

                          <h3
                            className={[
                              "text-[19px] font-black leading-snug text-[#111827] transition-colors duration-300 sm:text-[21px]",
                              themeClass.titleHover,
                            ].join(" ")}
                          >
                            {title}
                          </h3>

                          <p className="mt-1 text-[13px] leading-5 text-slate-600">
                            {desc}
                          </p>
                        </div>

                        <a
                          href={href}
                          className={[
                            COURSE_LIST_CTA_CLASS,
                            "shrink-0 sm:min-w-[112px]",
                            themeClass.ctaText,
                            themeClass.ctaHover,
                          ].join(" ")}
                        >
                          {cta}
                          <ArrowRight
                            size={14}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </a>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .course-card {
          border-radius: 32px;
        }

        .course-list-card {
          border-radius: 24px;
        }

        @keyframes coursePanelIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.99);
            filter: blur(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .course-view-panel {
          animation: coursePanelIn 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @media (max-width: 767px) {
          .course-card {
            min-height: 300px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .course-view-panel {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
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
  Target,
} from "lucide-react";

type ViewMode = "grid" | "list";

type CourseItem = {
  id?: string | number;
  slug?: string;
  title?: string;
  desc?: string;
  description?: string;
  content?: string;
  audience?: string;
  target?: string;
  level?: string;
  href?: string;
  cta?: string;
  highlight?: boolean;
};

const COURSE_ICONS = [Baby, GraduationCap, BookOpen, Headphones, Laptop, Mic2];

const COURSE_CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-bold text-red-700 shadow-sm shadow-red-100/60 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-slate-800 hover:text-white hover:shadow-lg hover:shadow-red-600/20 active:translate-y-0 active:scale-[0.99]";

export default function Courses() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const courses = useMemo(() => {
    return (COURSES as CourseItem[]).slice(0, 6).map((course, index) => {
      const Icon = COURSE_ICONS[index % COURSE_ICONS.length];

      return {
        id: course.id ?? course.slug ?? course.title ?? index,
        title: course.title ?? "Khóa học Rex",
        desc:
          course.desc ??
          course.description ??
          course.content ??
          "Chương trình học được thiết kế phù hợp với năng lực và mục tiêu của từng học viên.",
        audience:
          course.audience ??
          course.target ??
          course.level ??
          "Học viên theo lộ trình Rex",
        href: course.href ?? "#contact",
        cta: course.cta ?? "Nhận tư vấn",
        Icon,
      };
    });
  }, []);

  return (
    <section
      id="courses"
      className="courses-page relative z-40 -mt-px overflow-visible pb-32 pt-12 scroll-mt-24 sm:pb-36 sm:pt-14 lg:pb-40 lg:pt-16"
      style={{
        backgroundColor: "#f0f9ff",
        backgroundImage: `
      url('/image/timeline-end-green-front.svg'),
     
      radial-gradient(circle at 90% 80%, rgba(168, 230, 207, 0.15) 0%, transparent 20%)
    `,
        backgroundRepeat: "no-repeat, no-repeat, no-repeat",
        backgroundPosition: "bottom center, top left, bottom right",
        backgroundSize: "100% auto, auto, auto",
      }}
    >
      <div className="pointer-events-none absolute left-0 top-0 z-0 w-full -translate-y-[99%] leading-none">
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-[90px] w-full sm:h-[110px] lg:h-[120px]"
          preserveAspectRatio="none"
        >
          <path
            d="M0,70 C180,25 360,110 540,70 C720,30 900,105 1080,70 C1260,35 1350,50 1440,35 L1440,120 L0,120 Z"
            fill="#f0f9ff"
          />
        </svg>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-9 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          <div className="hidden lg:block" />

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/85 px-4 py-2 text-xs font-bold uppercase text-[#111827] shadow-sm shadow-red-200/50 backdrop-blur">
              <Target className="size-4 text-red-600" />
              Chương trình học tại Rex
            </div>

            <h2 className="text-3xl font-black tracking-tight text-[#111827] sm:text-4xl lg:text-[2.65rem]">
              Khóa học{" "}
              <span className="bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                nổi bật
              </span>
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Các chương trình được thiết kế theo từng độ tuổi và mục tiêu học,
              giúp phụ huynh dễ dàng chọn lộ trình phù hợp cho con.
            </p>
          </div>

          {/* Switch Grid/List giống mẫu segmented button */}
          <div className="flex justify-center lg:justify-end lg:pt-1">
            <div className="relative inline-flex h-12 items-center rounded-[22px] border border-red-100 bg-white/90 p-1.5 shadow-lg shadow-red-100/70 backdrop-blur-md">
              <span
                className={[
                  "absolute left-1.5 top-1.5 h-9 w-[86px] rounded-[16px] bg-red-600 shadow-lg ",
                  "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  viewMode === "grid" ? "translate-x-0" : "translate-x-[90px]",
                ].join(" ")}
              />

              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={[
                  "relative z-10 inline-flex h-9 w-[86px] items-center justify-center gap-1.5 rounded-[16px] text-xs font-black",
                  "transition-colors duration-300",
                  viewMode === "grid"
                    ? "text-white"
                    : "text-slate-700 hover:text-red-700",
                ].join(" ")}
              >
                <Grid2X2 size={15} strokeWidth={2.4} />
                Grid
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={[
                  "relative z-10 inline-flex h-9 w-[86px] items-center justify-center gap-1.5 rounded-[16px] text-xs font-black",
                  "transition-colors duration-300",
                  viewMode === "list"
                    ? "text-white"
                    : "text-slate-700 hover:text-red-700",
                ].join(" ")}
              >
                <LayoutList size={15} strokeWidth={2.4} />
                List
              </button>
            </div>
          </div>
        </div>

        <div key={viewMode} className="course-view-panel">
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map(
                ({ id, title, desc, audience, href, cta, Icon }) => (
                  <article
                    key={id}
                    className={[
                      "course-card group relative flex h-full min-h-[255px] flex-col overflow-hidden border bg-white/92 p-5 shadow-md  backdrop-blur-sm",
                      "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-600/12",
                      "border-red-100/80",
                    ].join(" ")}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white via-white to-red-50/45" />

                    <div className="pointer-events-none absolute -right-6 -top-6 size-12 rounded-full bg-rose-100/75 transition-transform duration-500 group-hover:scale-120" />

                    <div className="pointer-events-none absolute -bottom-8 -left-8 size-14 rounded-full bg-rose-100/65 transition-transform duration-500 group-hover:scale-120" />
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100 transition-all duration-500 group-hover:bg-red-600 group-hover:text-white">
                        <Icon size={22} strokeWidth={2.4} />
                      </div>

                      <h3 className="text-lg font-black leading-snug text-[#111827] transition-colors duration-300 group-hover:text-red-700">
                        {title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {desc}
                      </p>

                      <div className="mt-4 rounded-[20px] border border-slate-200 bg-white/75 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Đối tượng phù hợp
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {audience}
                        </p>
                      </div>

                      <div className="mt-auto pt-4">
                        <a href={href} className={`${COURSE_CTA_CLASS} w-full`}>
                          {cta}
                          <ArrowRight
                            size={16}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </a>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {courses.map(
                ({ id, title, desc, audience, href, cta, Icon }) => (
                  <article
                    key={id}
                    className={[
                      "course-list-card group relative overflow-hidden border bg-white/92 p-4 shadow-md backdrop-blur-sm",
                      "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-red-200 hover:shadow-xl hover:shadow-red-600/12",
                      "border-red-100/80",
                    ].join(" ")}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white via-white to-red-50/55" />

                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100 transition-all duration-500 group-hover:bg-red-600 group-hover:text-white">
                        <Icon size={21} strokeWidth={2.4} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black leading-snug text-[#111827] transition-colors duration-300 group-hover:text-red-700 sm:text-lg">
                            {title}
                          </h3>
                        </div>

                        <p className="mt-1 line-clamp-1 text-sm leading-6 text-slate-600">
                          {desc}
                        </p>

                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                          Đối tượng:{" "}
                          <span className="normal-case tracking-normal text-slate-800">
                            {audience}
                          </span>
                        </p>
                      </div>

                      <a
                        href={href}
                        className={`${COURSE_CTA_CLASS} shrink-0 sm:min-w-[124px]`}
                      >
                        {cta}
                        <ArrowRight
                          size={16}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </a>
                    </div>
                  </article>
                ),
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
          border-radius: 26px;
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

        @media (prefers-reduced-motion: reduce) {
          .course-view-panel {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

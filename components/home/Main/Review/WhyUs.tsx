"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Gift,
  HeartHandshake,
  MessageCircle,
  SmilePlus,
  Target,
} from "lucide-react";
import { getMessages } from "@/lib/dict";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import SectionTitle from "./SectionTitle";

const FALLBACK_ICONS = [
  Target,
  HeartHandshake,
  SmilePlus,
  MessageCircle,
  BarChart3,
  Gift,
];

type WhyTheme = {
  border: string;
  hoverBorder: string;
  cardBg: string;
  topLine: string;
  iconBox: string;
  iconDot: string;
  titleHover: string;
  dot: string;
  bottomLine: string;
  sparkle: string;
};

const WHY_THEMES: WhyTheme[] = [
  {
    border: "border-rose-200/95",
    hoverBorder: "hover:border-rose-400 hover:shadow-rose-200/70",
    cardBg: "bg-linear-to-br from-white via-white to-rose-50/55",
    topLine: "bg-linear-to-r from-rose-600 via-red-500 to-rose-300",
    iconBox: "bg-rose-50 text-rose-600 ring-rose-100 shadow-rose-100",
    iconDot: "bg-white text-rose-600 ring-rose-100",
    titleHover: "group-hover:text-rose-700",
    dot: "bg-rose-600 shadow-rose-600/25",
    bottomLine: "via-rose-200/80",
    sparkle: "text-rose-400",
  },
  {
    border: "border-amber-200/95",
    hoverBorder: "hover:border-amber-400 hover:shadow-amber-200/70",
    cardBg: "bg-linear-to-br from-white via-white to-amber-50/60",
    topLine: "bg-linear-to-r from-amber-500 via-orange-400 to-yellow-300",
    iconBox: "bg-amber-50 text-amber-600 ring-amber-100 shadow-amber-100",
    iconDot: "bg-white text-amber-600 ring-amber-100",
    titleHover: "group-hover:text-amber-700",
    dot: "bg-amber-500 shadow-amber-600/25",
    bottomLine: "via-amber-200/80",
    sparkle: "text-amber-400",
  },
  {
    border: "border-emerald-200/95",
    hoverBorder: "hover:border-emerald-400 hover:shadow-emerald-200/70",
    cardBg: "bg-linear-to-br from-white via-white to-emerald-50/60",
    topLine: "bg-linear-to-r from-emerald-600 via-teal-500 to-green-300",
    iconBox:
      "bg-emerald-50 text-emerald-600 ring-emerald-100 shadow-emerald-100",
    iconDot: "bg-white text-emerald-600 ring-emerald-100",
    titleHover: "group-hover:text-emerald-700",
    dot: "bg-emerald-600 shadow-emerald-600/25",
    bottomLine: "via-emerald-200/80",
    sparkle: "text-emerald-400",
  },
  {
    border: "border-sky-200/95",
    hoverBorder: "hover:border-sky-400 hover:shadow-sky-200/70",
    cardBg: "bg-linear-to-br from-white via-white to-sky-50/60",
    topLine: "bg-linear-to-r from-sky-600 via-cyan-500 to-blue-300",
    iconBox: "bg-sky-50 text-sky-600 ring-sky-100 shadow-sky-100",
    iconDot: "bg-white text-sky-600 ring-sky-100",
    titleHover: "group-hover:text-sky-700",
    dot: "bg-sky-600 shadow-sky-600/25",
    bottomLine: "via-sky-200/80",
    sparkle: "text-sky-400",
  },
  {
    border: "border-violet-200/95",
    hoverBorder: "hover:border-violet-400 hover:shadow-violet-200/70",
    cardBg: "bg-linear-to-br from-white via-white to-violet-50/60",
    topLine: "bg-linear-to-r from-violet-600 via-purple-500 to-fuchsia-300",
    iconBox: "bg-violet-50 text-violet-600 ring-violet-100 shadow-violet-100",
    iconDot: "bg-white text-violet-600 ring-violet-100",
    titleHover: "group-hover:text-violet-700",
    dot: "bg-violet-600 shadow-violet-600/25",
    bottomLine: "via-violet-200/80",
    sparkle: "text-violet-400",
  },
  {
    border: "border-orange-200/95",
    hoverBorder: "hover:border-orange-400 hover:shadow-orange-200/70",
    cardBg: "bg-linear-to-br from-white via-white to-orange-50/60",
    topLine: "bg-linear-to-r from-orange-600 via-red-500 to-amber-300",
    iconBox: "bg-orange-50 text-orange-600 ring-orange-100 shadow-orange-100",
    iconDot: "bg-white text-orange-600 ring-orange-100",
    titleHover: "group-hover:text-orange-700",
    dot: "bg-orange-600 shadow-orange-600/25",
    bottomLine: "via-orange-200/80",
    sparkle: "text-orange-400",
  },
];

const WHY_CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#111827] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-red-600/25 active:translate-y-0 active:scale-[0.99]";

type DesktopNode = {
  reasonIndex: number;
  className: string;
  dotTop?: boolean;
  dotBottom?: boolean;
};

const DESKTOP_NODES: DesktopNode[] = [
  {
    reasonIndex: 0,
    className: "left-[3.5%] top-0",
    dotBottom: true,
  },
  {
    reasonIndex: 3,
    className: "left-[17.5%] top-[246px]",
    dotTop: true,
  },
  {
    reasonIndex: 1,
    className: "left-[31.5%] top-0",
    dotBottom: true,
  },
  {
    reasonIndex: 4,
    className: "left-[45.5%] top-[246px]",
    dotTop: true,
  },
  {
    reasonIndex: 2,
    className: "left-[59.5%] top-0",
    dotBottom: true,
  },
  {
    reasonIndex: 5,
    className: "left-[73.5%] top-[246px]",
    dotTop: true,
  },
];

function getStickerPath(index: number) {
  const stickerNumber = (index % 18) + 1;
  return `/sticker/${stickerNumber}.png`;
}

function WhyCard({
  title,
  desc,
  index,
  dotTop = false,
  dotBottom = false,
}: {
  title: string;
  desc: string;
  index: number;
  dotTop?: boolean;
  dotBottom?: boolean;
}) {
  const Icon = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  const theme = WHY_THEMES[index % WHY_THEMES.length];

  return (
    <article
      className={[
        "why-card group relative isolate overflow-visible rounded-[26px] border-[1.5px] bg-white p-4 shadow-md",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1.5 hover:shadow-2xl sm:p-5 xl:h-[188px]",
        theme.border,
        theme.hoverBorder,
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute inset-0 rounded-[26px] opacity-95 transition-opacity duration-500 group-hover:opacity-100",
          theme.cardBg,
        ].join(" ")}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
        <span className="why-card-shine absolute inset-y-0 -left-1/2 z-10 w-1/2 rotate-12 bg-linear-to-r from-transparent via-white/80 to-transparent opacity-0" />
      </div>

      <div className="why-top-line absolute left-5 right-5 top-0 h-1.5 overflow-hidden rounded-b-full bg-slate-100/70">
        <span
          className={[
            "absolute inset-0 origin-left scale-x-100 rounded-b-full",
            theme.topLine,
          ].join(" ")}
        />
        <span className="why-line-runner absolute inset-y-0 left-0 w-1/3 -translate-x-full rounded-full bg-white/90 blur-[1px]" />
      </div>

      <span
        className={[
          "why-sparkle why-sparkle-1 absolute -left-2 bottom-9 z-20 opacity-0",
          theme.sparkle,
        ].join(" ")}
      >
        {"\u2726"}
      </span>

      <span
        className={[
          "why-sparkle why-sparkle-2 absolute -right-2 top-11 z-20 opacity-0",
          theme.sparkle,
        ].join(" ")}
      >
        {"\u2727"}
      </span>

      <span
        className={[
          "why-sparkle why-sparkle-3 absolute right-8 -bottom-2 z-20 opacity-0",
          theme.sparkle,
        ].join(" ")}
      >
        {"\u2726"}
      </span>

      {dotBottom && (
        <span
          className={[
            "absolute bottom-0 left-1/2 z-30 size-3.5 -translate-x-1/2 translate-y-1/2 rounded-full ring-4 ring-white shadow-md",
            theme.dot,
          ].join(" ")}
        />
      )}

      {dotTop && (
        <span
          className={[
            "absolute left-1/2 top-0 z-30 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white shadow-md",
            theme.dot,
          ].join(" ")}
        />
      )}

      <div className="relative z-20 flex items-start gap-4">
        <div
          className={[
            "relative grid size-[56px] shrink-0 place-items-center rounded-[20px] ring-1 shadow-sm transition-all duration-500 group-hover:scale-105",
            theme.iconBox,
          ].join(" ")}
        >
          <Image
            src={getStickerPath(index)}
            alt={title}
            width={56}
            height={56}
            className="h-10 w-10 object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
            priority={index < 3}
          />

          <div
            className={[
              "absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full ring-1 shadow-sm",
              theme.iconDot,
            ].join(" ")}
          >
            <Icon size={11} strokeWidth={2.5} />
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h3
            className={[
              "why-title text-[16px] font-black leading-snug text-[#111827] transition-colors duration-300 sm:text-[17px]",
              theme.titleHover,
            ].join(" ")}
          >
            {title}
          </h3>

          <p className="why-desc mt-2 text-[14px] leading-6 text-slate-600">
            {desc}
          </p>
        </div>
      </div>

      <div
        className={[
          "pointer-events-none absolute inset-x-5 bottom-0 h-px bg-linear-to-r from-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          theme.bottomLine,
        ].join(" ")}
      />
    </article>
  );
}

function ConnectorLayer() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      viewBox="0 0 100 434"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points="16,188 30,246 44,188 58,246 72,188 86,246"
        fill="none"
        stroke="rgb(248 113 113 / 0.75)"
        strokeWidth={1.8}
        strokeDasharray="5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function WhyUs() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const whyUsText = getMessages(locale).whyUsSection;
  const whyReasons = whyUsText.reasons;

  return (
    <section
      id="why-rex"
      className="whyus-page relative z-30 overflow-hidden scroll-mt-24 bg-slate-100 pb-28 pt-16 sm:pb-32 sm:pt-20 lg:pb-36 lg:pt-24"
    >
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <SectionTitle
            leading={whyUsText.title.leading}
            accent={whyUsText.title.accent}
          />

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {whyUsText.description}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:hidden">
          {whyReasons.map(({ title, desc }, index) => (
            <WhyCard key={title} title={title} desc={desc} index={index} />
          ))}
        </div>

        <div className="relative hidden xl:block">
          <div className="relative mx-auto h-[434px] max-w-[1380px]">
            <ConnectorLayer />

            {DESKTOP_NODES.map(
              ({ reasonIndex, className, dotTop, dotBottom }) => {
                const reason = whyReasons[reasonIndex];

                return (
                  <div
                    key={reason.title}
                    className={`absolute z-20 w-[25%] ${className}`}
                  >
                    <WhyCard
                      title={reason.title}
                      desc={reason.desc}
                      index={reasonIndex}
                      dotTop={dotTop}
                      dotBottom={dotBottom}
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div className="mt-9 flex justify-center xl:mt-10">
          <a href="#contact" className={WHY_CTA_CLASS}>
            {whyUsText.cta}
            <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <style jsx global>{`
        .why-card {
          min-height: 142px;
          transition:
            transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 500ms cubic-bezier(0.22, 1, 0.36, 1),
            border-width 220ms ease,
            border-color 300ms ease;
        }

        .why-card:hover {
          border-width: 2.5px;
        }

        .why-title {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.75em;
        }

        .why-desc {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 4.5rem;
        }

        .why-sparkle {
          font-size: 16px;
          line-height: 1;
          text-shadow: 0 0 12px currentColor;
          transition:
            opacity 250ms ease,
            transform 500ms ease;
        }

        .why-card:hover .why-sparkle-1 {
          opacity: 0.9;
          animation: sparkleFloatOne 1200ms ease-in-out infinite;
        }

        .why-card:hover .why-sparkle-2 {
          opacity: 0.85;
          animation: sparkleFloatTwo 1400ms ease-in-out infinite;
        }

        .why-card:hover .why-sparkle-3 {
          opacity: 0.8;
          animation: sparkleFloatThree 1600ms ease-in-out infinite;
        }

        .why-card:hover .why-card-shine {
          opacity: 1;
          animation: cardShineSweep 950ms ease forwards;
        }

        .why-card:hover .why-line-runner {
          animation: topLineRunner 900ms ease forwards;
        }

        @keyframes topLineRunner {
          from {
            transform: translateX(-120%);
          }
          to {
            transform: translateX(420%);
          }
        }

        @keyframes cardShineSweep {
          from {
            transform: translateX(0) rotate(12deg);
          }
          to {
            transform: translateX(330%) rotate(12deg);
          }
        }

        @keyframes sparkleFloatOne {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.12);
          }
        }

        @keyframes sparkleFloatTwo {
          0%,
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-4px) rotate(12deg) scale(1.1);
          }
        }

        @keyframes sparkleFloatThree {
          0%,
          100% {
            transform: translateY(0) scale(0.95);
          }
          50% {
            transform: translateY(-4px) scale(1.08);
          }
        }

        @media (min-width: 1280px) {
          .why-card {
            min-height: 188px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .why-card:hover .why-sparkle,
          .why-card:hover .why-card-shine,
          .why-card:hover .why-line-runner {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

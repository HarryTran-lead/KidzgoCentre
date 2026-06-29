"use client";

import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  MessageCircleHeart,
  Quote,
  Sparkles,
  Star,
} from "lucide-react";
import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/lib/i18n";
import { EndPoint } from "@/lib/routes";

type FeedbackItem = {
  name: string;
  role: string;
  course: string;
  rating: number;
  content: string;
  initials: string;
  avatarClass: string;
};

const feedbackItems: FeedbackItem[] = [
  {
    name: "Phụ huynh bé Minh Anh",
    role: "Phụ huynh chia sẻ",
    course: "Cambridge Starters",
    rating: 5.0,
    content:
      "Sau một thời gian học tại Rex, con tự tin nói tiếng Anh hơn và chủ động giao tiếp ở nhà nhiều hơn.",
    initials: "MA",
    avatarClass: "bg-red-50 text-red-700",
  },
  {
    name: "Phụ huynh bé Gia Huy",
    role: "Phụ huynh chia sẻ",
    course: "Phonics",
    rating: 5.0,
    content:
      "Giáo viên theo sát tiến độ, phản hồi rõ ràng nên gia đình dễ nắm được quá trình học của con.",
    initials: "GH",
    avatarClass: "bg-rose-50 text-red-700",
  },
  {
    name: "Học viên Khánh Linh",
    role: "Học viên chia sẻ",
    course: "Giao tiếp / Thuyết trình",
    rating: 4.9,
    content:
      "Em không còn ngại nói tiếng Anh trước lớp và biết cách trình bày ý tưởng rõ ràng hơn.",
    initials: "KL",
    avatarClass: "bg-amber-50 text-amber-700",
  },
  {
    name: "Phụ huynh bé Bảo Ngọc",
    role: "Phụ huynh chia sẻ",
    course: "Movers",
    rating: 5.0,
    content:
      "Con phát âm tốt hơn, thích đi học hơn và có nhiều tiến bộ trong kỹ năng nghe nói.",
    initials: "BN",
    avatarClass: "bg-red-50 text-red-700",
  },
];

function StarRating() {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          className="feedback-star fill-yellow-400 text-yellow-400 drop-shadow-sm"
          strokeWidth={1.8}
          style={{ animationDelay: `${index * 80}ms` }}
        />
      ))}
    </div>
  );
}

function FeedbackCard({
  item,
  index,
}: {
  item: FeedbackItem;
  index: number;
}) {
  return (
    <article
      className="feedback-card group relative flex h-full min-h-[258px] flex-col overflow-hidden rounded-[28px] border border-red-100/70 bg-white p-5 shadow-md shadow-emerald-950/5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-red-200 hover:shadow-xl hover:shadow-red-100/70"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-white transition-colors duration-500 group-hover:bg-red-50/25" />

      <div className="absolute left-0 right-0 top-0 h-1.5 bg-linear-to-r from-red-600 via-red-500 to-rose-500" />

   
      <div className="relative z-10 mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`grid size-12 shrink-0 place-items-center rounded-full text-sm font-black ring-2 ring-white shadow-sm ${item.avatarClass}`}
          >
            {item.initials}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black leading-snug text-[#111827]">
                {item.name}
              </p>

              <BadgeCheck
                size={15}
                className="shrink-0 fill-red-600 text-white"
                strokeWidth={2.4}
              />
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <MessageCircleHeart size={13} className="text-red-400" />
              {item.role}
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-black text-yellow-700 ring-1 ring-yellow-200">
          {item.rating.toFixed(1)}
        </div>
      </div>

      <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
        <StarRating />

        <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
          <GraduationCap size={13} strokeWidth={2.4} />
          {item.course}
        </div>
      </div>

      <div className="relative z-10 flex-1 rounded-[20px] border border-slate-100 bg-white/75 p-4 transition-colors duration-500 group-hover:border-red-100 group-hover:bg-white">
        <Quote
          size={20}
          className="feedback-quote absolute -left-1 -top-2 text-red-600"
          strokeWidth={2}
        />

        <p className="pl-5 text-sm leading-6 text-slate-600">
          “{item.content}”
        </p>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-100">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Đánh giá sau khóa học
        </span>

        <span className="text-[11px] font-bold text-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Rex verified
        </span>
      </div>
    </article>
  );
}

export default function FeedbackSection() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const contactHref = localizePath(EndPoint.CONTACT, locale);

  return (
    <section
      id="feedback"
      className="feedback-page relative z-30 overflow-visible bg-[#f0fdf4] pb-24 pt-12 scroll-mt-24 sm:pb-28 sm:pt-14 lg:pb-32 lg:pt-16"
    >
      <div className="pointer-events-none absolute left-0 top-0 z-0 w-full -translate-y-[99%] leading-none">
        <svg
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-[86px] w-full sm:h-[104px] lg:h-[116px]"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,70 C180,25 360,110 540,70 C720,30 900,105 1080,70 C1260,35 1350,50 1440,35 L1440,120 L0,120 Z"
            fill="#f0fdf4"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="feedback-orb feedback-orb-1 absolute -left-24 top-20 size-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="feedback-orb feedback-orb-2 absolute -right-20 bottom-16 size-80 rounded-full bg-lime-200/35 blur-3xl" />
        <div className="feedback-orb feedback-orb-3 absolute left-1/2 top-1/3 size-60 rounded-full bg-sky-100/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-4 py-2 text-xs font-bold uppercase text-[#111827] shadow-sm shadow-emerald-100/70 backdrop-blur">
            <Quote className="size-4 text-red-600" />
            Phụ huynh & học viên nói gì
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[#111827] sm:text-4xl lg:text-[2.65rem]">
            Niềm tin từ{" "}
            <span className="bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              hành trình học thật
            </span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Những chia sẻ ngắn từ phụ huynh và học viên sau quá trình đồng hành
            cùng Rex.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {feedbackItems.map((item, index) => (
            <FeedbackCard key={item.name} item={item} index={index} />
          ))}
        </div>

    
      </div>

      <style jsx>{`
        @keyframes feedbackFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -16px, 0) scale(1.06);
          }
        }

        @keyframes feedbackIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes starWink {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.18) rotate(-6deg);
          }
        }

        @keyframes quoteFloat {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        .feedback-orb {
          animation: feedbackFloat 7s ease-in-out infinite;
          will-change: transform;
        }

        .feedback-orb-2 {
          animation-duration: 8.5s;
          animation-delay: 0.8s;
        }

        .feedback-orb-3 {
          animation-duration: 9.5s;
          animation-delay: 1.2s;
        }

        .feedback-card {
          animation: feedbackIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .feedback-star {
          animation: starWink 2.6s ease-in-out infinite;
        }

        .feedback-quote {
          animation: quoteFloat 3.2s ease-in-out infinite;
        }

        .feedback-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 28px;
          pointer-events: none;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(239, 68, 68, 0.08) 45%,
            transparent 70%
          );
          opacity: 0;
          transform: translateX(-30%);
          transition:
            opacity 500ms ease,
            transform 700ms ease;
        }

        .feedback-card:hover::after {
          opacity: 1;
          transform: translateX(30%);
        }

        @media (prefers-reduced-motion: reduce) {
          .feedback-orb,
          .feedback-card,
          .feedback-star,
          .feedback-quote {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
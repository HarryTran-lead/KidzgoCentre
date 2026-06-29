"use client";

import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Gift,
  HeartHandshake,
  MessageCircle,
  SmilePlus,
  Target,
} from "lucide-react";

const WHY_REASONS = [
  {
    title: "Chương trình phù hợp theo từng độ tuổi",
    desc: "Lộ trình được xây dựng theo năng lực, độ tuổi và mục tiêu học tập riêng của từng học sinh.",
  },
  {
    title: "Giáo viên đồng hành sát sao từng buổi học",
    desc: "Theo dõi tiến bộ, hỗ trợ học sinh và kịp thời điều chỉnh trong suốt quá trình học.",
  },
  {
    title: "Môi trường học tích cực và thân thiện",
    desc: "Tạo cảm hứng học tiếng Anh qua hoạt động tương tác, trò chơi và thực hành gần gũi.",
  },
  {
    title: "Tập trung giao tiếp trong tình huống thực tế",
    desc: "Học sinh được luyện phản xạ, nói tự nhiên và sử dụng tiếng Anh trong các ngữ cảnh quen thuộc.",
  },
  {
    title: "Báo cáo tiến bộ rõ ràng cho phụ huynh",
    desc: "Phụ huynh dễ dàng nắm được quá trình học, kết quả của con và định hướng tiếp theo.",
  },
  {
    title: "Học thử và tư vấn lộ trình miễn phí",
    desc: "Giúp phụ huynh hiểu rõ năng lực của con và chọn chương trình phù hợp trước khi đăng ký.",
  },
];

const FALLBACK_ICONS = [
  Target,
  HeartHandshake,
  SmilePlus,
  MessageCircle,
  BarChart3,
  Gift,
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

  return (
    <article className="why-card group relative overflow-visible border border-slate-100/70 bg-white p-4 shadow-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-red-200 hover:shadow-lg sm:p-5 xl:h-[188px]">
      <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-linear-to-br from-white via-white to-red-50/35 opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute left-5 right-5 top-0 h-1.5 rounded-b-full bg-linear-to-r from-red-600 via-red-500 to-rose-400 opacity-90" />

    
      {dotBottom && (
        <span className="absolute bottom-0 left-1/2 z-30 size-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-red-600 ring-4 ring-white shadow-md shadow-red-600/25" />
      )}

      {dotTop && (
        <span className="absolute left-1/2 top-0 z-30 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 ring-4 ring-white shadow-md shadow-red-600/25" />
      )}

      <div className="relative z-10 flex items-start gap-4">
        <div className="relative grid size-[56px] shrink-0 place-items-center rounded-[20px] bg-red-50 text-red-600 ring-1 ring-red-100 shadow-sm shadow-red-100 transition-all duration-500  group-hover:text-white ">
          <Image
            src={getStickerPath(index)}
            alt={title}
            width={56}
            height={56}
            className="h-10 w-10 object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
            priority={index < 3}
          />

          <div className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-white text-red-600 ring-1 ring-red-100 shadow-sm">
            <Icon size={11} strokeWidth={2.5} />
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h3 className="why-title text-[16px] font-black leading-snug text-[#111827] transition-colors duration-300 group-hover:text-red-700 sm:text-[17px]">
            {title}
          </h3>

          <p className="why-desc mt-2 text-[14px] leading-6 text-slate-600">
            {desc}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-linear-to-r from-transparent via-red-200/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
  return (
    <section
      id="why-rex"
      className="whyus-page relative z-30 overflow-hidden scroll-mt-24 bg-linear-to-b from-slate-50 via-white to-slate-100 pt-16 pb-28 sm:pt-20 sm:pb-32 lg:pt-24 lg:pb-36"
    >
   

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/85 px-4 py-2 text-xs font-bold uppercase text-[#111827] shadow-sm shadow-red-100/60 backdrop-blur">
            <Target className="size-4 text-red-600" />
            Tại sao chọn Rex
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[#111827] sm:text-4xl lg:text-[2.65rem]">
            Khác biệt tạo nên{" "}
            <span className="bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              hiệu quả
            </span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Rex giúp phụ huynh hiểu nhanh điểm khác biệt của trung tâm và dễ
            chọn lộ trình phù hợp cho con.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:hidden">
          {WHY_REASONS.map(({ title, desc }, index) => (
            <WhyCard key={title} title={title} desc={desc} index={index} />
          ))}
        </div>

        <div className="relative hidden xl:block">
          <div className="relative mx-auto h-[434px] max-w-[1380px]">
            <ConnectorLayer />

            {DESKTOP_NODES.map(
              ({ reasonIndex, className, dotTop, dotBottom }) => {
                const reason = WHY_REASONS[reasonIndex];

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
            Tư vấn lộ trình học cho con
            <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <style jsx>{`
        .why-card {
          border-radius: 26px;
          min-height: 142px;
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

        @media (min-width: 1280px) {
          .why-card {
            min-height: 188px;
          }
        }
      `}</style>
    </section>
  );
}
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { ExternalLink, Quote } from "lucide-react";
import FbFrame from "@/components/home/Footer/fbframe";
import { getMessages } from "@/lib/dict";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import SectionTitle from "./SectionTitle";

const PHONE_HREF = "tel:0867405801";
const FANPAGE_URL = "https://www.facebook.com/kidzgovn";
const MAP_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "T2-23 Manhattan Grand Park, Vinhomes Grand Park, phường Long Bình, TP Thủ Đức, TP. HCM",
)}`;

const contactCards = [
  {
    key: "address",
    href: MAP_SEARCH_URL,
    iconImage: "/icons/about/location-spot.svg",
    external: true,
    full: true,
    imageClassName: "h-[42px] w-[42px]",
    valueClassName: "text-[14px]",
  },
  {
    key: "phone",
    href: PHONE_HREF,
    iconImage: "/icons/about/phone-call.svg",
    external: false,
    full: false,
    imageClassName: "h-[38px] w-[38px]",
    valueClassName: "text-[13.5px]",
  },
  {
    key: "email",
    href: "mailto:Tearexenglish@gmail.com",
    iconImage: "/icons/about/mail-letter.svg",
    external: false,
    full: false,
    imageClassName: "h-[38px] w-[38px]",
    valueClassName: "text-[13.5px]",
  },
] as const;

const highlights = [
  {
    key: "foundation",
    iconImage: "/icons/level.png",
    tone: "from-rose-500 to-red-600",
    glow: "bg-rose-100",
  },
  {
    key: "communication",
    iconImage: "/icons/quest.png",
    tone: "from-orange-500 to-amber-500",
    glow: "bg-amber-100",
  },
  {
    key: "support",
    iconImage: "/icons/teacher.png",
    tone: "from-fuchsia-500 to-rose-500",
    glow: "bg-pink-100",
  },
] as const;

export default function AboutSection() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const aboutText = getMessages(locale).about;
  const contactContent = {
    address: {
      label: aboutText.contact.addressLabel,
      value: aboutText.contact.addressValue,
    },
    phone: {
      label: aboutText.contact.phoneLabel,
      value: aboutText.contact.phoneValue,
    },
    email: {
      label: aboutText.contact.emailLabel,
      value: aboutText.contact.emailValue,
    },
  } as const;

  return (
    <section
      id="about"
      className="roadmap-page relative z-30 overflow-hidden scroll-mt-24 bg-linear-to-b from-slate-50 via-white to-slate-50 pt-16 pb-28 sm:pt-20 sm:pb-32 lg:pt-24 lg:pb-36"
      style={{
        borderTopLeftRadius: "3rem",
        borderTopRightRadius: "3rem",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="pointer-events-none absolute -left-24 top-24 size-60 rounded-full bg-red-100/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-12 size-64 rounded-full bg-rose-100/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)] xl:gap-10">
          <div className="min-w-0">
            <SectionTitle
              leading={aboutText.title.leading}
              accent={aboutText.title.accent}
              align="left"
            />

            <div className="mt-5 rounded-[1.7rem] border border-red-100 border-l-[6px] border-l-red-600 bg-white p-4 shadow-[0_14px_34px_rgba(239,68,68,0.08)] sm:p-5 lg:p-6">
              <Quote className="mb-2.5 size-6 text-red-600/80" />

              <p className="text-base font-semibold leading-7 text-[#111827] sm:text-[17px]">
                &ldquo;{aboutText.quote.text}&rdquo;
              </p>

              <p className="mt-3 text-sm font-bold text-red-700">
                {aboutText.quote.source}
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {highlights.map(({ key, iconImage, tone, glow }) => (
                <div
                  key={key}
                  className="group relative overflow-hidden rounded-[1.45rem] border border-red-100/90 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition duration-300 motion-safe:lg:hover:-translate-y-1 lg:hover:border-red-200 lg:hover:shadow-[0_18px_36px_rgba(239,68,68,0.12)]"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${tone}`}
                  />

                  <div
                    className={`pointer-events-none absolute -right-8 -top-8 size-24 rounded-full ${glow} opacity-0 blur-2xl transition duration-300 group-hover:opacity-100`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start gap-3">
                      <RealIconBadge
                        src={iconImage}
                        alt=""
                        wrapperClassName="mt-0.5"
                        imageClassName="h-[28px] w-[28px]"
                      />

                      <p className="min-w-0 text-[15px] font-extrabold leading-5 text-red-700 sm:text-base">
                        {aboutText.highlights[key].title}
                      </p>
                    </div>

                    <p className="mt-3 overflow-hidden pl-1 pr-1 text-[13px] font-semibold leading-5 text-slate-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {aboutText.highlights[key].desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4 text-base leading-7 text-slate-800 sm:text-[16px] sm:leading-8">
              {aboutText.body.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>
                  {paragraph.map((segment, segmentIndex) => (
                    <span
                      key={`${paragraphIndex}-${segmentIndex}`}
                      className={
                        "highlight" in segment && segment.highlight
                          ? "font-semibold text-red-700"
                          : undefined
                      }
                    >
                      {segment.text}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </div>

          <aside className="min-w-0 lg:pt-1">
            <div className="mb-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-red-600">
                {aboutText.contact.eyebrow}
              </p>

              <h3 className="mt-1 text-2xl font-extrabold leading-tight text-[#111827] sm:text-[1.65rem]">
                {aboutText.contact.title}
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {contactCards.map(
                ({
                  key,
                  href,
                  iconImage,
                  external,
                  full,
                  imageClassName,
                  valueClassName,
                }) => (
                  <a
                    key={key}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className={`group block rounded-[1.25rem] border border-slate-200 bg-white px-3.5 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.045)] transition-[transform,box-shadow,border-color] duration-200 ease-out motion-safe:lg:hover:-translate-y-0.5 lg:hover:border-red-200 lg:hover:shadow-[0_12px_26px_rgba(15,23,42,0.075)] ${
                      full ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RealIconBadge
                        src={iconImage}
                        alt=""
                        wrapperClassName="mt-0.5"
                        imageClassName={imageClassName}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold leading-5 text-slate-500">
                          {contactContent[key].label}
                        </p>

                        <p
                          className={`mt-0.5 break-words font-semibold leading-5 text-[#111827] ${valueClassName}`}
                        >
                          {contactContent[key].value}
                        </p>
                      </div>

                      <ExternalLink className="mt-1 size-3.5 shrink-0 text-slate-300 transition-colors duration-200 group-hover:text-red-500" />
                    </div>
                  </a>
                ),
              )}
            </div>

            <div className="mt-4 rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex items-center gap-3">
                <RealIconBadge
                  src="/icons/about/facebook-brand.svg"
                  alt=""
                  wrapperClassName="mt-0.5"
                  imageClassName="h-[40px] w-[40px]"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-500">
                    {aboutText.contact.fanpageLabel}
                  </p>

                  <a
                    href={FANPAGE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[17px] font-semibold text-[#111827] transition-colors duration-200 hover:text-red-700"
                  >
                    {aboutText.contact.fanpageName}
                    <ExternalLink className="size-4 text-slate-400" />
                  </a>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-[500px] overflow-hidden rounded-[1.35rem] shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
                  <FbFrame
                    url={FANPAGE_URL}
                    height={315}
                    tabs="timeline"
                    minWidth={340}
                    maxWidth={500}
                    showFacepile={false}
                    hideCover={false}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function RealIconBadge({
  src,
  alt,
  wrapperClassName,
  imageClassName,
}: {
  src: string;
  alt: string;
  wrapperClassName?: string;
  imageClassName: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center leading-none ${wrapperClassName ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className={`object-contain drop-shadow-[0_4px_8px_rgba(15,23,42,0.12)] ${imageClassName}`}
      />
    </span>
  );
}

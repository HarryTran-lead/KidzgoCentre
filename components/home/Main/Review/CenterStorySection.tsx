"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getMessages } from "@/lib/dict";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import SectionTitle from "./SectionTitle";
import SectionWaveTop from "./SectionWaveTop";

const SECTION_BG = "#ffe4e6";

const storyImages = [
  { src: "/image/Club1.JPG" },
  { src: "/image/Club4.JPG" },
  { src: "/image/Club5.JPG" },
  { src: "/image/Club7.JPG" },
] as const;

export default function CenterStorySection() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const centerStoryText = getMessages(locale).centerStory;
  const [activeImage, setActiveImage] = useState(0);
  const currentImage = storyImages[activeImage];

  const goToPreviousImage = () => {
    setActiveImage((index) =>
      index === 0 ? storyImages.length - 1 : index - 1,
    );
  };

  const goToNextImage = () => {
    setActiveImage((index) => (index + 1) % storyImages.length);
  };

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setActiveImage((index) => (index + 1) % storyImages.length);
    }, 5000);

    return () => window.clearInterval(slideTimer);
  }, []);

  return (
    <section
      className="relative z-30 overflow-visible pb-32 pt-12 scroll-mt-24 sm:pb-36 sm:pt-14 lg:pb-40 lg:pt-16"
      style={{ backgroundColor: SECTION_BG }}
    >
      <SectionWaveTop fill={SECTION_BG} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <SectionTitle
            leading={centerStoryText.title.leading}
            accent={centerStoryText.title.accent}
            align="center"
          />

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg">
            {centerStoryText.description}
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-[1.75rem] border border-red-200/70 bg-white/90 p-2.5 shadow-[0_28px_80px_rgba(220,38,38,0.14)] backdrop-blur sm:rounded-[2.25rem] sm:p-3">
            <div
              className="relative overflow-hidden rounded-[1.35rem] bg-red-100 sm:rounded-[1.8rem]"
              style={{ aspectRatio: "16 / 9" }}
            >
              <Image
                key={currentImage.src}
                src={currentImage.src}
                alt={centerStoryText.images[activeImage]?.alt ?? ""}
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover transition duration-700 ease-out"
                priority={activeImage === 0}
                loading={activeImage === 0 ? "eager" : "lazy"}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />

              <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur-md sm:text-sm">
                  <Sparkles
                    className="size-4 text-amber-400"
                    strokeWidth={2.4}
                  />
                  {centerStoryText.badge}
                </div>
              </div>

              <button
                type="button"
                aria-label={centerStoryText.controls.previous}
                onClick={goToPreviousImage}
                className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-red-700 shadow-lg shadow-slate-950/10 backdrop-blur-md transition duration-300 hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 sm:left-5 sm:size-11"
              >
                <ChevronLeft size={21} strokeWidth={2.6} />
              </button>

              <button
                type="button"
                aria-label={centerStoryText.controls.next}
                onClick={goToNextImage}
                className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-red-700 shadow-lg shadow-slate-950/10 backdrop-blur-md transition duration-300 hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 sm:right-5 sm:size-11"
              >
                <ChevronRight size={21} strokeWidth={2.6} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {storyImages.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  aria-label={`${centerStoryText.controls.viewImage} ${index + 1}`}
                  aria-current={index === activeImage}
                  onClick={() => setActiveImage(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeImage
                      ? "w-8 bg-red-600 shadow-sm shadow-red-300"
                      : "w-2.5 bg-red-200 hover:bg-red-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

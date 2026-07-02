"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useParams } from "next/navigation";
import { getMessages } from "@/lib/dict";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import SectionTitle from "./SectionTitle";
import SectionWaveTop from "./SectionWaveTop";

type FeedbackImageItem = {
  src: string;
  alt: string;
  label: string;
};

type PanOffset = {
  x: number;
  y: number;
};

type FeedbackUiText = {
  openImage: string;
  zoomHint: string;
  modalTitle: string;
  modalGuide: string;
  closeImage: string;
  previousImage: string;
  nextImage: string;
  zoomOut: string;
  zoomIn: string;
  resetZoom: string;
};

const COLLAGE_LAYOUT_CLASSES = [
  "sm:col-span-2 sm:row-span-2",
  "sm:row-span-2",
  "sm:row-span-2",
  "sm:row-span-2",
  "sm:row-span-2",
  "sm:col-span-2 sm:row-span-2",
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +value.toFixed(2)));
}

function clampPanOffset(
  offset: PanOffset,
  scale: number,
  container?: HTMLElement | null,
): PanOffset {
  if (scale <= 1) return { x: 0, y: 0 };

  const width = container?.clientWidth ?? 800;
  const height = container?.clientHeight ?? 600;

  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

function FeedbackImageCard({
  item,
  fallbackLabel,
  uiText,
  priority = false,
  variant = "collage",
  className = "",
  onOpen,
}: {
  item: FeedbackImageItem;
  fallbackLabel: string;
  uiText: FeedbackUiText;
  priority?: boolean;
  variant?: "featured" | "collage";
  className?: string;
  onOpen: () => void;
}) {
  const [imageMissing, setImageMissing] = useState(false);
  const isFeatured = variant === "featured";

  return (
    <article
      className={[
        "feedback-shot group relative h-full overflow-hidden rounded-[24px] border-[1.5px] border-slate-200/90 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.10)]",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_24px_58px_rgba(15,23,42,0.16)]",
        isFeatured ? "min-h-[360px] lg:min-h-0" : "min-h-[126px]",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative block h-full w-full overflow-hidden text-left"
        aria-label={`${uiText.openImage}: ${item.label}`}
        title={uiText.zoomHint}
      >
        {imageMissing ? (
          <div className="flex h-full min-h-[180px] items-center justify-center bg-linear-to-br from-slate-100 via-white to-rose-50 px-5 py-10 text-center">
            <div>
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm ring-1 ring-rose-100">
                <ImageIcon size={22} />
              </div>

              <p className="text-sm font-bold text-slate-500">
                {fallbackLabel}
              </p>

              <p className="mt-1.5 text-xs font-medium text-slate-400">
                {item.label}
              </p>
            </div>
          </div>
        ) : (
          <Image
            src={item.src}
            alt={item.alt}
            fill
            priority={priority}
            sizes={
              isFeatured
                ? "(min-width: 1280px) 500px, 100vw"
                : "(min-width: 1280px) 260px, (min-width: 640px) 45vw, 100vw"
            }
            className="object-cover object-top transition duration-700 group-hover:scale-[1.035]"
            onError={() => setImageMissing(true)}
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-slate-950/72 via-slate-950/12 to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-95" />

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span className="feedback-tooltip flex scale-90 items-center gap-1.5 rounded-full border border-white/25 bg-slate-950/72 px-3.5 py-2 text-[11px] font-bold text-white shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-100">
            <ZoomIn size={13} strokeWidth={2.6} />
            {uiText.zoomHint}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 p-3.5">
          <p
            className={[
              "font-black text-white drop-shadow-[0_2px_10px_rgba(15,23,42,0.45)]",
              isFeatured ? "text-sm sm:text-[15px]" : "text-xs sm:text-sm",
            ].join(" ")}
          >
            {item.label}
          </p>
        </div>
      </button>
    </article>
  );
}

function FeedbackImageModal({
  item,
  uiText,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalItems,
}: {
  item: FeedbackImageItem;
  uiText: FeedbackUiText;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalItems: number;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef<PanOffset>({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    mode: "pan" | "swipe";
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const panFrameRef = useRef<number | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);

  const commitOffset = useCallback(
    (nextOffset: PanOffset, immediate = false) => {
      const safeOffset = clampPanOffset(
        nextOffset,
        scaleRef.current,
        imageWrapperRef.current,
      );

      offsetRef.current = safeOffset;

      if (immediate) {
        if (panFrameRef.current !== null) {
          window.cancelAnimationFrame(panFrameRef.current);
          panFrameRef.current = null;
        }

        setOffset(safeOffset);
        return;
      }

      if (panFrameRef.current !== null) return;

      panFrameRef.current = window.requestAnimationFrame(() => {
        panFrameRef.current = null;
        setOffset(offsetRef.current);
      });
    },
    [],
  );

  const commitScale = useCallback(
    (nextValue: number) => {
      const nextScale = clampZoom(nextValue);

      scaleRef.current = nextScale;
      setScale(nextScale);

      if (nextScale === 1) {
        commitOffset({ x: 0, y: 0 }, true);
        return;
      }

      commitOffset(
        clampPanOffset(offsetRef.current, nextScale, imageWrapperRef.current),
        true,
      );
    },
    [commitOffset],
  );

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    setScale(1);
    commitOffset({ x: 0, y: 0 }, true);
  }, [commitOffset]);

  const zoomIn = useCallback(() => {
    commitScale(scaleRef.current + 0.5);
  }, [commitScale]);

  const zoomOut = useCallback(() => {
    commitScale(scaleRef.current - 0.5);
  }, [commitScale]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "+" || event.key === "=") zoomIn();
      if (event.key === "-" || event.key === "_") zoomOut();
      if (event.key === "0") resetZoom();
    };

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onNext, onPrev, zoomIn, zoomOut, resetZoom]);

  useEffect(() => {
    const el = imageWrapperRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      wheelDeltaRef.current += event.deltaY;

      if (wheelFrameRef.current !== null) return;

      wheelFrameRef.current = window.requestAnimationFrame(() => {
        wheelFrameRef.current = null;

        const delta = wheelDeltaRef.current;
        wheelDeltaRef.current = 0;

        commitScale(scaleRef.current - delta * 0.0018);
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [commitScale]);

  useEffect(() => {
    return () => {
      if (panFrameRef.current !== null) {
        window.cancelAnimationFrame(panFrameRef.current);
      }

      if (wheelFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelFrameRef.current);
      }
    };
  }, []);

  const handleDoubleClick = useCallback(() => {
    commitScale(scaleRef.current > 1 ? 1 : 2.2);
  }, [commitScale]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    const shouldPan = scaleRef.current > 1;

    dragStateRef.current = {
      mode: shouldPan ? "pan" : "swipe",
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offsetRef.current.x,
      startOffsetY: offsetRef.current.y,
    };

    setIsDragging(shouldPan);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.mode !== "pan") return;

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;

    commitOffset({
      x: dragState.startOffsetX + dx,
      y: dragState.startOffsetY + dy,
    });
  };

  const stopPointerAction = (
    event: React.PointerEvent<HTMLDivElement>,
    shouldCheckSwipe: boolean,
  ) => {
    const dragState = dragStateRef.current;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (shouldCheckSwipe && dragState?.mode === "swipe") {
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;

      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) onNext();
        else onPrev();
      }
    }

    setIsDragging(false);
    dragStateRef.current = null;
  };

  if (typeof document === "undefined") return null;

  const isZoomed = scale > 1;
  const zoomPercent = Math.round(scale * 100);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/72 px-3 py-4 backdrop-blur-[2px] sm:px-4 sm:py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex h-[min(96vh,900px)] w-full max-w-[1300px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#030716] shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-[66px] shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <h3 className="shrink-0 text-base font-black text-white">
              {uiText.modalTitle}
            </h3>

            <span className="hidden rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-[11px] font-semibold text-white/72 backdrop-blur-md md:inline-flex">
              {uiText.modalGuide}
            </span>
          </div>

          <motion.button
            type="button"
            onClick={onClose}
            className="group relative shrink-0 rounded-xl p-2.5 transition-colors hover:bg-white"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            aria-label={uiText.closeImage}
          >
            <span className="relative">
              <X className="h-5 w-5 text-white/90 transition-colors duration-300 group-hover:text-black" />
            </span>
          </motion.button>
        </div>

        <div className="relative min-h-0 flex-1 px-4 py-4 sm:px-16 sm:py-5 lg:px-20">
          {totalItems > 1 ? (
            <>
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-3 top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-slate-800 shadow-lg transition hover:bg-red-600 hover:text-white sm:left-4 sm:size-12"
                aria-label={uiText.previousImage}
              >
                <ChevronLeft size={28} strokeWidth={2.7} />
              </button>

              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-slate-800 shadow-lg transition hover:bg-red-600 hover:text-white sm:right-4 sm:size-12"
                aria-label={uiText.nextImage}
              >
                <ChevronRight size={28} strokeWidth={2.7} />
              </button>
            </>
          ) : null}

          <div
            ref={imageWrapperRef}
            onDoubleClick={handleDoubleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => stopPointerAction(event, true)}
            onPointerCancel={(event) => stopPointerAction(event, false)}
            className={[
              "relative mx-auto h-full w-full max-w-[860px] touch-none select-none overflow-hidden rounded-[12px] bg-white",
              "shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
              isZoomed
                ? isDragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-zoom-in",
            ].join(" ")}
            style={{
              contain: "layout paint",
            }}
          >
            <div
              className="relative h-full w-full transform-gpu will-change-transform"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging
                  ? "none"
                  : "transform 180ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority
                draggable={false}
                sizes="(min-width: 1280px) 860px, 92vw"
                className="pointer-events-none object-contain"
              />
            </div>
          </div>
        </div>

        <div className="flex h-[64px] shrink-0 items-center justify-between gap-3 border-t border-white/10 px-5 sm:px-6">
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">
            {item.label}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/7 p-1.5 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= MIN_ZOOM}
                className="grid size-8 place-items-center rounded-full text-white transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={uiText.zoomOut}
              >
                <ZoomOut size={16} strokeWidth={2.4} />
              </button>

              <span className="min-w-[42px] text-center text-xs font-bold text-white/85">
                {zoomPercent}%
              </span>

              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= MAX_ZOOM}
                className="grid size-8 place-items-center rounded-full text-white transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={uiText.zoomIn}
              >
                <ZoomIn size={16} strokeWidth={2.4} />
              </button>

              <span className="mx-0.5 h-5 w-px bg-white/15" />

              <button
                type="button"
                onClick={resetZoom}
                disabled={scale === 1 && offset.x === 0 && offset.y === 0}
                className="grid size-8 place-items-center rounded-full text-white transition hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label={uiText.resetZoom}
              >
                <RotateCcw size={15} strokeWidth={2.4} />
              </button>
            </div>

            {totalItems > 1 ? (
              <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                {currentIndex + 1}/{totalItems}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function FeedbackSection() {
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale ?? DEFAULT_LOCALE) as Locale;
  const feedbackText = getMessages(locale).feedbackSection;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [featuredItem, ...galleryItems] = feedbackText.items;
  const visibleGalleryItems = galleryItems.slice(0, 6);

  const selectedItem =
    selectedIndex === null ? null : (feedbackText.items[selectedIndex] ?? null);

  const showPreviousFeedback = () => {
    setSelectedIndex((index) =>
      index === null
        ? null
        : (index - 1 + feedbackText.items.length) % feedbackText.items.length,
    );
  };

  const showNextFeedback = () => {
    setSelectedIndex((index) =>
      index === null ? null : (index + 1) % feedbackText.items.length,
    );
  };

  return (
    <section
      id="feedback"
      className="feedback-page relative z-30 overflow-visible pb-28 pt-10 scroll-mt-24 sm:pb-32 sm:pt-12 lg:pb-36 lg:pt-14"
      style={{ backgroundColor: "#dcf5e6" }}
    >
      <SectionWaveTop fill="#dcf5e6" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 size-72 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="absolute -right-20 bottom-16 size-80 rounded-full bg-lime-200/40 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 size-60 rounded-full bg-sky-100/34 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-7 max-w-3xl text-center">
          <SectionTitle
            leading={feedbackText.title.leading}
            accent={feedbackText.title.accent}
          />

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {feedbackText.description}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[36px] border border-white bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-red-100/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full bg-emerald-100/65 blur-3xl" />

          <div className="relative z-10 grid gap-3 lg:h-[min(58vh,540px)] lg:min-h-[430px] lg:grid-cols-[0.78fr_1.22fr] xl:gap-4">
            {featuredItem ? (
              <FeedbackImageCard
                item={featuredItem}
                fallbackLabel={feedbackText.imageFallback}
                uiText={feedbackText.ui}
                priority
                variant="featured"
                className="lg:h-full"
                onOpen={() => setSelectedIndex(0)}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:grid-rows-4 lg:h-full">
              {visibleGalleryItems.map((item, index) => (
                <FeedbackImageCard
                  key={`${item.src}-${index}`}
                  item={item}
                  fallbackLabel={feedbackText.imageFallback}
                  uiText={feedbackText.ui}
                  variant="collage"
                  className={
                    COLLAGE_LAYOUT_CLASSES[
                      index % COLLAGE_LAYOUT_CLASSES.length
                    ]
                  }
                  onOpen={() => setSelectedIndex(index + 1)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedItem ? (
        <FeedbackImageModal
          key={`${selectedIndex ?? 0}-${selectedItem.src}`}
          item={selectedItem}
          uiText={feedbackText.ui}
          onClose={() => setSelectedIndex(null)}
          onNext={showNextFeedback}
          onPrev={showPreviousFeedback}
          currentIndex={selectedIndex ?? 0}
          totalItems={feedbackText.items.length}
        />
      ) : null}

      <style jsx>{`
        .feedback-shot {
          animation: feedbackShotIn 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .feedback-shot::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 24px;
          pointer-events: none;
          background: linear-gradient(
            125deg,
            transparent 0%,
            rgba(255, 255, 255, 0.22) 45%,
            transparent 72%
          );
          opacity: 0;
          transform: translateX(-24%);
          transition:
            opacity 420ms ease,
            transform 620ms ease;
        }

        .feedback-shot:hover::after {
          opacity: 1;
          transform: translateX(24%);
        }

        .feedback-tooltip {
          white-space: nowrap;
        }

        @keyframes feedbackShotIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .feedback-shot {
            animation: none;
          }

          .feedback-shot::after {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}

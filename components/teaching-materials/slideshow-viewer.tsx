"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Download, FileText, Loader2,
  Maximize2, Minimize2, X, StickyNote, Bookmark, BookmarkCheck,
  MessageSquarePlus, Grid3X3, Play, Pause,
} from "lucide-react";
import {
  createObjectUrl, fetchTeachingMaterialSlidePreview, fetchTeachingMaterialSlideThumbnail,
  fetchTeachingMaterialDownload, fetchTeachingMaterialPreview, fetchTeachingMaterialPreviewPdf, getTeachingMaterialSlides, getTeachingMaterialSlideNotes,
  triggerBrowserDownload, revokeObjectUrl, updateViewProgress,
  createBookmark, deleteBookmark, createAnnotation, getAnnotations,
} from "@/lib/api/teachingMaterialsService";
import { useToast } from "@/hooks/use-toast";
import type { TeachingMaterialItem, TeachingMaterialSlide, TeachingMaterialAnnotation } from "@/types/teachingMaterials";

/* ── helpers ─────────────────────────────────────────────── */
function cn(...a: Array<string | false | null | undefined>) { return a.filter(Boolean).join(" "); }
const msg = (e: unknown, fb: string) => {
  const s = e as Record<string, unknown>;
  const r = s?.response as Record<string, unknown> | undefined;
  const d = r?.data as Record<string, unknown> | undefined;
  return (s?.detail ?? d?.detail ?? d?.message ?? (s as unknown as Error)?.message ?? fb) as string;
};

interface SlideshowViewerProps {
  material: TeachingMaterialItem;
  onClose: () => void;
  /** dark = student portal, light = admin portal */
  theme?: "dark" | "light";
}

export default function SlideshowViewer({ material, onClose, theme = "dark" }: SlideshowViewerProps) {
  const { toast } = useToast();
  const dark = theme === "dark";

  /* ── state ─────────────────────────────────────────────── */
  const [slides, setSlides] = useState<TeachingMaterialSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideUrl, setSlideUrl] = useState<string | null>(null);
  const [slideLoading, setSlideLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<number, string>>(new Map());
  const [notes, setNotes] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [annotations, setAnnotations] = useState<TeachingMaterialAnnotation[]>([]);
  const [showAnnotations] = useState(true);
  const [annotationInput, setAnnotationInput] = useState("");
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [pdfFallbackUrl, setPdfFallbackUrl] = useState<string | null>(null);
  const [pdfFallbackLoading, setPdfFallbackLoading] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;

  /* ── load slides list ──────────────────────────────────── */
  useEffect(() => {
    let off = false;
    setLoading(true);
    getTeachingMaterialSlides(material.id)
      .then((r) => {
        if (!off && r.data?.slides) {
          setSlides(r.data.slides);
        }
      })
      .catch(() => {
        // slides not generated — try PDF fallback silently
        if (!off) {
          setPdfFallbackLoading(true);
          fetchTeachingMaterialPreviewPdf(material.id)
            .then((r) => { if (!off) setPdfFallbackUrl(createObjectUrl(r.blob)); })
            .catch(() => {
              // preview-pdf also failed → try regular preview endpoint
              if (!off && material.previewUrl) {
                return fetchTeachingMaterialPreview(material.previewUrl)
                  .then((r) => { if (!off) setPdfFallbackUrl(createObjectUrl(r.blob)); })
                  .catch(() => { /* no preview available */ });
              }
            })
            .finally(() => { if (!off) setPdfFallbackLoading(false); });
        }
      })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [material.id, material.previewUrl, toast]);

  /* ── load slide image when currentSlide changes ────────── */
  useEffect(() => {
    if (totalSlides === 0) return;
    let off = false;
    setSlideLoading(true);
    revokeObjectUrl(slideUrl);

    fetchTeachingMaterialSlidePreview(material.id, currentSlide)
      .then((r) => { if (!off) setSlideUrl(createObjectUrl(r.blob)); })
      .catch(() => { if (!off) setSlideUrl(null); })
      .finally(() => { if (!off) setSlideLoading(false); });

    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material.id, currentSlide, totalSlides]);

  /* ── load thumbnails (batch, lazy) ─────────────────────── */
  useEffect(() => {
    if (slides.length === 0) return;
    let off = false;
    const loadBatch = async () => {
      const urls = new Map<number, string>();
      for (const slide of slides) {
        if (off) break;
        try {
          const r = await fetchTeachingMaterialSlideThumbnail(material.id, slide.slideNumber);
          urls.set(slide.slideNumber, createObjectUrl(r.blob));
          if (!off) setThumbnailUrls(new Map(urls));
        } catch { /* skip */ }
      }
    };
    loadBatch();
    return () => {
      off = true;
      // cleanup will be handled on unmount
    };
  }, [slides, material.id]);

  /* ── cleanup URLs on unmount ───────────────────────────── */
  useEffect(() => {
    return () => {
      revokeObjectUrl(slideUrl);
      for (const url of thumbnailUrls.values()) revokeObjectUrl(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── load notes for current slide ──────────────────────── */
  useEffect(() => {
    if (!showNotes || totalSlides === 0) { setNotes(null); return; }
    let off = false;
    getTeachingMaterialSlideNotes(material.id, currentSlide)
      .then((r) => { if (!off) setNotes(r.data?.notes ?? null); })
      .catch(() => { if (!off) setNotes(null); });
    return () => { off = true; };
  }, [material.id, currentSlide, showNotes, totalSlides]);

  /* ── load annotations ──────────────────────────────────── */
  const loadAnnotations = useCallback(() => {
    getAnnotations(material.id, { slideNumber: currentSlide })
      .then((r) => setAnnotations(r.data ?? []))
      .catch(() => setAnnotations([]));
  }, [material.id, currentSlide]);

  useEffect(() => { loadAnnotations(); }, [loadAnnotations]);

  /* ── auto-play ─────────────────────────────────────────── */
  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev >= totalSlides) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000);
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, totalSlides]);

  /* ── keyboard navigation ───────────────────────────────── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goSlide(-1); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); goSlide(1); }
      if (e.key === "Escape") { if (fullscreen) setFullscreen(false); else onClose(); }
      if (e.key === "f" || e.key === "F") setFullscreen((v) => !v);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, totalSlides, fullscreen]);

  /* ── save progress on unmount / slide change ───────────── */
  useEffect(() => {
    const start = startTimeRef.current;
    return () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      const progress = totalSlides > 0 ? Math.round((currentSlide / totalSlides) * 100) : 0;
      updateViewProgress(material.id, {
        progressPercent: progress,
        lastSlideViewed: currentSlide,
        totalTimeSeconds: elapsed,
      }).catch(() => { /* silent */ });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── navigation ────────────────────────────────────────── */
  function goSlide(dir: -1 | 1) {
    const next = currentSlide + dir;
    if (next >= 1 && next <= totalSlides) setCurrentSlide(next);
  }

  function goToSlide(n: number) {
    if (n >= 1 && n <= totalSlides) setCurrentSlide(n);
  }

  /* ── bookmark toggle ───────────────────────────────────── */
  async function toggleBookmark() {
    try {
      if (bookmarked) {
        await deleteBookmark(material.id);
        setBookmarked(false);
        toast.success({ title: "Đã bỏ bookmark" });
      } else {
        await createBookmark(material.id);
        setBookmarked(true);
        toast.success({ title: "Đã bookmark" });
      }
    } catch (e) {
      toast.destructive({ title: "Lỗi", description: msg(e, "Không thể thao tác bookmark.") });
    }
  }

  /* ── add annotation ────────────────────────────────────── */
  async function submitAnnotation() {
    if (!annotationInput.trim()) return;
    try {
      await createAnnotation(material.id, {
        slideNumber: currentSlide,
        content: annotationInput.trim(),
        type: "Note",
        visibility: "Private",
      });
      setAnnotationInput("");
      setShowAnnotationForm(false);
      loadAnnotations();
      toast.success({ title: "Đã thêm ghi chú" });
    } catch (e) {
      toast.destructive({ title: "Lỗi", description: msg(e, "Không thể lưu ghi chú.") });
    }
  }

  /* ── download ──────────────────────────────────────────── */
  async function doDownload() {
    if (!material.downloadUrl) return;
    try {
      const result = await fetchTeachingMaterialDownload(material.downloadUrl);
      triggerBrowserDownload(result.blob, result.fileName || material.originalFileName || material.displayName || "file");
    } catch (e) {
      toast.destructive({ title: "Tải thất bại", description: msg(e, "Không thể tải file.") });
    }
  }

  /* ── color sets ────────────────────────────────────────── */
  const bg = dark ? "bg-[#0f0f2a]" : "bg-white";
  const border = dark ? "border-white/10" : "border-gray-200";
  const textPrimary = dark ? "text-white" : "text-gray-900";
  const textSecondary = dark ? "text-white/60" : "text-gray-500";
  const textMuted = dark ? "text-white/40" : "text-gray-400";
  const hoverBg = dark ? "hover:bg-white/10" : "hover:bg-gray-100";
  const panelBg = dark ? "bg-white/5" : "bg-gray-50";
  const activeBg = dark ? "bg-indigo-500/30 border-indigo-400/30" : "bg-red-50 border-red-300";
  const btnPrimary = dark
    ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
    : "bg-red-50 text-red-700 hover:bg-red-100";

  /* ═════════════════════ RENDER ═════════════════════════ */

  if (loading) {
    return (
      <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center", dark ? "bg-black/90" : "bg-black/60")}>
        <div className={cn("rounded-2xl p-8 text-center", bg, `border ${border}`)}>
          <Loader2 className={cn("h-8 w-8 animate-spin mx-auto mb-3", dark ? "text-indigo-400" : "text-red-500")} />
          <p className={textSecondary}>Đang tải slides...</p>
        </div>
      </div>
    );
  }

  if (totalSlides === 0) {
    // PDF fallback: show embedded PDF viewer instead of just a download prompt
    if (pdfFallbackLoading) {
      return (
        <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center", dark ? "bg-black/90" : "bg-black/60")}>
          <div className={cn("rounded-2xl p-8 text-center", bg, `border ${border}`)}>
            <Loader2 className={cn("h-8 w-8 animate-spin mx-auto mb-3", dark ? "text-indigo-400" : "text-red-500")} />
            <p className={textSecondary}>Đang tải bản xem trước...</p>
          </div>
        </div>
      );
    }
    if (pdfFallbackUrl) {
      return (
        <div className={cn("fixed inset-0 z-[9999] flex flex-col", dark ? "bg-[#0a0a1a]" : "bg-gray-100", "p-2 md:p-4")}>
          <div className={cn("flex items-center justify-between px-4 py-2.5 flex-shrink-0 rounded-t-2xl", bg, `border-b ${border}`)}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", dark ? "from-purple-500 to-pink-500" : "from-red-500 to-orange-500")}>
                <FileText size={14} className="text-white" />
              </div>
              <p className={cn("text-sm font-semibold truncate", textPrimary)}>
                {material.displayName || material.originalFileName || "Tài liệu"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={doDownload} className={cn("p-2 rounded-lg transition-colors cursor-pointer", textSecondary, hoverBg)} title="Tải xuống">
                <Download size={16} />
              </button>
              <button onClick={() => { revokeObjectUrl(pdfFallbackUrl); onClose(); }} className={cn("p-2 rounded-lg transition-colors cursor-pointer", textSecondary, hoverBg)} title="Đóng">
                <X size={16} />
              </button>
            </div>
          </div>
          <iframe src={pdfFallbackUrl} title="PDF preview" className={cn("flex-1 w-full rounded-b-2xl", `border ${border}`)} />
        </div>
      );
    }
    // No slides and no PDF — show download prompt
    return (
      <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center", dark ? "bg-black/90" : "bg-black/60")}>
        <div className={cn("rounded-2xl p-8 text-center max-w-sm", bg, `border ${border}`)}>
          <FileText size={40} className={cn("mx-auto mb-3", textMuted)} />
          <h3 className={cn("text-lg font-bold mb-1", textPrimary)}>Không thể xem slides</h3>
          <p className={cn("text-sm mb-4", textSecondary)}>File này chưa được convert sang slides. Hãy tải về để xem.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={doDownload} className={cn("px-4 py-2 rounded-xl text-sm font-medium cursor-pointer", btnPrimary)}>
              <Download size={14} className="inline mr-1.5" /> Tải xuống
            </button>
            <button onClick={onClose} className={cn("px-4 py-2 rounded-xl text-sm cursor-pointer", textSecondary, hoverBg)}>Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col",
        dark ? "bg-[#0a0a1a]" : "bg-gray-100",
        fullscreen ? "" : "p-2 md:p-4",
      )}
    >
      {/* ── Top bar ────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2.5 flex-shrink-0",
        bg, `border-b ${border}`,
        fullscreen ? "" : "rounded-t-2xl",
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", dark ? "from-purple-500 to-pink-500" : "from-red-500 to-orange-500")}>
            <FileText size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold truncate", textPrimary)}>
              {material.displayName || material.originalFileName || "Bài giảng"}
            </p>
            <p className={cn("text-[10px]", textMuted)}>
              Slide {currentSlide} / {totalSlides}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Auto-play */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={cn("p-2 rounded-lg transition-colors cursor-pointer", textSecondary, hoverBg)}
            title={autoPlay ? "Dừng tự động" : "Tự động chuyển slide"}
          >
            {autoPlay ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Thumbnails toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={cn("p-2 rounded-lg transition-colors cursor-pointer", showThumbnails ? btnPrimary : textSecondary, hoverBg)}
            title="Thumbnail"
          >
            <Grid3X3 size={16} />
          </button>

          {/* Notes toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={cn("p-2 rounded-lg transition-colors cursor-pointer", showNotes ? btnPrimary : textSecondary, hoverBg)}
            title="Ghi chú giảng viên"
          >
            <StickyNote size={16} />
          </button>

          {/* Annotation form toggle */}
          <button
            onClick={() => setShowAnnotationForm(!showAnnotationForm)}
            className={cn("p-2 rounded-lg transition-colors cursor-pointer", showAnnotationForm ? btnPrimary : textSecondary, hoverBg)}
            title="Thêm ghi chú"
          >
            <MessageSquarePlus size={16} />
          </button>

          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={cn("p-2 rounded-lg transition-colors cursor-pointer", bookmarked ? "text-yellow-400" : textSecondary, hoverBg)}
            title={bookmarked ? "Bỏ bookmark" : "Bookmark"}
          >
            {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>

          {/* Download */}
          <button onClick={doDownload} className={cn("p-2 rounded-lg transition-colors cursor-pointer", textSecondary, hoverBg)} title="Tải xuống">
            <Download size={16} />
          </button>

          {/* Fullscreen */}
          <button onClick={() => setFullscreen(!fullscreen)} className={cn("p-2 rounded-lg transition-colors cursor-pointer", textSecondary, hoverBg)} title="Toàn màn hình">
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Close */}
          <button onClick={onClose} className={cn("p-2 rounded-lg transition-colors cursor-pointer", textSecondary, hoverBg)} title="Đóng">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Thumbnail sidebar */}
        {showThumbnails && (
          <div className={cn(
            "w-[140px] flex-shrink-0 overflow-y-auto border-r p-2 space-y-1.5",
            bg, border,
          )}>
            {slides.map((s) => {
              const isActive = s.slideNumber === currentSlide;
              const thumbUrl = thumbnailUrls.get(s.slideNumber);
              return (
                <button
                  key={s.slideNumber}
                  type="button"
                  onClick={() => goToSlide(s.slideNumber)}
                  className={cn(
                    "w-full rounded-lg overflow-hidden border-2 transition-all",
                    isActive ? activeBg : `border-transparent ${hoverBg}`,
                  )}
                >
                  {thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbUrl} alt={`Slide ${s.slideNumber}`} className="w-full aspect-[16/9] object-cover" />
                  ) : (
                    <div className={cn("w-full aspect-[16/9] flex items-center justify-center", panelBg)}>
                      <Loader2 className={cn("h-4 w-4 animate-spin", textMuted)} />
                    </div>
                  )}
                  <div className={cn("text-[10px] py-0.5 text-center", isActive ? textPrimary : textMuted)}>
                    {s.slideNumber}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Slide content + overlay */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-4">
            {slideLoading ? (
              <Loader2 className={cn("h-10 w-10 animate-spin", dark ? "text-indigo-400" : "text-red-500")} />
            ) : slideUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slideUrl} alt={`Slide ${currentSlide}`} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />

                {/* Annotation dots */}
                {showAnnotations && annotations.length > 0 && (
                  <div className="absolute inset-4 pointer-events-none">
                    {annotations.filter((a) => a.positionX != null && a.positionY != null).map((a) => (
                      <div
                        key={a.id}
                        className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-auto cursor-pointer group"
                        style={{
                          left: `${(a.positionX ?? 0) * 100}%`,
                          top: `${(a.positionY ?? 0) * 100}%`,
                          backgroundColor: a.color || "#FFD700",
                          transform: "translate(-50%, -50%)",
                        }}
                        title={a.content}
                      >
                        <div className={cn(
                          "absolute bottom-7 left-1/2 -translate-x-1/2 hidden group-hover:block",
                          "px-3 py-2 rounded-lg text-xs font-medium max-w-[200px] whitespace-pre-wrap shadow-xl z-10",
                          dark ? "bg-gray-900 text-white border border-white/20" : "bg-white text-gray-900 border border-gray-200",
                        )}>
                          <p>{a.content}</p>
                          {a.createdByName && <p className={cn("mt-1 text-[10px]", textMuted)}>— {a.createdByName}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Left/right click areas for navigation */}
                <button
                  onClick={() => goSlide(-1)}
                  disabled={currentSlide <= 1}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => goSlide(1)}
                  disabled={currentSlide >= totalSlides}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            ) : (
              <p className={textMuted}>Không thể hiển thị slide này.</p>
            )}
          </div>

          {/* Bottom: slide nav bar */}
          <div className={cn("flex items-center justify-center gap-3 px-4 py-2 border-t", bg, border)}>
            <button onClick={() => goSlide(-1)} disabled={currentSlide <= 1} className={cn("p-1.5 rounded-lg transition-colors disabled:opacity-30 cursor-pointer", textSecondary, hoverBg)}>
              <ChevronLeft size={18} />
            </button>

            {/* Slide number input */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={totalSlides}
                value={currentSlide}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (v >= 1 && v <= totalSlides) goToSlide(v);
                }}
                className={cn(
                  "w-14 h-8 text-center rounded-lg text-sm font-medium border focus:outline-none focus:ring-2",
                  dark ? "bg-white/10 border-white/20 text-white focus:ring-indigo-400/50" : "bg-white border-gray-200 text-gray-900 focus:ring-red-300",
                )}
              />
              <span className={cn("text-sm", textMuted)}>/ {totalSlides}</span>
            </div>

            <button onClick={() => goSlide(1)} disabled={currentSlide >= totalSlides} className={cn("p-1.5 rounded-lg transition-colors disabled:opacity-30 cursor-pointer", textSecondary, hoverBg)}>
              <ChevronRight size={18} />
            </button>

            {/* Progress bar */}
            <div className={cn("flex-1 max-w-xs h-1.5 rounded-full overflow-hidden ml-4", dark ? "bg-white/10" : "bg-gray-200")}>
              <div
                className={cn("h-full rounded-full transition-all duration-300", dark ? "bg-indigo-500" : "bg-red-500")}
                style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right panel: notes + annotations */}
        {(showNotes || showAnnotationForm) && (
          <div className={cn("w-[280px] flex-shrink-0 overflow-y-auto border-l p-3 space-y-3", bg, border)}>
            {/* Speaker notes */}
            {showNotes && (
              <div>
                <h4 className={cn("text-xs font-bold mb-2 flex items-center gap-1.5", textSecondary)}>
                  <StickyNote size={12} /> Ghi chú giảng viên
                </h4>
                <div className={cn("rounded-xl p-3 text-sm", panelBg, notes ? textPrimary : textMuted)}>
                  {notes || "Không có ghi chú cho slide này."}
                </div>
              </div>
            )}

            {/* Annotation form */}
            {showAnnotationForm && (
              <div>
                <h4 className={cn("text-xs font-bold mb-2 flex items-center gap-1.5", textSecondary)}>
                  <MessageSquarePlus size={12} /> Ghi chú của bạn
                </h4>
                <textarea
                  value={annotationInput}
                  onChange={(e) => setAnnotationInput(e.target.value)}
                  placeholder="Nhập ghi chú cho slide này..."
                  rows={3}
                  className={cn(
                    "w-full rounded-xl p-3 text-sm border focus:outline-none focus:ring-2 resize-none",
                    dark ? "bg-white/10 border-white/20 text-white placeholder-white/30 focus:ring-indigo-400/50" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-red-300",
                  )}
                />
                <button
                  onClick={submitAnnotation}
                  disabled={!annotationInput.trim()}
                  className={cn(
                    "mt-2 w-full py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 cursor-pointer",
                    dark ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-red-600 text-white hover:bg-red-700",
                  )}
                >
                  Lưu ghi chú
                </button>

                {/* Existing annotations list */}
                {annotations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {annotations.map((a) => (
                      <div key={a.id} className={cn("rounded-lg p-2.5 text-xs", panelBg)}>
                        <p className={textPrimary}>{a.content}</p>
                        {a.createdByName && <p className={cn("mt-1", textMuted)}>— {a.createdByName}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

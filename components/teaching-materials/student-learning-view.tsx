"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen, ChevronLeft, ChevronRight, ChevronDown, Download, Eye, FileText,
  Headphones, Image as ImageIcon, Loader2, Monitor, Play, Video,
  Maximize2, Minimize2, X, Layers,
} from "lucide-react";
import dynamic from "next/dynamic";
import { FilterTabs } from "@/components/portal/student/FilterTabs";
import { getActiveProgramsForDropdown } from "@/lib/api/programService";
import {
  createObjectUrl, fetchTeachingMaterialDownload, fetchTeachingMaterialPreview,
  fetchTeachingMaterialPreviewPdf,
  getTeachingMaterialLessonBundle, getTeachingMaterials, pickTeachingMaterialItems,
  revokeObjectUrl, sortTeachingMaterialItems, triggerBrowserDownload,
} from "@/lib/api/teachingMaterialsService";
import { useToast } from "@/hooks/use-toast";
import type { Program } from "@/types/admin/programs";
import type { TeachingMaterialItem, TeachingMaterialLessonBundle } from "@/types/teachingMaterials";

const SlideshowViewer = dynamic(() => import("./slideshow-viewer"), { ssr: false });

/* ── helpers ─────────────────────────────────────────────── */
function cn(...a: Array<string | false | null | undefined>) { return a.filter(Boolean).join(" "); }
const msg = (e: unknown, fb: string) => { const s = e as Record<string, unknown>; const r = s?.response as Record<string, unknown> | undefined; const d = r?.data as Record<string, unknown> | undefined; return (s?.detail ?? d?.detail ?? d?.message ?? (s as unknown as Error)?.message ?? fb) as string; };
const bytes = (v?: number | null) => !v && v !== 0 ? "" : v < 1024 * 1024 ? `${(v / 1024).toFixed(0)} KB` : `${(v / (1024 * 1024)).toFixed(1)} MB`;
const previewable = (ft?: string | null) => ["Image", "Pdf", "Audio", "Video"].includes(String(ft ?? ""));

type TabId = "all" | "slides" | "audio" | "video" | "images" | "docs";

interface LessonNode {
  key: string;
  programId: string;
  programName: string;
  unitNumber: number;
  lessonNumber: number;
  lessonTitle: string;
  count: number;
}

interface UnitNode {
  unitNumber: number;
  programId: string;
  programName: string;
  lessons: LessonNode[];
}

/* ── file type icon ──────────────────────────────────────── */
function FileTypeIcon({ type, size = 18 }: { type?: string | null; size?: number }) {
  switch (type) {
    case "Presentation": return <Monitor size={size} />;
    case "Audio": return <Headphones size={size} />;
    case "Video": return <Video size={size} />;
    case "Image": return <ImageIcon size={size} />;
    case "Pdf": return <FileText size={size} />;
    default: return <FileText size={size} />;
  }
}

function fileTypeColor(type?: string | null) {
  switch (type) {
    case "Presentation": return "from-purple-500 to-pink-500";
    case "Audio": return "from-blue-500 to-cyan-500";
    case "Video": return "from-red-500 to-orange-500";
    case "Image": return "from-green-500 to-emerald-500";
    case "Pdf": return "from-orange-500 to-amber-500";
    default: return "from-gray-500 to-gray-600";
  }
}

/* ═════════════════════════════════════════════════════════════
   Main Component
   ═════════════════════════════════════════════════════════════ */
export default function StudentLearningView() {
  const { toast } = useToast();

  /* ── data state ───────────────────────────────────────── */
  const [programs, setPrograms] = useState<Program[]>([]);
  const [materials, setMaterials] = useState<TeachingMaterialItem[]>([]);
  const [bundle, setBundle] = useState<TeachingMaterialLessonBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");

  /* ── navigation state ─────────────────────────────────── */
  const [selectedLesson, setSelectedLesson] = useState("");
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabId>("all");

  /* ── viewer state ─────────────────────────────────────── */
  const [viewingMaterial, setViewingMaterial] = useState<TeachingMaterialItem | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  /* ── slideshow state ──────────────────────────────────── */
  const [slideshowMaterial, setSlideshowMaterial] = useState<TeachingMaterialItem | null>(null);

  /* ── load programs ────────────────────────────────────── */
  useEffect(() => {
    getActiveProgramsForDropdown().then(setPrograms).catch(() => setPrograms([]));
  }, []);

  /* ── load all materials ───────────────────────────────── */
  useEffect(() => {
    let off = false;
    setLoading(true);
    getTeachingMaterials({
      programId: selectedProgramId || undefined,
      pageNumber: 1,
      pageSize: 500,
    })
      .then((r) => { if (!off) setMaterials(sortTeachingMaterialItems(pickTeachingMaterialItems(r.data))); })
      .catch((e) => { if (!off) toast.destructive({ title: "Lỗi tải tài liệu", description: msg(e, "Không thể tải danh sách tài liệu.") }); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [selectedProgramId, toast]);

  /* ── build unit → lesson tree ─────────────────────────── */
  const units: UnitNode[] = useMemo(() => {
    const lessonMap = new Map<string, LessonNode>();
    for (const m of materials) {
      const key = `${m.programId}:${m.unitNumber ?? 0}:${m.lessonNumber ?? 0}`;
      if (!lessonMap.has(key)) {
        lessonMap.set(key, {
          key,
          programId: m.programId,
          programName: m.programName ?? "",
          unitNumber: Number(m.unitNumber ?? 0),
          lessonNumber: Number(m.lessonNumber ?? 0),
          lessonTitle: m.lessonTitle ?? "",
          count: 0,
        });
      }
      lessonMap.get(key)!.count++;
    }

    const unitMap = new Map<number, UnitNode>();
    for (const lesson of lessonMap.values()) {
      if (!unitMap.has(lesson.unitNumber)) {
        unitMap.set(lesson.unitNumber, {
          unitNumber: lesson.unitNumber,
          programId: lesson.programId,
          programName: lesson.programName,
          lessons: [],
        });
      }
      unitMap.get(lesson.unitNumber)!.lessons.push(lesson);
    }

    for (const unit of unitMap.values()) {
      unit.lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
    }

    return [...unitMap.values()].sort((a, b) => a.unitNumber - b.unitNumber);
  }, [materials]);

  /* ── auto-select first lesson & expand first unit ────── */
  useEffect(() => {
    if (!selectedLesson && units[0]?.lessons[0]) {
      setSelectedLesson(units[0].lessons[0].key);
      setExpandedUnits(new Set([units[0].unitNumber]));
    }
  }, [units, selectedLesson]);

  /* ── load bundle for selected lesson ──────────────────── */
  const currentLesson = useMemo(
    () => units.flatMap((u) => u.lessons).find((l) => l.key === selectedLesson) ?? null,
    [units, selectedLesson],
  );

  useEffect(() => {
    if (!currentLesson) { setBundle(null); return; }
    let off = false;
    setBundleLoading(true);
    getTeachingMaterialLessonBundle({
      programId: currentLesson.programId,
      unitNumber: currentLesson.unitNumber,
      lessonNumber: currentLesson.lessonNumber,
    })
      .then((r) => { if (!off) setBundle(r.data ?? null); })
      .catch(() => { if (!off) setBundle(null); })
      .finally(() => { if (!off) setBundleLoading(false); });
    return () => { off = true; };
  }, [currentLesson]);

  /* ── bundle → flat list of materials ──────────────────── */
  const bundleMaterials = useMemo(() => {
    if (!bundle) return [];
    return [...new Map(
      [
        ...(bundle.primaryPresentation ? [bundle.primaryPresentation] : []),
        ...bundle.presentations,
        ...bundle.audioFiles,
        ...bundle.imageFiles,
        ...bundle.videoFiles,
        ...bundle.documents,
        ...bundle.supplementaryFiles,
        ...bundle.otherFiles,
      ].map((m) => [m.id, m]),
    ).values()];
  }, [bundle]);

  /* ── filtered by tab ──────────────────────────────────── */
  const visible = useMemo(() => bundleMaterials.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab === "slides") return m.fileType === "Presentation";
    if (activeTab === "audio") return m.fileType === "Audio";
    if (activeTab === "video") return m.fileType === "Video";
    if (activeTab === "images") return m.fileType === "Image";
    if (activeTab === "docs") return ["Pdf", "Document", "Spreadsheet", "Other"].includes(String(m.fileType ?? ""));
    return true;
  }), [activeTab, bundleMaterials]);

  /* ── tab counts ───────────────────────────────────────── */
  const tabCounts = useMemo(() => ({
    all: bundleMaterials.length,
    slides: bundleMaterials.filter((m) => m.fileType === "Presentation").length,
    audio: bundleMaterials.filter((m) => m.fileType === "Audio").length,
    video: bundleMaterials.filter((m) => m.fileType === "Video").length,
    images: bundleMaterials.filter((m) => m.fileType === "Image").length,
    docs: bundleMaterials.filter((m) => ["Pdf", "Document", "Spreadsheet", "Other"].includes(String(m.fileType ?? ""))).length,
  }), [bundleMaterials]);

  /* ── image gallery list ───────────────────────────────── */
  const imageItems = useMemo(() => bundleMaterials.filter((m) => m.fileType === "Image"), [bundleMaterials]);

  /* ── viewer open / close ──────────────────────────────── */
  /* ── open slideshow for presentations ───────────────────── */
  const openSlideshow = useCallback((item: TeachingMaterialItem) => {
    setSlideshowMaterial(item);
  }, []);

  const closeSlideshow = useCallback(() => {
    setSlideshowMaterial(null);
  }, []);

  const officePreviewable = (ft?: string | null) => ["Presentation", "Document", "Spreadsheet"].includes(String(ft ?? ""));

  /* ── viewer open / close ──────────────────────────────── */
  const openViewer = useCallback(async (item: TeachingMaterialItem) => {
    // Presentations → open slideshow viewer
    if (item.fileType === "Presentation") {
      setSlideshowMaterial(item);
      return;
    }

    // Office files (Document, Spreadsheet) → try PDF preview, fallback to regular preview
    if (officePreviewable(item.fileType)) {
      setViewingMaterial(item);
      setViewerLoading(true);
      revokeObjectUrl(viewerUrl);
      try {
        const res = await fetchTeachingMaterialPreviewPdf(item.id);
        setViewerUrl(createObjectUrl(res.blob));
      } catch {
        // preview-pdf failed → try regular preview endpoint
        if (item.previewUrl) {
          try {
            const res = await fetchTeachingMaterialPreview(item.previewUrl);
            setViewerUrl(createObjectUrl(res.blob));
          } catch {
            // both failed → show error, keep viewer open with no content
            toast.warning({ title: "Không thể xem trước", description: "File này chưa hỗ trợ xem trực tiếp." });
          }
        } else {
          toast.warning({ title: "Không thể xem trước", description: "File này chưa hỗ trợ xem trực tiếp." });
        }
      } finally {
        setViewerLoading(false);
      }
      return;
    }

    if (!item.previewUrl || !previewable(item.fileType)) {
      // cannot preview → show viewer with no content (user can download manually)
      setViewingMaterial(item);
      setViewerLoading(false);
      toast.warning({ title: "Không thể xem trước", description: "File này chưa hỗ trợ xem trực tiếp." });
      return;
    }
    setViewingMaterial(item);
    setViewerLoading(true);
    revokeObjectUrl(viewerUrl);
    try {
      const res = await fetchTeachingMaterialPreview(item.previewUrl);
      setViewerUrl(createObjectUrl(res.blob));
      if (item.fileType === "Image") {
        const idx = imageItems.findIndex((i) => i.id === item.id);
        setGalleryIndex(idx >= 0 ? idx : 0);
      }
    } catch (e) {
      toast.warning({ title: "Preview lỗi", description: msg(e, "Không thể preview file này.") });
      setViewingMaterial(null);
    } finally {
      setViewerLoading(false);
    }
  }, [imageItems, toast, viewerUrl]);

  const closeViewer = useCallback(() => {
    revokeObjectUrl(viewerUrl);
    setViewerUrl(null);
    setViewingMaterial(null);
    setFullscreen(false);
  }, [viewerUrl]);

  /* ── gallery navigation ───────────────────────────────── */
  const galleryNavigate = useCallback(async (dir: -1 | 1) => {
    const next = galleryIndex + dir;
    if (next < 0 || next >= imageItems.length) return;
    setGalleryIndex(next);
    const item = imageItems[next];
    if (!item?.previewUrl) return;
    setViewerLoading(true);
    revokeObjectUrl(viewerUrl);
    try {
      const res = await fetchTeachingMaterialPreview(item.previewUrl);
      setViewerUrl(createObjectUrl(res.blob));
      setViewingMaterial(item);
    } catch {
      /* skip */
    } finally {
      setViewerLoading(false);
    }
  }, [galleryIndex, imageItems, viewerUrl]);

  /* ── download helper ──────────────────────────────────── */
  const doDownload = useCallback(async (item: TeachingMaterialItem) => {
    if (!item.downloadUrl) return;
    try {
      const result = await fetchTeachingMaterialDownload(item.downloadUrl);
      triggerBrowserDownload(result.blob, result.fileName || item.originalFileName || item.displayName || "file");
      toast.success({ title: "Đã tải xong!" });
    } catch (e) {
      toast.destructive({ title: "Tải thất bại", description: msg(e, "Không thể tải file.") });
    }
  }, [toast]);

  /* ── lesson navigation (prev/next) ───────────────────── */
  const allLessons = useMemo(() => units.flatMap((u) => u.lessons), [units]);
  const currentLessonIdx = allLessons.findIndex((l) => l.key === selectedLesson);

  function goLesson(dir: -1 | 1) {
    const next = currentLessonIdx + dir;
    if (next < 0 || next >= allLessons.length) return;
    const lesson = allLessons[next];
    setSelectedLesson(lesson.key);
    setExpandedUnits((prev) => new Set([...prev, lesson.unitNumber]));
    setActiveTab("all");
  }

  /* ── toggle unit expand ───────────────────────────────── */
  function toggleUnit(unitNumber: number) {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitNumber)) next.delete(unitNumber);
      else next.add(unitNumber);
      return next;
    });
  }

  /* ═══════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="relative min-h-full">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Tài liệu học tập
            </h1>
            <p className="text-sm text-white/50">Chọn bài học để xem slides, audio, video và tài liệu</p>
          </div>
        </div>

        {/* Program selector */}
        {programs.length > 1 && (
          <div className="mt-3">
            <select
              value={selectedProgramId}
              onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedLesson(""); }}
              className="h-9 rounded-xl bg-white/10 border border-white/20 px-3 text-sm text-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            >
              <option value="" className="text-gray-900">Tất cả chương trình</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
          <p className="text-white/50 text-sm">Đang tải tài liệu...</p>
        </div>
      ) : units.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-white/5 mb-4"><BookOpen size={40} className="text-white/30" /></div>
          <h3 className="text-lg font-bold text-white/70 mb-1">Chưa có tài liệu</h3>
          <p className="text-sm text-white/40 max-w-xs">Giáo viên chưa upload tài liệu cho chương trình này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
          {/* ═══ LEFT: Unit/Lesson Sidebar ═══════════════════ */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
            <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                Nội dung bài học
              </h3>
              {currentLesson && (
                <p className="text-xs text-white/40 mt-0.5">{currentLesson.programName}</p>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {units.map((unit) => (
                <div key={unit.unitNumber} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleUnit(unit.unitNumber)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors group"
                  >
                    <ChevronDown
                      size={14}
                      className={cn(
                        "text-white/40 transition-transform duration-200",
                        !expandedUnits.has(unit.unitNumber) && "-rotate-90",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white/80 group-hover:text-white">
                        Unit {unit.unitNumber}
                      </span>
                      <span className="ml-2 text-xs text-white/30">{unit.lessons.length} bài</span>
                    </div>
                  </button>

                  {expandedUnits.has(unit.unitNumber) && (
                    <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5 mb-2">
                      {unit.lessons.map((lesson) => {
                        const isActive = lesson.key === selectedLesson;
                        return (
                          <button
                            key={lesson.key}
                            type="button"
                            onClick={() => { setSelectedLesson(lesson.key); setActiveTab("all"); }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-xl transition-all text-sm",
                              isActive
                                ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/20 text-white border border-indigo-400/30"
                                : "text-white/60 hover:text-white/90 hover:bg-white/5",
                            )}
                          >
                            <div className="font-medium">Lesson {lesson.lessonNumber}</div>
                            {lesson.lessonTitle && (
                              <div className="text-xs mt-0.5 opacity-60 truncate">{lesson.lessonTitle}</div>
                            )}
                            <div className="text-[10px] mt-0.5 opacity-40">{lesson.count} tài liệu</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ═══ RIGHT: Lesson Content ═══════════════════════ */}
          <div className="space-y-4">
            {/* Lesson header + nav */}
            {currentLesson && (
              <div className="rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/15 p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-indigo-300 font-medium mb-1">
                      {currentLesson.programName} &bull; Unit {currentLesson.unitNumber}
                    </p>
                    <h2 className="text-xl font-extrabold text-white">
                      Lesson {currentLesson.lessonNumber}
                      {currentLesson.lessonTitle ? `: ${currentLesson.lessonTitle}` : ""}
                    </h2>
                    <p className="text-xs text-white/40 mt-1">{bundleMaterials.length} tài liệu trong bài</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goLesson(-1)}
                      disabled={currentLessonIdx <= 0}
                      className="p-2 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-white/40 min-w-[60px] text-center">
                      {currentLessonIdx + 1} / {allLessons.length}
                    </span>
                    <button
                      onClick={() => goLesson(1)}
                      disabled={currentLessonIdx >= allLessons.length - 1}
                      className="p-2 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content tabs */}
            <FilterTabs
              tabs={[
                { id: "all", label: "Tất cả", count: tabCounts.all, icon: <BookOpen className="h-3.5 w-3.5" /> },
                ...(tabCounts.slides > 0 ? [{ id: "slides", label: "Slides", count: tabCounts.slides, icon: <Monitor className="h-3.5 w-3.5" /> }] : []),
                ...(tabCounts.audio > 0 ? [{ id: "audio", label: "Audio", count: tabCounts.audio, icon: <Headphones className="h-3.5 w-3.5" /> }] : []),
                ...(tabCounts.video > 0 ? [{ id: "video", label: "Video", count: tabCounts.video, icon: <Video className="h-3.5 w-3.5" /> }] : []),
                ...(tabCounts.images > 0 ? [{ id: "images", label: "Hình ảnh", count: tabCounts.images, icon: <ImageIcon className="h-3.5 w-3.5" /> }] : []),
                ...(tabCounts.docs > 0 ? [{ id: "docs", label: "Tài liệu", count: tabCounts.docs, icon: <FileText className="h-3.5 w-3.5" /> }] : []),
              ]}
              activeTab={activeTab}
              onChange={(v) => setActiveTab(v as TabId)}
              variant="solid"
              size="sm"
            />

            {/* Material content */}
            {bundleLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40 text-sm">Không có tài liệu nào cho tab này.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* ── Image gallery (special layout) ─── */}
                {(activeTab === "all" || activeTab === "images") && imageItems.length > 0 && (
                  <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                      <ImageIcon size={14} className="text-green-400" /> Hình ảnh bài học
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageItems.map((item) => (
                        <ImageThumbnail key={item.id} item={item} onOpen={() => openViewer(item)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Audio inline players ─── */}
                {(activeTab === "all" || activeTab === "audio") && bundleMaterials.filter((m) => m.fileType === "Audio").length > 0 && (
                  <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                      <Headphones size={14} className="text-blue-400" /> Audio
                    </h3>
                    <div className="space-y-2">
                      {bundleMaterials.filter((m) => m.fileType === "Audio").map((item) => (
                        <InlineAudioPlayer key={item.id} item={item} onDownload={() => doDownload(item)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Video cards ─── */}
                {(activeTab === "all" || activeTab === "video") && bundleMaterials.filter((m) => m.fileType === "Video").length > 0 && (
                  <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                      <Video size={14} className="text-red-400" /> Video
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bundleMaterials.filter((m) => m.fileType === "Video").map((item) => (
                        <MaterialCard key={item.id} item={item} onOpen={() => openViewer(item)} onDownload={() => doDownload(item)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Slides / presentations ─── */}
                {(activeTab === "all" || activeTab === "slides") && bundleMaterials.filter((m) => m.fileType === "Presentation").length > 0 && (
                  <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                      <Monitor size={14} className="text-purple-400" /> Bài giảng / Slides
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bundleMaterials.filter((m) => m.fileType === "Presentation").map((item) => (
                        <MaterialCard key={item.id} item={item} onOpen={() => openSlideshow(item)} onDownload={() => doDownload(item)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Documents (PDF, etc) ─── */}
                {(activeTab === "all" || activeTab === "docs") && bundleMaterials.filter((m) => ["Pdf", "Document", "Spreadsheet", "Other"].includes(String(m.fileType ?? ""))).length > 0 && (
                  <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-orange-400" /> Tài liệu
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bundleMaterials.filter((m) => ["Pdf", "Document", "Spreadsheet", "Other"].includes(String(m.fileType ?? ""))).map((item) => (
                        <MaterialCard key={item.id} item={item} onOpen={() => openViewer(item)} onDownload={() => doDownload(item)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Full-screen Viewer Modal ═══════════════════════ */}
      {viewingMaterial && (
        <div className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm",
          fullscreen ? "p-0" : "p-4 md:p-8",
        )}>
          {/* close overlay */}
          <div className="absolute inset-0" onClick={closeViewer} />

          <div className={cn(
            "relative bg-[#0f0f2a] border border-white/10 rounded-2xl overflow-hidden flex flex-col",
            fullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl max-h-[90vh]",
          )}>
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", fileTypeColor(viewingMaterial.fileType))}>
                  <FileTypeIcon type={viewingMaterial.fileType} size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {viewingMaterial.displayName || viewingMaterial.originalFileName || "Tài liệu"}
                  </p>
                  {bytes(viewingMaterial.fileSize) && (
                    <p className="text-[10px] text-white/40">{bytes(viewingMaterial.fileSize)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {viewingMaterial.fileType === "Image" && imageItems.length > 1 && (
                  <span className="text-xs text-white/40 mr-2">
                    {galleryIndex + 1} / {imageItems.length}
                  </span>
                )}
                <button onClick={() => doDownload(viewingMaterial)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer" title="Tải xuống">
                  <Download size={16} />
                </button>
                <button onClick={() => setFullscreen(!fullscreen)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer" title="Phóng to">
                  {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={closeViewer} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer" title="Đóng">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-auto p-4">
              {viewerLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              ) : viewerUrl && viewingMaterial.fileType === "Image" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewerUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
                  {imageItems.length > 1 && (
                    <>
                      <button
                        onClick={() => galleryNavigate(-1)}
                        disabled={galleryIndex <= 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => galleryNavigate(1)}
                        disabled={galleryIndex >= imageItems.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </>
              ) : viewerUrl && viewingMaterial.fileType === "Pdf" ? (
                <iframe src={viewerUrl} title="PDF" className="w-full h-full rounded-lg" style={{ minHeight: 500 }} />
              ) : viewerUrl && (viewingMaterial.fileType === "Document" || viewingMaterial.fileType === "Spreadsheet") ? (
                <iframe src={viewerUrl} title="PDF Preview" className="w-full h-full rounded-lg" style={{ minHeight: 500 }} />
              ) : viewerUrl && viewingMaterial.fileType === "Audio" ? (
                <div className="w-full max-w-lg space-y-4 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse">
                    <Headphones size={36} className="text-white" />
                  </div>
                  <p className="text-white font-medium">{viewingMaterial.displayName || viewingMaterial.originalFileName}</p>
                  <audio controls src={viewerUrl} className="w-full" autoPlay />
                </div>
              ) : viewerUrl && viewingMaterial.fileType === "Video" ? (
                <video controls src={viewerUrl} className="max-w-full max-h-full rounded-lg" autoPlay />
              ) : (
                <p className="text-white/50">Không thể preview file này.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Slideshow Viewer for Presentations ═══════════ */}
      {slideshowMaterial && (
        <SlideshowViewer
          material={slideshowMaterial}
          onClose={closeSlideshow}
          theme="dark"
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

/* ── Image Thumbnail ──────────────────────────────────────── */
function ImageThumbnail({ item, onOpen }: { item: TeachingMaterialItem; onOpen: () => void }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item.previewUrl) { setLoading(false); return; }
    let off = false;
    fetchTeachingMaterialPreview(item.previewUrl)
      .then((r) => { if (!off) setThumbUrl(createObjectUrl(r.blob)); })
      .catch(() => {})
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; revokeObjectUrl(thumbUrl); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.previewUrl]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400/50 transition-all bg-white/5"
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      ) : thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon size={24} className="text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[11px] text-white font-medium truncate">{item.displayName || item.originalFileName}</p>
        </div>
        <div className="absolute top-2 right-2">
          <Eye size={14} className="text-white/80" />
        </div>
      </div>
    </button>
  );
}

/* ── Inline Audio Player ─────────────────────────────────── */
function InlineAudioPlayer({ item, onDownload }: { item: TeachingMaterialItem; onDownload: () => void }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadAudio = async () => {
    if (loaded || !item.previewUrl) return;
    setLoading(true);
    try {
      const res = await fetchTeachingMaterialPreview(item.previewUrl);
      setAudioUrl(createObjectUrl(res.blob));
      setLoaded(true);
    } catch {
      /* skip */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => revokeObjectUrl(audioUrl), [audioUrl]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/30 transition-colors">
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0">
        <Headphones size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{item.displayName || item.originalFileName}</p>
        {bytes(item.fileSize) && <p className="text-[10px] text-white/30">{bytes(item.fileSize)}</p>}
        {audioUrl ? (
          <audio controls src={audioUrl} className="w-full mt-2 h-8" />
        ) : (
          <button
            onClick={loadAudio}
            disabled={loading}
            className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            {loading ? "Đang tải..." : "Nghe"}
          </button>
        )}
      </div>
      <button onClick={onDownload} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors flex-shrink-0 cursor-pointer" title="Tải xuống">
        <Download size={14} />
      </button>
    </div>
  );
}

/* ── Material Card (generic) ─────────────────────────────── */
function MaterialCard({ item, onOpen, onDownload, isDownloadOnly }: {
  item: TeachingMaterialItem;
  onOpen: () => void;
  onDownload: () => void;
  isDownloadOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group">
      <div className={cn("p-2.5 rounded-xl bg-gradient-to-br flex-shrink-0", fileTypeColor(item.fileType))}>
        <FileTypeIcon type={item.fileType} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{item.displayName || item.originalFileName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-white/30">{item.fileType}</span>
          {bytes(item.fileSize) && <span className="text-[10px] text-white/30">&bull; {bytes(item.fileSize)}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onOpen}
          className={cn(
            "p-2 rounded-lg transition-colors cursor-pointer",
            "hover:bg-white/10 text-white/50 hover:text-white",
          )}
          title={isDownloadOnly ? "Tải xuống để xem" : "Xem"}
        >
          {isDownloadOnly ? <Download size={14} /> : <Eye size={14} />}
        </button>
        {!isDownloadOnly && (
          <button onClick={onDownload} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer" title="Tải xuống">
            <Download size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

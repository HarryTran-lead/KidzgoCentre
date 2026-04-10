"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { 
  AlertCircle, Download, Eye, FileText, Folder, Info, Loader2, 
  Maximize2, RefreshCw, Search, Sparkles, Upload, BookOpen, Filter, X,
  ChevronLeft, ChevronRight, Clock, User, Calendar, Tag, HardDrive,
  GraduationCap, Settings2,
} from "lucide-react";
import dynamic from "next/dynamic";

const StudentLearningView = dynamic(() => import("./student-learning-view"), { ssr: false });
const SlideshowViewer = dynamic(() => import("./slideshow-viewer"), { ssr: false });
import { FilterTabs } from "@/components/portal/student/FilterTabs";
import { getActiveProgramsForDropdown } from "@/lib/api/programService";
import { createObjectUrl, fetchTeachingMaterialDownload, fetchTeachingMaterialPreview, fetchTeachingMaterialPreviewPdf, getTeachingMaterialById, getTeachingMaterialLessonBundle, getTeachingMaterials, pickTeachingMaterialItems, revokeObjectUrl, sortTeachingMaterialItems, triggerBrowserDownload, uploadTeachingMaterials } from "@/lib/api/teachingMaterialsService";
import { ROLE_LABEL, type Role } from "@/lib/role";
import { useToast } from "@/hooks/use-toast";
import type { Program } from "@/types/admin/programs";
import type { TeachingMaterialItem, TeachingMaterialLessonBundle } from "@/types/teachingMaterials";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import ConfirmModal from "@/components/ConfirmModal";

type Variant = "student" | "portal";
type TabId = "all" | "presentation" | "audio" | "video" | "image" | "document";
type UploadMode = "single" | "multi" | "archive";

const CAN_UPLOAD = new Set<Role>(["Admin", "Teacher", "Staff_Manager"]);

const LESSON_REGEX = /UNIT\s*(\d+)\s*-\s*L(\d+)\s*-\s*(.+)/i;

/** Validate a relativePath against the BE naming convention */
function validateRelativePath(p: string): { ok: boolean; program?: string; unit?: string; lesson?: string; title?: string; warning?: string } {
  const parts = p.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length < 2) return { ok: false, warning: "Thiếu folder chương trình" };
  const program = parts[0];
  // Find the segment matching UNIT x-Ly-Title
  const lessonSeg = parts.find((seg) => LESSON_REGEX.test(seg));
  if (!lessonSeg) return { ok: false, program, warning: "Không tìm thấy folder UNIT x-Ly-Title" };
  const m = LESSON_REGEX.exec(lessonSeg)!;
  return { ok: true, program, unit: m[1], lesson: m[2], title: m[3] };
}
const TABS = [
  { id: "all", label: "Tất cả", icon: <Folder className="h-4 w-4" /> },
  { id: "presentation", label: "Slides", icon: <FileText className="h-4 w-4" /> },
  { id: "audio", label: "Audio", icon: <FileText className="h-4 w-4" /> },
  { id: "video", label: "Video", icon: <FileText className="h-4 w-4" /> },
  { id: "image", label: "Image", icon: <FileText className="h-4 w-4" /> },
  { id: "document", label: "Docs", icon: <FileText className="h-4 w-4" /> },
] as const;

const msg = (error: unknown, fallback: string) => {
  const source = error as any;
  return source?.detail ?? source?.response?.data?.detail ?? source?.response?.data?.message ?? source?.message ?? fallback;
};

const previewable = (fileType?: string | null) => ["Image", "Pdf", "Audio", "Video"].includes(String(fileType ?? ""));
const bytes = (v?: number | null) => !v && v !== 0 ? "Chưa rõ" : v < 1024 * 1024 ? `${(v / 1024).toFixed(1)} KB` : `${(v / (1024 * 1024)).toFixed(1)} MB`;
const dateText = (v?: string | null) => v ? new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa rõ";
const n = (v: string) => v.trim() ? Number(v) : undefined;

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function StatusBadge({ type }: { type: string }) {
  const getColor = () => {
    if (type === "Presentation") return "bg-purple-100 text-purple-700 border-purple-200";
    if (type === "Audio") return "bg-blue-100 text-blue-700 border-blue-200";
    if (type === "Video") return "bg-red-100 text-red-700 border-red-200";
    if (type === "Image") return "bg-green-100 text-green-700 border-green-200";
    if (type === "Pdf") return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };
  
  return (
    <span className={cn("px-2 py-0.5 rounded-lg text-xs font-medium border", getColor())}>
      {type || "Other"}
    </span>
  );
}

export default function TeachingMaterialsWorkspace({ viewerRole, variant = "portal" }: { viewerRole: Role; variant?: Variant }) {
  const { toast } = useToast();
  const dark = variant === "student";
  const canUpload = CAN_UPLOAD.has(viewerRole);
  const [viewMode, setViewMode] = useState<"manage" | "learn">("manage");
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [materials, setMaterials] = useState<TeachingMaterialItem[]>([]);
  const [bundle, setBundle] = useState<TeachingMaterialLessonBundle | null>(null);
  const [detail, setDetail] = useState<TeachingMaterialItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [uploading, setUploading] = useState(false);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [multiFiles, setMultiFiles] = useState<File[]>([]);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [filters, setFilters] = useState({ programId: "", unitNumber: "", lessonNumber: "", fileType: "", category: "", searchTerm: "" });
  const [uploadForm, setUploadForm] = useState({ programId: "", unitNumber: "", lessonNumber: "", lessonTitle: "", displayName: "", category: "LessonSlide" });
  const search = useDeferredValue(filters.searchTerm);
  const [slideshowMaterial, setSlideshowMaterial] = useState<TeachingMaterialItem | null>(null);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  useEffect(() => { getActiveProgramsForDropdown().then(setPrograms).catch(() => setPrograms([])); }, []);

  useEffect(() => {
    let off = false;
    setLoading(true);
    getTeachingMaterials({ programId: filters.programId || undefined, unitNumber: n(filters.unitNumber), lessonNumber: n(filters.lessonNumber), fileType: filters.fileType || undefined, category: filters.category || undefined, searchTerm: search || undefined, pageNumber: 1, pageSize: 200 })
      .then((r) => !off && setMaterials(sortTeachingMaterialItems(pickTeachingMaterialItems(r.data))))
      .catch((e) => !off && toast.destructive({ title: "Load thất bại", description: msg(e, "Không thể tải teaching materials.") }))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [filters.category, filters.fileType, filters.lessonNumber, filters.programId, filters.unitNumber, refreshTick, search, toast]);

  const lessons = useMemo(() => [...new Map(materials.filter((m) => m.programId).map((m) => [`${m.programId}:${m.unitNumber ?? 0}:${m.lessonNumber ?? 0}`, { key: `${m.programId}:${m.unitNumber ?? 0}:${m.lessonNumber ?? 0}`, title: `${m.programName || m.programId} • Unit ${m.unitNumber ?? "?"} • Lesson ${m.lessonNumber ?? "?"}`, programId: m.programId, unitNumber: Number(m.unitNumber ?? 0), lessonNumber: Number(m.lessonNumber ?? 0), lessonTitle: m.lessonTitle || "", count: 0 }])).values()].map((lesson) => ({ ...lesson, count: materials.filter((m) => `${m.programId}:${m.unitNumber ?? 0}:${m.lessonNumber ?? 0}` === lesson.key).length })), [materials]);

  useEffect(() => {
    if (!selectedLesson && lessons[0]) {
      setSelectedLesson(lessons[0].key);
      setFilters((current) => ({
        ...current,
        programId: lessons[0].programId,
        unitNumber: String(lessons[0].unitNumber || ""),
        lessonNumber: String(lessons[0].lessonNumber || ""),
      }));
    }
  }, [lessons, selectedLesson]);

  useEffect(() => {
    const current = lessons.find((l) => l.key === selectedLesson);
    if (!current) { setBundle(null); return; }
    getTeachingMaterialLessonBundle({ programId: current.programId, unitNumber: current.unitNumber, lessonNumber: current.lessonNumber }).then((r) => setBundle(r.data ?? null)).catch(() => setBundle(null));
  }, [lessons, selectedLesson]);

  const bundleMaterials = useMemo(() => !bundle ? [] : [...new Map([...(bundle.primaryPresentation ? [bundle.primaryPresentation] : []), ...bundle.presentations, ...bundle.audioFiles, ...bundle.imageFiles, ...bundle.videoFiles, ...bundle.documents, ...bundle.supplementaryFiles, ...bundle.otherFiles].map((m) => [m.id, m])).values()], [bundle]);
  const visible = useMemo(() => (bundleMaterials.length ? bundleMaterials : materials).filter((m) => activeTab === "all" || (activeTab === "presentation" && m.fileType === "Presentation") || (activeTab === "audio" && m.fileType === "Audio") || (activeTab === "video" && m.fileType === "Video") || (activeTab === "image" && m.fileType === "Image") || (activeTab === "document" && ["Pdf", "Document", "Spreadsheet", "Archive", "Other"].includes(String(m.fileType ?? "")))), [activeTab, bundleMaterials, materials]);

  useEffect(() => { if (!selectedMaterialId && visible[0]) setSelectedMaterialId(visible[0].id); }, [selectedMaterialId, visible]);

  const selectedMaterial = useMemo(() => visible.find((m) => m.id === selectedMaterialId) ?? bundleMaterials.find((m) => m.id === selectedMaterialId) ?? materials.find((m) => m.id === selectedMaterialId) ?? null, [bundleMaterials, materials, selectedMaterialId, visible]);

  const officePreviewable = (ft?: string | null) => ["Presentation", "Document", "Spreadsheet"].includes(String(ft ?? ""));

  useEffect(() => {
    if (!selectedMaterialId) { setPreviewUrl((prev) => { revokeObjectUrl(prev); return null; }); return; }
    let off = false;
    getTeachingMaterialById(selectedMaterialId).then((r) => !off && setDetail(r.data ?? null)).catch(() => !off && setDetail(null));

    // Office files → try preview-pdf, fallback to regular preview
    if (officePreviewable(selectedMaterial?.fileType)) {
      setPreviewLoading(true);
      setPreviewUrl((prev) => { revokeObjectUrl(prev); return null; });

      fetchTeachingMaterialPreviewPdf(selectedMaterialId)
        .then((r) => { if (!off) setPreviewUrl(createObjectUrl(r.blob)); })
        .catch(() => {
          // preview-pdf failed → fallback to regular preview endpoint
          if (off || !selectedMaterial?.previewUrl) { if (!off) setPreviewUrl(null); return; }
          return fetchTeachingMaterialPreview(selectedMaterial.previewUrl)
            .then((r) => { if (!off) setPreviewUrl(createObjectUrl(r.blob)); })
            .catch(() => { if (!off) setPreviewUrl(null); });
        })
        .finally(() => { if (!off) setPreviewLoading(false); });
      return () => { off = true; };
    }

    if (!selectedMaterial?.previewUrl || !previewable(selectedMaterial.fileType)) { setPreviewUrl((prev) => { revokeObjectUrl(prev); return null; }); return () => { off = true; }; }
    setPreviewLoading(true);
    setPreviewUrl((prev) => { revokeObjectUrl(prev); return null; });
    fetchTeachingMaterialPreview(selectedMaterial.previewUrl)
      .then((r) => { if (!off) setPreviewUrl(createObjectUrl(r.blob)); })
      .catch((e) => { if (!off) toast.warning({ title: "Preview lỗi", description: msg(e, "Không thể preview file.") }); })
      .finally(() => { if (!off) setPreviewLoading(false); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaterialId]);

  const onUploadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (uploadMode === "single") setSingleFile(files[0] ?? null);
    if (uploadMode === "multi") {
      setMultiFiles(files);
      // Validate folder structure
      const warns: string[] = [];
      const programs = new Set<string>();
      for (const f of files) {
        const rp = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
        const v = validateRelativePath(rp);
        if (v.program) programs.add(v.program);
        if (!v.ok) warns.push(`${rp}: ${v.warning}`);
      }
      if (programs.size > 1) warns.unshift(`Cảnh báo: ${programs.size} program roots (${[...programs].join(", ")}). Nên chỉ chọn 1 program.`);
      if (warns.length) toast.warning({ title: `${warns.length} cảnh báo cấu trúc folder`, description: warns.slice(0, 3).join("\n") + (warns.length > 3 ? `\n...và ${warns.length - 3} cảnh báo khác` : "") });
    }
    if (uploadMode === "archive") setArchiveFile(files[0] ?? null);
  };

  const tabCounts = useMemo(() => {
    const source = bundleMaterials.length ? bundleMaterials : materials;
    return TABS.reduce<Record<TabId, number>>((acc, tab) => {
      acc[tab.id] = source.filter((m) => tab.id === "all" || (tab.id === "presentation" && m.fileType === "Presentation") || (tab.id === "audio" && m.fileType === "Audio") || (tab.id === "video" && m.fileType === "Video") || (tab.id === "image" && m.fileType === "Image") || (tab.id === "document" && ["Pdf", "Document", "Spreadsheet", "Archive", "Other"].includes(String(m.fileType ?? "")))).length;
      return acc;
    }, { all: source.length, presentation: 0, audio: 0, video: 0, image: 0, document: 0 });
  }, [bundleMaterials, materials]);

  const doDownload = async (item: TeachingMaterialItem) => {
    if (!item.downloadUrl) return;
    try {
      const result = await fetchTeachingMaterialDownload(item.downloadUrl);
      triggerBrowserDownload(result.blob, result.fileName || item.originalFileName || item.displayName || "teaching-material");
    } catch (error) {
      toast.destructive({ title: "Download thất bại", description: msg(error, "Không thể tải file.") });
    }
  };

  const doUpload = async () => {
    const form = new FormData();

    if (uploadMode === "single") {
      // Single file: send metadata fields
      if (!uploadForm.programId.trim()) { toast.warning({ title: "Thiếu chương trình", description: "Hãy chọn chương trình trước khi upload." }); return; }
      if (!singleFile) { toast.warning({ title: "Thiếu file", description: "Hãy chọn file để upload." }); return; }
      form.append("programId", uploadForm.programId.trim());
      if (uploadForm.unitNumber.trim()) form.append("unitNumber", uploadForm.unitNumber.trim());
      if (uploadForm.lessonNumber.trim()) form.append("lessonNumber", uploadForm.lessonNumber.trim());
      if (uploadForm.lessonTitle.trim()) form.append("lessonTitle", uploadForm.lessonTitle.trim());
      if (uploadForm.displayName.trim()) form.append("displayName", uploadForm.displayName.trim());
      form.append("category", uploadForm.category);
      form.append("file", singleFile);
    } else if (uploadMode === "multi") {
      // Multi files (folder upload): send files[] + relativePaths[]
      if (multiFiles.length === 0) { toast.warning({ title: "Thiếu files", description: "Hãy chọn folder để upload." }); return; }
      for (const f of multiFiles) {
        const rp = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
        form.append("files", f);
        form.append("relativePaths", rp);
      }
    } else {
      // Archive (.zip)
      if (!archiveFile) { toast.warning({ title: "Thiếu file", description: "Hãy chọn file .zip để upload." }); return; }
      form.append("archive", archiveFile);
    }

    setUploading(true);
    try {
      await uploadTeachingMaterials(form);
      setUploadOpen(false);
      setSingleFile(null); setMultiFiles([]); setArchiveFile(null);
      setUploadForm((c) => ({ ...c, unitNumber: "", lessonNumber: "", lessonTitle: "", displayName: "" }));
      setRefreshTick((v) => v + 1);
      toast.success({ title: "Upload thành công", description: "Danh sách đã được làm mới." });
    } catch (e) {
      toast.destructive({ title: "Upload thất bại", description: msg(e, "Không thể upload materials.") });
    } finally {
      setUploading(false);
    }
  };

  const stats = useMemo(() => ({
    total: materials.length,
    presentations: materials.filter(m => m.fileType === "Presentation").length,
    audios: materials.filter(m => m.fileType === "Audio").length,
    videos: materials.filter(m => m.fileType === "Video").length,
    images: materials.filter(m => m.fileType === "Image").length,
    documents: materials.filter(m => ["Pdf", "Document", "Spreadsheet"].includes(String(m.fileType ?? ""))).length,
  }), [materials]);

  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Kho tài liệu
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý tài liệu giảng dạy cho {ROLE_LABEL[viewerRole] || viewerRole}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* View mode toggle */}
          <div className="inline-flex rounded-xl border border-red-200 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode("manage")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                viewMode === "manage"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                  : "text-gray-600 hover:bg-red-50",
              )}
            >
              <Settings2 size={15} /> Quản lý
            </button>
            <button
              onClick={() => setViewMode("learn")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                viewMode === "learn"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                  : "text-gray-600 hover:bg-red-50",
              )}
            >
              <GraduationCap size={15} /> Xem bài học
            </button>
          </div>

          <button
            onClick={() => setRefreshTick((v) => v + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
          {canUpload && (
            <button
              onClick={() => setUploadOpen(!uploadOpen)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all cursor-pointer"
            >
              <Upload size={16} /> Tải lên
            </button>
          )}
        </div>
      </div>

      {/* ═══ LEARN MODE: Interactive learning view ═══ */}
      {viewMode === "learn" && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0a0a2a] via-[#1a1a3a] to-[#2a1a3a] p-6 min-h-[60vh]">
          <StudentLearningView />
        </div>
      )}

      {/* ═══ MANAGE MODE: Stats, filters, 3-column layout ═══ */}
      {viewMode === "manage" && (<>

      {/* Stats Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
              <FileText className="text-red-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tổng tài liệu</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-100 grid place-items-center">
              <FileText className="text-purple-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Slides</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.presentations}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-100 grid place-items-center">
              <FileText className="text-blue-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Audio</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.audios}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-100 grid place-items-center">
              <FileText className="text-red-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Video</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.videos}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-green-100 grid place-items-center">
              <FileText className="text-green-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Hình ảnh</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.images}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-100 grid place-items-center">
              <FileText className="text-orange-600" size={18} />
            </span>
            <div>
              <div className="text-sm text-gray-600">Tài liệu</div>
              <div className="text-2xl font-extrabold text-gray-900">{stats.documents}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50 p-4 transition-all duration-700 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              value={filters.searchTerm}
              onChange={(e) => setFilters((c) => ({ ...c, searchTerm: e.target.value }))}
              placeholder="Tìm kiếm tài liệu..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={filters.programId} onValueChange={(val) => setFilters((c) => ({ ...c, programId: val }))}>
              <SelectTrigger className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 min-w-[180px]">
                <SelectValue placeholder="Chọn chương trình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả chương trình</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              value={filters.unitNumber}
              onChange={(e) => setFilters((c) => ({ ...c, unitNumber: e.target.value }))}
              className="h-10 w-24 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Unit"
            />

            <input
              value={filters.lessonNumber}
              onChange={(e) => setFilters((c) => ({ ...c, lessonNumber: e.target.value }))}
              className="h-10 w-24 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Lesson"
            />

            <Select value={filters.category} onValueChange={(val) => setFilters((c) => ({ ...c, category: val }))}>
              <SelectTrigger className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 min-w-[160px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả danh mục</SelectItem>
                <SelectItem value="ProgramDocument">Program Document</SelectItem>
                <SelectItem value="LessonSlide">Lesson Slide</SelectItem>
                <SelectItem value="LessonAsset">Lesson Asset</SelectItem>
                <SelectItem value="Supplementary">Supplementary</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.searchTerm || filters.programId || filters.unitNumber || filters.lessonNumber || filters.category) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-red-100">
            <span className="text-xs text-gray-500">Bộ lọc đang áp dụng:</span>
            {filters.searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs">
                Tìm kiếm: "{filters.searchTerm}"
                <button onClick={() => setFilters(c => ({ ...c, searchTerm: "" }))} className="ml-1 hover:text-red-900">×</button>
              </span>
            )}
            {filters.programId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs">
                Chương trình: {programs.find(p => p.id === filters.programId)?.name || filters.programId}
                <button onClick={() => setFilters(c => ({ ...c, programId: "" }))} className="ml-1 hover:text-red-900">×</button>
              </span>
            )}
            {filters.unitNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs">
                Unit: {filters.unitNumber}
                <button onClick={() => setFilters(c => ({ ...c, unitNumber: "" }))} className="ml-1 hover:text-red-900">×</button>
              </span>
            )}
            {filters.lessonNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs">
                Lesson: {filters.lessonNumber}
                <button onClick={() => setFilters(c => ({ ...c, lessonNumber: "" }))} className="ml-1 hover:text-red-900">×</button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs">
                Danh mục: {filters.category}
                <button onClick={() => setFilters(c => ({ ...c, category: "" }))} className="ml-1 hover:text-red-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={`transition-all duration-700 delay-150 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <FilterTabs 
          tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: tabCounts[t.id], icon: t.icon }))} 
          activeTab={activeTab} 
          onChange={(v) => setActiveTab(v as TabId)} 
          variant="pill" 
          size="md" 
        />
      </div>

      {/* Upload Section */}
      {uploadOpen && canUpload && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Tải lên tài liệu mới</h3>
            <button onClick={() => setUploadOpen(false)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            {(["single", "multi", "archive"] as UploadMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setUploadMode(m); setSingleFile(null); setMultiFiles([]); setArchiveFile(null); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  uploadMode === m
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {m === "single" ? "Một file" : m === "multi" ? "Chọn folder" : "Archive (.zip)"}
              </button>
            ))}
          </div>

          {/* ── Single mode: metadata form ── */}
          {uploadMode === "single" && (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-4">
                <Select value={uploadForm.programId} onValueChange={(val) => setUploadForm((c) => ({ ...c, programId: val }))}>
                  <SelectTrigger className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200">
                    <SelectValue placeholder="Chọn chương trình *" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  value={uploadForm.unitNumber}
                  onChange={(e) => setUploadForm((c) => ({ ...c, unitNumber: e.target.value }))}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Unit Number"
                />
                <input
                  value={uploadForm.lessonNumber}
                  onChange={(e) => setUploadForm((c) => ({ ...c, lessonNumber: e.target.value }))}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Lesson Number"
                />
                <input
                  value={uploadForm.lessonTitle}
                  onChange={(e) => setUploadForm((c) => ({ ...c, lessonTitle: e.target.value }))}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Lesson Title"
                />
                <input
                  value={uploadForm.displayName}
                  onChange={(e) => setUploadForm((c) => ({ ...c, displayName: e.target.value }))}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Display Name"
                />
                <Select value={uploadForm.category} onValueChange={(val) => setUploadForm((c) => ({ ...c, category: val }))}>
                  <SelectTrigger className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ProgramDocument">ProgramDocument</SelectItem>
                    <SelectItem value="LessonSlide">LessonSlide</SelectItem>
                    <SelectItem value="LessonAsset">LessonAsset</SelectItem>
                    <SelectItem value="Supplementary">Supplementary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <input
                type="file"
                onChange={onUploadFile}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 mb-4"
              />
              {singleFile && (
                <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  <span className="font-medium">{singleFile.name}</span>
                  <span className="text-gray-400 ml-2">({(singleFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
            </>
          )}

          {/* ── Multi mode: folder upload ── */}
          {uploadMode === "multi" && (
            <>
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <Info size={14} className="inline mr-1.5 -mt-0.5" />
                <strong>Chọn folder</strong> có cấu trúc: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">ProgramName/UNIT x-Ly-Title/files</code>
                <br />
                <span className="text-xs text-amber-600 mt-1 block">VD: Movers/UNIT 1-L2-READING WRITING/UNIT 1-L2-READING WRITING.pptx</span>
              </div>
              {/* @ts-expect-error webkitdirectory is non-standard but widely supported */}
              <input
                type="file"
                webkitdirectory=""
                onChange={onUploadFile}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 mb-4"
              />
              {multiFiles.length > 0 && (
                <div className="mb-3 rounded-xl border border-gray-200 bg-white max-h-48 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between text-xs text-gray-500">
                    <span>{multiFiles.length} files</span>
                    <span>{(multiFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB tổng</span>
                  </div>
                  {multiFiles.slice(0, 50).map((f, i) => {
                    const rp = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
                    const v = validateRelativePath(rp);
                    return (
                      <div key={i} className={cn("flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-50", !v.ok && "bg-red-50")}>
                        <span className={cn("flex-1 truncate", v.ok ? "text-gray-700" : "text-red-600")}>{rp}</span>
                        {v.ok ? (
                          <span className="text-green-600 text-[10px] shrink-0">U{v.unit}-L{v.lesson}</span>
                        ) : (
                          <span className="text-red-500 text-[10px] shrink-0" title={v.warning}>⚠</span>
                        )}
                      </div>
                    );
                  })}
                  {multiFiles.length > 50 && (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center">...và {multiFiles.length - 50} files khác</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Archive mode: zip upload ── */}
          {uploadMode === "archive" && (
            <>
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <Info size={14} className="inline mr-1.5 -mt-0.5" />
                <strong>File .zip</strong> phải chứa cấu trúc: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">ProgramName/UNIT x-Ly-Title/files</code>
              </div>
              <input
                type="file"
                accept=".zip"
                onChange={onUploadFile}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 mb-4"
              />
              {archiveFile && (
                <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  <span className="font-medium">{archiveFile.name}</span>
                  <span className="text-gray-400 ml-2">({(archiveFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => setUploadOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button onClick={doUpload} disabled={uploading} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50">
              {uploading ? <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> : <Upload className="inline h-4 w-4 mr-2" />}
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Main Content - 3 Columns */}
      <div className={`grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_400px] gap-6 transition-all duration-700 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Left Column - Lessons List */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Bài học</h3>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            ) : (
              lessons.map((lesson) => (
                <button
                  key={lesson.key}
                  type="button"
                  onClick={() => {
                    setSelectedLesson(lesson.key);
                    setFilters((c) => ({
                      ...c,
                      programId: lesson.programId,
                      unitNumber: String(lesson.unitNumber || ""),
                      lessonNumber: String(lesson.lessonNumber || ""),
                    }));
                  }}
                  className={cn(
                    "w-full text-left mb-2 p-3 rounded-xl transition-all",
                    selectedLesson === lesson.key
                      ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className="font-semibold text-gray-900 text-sm">{lesson.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{lesson.lessonTitle || `${lesson.count} tài liệu`}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Middle Column - Materials List */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Tài liệu</h3>
            <span className="text-xs text-gray-500">{visible.length} items</span>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-3 space-y-2">
            {visible.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedMaterialId(item.id)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all",
                  selectedMaterialId === item.id
                    ? "border-red-300 bg-gradient-to-r from-red-50 to-red-100"
                    : "border-gray-200 hover:border-red-200 hover:bg-red-50/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge type={item.fileType || "Other"} />
                      <span className="text-xs text-gray-500">{item.category || "Other"}</span>
                    </div>
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {item.displayName || item.originalFileName || item.id}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><HardDrive size={10} /> {bytes(item.fileSize)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {dateText(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedMaterialId(item.id); }}
                      className="p-1.5 rounded-lg hover:bg-white transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} className="text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); void doDownload(item); }}
                      className="p-1.5 rounded-lg hover:bg-white transition-colors"
                      title="Tải xuống"
                    >
                      <Download size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {visible.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">Không có tài liệu nào</div>
            )}
          </div>
        </div>

        {/* Right Column - Preview & Details */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-red-500/10 to-red-700/10 border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Xem trước & Chi tiết</h3>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-4">
            {!selectedMaterial ? (
              <div className="text-center py-12">
                <div className="inline-flex p-4 rounded-2xl bg-gray-100 mb-4">
                  <FileText size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Chọn một tài liệu để xem trước</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-4 group">
                  {previewUrl && !previewLoading && (
                    <button
                      onClick={() => setFullscreenPreview(true)}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      title="Phóng to"
                    >
                      <Maximize2 size={14} />
                    </button>
                  )}
                  {previewLoading ? (
                    <div className="flex min-h-[200px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : previewUrl && selectedMaterial.fileType === "Image" ? (
                    <img src={previewUrl} alt="Preview" className="max-h-[300px] w-full rounded-lg object-contain" />
                  ) : previewUrl && selectedMaterial.fileType === "Pdf" ? (
                    <iframe src={previewUrl} title="PDF preview" className="h-[400px] w-full rounded-lg" />
                  ) : previewUrl && officePreviewable(selectedMaterial.fileType) ? (
                    <div>
                      <iframe src={previewUrl} title="PDF preview" className="h-[400px] w-full rounded-lg" />
                      {selectedMaterial.fileType === "Presentation" && (
                        <button
                          onClick={() => setSlideshowMaterial(selectedMaterial)}
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
                        >
                          <Eye size={16} /> Xem từng slide
                        </button>
                      )}
                    </div>
                  ) : previewUrl && selectedMaterial.fileType === "Audio" ? (
                    <audio controls src={previewUrl} className="w-full" />
                  ) : previewUrl && selectedMaterial.fileType === "Video" ? (
                    <video controls src={previewUrl} className="max-h-[300px] w-full rounded-lg" />
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        {previewable(selectedMaterial.fileType) || officePreviewable(selectedMaterial.fileType) ? "Preview không khả dụng" : "Tải xuống để xem file này"}
                      </p>
                      {selectedMaterial.fileType === "Presentation" && (
                        <button
                          onClick={() => setSlideshowMaterial(selectedMaterial)}
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
                        >
                          <Eye size={16} /> Xem từng slide
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-900 text-sm mb-3">Thông tin tài liệu</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Tên hiển thị:</span>
                      <span className="text-gray-900 font-medium">{selectedMaterial.displayName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Tên gốc:</span>
                      <span className="text-gray-900 truncate max-w-[200px]">{selectedMaterial.originalFileName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Loại file:</span>
                      <StatusBadge type={selectedMaterial.fileType || "Other"} />
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Kích thước:</span>
                      <span className="text-gray-900">{bytes(selectedMaterial.fileSize)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Chương trình:</span>
                      <span className="text-gray-900">{selectedMaterial.programName || selectedMaterial.programId || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Bài học:</span>
                      <span className="text-gray-900">{selectedMaterial.lessonTitle || `Unit ${selectedMaterial.unitNumber} - Lesson ${selectedMaterial.lessonNumber}` || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Người tải lên:</span>
                      <span className="text-gray-900">{detail?.uploadedByName || selectedMaterial.uploadedByName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Ngày tạo:</span>
                      <span className="text-gray-900">{dateText(detail?.createdAt || selectedMaterial.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => void doDownload(selectedMaterial)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all"
                  >
                    <Download size={16} /> Tải xuống
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      </>)}

      {slideshowMaterial && (
        <SlideshowViewer
          material={slideshowMaterial}
          onClose={() => setSlideshowMaterial(null)}
          theme="light"
        />
      )}

      {/* Fullscreen preview modal */}
      {fullscreenPreview && previewUrl && selectedMaterial && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={() => setFullscreenPreview(false)}>
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 min-w-0">
              <StatusBadge type={selectedMaterial.fileType || "Other"} />
              <span className="text-white text-sm font-medium truncate">
                {selectedMaterial.displayName || selectedMaterial.originalFileName || "Tài liệu"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void doDownload(selectedMaterial)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Tải xuống"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => setFullscreenPreview(false)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
            {selectedMaterial.fileType === "Image" ? (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : selectedMaterial.fileType === "Pdf" || officePreviewable(selectedMaterial.fileType) ? (
              <iframe src={previewUrl} title="Preview" className="w-full h-full rounded-lg bg-white" />
            ) : selectedMaterial.fileType === "Audio" ? (
              <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
                <audio controls src={previewUrl} className="w-full" />
              </div>
            ) : selectedMaterial.fileType === "Video" ? (
              <video controls src={previewUrl} className="max-w-full max-h-full rounded-lg" />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
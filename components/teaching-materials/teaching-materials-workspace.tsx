"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { 
  AlertCircle, Download, Eye, FileText, Folder, Loader2, 
  RefreshCw, Search, Upload, BookOpen, X,
  Clock, HardDrive, Image, Film, Music, File, Archive,
  Layers, Inbox, Wand2
} from "lucide-react";
import { FilterTabs } from "@/components/portal/student/FilterTabs";
import { getActiveProgramsForDropdown } from "@/lib/api/programService";
import { createObjectUrl, fetchTeachingMaterialDownload, fetchTeachingMaterialPreview, getTeachingMaterialById, getTeachingMaterialLessonBundle, getTeachingMaterials, pickTeachingMaterialItems, revokeObjectUrl, sortTeachingMaterialItems, triggerBrowserDownload, uploadTeachingMaterials } from "@/lib/api/teachingMaterialsService";
import { ROLE_LABEL, type Role } from "@/lib/role";
import { useToast } from "@/hooks/use-toast";
import type { Program } from "@/types/admin/programs";
import type { TeachingMaterialItem, TeachingMaterialLessonBundle } from "@/types/teachingMaterials";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";

type Variant = "student" | "portal";
type TabId = "all" | "presentation" | "audio" | "video" | "image" | "document";
type UploadMode = "single" | "multi" | "archive";

const CAN_UPLOAD = new Set<Role>(["Admin", "Teacher", "Staff_Manager"]);
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
const dateText = (v?: string | null) => v ? new Date(v).toLocaleString("vi-VN") : "Chưa rõ";
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

export default function TeachingMaterialsWorkspace({ viewerRole, variant: _variant = "portal" }: { viewerRole: Role; variant?: Variant }) {
  const { toast } = useToast();
  const canUpload = CAN_UPLOAD.has(viewerRole);
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

  useEffect(() => {
    if (!selectedMaterialId) return;
    let off = false;
    getTeachingMaterialById(selectedMaterialId).then((r) => !off && setDetail(r.data ?? null)).catch(() => !off && setDetail(null));
    if (!selectedMaterial?.previewUrl || !previewable(selectedMaterial.fileType)) { revokeObjectUrl(previewUrl); setPreviewUrl(null); return () => { off = true; }; }
    setPreviewLoading(true);
    revokeObjectUrl(previewUrl);
    fetchTeachingMaterialPreview(selectedMaterial.previewUrl).then((r) => !off && setPreviewUrl(createObjectUrl(r.blob))).catch((e) => !off && toast.warning({ title: "Preview lỗi", description: msg(e, "Không thể preview file.") })).finally(() => !off && setPreviewLoading(false));
    return () => { off = true; };
  }, [previewUrl, selectedMaterial, selectedMaterialId, toast]);

  useEffect(() => () => revokeObjectUrl(previewUrl), [previewUrl]);

  const onUploadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (uploadMode === "single") setSingleFile(files[0] ?? null);
    if (uploadMode === "multi") setMultiFiles(files);
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
    if (!uploadForm.programId.trim()) { toast.warning({ title: "Thiếu programId", description: "Hãy nhập programId trước khi upload." }); return; }
    form.append("programId", uploadForm.programId.trim());
    if (uploadForm.unitNumber.trim()) form.append("unitNumber", uploadForm.unitNumber.trim());
    if (uploadForm.lessonNumber.trim()) form.append("lessonNumber", uploadForm.lessonNumber.trim());
    if (uploadForm.lessonTitle.trim()) form.append("lessonTitle", uploadForm.lessonTitle.trim());
    if (uploadForm.displayName.trim()) form.append("displayName", uploadForm.displayName.trim());
    form.append("category", uploadForm.category);
    if (uploadMode === "single" && singleFile) form.append("file", singleFile);
    if (uploadMode === "multi") multiFiles.forEach((f) => form.append("files", f));
    if (uploadMode === "archive" && archiveFile) form.append("archive", archiveFile);
    setUploading(true);
    try { await uploadTeachingMaterials(form); setUploadOpen(false); setRefreshTick((v) => v + 1); toast.success({ title: "Upload thành công", description: "Danh sách đã được làm mới." }); } catch (e) { toast.destructive({ title: "Upload thất bại", description: msg(e, "Không thể upload materials.") }); } finally { setUploading(false); }
  };

  const stats = useMemo(() => ({
    total: materials.length,
    presentations: materials.filter(m => m.fileType === "Presentation").length,
    audios: materials.filter(m => m.fileType === "Audio").length,
    videos: materials.filter(m => m.fileType === "Video").length,
    images: materials.filter(m => m.fileType === "Image").length,
    documents: materials.filter(m => ["Pdf", "Document", "Spreadsheet"].includes(String(m.fileType ?? ""))).length,
  }), [materials]);

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-20 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-6 transition-all duration-500 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3.5 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl shadow-lg shadow-red-500/20 ring-4 ring-red-100">
              <BookOpen size={24} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Kho tài liệu giảng dạy
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                <Layers size={11} /> {ROLE_LABEL[viewerRole] || viewerRole}
              </span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {stats.total} tài liệu
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRefreshTick((v) => v + 1)}
            className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <RefreshCw size={15} className="group-hover:rotate-45 transition-transform duration-500" /> 
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          {canUpload && (
            <button
              onClick={() => setUploadOpen(!uploadOpen)}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 cursor-pointer"
            >
              <Upload size={15} className="group-hover:translate-y-[-1px] transition-transform duration-200" /> 
              <span className="hidden sm:inline">Tải lên</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 transition-all duration-500 delay-100 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <div className="group relative rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-200/50 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-100 to-red-200/50 flex items-center justify-center shadow-sm">
                <Layers className="text-red-600" size={18} />
              </div>
              <div className="absolute -inset-1 bg-red-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Tổng cộng</div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="group relative rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-200/50 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200/50 flex items-center justify-center shadow-sm">
                <FileText className="text-violet-600" size={18} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Slides</div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.presentations}</div>
            </div>
          </div>
        </div>
        <div className="group relative rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200/50 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200/50 flex items-center justify-center shadow-sm">
                <Music className="text-blue-600" size={18} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Audio</div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.audios}</div>
            </div>
          </div>
        </div>
        <div className="group relative rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-rose-500/10 hover:border-rose-200/50 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200/50 flex items-center justify-center shadow-sm">
                <Film className="text-rose-600" size={18} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Video</div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.videos}</div>
            </div>
          </div>
        </div>
        <div className="group relative rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200/50 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200/50 flex items-center justify-center shadow-sm">
                <Image className="text-emerald-600" size={18} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Hình ảnh</div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.images}</div>
            </div>
          </div>
        </div>
        <div className="group relative rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-200/50 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200/50 flex items-center justify-center shadow-sm">
                <File className="text-orange-600" size={18} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">Tài liệu</div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">{stats.documents}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-md shadow-sm p-4 transition-all duration-500 delay-150 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors" size={16} />
            <input
              value={filters.searchTerm}
              onChange={(e) => setFilters((c) => ({ ...c, searchTerm: e.target.value }))}
              placeholder="Tìm kiếm tài liệu..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200/80 bg-gray-50/80 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={filters.programId} onValueChange={(val) => setFilters((c) => ({ ...c, programId: val }))}>
              <SelectTrigger className="h-10 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 min-w-[160px] transition-all hover:border-gray-300">
                <SelectValue placeholder="Chương trình" />
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
              className="h-10 w-20 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 transition-all hover:border-gray-300 placeholder:text-gray-400"
              placeholder="Unit"
            />

            <input
              value={filters.lessonNumber}
              onChange={(e) => setFilters((c) => ({ ...c, lessonNumber: e.target.value }))}
              className="h-10 w-20 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 transition-all hover:border-gray-300 placeholder:text-gray-400"
              placeholder="Lesson"
            />

            <Select value={filters.category} onValueChange={(val) => setFilters((c) => ({ ...c, category: val }))}>
              <SelectTrigger className="h-10 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 min-w-[140px] transition-all hover:border-gray-300">
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

        {/* Active Filters */}
        {(filters.searchTerm || filters.programId || filters.unitNumber || filters.lessonNumber || filters.category) && (
          <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Inbox size={12} /> Đang lọc:
            </span>
            {filters.searchTerm && (
              <button onClick={() => setFilters(c => ({ ...c, searchTerm: "" }))} className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/80 text-red-600 text-xs font-medium border border-red-100/50 hover:bg-red-100/80 transition-colors">
                "{filters.searchTerm}"
                <X size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {filters.programId && (
              <button onClick={() => setFilters(c => ({ ...c, programId: "" }))} className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/80 text-red-600 text-xs font-medium border border-red-100/50 hover:bg-red-100/80 transition-colors">
                {programs.find(p => p.id === filters.programId)?.name || filters.programId}
                <X size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {filters.unitNumber && (
              <button onClick={() => setFilters(c => ({ ...c, unitNumber: "" }))} className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/80 text-red-600 text-xs font-medium border border-red-100/50 hover:bg-red-100/80 transition-colors">
                Unit {filters.unitNumber}
                <X size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {filters.lessonNumber && (
              <button onClick={() => setFilters(c => ({ ...c, lessonNumber: "" }))} className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/80 text-red-600 text-xs font-medium border border-red-100/50 hover:bg-red-100/80 transition-colors">
                Lesson {filters.lessonNumber}
                <X size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {filters.category && (
              <button onClick={() => setFilters(c => ({ ...c, category: "" }))} className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/80 text-red-600 text-xs font-medium border border-red-100/50 hover:bg-red-100/80 transition-colors">
                {filters.category}
                <X size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={`transition-all duration-500 delay-150 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
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
        <div className="rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-md shadow-lg shadow-red-500/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-50">
                <Upload size={16} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Tải lên tài liệu mới</h3>
            </div>
            <button onClick={() => setUploadOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="flex gap-2 mb-4">
            {(["single", "multi", "archive"] as UploadMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setUploadMode(m)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  uploadMode === m
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm shadow-red-500/20"
                    : "border border-gray-200/80 bg-white/80 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                )}
              >
                {m === "single" ? "Single" : m === "multi" ? "Multi" : "Archive (.zip)"}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-4">
            <input
              value={uploadForm.programId}
              onChange={(e) => setUploadForm((c) => ({ ...c, programId: e.target.value }))}
              className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 transition-all placeholder:text-gray-400"
              placeholder="Program ID *"
            />
            <input
              value={uploadForm.unitNumber}
              onChange={(e) => setUploadForm((c) => ({ ...c, unitNumber: e.target.value }))}
              className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 transition-all placeholder:text-gray-400"
              placeholder="Unit Number"
            />
            <input
              value={uploadForm.lessonNumber}
              onChange={(e) => setUploadForm((c) => ({ ...c, lessonNumber: e.target.value }))}
              className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 transition-all placeholder:text-gray-400"
              placeholder="Lesson Number"
            />
            <input
              value={uploadForm.lessonTitle}
              onChange={(e) => setUploadForm((c) => ({ ...c, lessonTitle: e.target.value }))}
              className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 transition-all placeholder:text-gray-400"
              placeholder="Lesson Title"
            />
            <input
              value={uploadForm.displayName}
              onChange={(e) => setUploadForm((c) => ({ ...c, displayName: e.target.value }))}
              className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200/80 focus:border-red-300/50 transition-all placeholder:text-gray-400"
              placeholder="Display Name"
            />
            <Select value={uploadForm.category} onValueChange={(val) => setUploadForm((c) => ({ ...c, category: val }))}>
              <SelectTrigger className="rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm">
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
          <div className="relative">
            <input
              type="file"
              accept={uploadMode === "archive" ? ".zip" : undefined}
              multiple={uploadMode === "multi"}
              onChange={onUploadFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-gray-200/80 bg-gray-50/50 hover:bg-red-50/30 hover:border-red-200/50 transition-all duration-200">
              <div className="p-3 rounded-full bg-white shadow-sm">
                <Upload size={20} className="text-gray-400" />
              </div>
              <div className="text-sm text-gray-500">
                <span className="text-red-600 font-medium">Nhấn để chọn file</span> hoặc kéo thả
              </div>
              <div className="text-xs text-gray-400">
                {uploadMode === "archive" ? ".zip" : "Mọi định dạng"} • Tối đa 100MB
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setUploadOpen(false)} className="px-4 py-2 rounded-xl border border-gray-200/80 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
              Hủy
            </button>
            <button onClick={doUpload} disabled={uploading} className="group px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 disabled:opacity-50 text-sm flex items-center gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={14} className="group-hover:translate-y-[-1px] transition-transform" />}
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Main Content - 3 Columns */}
      <div className={`grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_380px] gap-5 transition-all duration-500 delay-200 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        {/* Left Column - Lessons List */}
        <div className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/80 to-transparent">
            <h3 className="font-semibold text-gray-900 text-sm">Bài học</h3>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-3 space-y-1.5">
            {loading ? (
              <SkeletonList />
            ) : lessons.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex p-3 rounded-2xl bg-gray-100 mb-3">
                  <BookOpen size={24} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Chưa có bài học nào</p>
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
                    "w-full text-left p-3 rounded-xl transition-all duration-200 group",
                    selectedLesson === lesson.key
                      ? "bg-gradient-to-r from-red-50/80 to-red-100/60 border border-red-200/60 shadow-sm"
                      : "hover:bg-gray-50/80 border border-transparent hover:border-gray-200/60"
                  )}
                >
                  <div className="font-medium text-gray-900 text-sm group-hover:text-red-700 transition-colors">{lesson.title}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <Inbox size={11} />{lesson.lessonTitle || `${lesson.count} tài liệu`}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Middle Column - Materials List */}
        <div className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/80 to-transparent flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Tài liệu</h3>
            <span className="text-xs text-gray-400 font-medium tabular-nums">{visible.length} items</span>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-3 space-y-2">
            {loading ? (
              <SkeletonList />
            ) : visible.length === 0 ? (
              <div className="text-center py-10">
                <div className="inline-flex p-3 rounded-2xl bg-gray-100 mb-3">
                  <FileText size={24} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Không có tài liệu nào</p>
              </div>
            ) : (
              visible.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMaterialId(item.id)}
                  className={cn(
                    "group p-3 rounded-xl border cursor-pointer transition-all duration-200",
                    selectedMaterialId === item.id
                      ? "border-red-300/70 bg-gradient-to-r from-red-50/80 to-red-100/60 shadow-sm shadow-red-500/10"
                      : "border-gray-200/60 hover:border-red-200/50 hover:bg-red-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusBadge type={item.fileType || "Other"} />
                        <span className="text-xs text-gray-400/80">{item.category || "Other"}</span>
                      </div>
                      <div className="font-medium text-gray-900 text-sm truncate group-hover:text-red-700 transition-colors">
                        {item.displayName || item.originalFileName || item.id}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><HardDrive size={10} /> {bytes(item.fileSize)}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {dateText(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedMaterialId(item.id); }}
                        className="p-1.5 rounded-lg bg-white border border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                        title="Xem chi tiết"
                      >
                        <Eye size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); void doDownload(item); }}
                        className="p-1.5 rounded-lg bg-white border border-gray-200/60 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm"
                        title="Tải xuống"
                      >
                        <Download size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Preview & Details */}
        <div className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-gray-100/80 bg-gradient-to-r from-gray-50/80 to-transparent">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Eye size={14} className="text-gray-400" />
              Xem trước & Chi tiết
            </h3>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-4 space-y-4">
            {!selectedMaterial ? (
              <div className="text-center py-16">
                <div className="inline-flex p-4 rounded-2xl bg-gray-100 mb-4">
                  <FileText size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm">Chọn một tài liệu để xem trước</p>
              </div>
            ) : (
              <>
                {/* Preview */}
                <div className="rounded-xl border border-gray-200/60 bg-gray-50/60 p-4 overflow-hidden">
                  {previewLoading ? (
                    <div className="flex min-h-[200px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : previewUrl && selectedMaterial.fileType === "Image" ? (
                    <img src={previewUrl} alt="Preview" className="max-h-[280px] w-full rounded-lg object-contain ring-1 ring-gray-200/50" />
                  ) : previewUrl && selectedMaterial.fileType === "Pdf" ? (
                    <iframe src={previewUrl} title="PDF preview" className="h-[400px] w-full rounded-lg ring-1 ring-gray-200/50" />
                  ) : previewUrl && selectedMaterial.fileType === "Audio" ? (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <audio controls src={previewUrl} className="w-full h-10 [&::-webkit-media-controls-panel]:bg-red-50" />
                    </div>
                  ) : previewUrl && selectedMaterial.fileType === "Video" ? (
                    <video controls src={previewUrl} className="max-h-[280px] w-full rounded-lg ring-1 ring-gray-200/50" />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                        <AlertCircle className="h-7 w-7 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400">
                        {previewable(selectedMaterial.fileType) ? "Preview không khả dụng" : "Tải xuống để xem file này"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="rounded-xl border border-gray-200/60 bg-white/60 p-4 space-y-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <Wand2 size={13} className="text-gray-400" />
                    Thông tin tài liệu
                  </h4>
                  <div className="divide-y divide-gray-100/80 text-sm">
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-400 text-xs">Tên hiển thị</span>
                      <span className="text-gray-900 font-medium text-xs">{selectedMaterial.displayName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-400 text-xs">Tên gốc</span>
                      <span className="text-gray-900 truncate max-w-[180px] text-xs">{selectedMaterial.originalFileName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5 items-center">
                      <span className="text-gray-400 text-xs">Loại file</span>
                      <StatusBadge type={selectedMaterial.fileType || "Other"} />
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-400 text-xs">Kích thước</span>
                      <span className="text-gray-900 text-xs">{bytes(selectedMaterial.fileSize)}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-400 text-xs">Chương trình</span>
                      <span className="text-gray-900 text-xs">{selectedMaterial.programName || selectedMaterial.programId || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-400 text-xs">Bài học</span>
                      <span className="text-gray-900 text-xs">{selectedMaterial.lessonTitle || `Unit ${selectedMaterial.unitNumber} - Lesson ${selectedMaterial.lessonNumber}` || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-400 text-xs">Người tải lên</span>
                      <span className="text-gray-900 text-xs">{detail?.uploadedByName || selectedMaterial.uploadedByName || "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-400 text-xs">Ngày tạo</span>
                      <span className="text-gray-900 text-xs">{dateText(detail?.createdAt || selectedMaterial.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => void doDownload(selectedMaterial)}
                    className="group flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200"
                  >
                    <Download size={15} className="group-hover:translate-y-[1px] transition-transform" /> 
                    Tải xuống
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

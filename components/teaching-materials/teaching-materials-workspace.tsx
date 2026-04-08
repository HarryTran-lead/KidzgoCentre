"use client";

import { useDeferredValue, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AlertCircle, Download, Eye, FileText, Folder, Info, Loader2, RefreshCw, Search, Sparkles, Upload } from "lucide-react";
import { FilterTabs } from "@/components/portal/student/FilterTabs";
import { getActiveProgramsForDropdown } from "@/lib/api/programService";
import { createObjectUrl, fetchTeachingMaterialDownload, fetchTeachingMaterialPreview, getTeachingMaterialById, getTeachingMaterialLessonBundle, getTeachingMaterials, pickTeachingMaterialItems, revokeObjectUrl, sortTeachingMaterialItems, triggerBrowserDownload, uploadTeachingMaterials } from "@/lib/api/teachingMaterialsService";
import { ROLE_LABEL, type Role } from "@/lib/role";
import { useToast } from "@/hooks/use-toast";
import type { Program } from "@/types/admin/programs";
import type { ProblemDetails, TeachingMaterialItem, TeachingMaterialLessonBundle } from "@/types/teachingMaterials";

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
const dateText = (v?: string | null) => v ? new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa rõ";
const n = (v: string) => v.trim() ? Number(v) : undefined;

export default function TeachingMaterialsWorkspace({ viewerRole, variant = "portal" }: { viewerRole: Role; variant?: Variant }) {
  const { toast } = useToast();
  const dark = variant === "student";
  const canUpload = CAN_UPLOAD.has(viewerRole);
  const card = dark ? "rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl" : "rounded-3xl border border-gray-200 bg-white";
  const input = dark ? "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40" : "rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900";
  const ghost = dark ? "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white" : "rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700";
  const primary = dark ? "rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-4 py-3 text-sm font-semibold text-slate-950" : "rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white";

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

  return (
    <div className={dark ? "flex h-full min-h-0 flex-col gap-4 p-4 text-white" : "space-y-6"}>
      <div className={`${card} p-5`}>
        <div className={dark ? "inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100" : "inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"}><Sparkles className="h-4 w-4" />Teaching Materials</div>
        <h1 className={dark ? "mt-3 text-2xl font-bold text-white" : "mt-3 text-3xl font-bold text-gray-900"}>Kho tài liệu cho {ROLE_LABEL[viewerRole] || viewerRole}</h1>
        <p className={dark ? "mt-2 text-sm text-white/65" : "mt-2 text-sm text-gray-600"}>List, lesson bundle, preview blob và download theo doc Teaching Materials API.</p>
      </div>

      <div className={`${card} p-4`}>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_220px_140px_140px_180px_auto]">
          <label className="relative"><Search className={dark ? "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" : "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"} /><input value={filters.searchTerm} onChange={(e) => setFilters((c) => ({ ...c, searchTerm: e.target.value }))} className={`${input} w-full pl-11`} placeholder="Tìm theo tên file..." /></label>
          <select value={filters.programId} onChange={(e) => setFilters((c) => ({ ...c, programId: e.target.value }))} className={input}><option value="">Tất cả program</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input value={filters.unitNumber} onChange={(e) => setFilters((c) => ({ ...c, unitNumber: e.target.value }))} className={input} placeholder="Unit" />
          <input value={filters.lessonNumber} onChange={(e) => setFilters((c) => ({ ...c, lessonNumber: e.target.value }))} className={input} placeholder="Lesson" />
          <select value={filters.category} onChange={(e) => setFilters((c) => ({ ...c, category: e.target.value }))} className={input}>{["", "ProgramDocument", "LessonSlide", "LessonAsset", "Supplementary", "Other"].map((v) => <option key={v || "all"} value={v}>{v || "Tất cả nhóm"}</option>)}</select>
          <div className="flex gap-2"><button type="button" onClick={() => setRefreshTick((v) => v + 1)} className={ghost}><RefreshCw className="h-4 w-4" /></button>{canUpload ? <button type="button" onClick={() => setUploadOpen((v) => !v)} className={primary}><Upload className="mr-2 inline h-4 w-4" />Upload</button> : null}</div>
        </div>
        <div className="mt-4"><FilterTabs tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: tabCounts[t.id], icon: t.icon }))} activeTab={activeTab} onChange={(v) => setActiveTab(v as TabId)} variant={dark ? "outline" : "pill"} size="md" /></div>
        {uploadOpen && canUpload ? <div className={dark ? "mt-4 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4" : "mt-4 space-y-3 rounded-3xl border border-red-100 bg-red-50/50 p-4"}><div className="flex gap-2">{(["single", "multi", "archive"] as UploadMode[]).map((m) => <button key={m} type="button" onClick={() => setUploadMode(m)} className={uploadMode === m ? primary : ghost}>{m}</button>)}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><input value={uploadForm.programId} onChange={(e) => setUploadForm((c) => ({ ...c, programId: e.target.value }))} className={input} placeholder="programId" /><input value={uploadForm.unitNumber} onChange={(e) => setUploadForm((c) => ({ ...c, unitNumber: e.target.value }))} className={input} placeholder="unitNumber" /><input value={uploadForm.lessonNumber} onChange={(e) => setUploadForm((c) => ({ ...c, lessonNumber: e.target.value }))} className={input} placeholder="lessonNumber" /><input value={uploadForm.lessonTitle} onChange={(e) => setUploadForm((c) => ({ ...c, lessonTitle: e.target.value }))} className={input} placeholder="lessonTitle" /><input value={uploadForm.displayName} onChange={(e) => setUploadForm((c) => ({ ...c, displayName: e.target.value }))} className={input} placeholder="displayName" /><select value={uploadForm.category} onChange={(e) => setUploadForm((c) => ({ ...c, category: e.target.value }))} className={input}>{["ProgramDocument", "LessonSlide", "LessonAsset", "Supplementary", "Other"].map((v) => <option key={v} value={v}>{v}</option>)}</select></div><input type="file" accept={uploadMode === "archive" ? ".zip" : undefined} multiple={uploadMode === "multi"} onChange={onUploadFile} className={dark ? "block w-full text-sm text-white/70" : "block w-full text-sm text-gray-700"} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setUploadOpen(false)} className={ghost}>Đóng</button><button type="button" onClick={doUpload} disabled={uploading} className={primary}>{uploading ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Upload className="mr-2 inline h-4 w-4" />}Upload</button></div></div> : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <div className={`${card} max-h-[70vh] overflow-y-auto p-4`}>{loading ? <div className="flex justify-center py-8"><Loader2 className={dark ? "h-5 w-5 animate-spin text-white/60" : "h-5 w-5 animate-spin text-gray-500"} /></div> : lessons.map((lesson) => <button key={lesson.key} type="button" onClick={() => { setSelectedLesson(lesson.key); setFilters((c) => ({ ...c, programId: lesson.programId, unitNumber: String(lesson.unitNumber || ""), lessonNumber: String(lesson.lessonNumber || "") })); }} className={selectedLesson === lesson.key ? (dark ? "mb-2 w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-3 text-left text-white" : "mb-2 w-full rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-left text-red-700") : (dark ? "mb-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-white/85" : "mb-2 w-full rounded-2xl border border-gray-200 bg-white px-3 py-3 text-left text-gray-700")}><div className="font-semibold">{lesson.title}</div><div className="text-xs opacity-75">{lesson.lessonTitle || `Tổng ${lesson.count} tài liệu`}</div></button>)}</div>
        <div className={`${card} max-h-[70vh] overflow-y-auto p-4`}>{visible.map((item) => <div key={item.id} className={selectedMaterialId === item.id ? (dark ? "mb-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4" : "mb-3 rounded-2xl border border-red-200 bg-red-50 p-4") : (dark ? "mb-3 rounded-2xl border border-white/10 bg-white/5 p-4" : "mb-3 rounded-2xl border border-gray-200 bg-white p-4")}><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => setSelectedMaterialId(item.id)} className="min-w-0 text-left"><div className={dark ? "text-xs text-white/55" : "text-xs text-gray-500"}>{item.fileType || "Other"} • {item.category || "Other"}</div><div className={dark ? "mt-2 text-sm font-semibold text-white" : "mt-2 text-sm font-semibold text-gray-900"}>{item.displayName || item.originalFileName || item.id}</div><div className={dark ? "mt-1 text-xs text-white/55" : "mt-1 text-xs text-gray-500"}>{bytes(item.fileSize)}</div></button><div className="flex gap-2"><button type="button" onClick={() => setSelectedMaterialId(item.id)} className={ghost}><Eye className="h-4 w-4" /></button><button type="button" onClick={() => void doDownload(item)} className={primary}><Download className="h-4 w-4" /></button></div></div></div>)}</div>
        <div className={`${card} max-h-[70vh] overflow-y-auto p-4`}>{!selectedMaterial ? <div className={dark ? "rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-white/70" : "rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600"}><Info className="mx-auto h-8 w-8" /><p className="mt-3 text-sm">Chọn một material để xem preview và metadata.</p></div> : <><div className={dark ? "rounded-2xl border border-white/10 bg-white/5 p-4" : "rounded-2xl border border-gray-200 bg-gray-50 p-4"}><div className={dark ? "text-xs text-white/55" : "text-xs text-gray-500"}>{selectedMaterial.fileType || "Other"}</div><div className={dark ? "mt-2 text-base font-semibold text-white" : "mt-2 text-base font-semibold text-gray-900"}>{selectedMaterial.displayName || selectedMaterial.originalFileName || selectedMaterial.id}</div><div className={dark ? "mt-1 text-xs text-white/55" : "mt-1 text-xs text-gray-500"}>{selectedMaterial.programName || selectedMaterial.programId} • {bytes(selectedMaterial.fileSize)}</div><div className="mt-3"><button type="button" onClick={() => void doDownload(selectedMaterial)} className={primary}><Download className="mr-2 inline h-4 w-4" />Download</button></div></div><div className={dark ? "mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4" : "mt-4 rounded-2xl border border-gray-200 bg-white p-4"}>{previewLoading ? <div className="flex min-h-[220px] items-center justify-center"><Loader2 className={dark ? "h-5 w-5 animate-spin text-white/60" : "h-5 w-5 animate-spin text-gray-500"} /></div> : previewUrl && selectedMaterial.fileType === "Image" ? <img src={previewUrl} alt="Preview" className="max-h-[320px] w-full rounded-2xl object-contain" /> : previewUrl && selectedMaterial.fileType === "Pdf" ? <iframe src={previewUrl} title="PDF preview" className="h-[360px] w-full rounded-2xl" /> : previewUrl && selectedMaterial.fileType === "Audio" ? <audio controls src={previewUrl} className="w-full" /> : previewUrl && selectedMaterial.fileType === "Video" ? <video controls src={previewUrl} className="max-h-[320px] w-full rounded-2xl" /> : <div className={dark ? "rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-white/70" : "rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-600"}><AlertCircle className="mx-auto h-8 w-8" /><p className="mt-3 text-sm">{previewable(selectedMaterial.fileType) ? "Preview đang trống hoặc lỗi." : "Loại file này nên download thay vì preview native."}</p></div>}</div><div className={dark ? "mt-4 rounded-2xl border border-white/10 bg-white/5 p-4" : "mt-4 rounded-2xl border border-gray-200 bg-white p-4"}><div className={dark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-gray-900"}>Metadata</div><div className="mt-3 grid gap-3 sm:grid-cols-2">{[{ label: "Program", value: detail?.programName || selectedMaterial.programName || selectedMaterial.programId }, { label: "Lesson", value: detail?.lessonTitle || selectedMaterial.lessonTitle || "Chưa rõ" }, { label: "Uploaded by", value: detail?.uploadedByName || selectedMaterial.uploadedByName || "Chưa rõ" }, { label: "Mime type", value: detail?.mimeType || selectedMaterial.mimeType || "Chưa rõ" }, { label: "Created at", value: dateText(detail?.createdAt || selectedMaterial.createdAt) }, { label: "Updated at", value: dateText(detail?.updatedAt || selectedMaterial.updatedAt) }].map((meta) => <div key={meta.label} className={dark ? "rounded-2xl border border-white/10 bg-white/5 px-4 py-3" : "rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"}><div className={dark ? "text-[11px] uppercase tracking-wide text-white/40" : "text-[11px] uppercase tracking-wide text-gray-500"}>{meta.label}</div><div className={dark ? "mt-2 text-sm text-white" : "mt-2 text-sm text-gray-900"}>{meta.value}</div></div>)}</div></div></>}</div>
      </div>
    </div>
  );
}

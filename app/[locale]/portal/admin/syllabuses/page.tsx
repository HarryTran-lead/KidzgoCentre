"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileArchive,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getLevels } from "@/lib/api/academicProgressionService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import {
  createSyllabus,
  getSyllabusById,
  getSyllabuses,
  importSyllabusArchive,
  importSyllabusWord,
  updateSyllabus,
  type CreateSyllabusRequest,
  type SyllabusDetail,
  type SyllabusListItem,
  type UpdateSyllabusRequest,
} from "@/lib/api/syllabusService";
import type { LevelDto } from "@/types/academic-progression";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  const e = err as any;
  return (
    e?.detail ?? e?.message ?? e?.error ?? fallback
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle size={12} /> Đang hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <XCircle size={12} /> Tạm ẩn
    </span>
  );
}

// ─── Modal: Create / Edit Syllabus ────────────────────────────────────────────

function SyllabusFormModal({
  isEdit,
  initial,
  programOptions,
  onClose,
  onSubmit,
}: {
  isEdit: boolean;
  initial?: SyllabusListItem | SyllabusDetail | null;
  programOptions: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (data: CreateSyllabusRequest | UpdateSyllabusRequest) => Promise<void>;
}) {
  const [programId, setProgramId] = useState(initial?.programId ?? "");
  const [levelId, setLevelId] = useState(initial?.levelId ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [version, setVersion] = useState(initial?.version ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [edition, setEdition] = useState((initial as SyllabusDetail)?.edition ?? "");
  const [overview, setOverview] = useState((initial as SyllabusDetail)?.overview ?? "");
  const [totalPeriods, setTotalPeriods] = useState(String((initial as SyllabusDetail)?.totalPeriods ?? ""));
  const [minutesPerPeriod, setMinutesPerPeriod] = useState(String((initial as SyllabusDetail)?.minutesPerPeriod ?? ""));
  const [totalLessons, setTotalLessons] = useState(String((initial as SyllabusDetail)?.totalLessons ?? ""));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) { setLevels([]); return; }
    setLevelsLoading(true);
    getLevels({ programId })
      .then((res) => setLevels(res.data?.items ?? []))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Tiêu đề là bắt buộc."); return; }
    if (!code.trim()) { setError("Mã syllabus là bắt buộc."); return; }
    if (!version.trim()) { setError("Version là bắt buộc."); return; }
    if (!isEdit && !programId) { setError("Chương trình là bắt buộc."); return; }
    if (!isEdit && !levelId) { setError("Level là bắt buộc."); return; }

    setSubmitting(true);
    try {
      if (isEdit) {
        await onSubmit({
          code: code.trim(),
          version: version.trim(),
          title: title.trim(),
          edition: edition.trim() || null,
          overview: overview.trim() || null,
          totalPeriods: totalPeriods ? Number(totalPeriods) : null,
          minutesPerPeriod: minutesPerPeriod ? Number(minutesPerPeriod) : null,
          totalLessons: totalLessons ? Number(totalLessons) : null,
          isActive,
        } as UpdateSyllabusRequest);
      } else {
        await onSubmit({
          programId,
          levelId,
          code: code.trim(),
          version: version.trim(),
          title: title.trim(),
          edition: edition.trim() || null,
          overview: overview.trim() || null,
          totalPeriods: totalPeriods ? Number(totalPeriods) : null,
          minutesPerPeriod: minutesPerPeriod ? Number(minutesPerPeriod) : null,
          totalLessons: totalLessons ? Number(totalLessons) : null,
          isActive,
        } as CreateSyllabusRequest);
      }
    } catch (err) {
      setError(toErrorMessage(err, "Không thể lưu syllabus."));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{isEdit ? "Sửa Syllabus" : "Tạo Syllabus"}</h2>
              <p className="text-sm text-white/80">{isEdit ? "Cập nhật thông tin syllabus" : "Tạo syllabus mới"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {!isEdit && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Chương trình *">
                <select value={programId} onChange={(e) => { setProgramId(e.target.value); setLevelId(""); }} className={inputCls}>
                  <option value="">-- Chọn chương trình --</option>
                  {programOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Level *">
                <select value={levelId} onChange={(e) => setLevelId(e.target.value)} className={inputCls} disabled={!programId || levelsLoading}>
                  <option value="">{levelsLoading ? "Đang tải..." : "-- Chọn level --"}</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Mã Syllabus (code) *">
              <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="GET_READY_STARTER" />
            </Field>
            <Field label="Version *">
              <input value={version} onChange={(e) => setVersion(e.target.value)} className={inputCls} placeholder="v1" />
            </Field>
          </div>

          <Field label="Tiêu đề *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="The Syllabus of Get Ready for Starters" />
          </Field>

          <Field label="Edition">
            <input value={edition} onChange={(e) => setEdition(e.target.value)} className={inputCls} placeholder="Second edition" />
          </Field>

          <Field label="Overview (Tổng quan)">
            <textarea value={overview} onChange={(e) => setOverview(e.target.value)} rows={3} className={inputCls} placeholder="Mô tả tổng quan chương trình..." />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tổng số tiết">
              <input type="number" value={totalPeriods} onChange={(e) => setTotalPeriods(e.target.value)} className={inputCls} placeholder="72" min={0} />
            </Field>
            <Field label="Phút / tiết">
              <input type="number" value={minutesPerPeriod} onChange={(e) => setMinutesPerPeriod(e.target.value)} className={inputCls} placeholder="90" min={0} />
            </Field>
            <Field label="Tổng bài học">
              <input type="number" value={totalLessons} onChange={(e) => setTotalLessons(e.target.value)} className={inputCls} placeholder="72" min={0} />
            </Field>
          </div>

          {isEdit && (
            <Field label="Trạng thái">
              <div className="grid grid-cols-2 gap-3">
                {[true, false].map((val) => (
                  <button key={String(val)} type="button" onClick={() => setIsActive(val)}
                    className={cn("rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
                      isActive === val ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600")}>
                    {val ? "Đang hoạt động" : "Tạm ẩn"}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {error && <ErrorBox message={error} />}

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Hủy</button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {isEdit ? "Lưu thay đổi" : "Tạo Syllabus"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Import Word ───────────────────────────────────────────────────────

function ImportWordModal({
  programOptions,
  loading,
  onClose,
  onSubmit,
}: {
  programOptions: Array<{ id: string; name: string }>;
  loading: boolean;
  onClose: () => void;
  onSubmit: (params: { programId: string; levelId: string; code: string; version: string; overwriteExisting: boolean }, file: File) => void;
}) {
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState("v1");
  const [overwrite, setOverwrite] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) { setLevels([]); return; }
    setLevelsLoading(true);
    getLevels({ programId }).then((res) => setLevels(res.data?.items ?? [])).catch(() => setLevels([])).finally(() => setLevelsLoading(false));
  }, [programId]);

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!programId) { setError("Chọn chương trình."); return; }
    if (!levelId) { setError("Chọn level."); return; }
    if (!code.trim()) { setError("Nhập code syllabus."); return; }
    if (!version.trim()) { setError("Nhập version."); return; }
    if (!file) { setError("Chọn file .docx."); return; }
    onSubmit({ programId, levelId, code: code.trim(), version: version.trim(), overwriteExisting: overwrite }, file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white"><FileText size={20} /></div>
            <h2 className="text-lg font-bold text-white">Import Syllabus (Word)</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Chương trình *">
              <select value={programId} onChange={(e) => { setProgramId(e.target.value); setLevelId(""); }} className={inputCls}>
                <option value="">-- Chọn --</option>
                {programOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Level *">
              <select value={levelId} onChange={(e) => setLevelId(e.target.value)} className={inputCls} disabled={!programId || levelsLoading}>
                <option value="">{levelsLoading ? "Đang tải..." : "-- Chọn --"}</option>
                {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Code syllabus *">
              <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="GET_READY_STARTER" />
            </Field>
            <Field label="Version *">
              <input value={version} onChange={(e) => setVersion(e.target.value)} className={inputCls} placeholder="v1" />
            </Field>
          </div>
          <Field label="File .docx *">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-gray-600 hover:bg-blue-50">
              <Upload size={16} className="text-blue-600" />
              <span>{file ? file.name : "Chọn file syllabus Word (.docx)"}</span>
              <input type="file" accept=".doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="rounded" />
            Ghi đè nếu đã tồn tại
          </label>
          {error && <ErrorBox message={error} />}
          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Hủy</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Import Word
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Import Archive ────────────────────────────────────────────────────

function ImportArchiveModal({
  programOptions,
  loading,
  onClose,
  onSubmit,
}: {
  programOptions: Array<{ id: string; name: string }>;
  loading: boolean;
  onClose: () => void;
  onSubmit: (params: { programId: string; levelId: string; code: string; version: string; overwriteExisting: boolean }, file: File) => void;
}) {
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState("v1");
  const [overwrite, setOverwrite] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skippedEntries, setSkippedEntries] = useState<string[]>([]);

  useEffect(() => {
    if (!programId) { setLevels([]); return; }
    setLevelsLoading(true);
    getLevels({ programId }).then((res) => setLevels(res.data?.items ?? [])).catch(() => setLevels([])).finally(() => setLevelsLoading(false));
  }, [programId]);

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSkippedEntries([]);
    if (!programId) { setError("Chọn chương trình."); return; }
    if (!levelId) { setError("Chọn level."); return; }
    if (!code.trim()) { setError("Nhập code syllabus."); return; }
    if (!version.trim()) { setError("Nhập version."); return; }
    if (!file) { setError("Chọn file .zip."); return; }
    onSubmit({ programId, levelId, code: code.trim(), version: version.trim(), overwriteExisting: overwrite }, file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white"><FileArchive size={20} /></div>
            <h2 className="text-lg font-bold text-white">Import Curriculum (Zip)</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-xs text-purple-700">
            ZIP phải chứa: thư mục <strong>PPCT ...</strong> (file syllabus) và các thư mục <strong>UNIT 1</strong>, <strong>UNIT 2</strong>, ... (file lesson .docx)
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Chương trình *">
              <select value={programId} onChange={(e) => { setProgramId(e.target.value); setLevelId(""); }} className={inputCls}>
                <option value="">-- Chọn --</option>
                {programOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Level *">
              <select value={levelId} onChange={(e) => setLevelId(e.target.value)} className={inputCls} disabled={!programId || levelsLoading}>
                <option value="">{levelsLoading ? "Đang tải..." : "-- Chọn --"}</option>
                {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Code syllabus *">
              <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="GET_READY_STARTER" />
            </Field>
            <Field label="Version *">
              <input value={version} onChange={(e) => setVersion(e.target.value)} className={inputCls} placeholder="v1" />
            </Field>
          </div>
          <Field label="File .zip *">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-purple-200 bg-purple-50/60 px-4 py-3 text-sm text-gray-600 hover:bg-purple-50">
              <Upload size={16} className="text-purple-600" />
              <span>{file ? file.name : "Chọn file zip curriculum"}</span>
              <input type="file" accept=".zip" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="rounded" />
            Ghi đè nếu đã tồn tại
          </label>
          {error && <ErrorBox message={error} />}
          {skippedEntries.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <strong>Bỏ qua {skippedEntries.length} file:</strong>
              <ul className="mt-1 space-y-0.5 text-xs">
                {skippedEntries.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Hủy</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Import Zip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Detail ────────────────────────────────────────────────────────────

function SyllabusDetailModal({
  detail,
  onClose,
  onEdit,
}: {
  detail: SyllabusDetail;
  onClose: () => void;
  onEdit: () => void;
}) {
  const rows: Array<{ label: string; value: string | number | null | undefined }> = [
    { label: "ID", value: detail.id },
    { label: "Chương trình", value: detail.programName },
    { label: "Level", value: detail.levelName },
    { label: "Code", value: detail.code },
    { label: "Version", value: detail.version },
    { label: "Edition", value: detail.edition },
    { label: "Tổng số tiết", value: detail.totalPeriods },
    { label: "Phút / tiết", value: detail.minutesPerPeriod },
    { label: "Tổng bài học", value: detail.totalLessons },
    { label: "Units", value: detail.unitCount },
    { label: "Session templates", value: detail.sessionTemplateCount },
    { label: "File nguồn", value: detail.sourceFileName },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white"><BookOpen size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">{detail.title}</h2>
              <p className="text-sm text-white/80">{detail.code} · {detail.version}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onEdit} className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/30 cursor-pointer">
              Sửa
            </button>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"><X size={18} /></button>
          </div>
        </div>
        <div className="space-y-1 p-6">
          <div className="mb-4"><ActiveBadge isActive={detail.isActive} /></div>
          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {rows.map(({ label, value }) => value != null && value !== "" ? (
              <div key={label} className="flex gap-4 px-4 py-2.5 text-sm">
                <dt className="w-40 shrink-0 text-gray-500">{label}</dt>
                <dd className="text-gray-800 break-all">{String(value)}</dd>
              </div>
            ) : null)}
          </dl>
          {detail.overview && (
            <div className="mt-4">
              <p className="mb-1 text-sm font-semibold text-gray-700">Overview</p>
              <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">{detail.overview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; item: SyllabusListItem }
  | null;

type ImportMode = "word" | "archive" | null;

export default function SyllabusesPage() {
  const { toast } = useToast();

  // Data
  const [items, setItems] = useState<SyllabusListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const PAGE_SIZE = 20;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgramId, setFilterProgramId] = useState("");
  const [filterLevelId, setFilterLevelId] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Program / Level options
  const [programOptions, setProgramOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [filterLevels, setFilterLevels] = useState<LevelDto[]>([]);

  // Modals
  const [modal, setModal] = useState<ModalState>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SyllabusDetail | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Load programs once
  useEffect(() => {
    getAllProgramsForDropdown()
      .then((list) => setProgramOptions(list.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, []);

  // Load levels when filter program changes
  useEffect(() => {
    setFilterLevelId("");
    if (!filterProgramId) { setFilterLevels([]); return; }
    getLevels({ programId: filterProgramId }).then((res) => setFilterLevels(res.data?.items ?? [])).catch(() => setFilterLevels([]));
  }, [filterProgramId]);

  const loadData = useCallback(async (page = pageNumber, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    try {
      const params: Record<string, unknown> = { pageNumber: page, pageSize: PAGE_SIZE };
      if (filterProgramId) params.programId = filterProgramId;
      if (filterLevelId) params.levelId = filterLevelId;
      if (searchTerm.trim()) params.searchTerm = searchTerm.trim();
      if (filterActive !== "all") params.isActive = filterActive === "active";

      const res = await getSyllabuses(params as any);
      if (res.isSuccess) {
        setItems(res.data.items);
        setTotalCount(res.data.totalCount);
      } else {
        toast({ title: "Lỗi tải dữ liệu", description: res.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageNumber, filterProgramId, filterLevelId, searchTerm, filterActive, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Handlers
  const handleCreate = async (data: CreateSyllabusRequest | UpdateSyllabusRequest) => {
    const res = await createSyllabus(data as CreateSyllabusRequest);
    if (!res.isSuccess) throw new Error(res.message ?? "Không thể tạo syllabus.");
    toast({ title: "Đã tạo Syllabus", variant: "success" });
    setModal(null);
    await loadData(1, true);
    setPageNumber(1);
  };

  const handleUpdate = async (id: string, data: CreateSyllabusRequest | UpdateSyllabusRequest) => {
    const res = await updateSyllabus(id, data as UpdateSyllabusRequest);
    if (!res.isSuccess) throw new Error(res.message ?? "Không thể cập nhật syllabus.");
    toast({ title: "Đã cập nhật Syllabus", variant: "success" });
    setModal(null);
    setDetail(null);
    await loadData(pageNumber, true);
  };

  const handleOpenDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await getSyllabusById(id);
      if (res.isSuccess && res.data) setDetail(res.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleImportWord = async (
    params: { programId: string; levelId: string; code: string; version: string; overwriteExisting: boolean },
    file: File,
  ) => {
    setImportLoading(true);
    try {
      const res = await importSyllabusWord(params, file);
      if (!res.isSuccess) {
        toast({ title: "Import thất bại", description: res.detail ?? res.message ?? "Lỗi import Word.", variant: "destructive" });
        return;
      }
      const d = res.data!;
      toast({
        title: "Import Word thành công",
        description: `${d.importedUnits} units · ${d.importedLessons} lessons · ${d.importedSessionTemplates} session templates`,
        variant: "success",
      });
      setImportMode(null);
      await loadData(1, true);
      setPageNumber(1);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportArchive = async (
    params: { programId: string; levelId: string; code: string; version: string; overwriteExisting: boolean },
    file: File,
  ) => {
    setImportLoading(true);
    try {
      const res = await importSyllabusArchive(params, file);
      if (!res.isSuccess) {
        toast({ title: "Import thất bại", description: res.detail ?? res.message ?? "Lỗi import archive.", variant: "destructive" });
        return;
      }
      const d = res.data!;
      const skippedMsg = d.skippedFiles > 0 ? ` · Bỏ qua ${d.skippedFiles} file` : "";
      toast({
        title: "Import Zip thành công",
        description: `${d.importedLessonPlans} lesson plans${skippedMsg}`,
        variant: "success",
      });
      if (d.skippedEntries.length > 0) {
        toast({
          title: `Bỏ qua ${d.skippedEntries.length} file`,
          description: d.skippedEntries.slice(0, 5).join(" | "),
          variant: "warning",
        });
      }
      setImportMode(null);
      await loadData(1, true);
      setPageNumber(1);
    } finally {
      setImportLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const inputCls = "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-3 shadow-lg">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Syllabus</h1>
            <p className="text-sm text-gray-500">{totalCount} syllabus{totalCount !== 1 ? "es" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => loadData(pageNumber, true)} disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 cursor-pointer disabled:opacity-50">
            <RefreshCw size={16} className={cn(refreshing && "animate-spin")} /> Làm mới
          </button>
          <button type="button" onClick={() => setImportMode("word")}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer">
            <FileText size={16} /> Import Word
          </button>
          <button type="button" onClick={() => setImportMode("archive")}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 cursor-pointer">
            <FileArchive size={16} /> Import Zip
          </button>
          <button type="button" onClick={() => setModal({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer">
            <Plus size={16} /> Tạo Syllabus
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm..." className={cn(inputCls, "pl-9 w-52")} />
        </div>
        <select value={filterProgramId} onChange={(e) => { setFilterProgramId(e.target.value); setFilterLevelId(""); }} className={inputCls}>
          <option value="">Tất cả chương trình</option>
          {programOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {filterLevels.length > 0 && (
          <select value={filterLevelId} onChange={(e) => setFilterLevelId(e.target.value)} className={inputCls}>
            <option value="">Tất cả level</option>
            {filterLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as any)} className={inputCls}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm ẩn</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-3" /> Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">Không có syllabus nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Chương trình / Level</th>
                <th className="px-4 py-3">Code · Version</th>
                <th className="px-4 py-3 text-center">Units</th>
                <th className="px-4 py-3 text-center">Sessions</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                    <div className="truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{item.programName ?? "—"}</div>
                    <div className="text-xs text-gray-400">{item.levelName ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    <div>{item.code}</div>
                    <div className="text-gray-400">{item.version}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.unitCount ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.sessionTemplateCount ?? "—"}</td>
                  <td className="px-4 py-3 text-center"><ActiveBadge isActive={item.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {detailLoading ? null : (
                        <button type="button" onClick={() => handleOpenDetail(item.id)}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer" title="Xem chi tiết">
                          <Eye size={14} />
                        </button>
                      )}
                      <button type="button" onClick={() => setModal({ mode: "edit", item })}
                        className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer" title="Sửa">
                        <Pencil size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{totalCount} kết quả · Trang {pageNumber}/{totalPages}</p>
          <div className="flex gap-2">
            <button type="button" disabled={pageNumber <= 1} onClick={() => setPageNumber((p) => p - 1)}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-red-50 disabled:opacity-40 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button type="button" disabled={pageNumber >= totalPages} onClick={() => setPageNumber((p) => p + 1)}
              className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-red-50 disabled:opacity-40 cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.mode === "create" && (
        <SyllabusFormModal isEdit={false} programOptions={programOptions} onClose={() => setModal(null)} onSubmit={handleCreate} />
      )}
      {modal?.mode === "edit" && (
        <SyllabusFormModal isEdit initial={detail ?? modal.item} programOptions={programOptions} onClose={() => setModal(null)}
          onSubmit={(data) => handleUpdate(modal.item.id, data)} />
      )}
      {detail && (
        <SyllabusDetailModal detail={detail} onClose={() => setDetail(null)}
          onEdit={() => { setModal({ mode: "edit", item: detail }); }} />
      )}
      {importMode === "word" && (
        <ImportWordModal programOptions={programOptions} loading={importLoading} onClose={() => setImportMode(null)} onSubmit={handleImportWord} />
      )}
      {importMode === "archive" && (
        <ImportArchiveModal programOptions={programOptions} loading={importLoading} onClose={() => setImportMode(null)} onSubmit={handleImportArchive} />
      )}
    </div>
  );
}

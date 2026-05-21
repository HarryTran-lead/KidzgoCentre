"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  BookOpenCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileArchive,
  FileText,
  Filter,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import { useToast } from "@/hooks/use-toast";
import { getLevels, getModules } from "@/lib/api/academicProgressionService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import {
  createSyllabus,
  getSyllabusById,
  getSyllabuses,
  importSyllabusArchive,
  importSyllabusWord,
  importLessonPlanWords,
  updateSyllabus,
  getImportConfiguration,
  upsertImportConfiguration,
  getUnitLessonPlans,
  type CreateSyllabusRequest,
  type UpsertImportConfigRequest,
  type SyllabusDetail,
  type UnitLessonPlansResult,
  type UnitLessonPlanGroup,
  type SyllabusListItem,
  type UpdateSyllabusRequest,
} from "@/lib/api/syllabusService";
import type { LevelDto, ModuleDto } from "@/types/academic-progression";

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

// ─── Modal: Import Configuration ────────────────────────────────────────────

interface RuleForm {
  key: string;
  moduleId: string;
  includeStarterUnit: boolean;
  unitFrom: string;
  unitTo: string;
  revisionNumber: string;
  orderIndex: number;
  expectedLessonPlanCount?: number | null;
  moduleName?: string | null;
}

function ImportConfigModal({
  programOptions,
  initialProgramId,
  initialLevelId,
  onClose,
  onSaved,
}: {
  programOptions: Array<{ id: string; name: string }>;
  initialProgramId?: string;
  initialLevelId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [programId, setProgramId] = useState(initialProgramId ?? "");
  const [levelId, setLevelId] = useState(initialLevelId ?? "");
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [regularCount, setRegularCount] = useState("3");
  const [starterCount, setStarterCount] = useState("2");
  const [revisionCount, setRevisionCount] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [rules, setRules] = useState<RuleForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  useEffect(() => {
    if (!programId) { setLevels([]); setLevelId(""); return; }
    setLevelsLoading(true);
    getLevels({ programId })
      .then((res) => setLevels(res.data?.items ?? []))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [programId]);

  useEffect(() => {
    if (!levelId) { setModules([]); setRules([]); return; }
    setModulesLoading(true);
    setLoading(true);
    Promise.all([
      getModules({ levelId }),
      getImportConfiguration(programId, levelId),
    ])
      .then(([modRes, cfgRes]) => {
        const mods = modRes.data?.items ?? [];
        setModules(mods);
        if (cfgRes.isSuccess && cfgRes.data) {
          const cfg = cfgRes.data;
          setRegularCount(String(cfg.regularUnitLessonPlanCount));
          setStarterCount(String(cfg.starterUnitLessonPlanCount));
          setRevisionCount(String(cfg.revisionLessonPlanCount));
          setIsActive(cfg.isActive);
          setRules(
            cfg.rules
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((r, i) => ({
                key: `r_${i}_${r.moduleId}`,
                moduleId: r.moduleId,
                includeStarterUnit: r.includeStarterUnit,
                unitFrom: r.unitFrom != null ? String(r.unitFrom) : "",
                unitTo: r.unitTo != null ? String(r.unitTo) : "",
                revisionNumber: r.revisionNumber != null ? String(r.revisionNumber) : "",
                orderIndex: r.orderIndex,
                expectedLessonPlanCount: r.expectedLessonPlanCount,
                moduleName: r.moduleName,
              }))
          );
        } else {
          // Pre-fill rules from available modules
          setRules(
            mods
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((m, i) => ({
                key: `new_${i}_${m.id}`,
                moduleId: m.id,
                includeStarterUnit: false,
                unitFrom: "",
                unitTo: "",
                revisionNumber: "",
                orderIndex: i + 1,
                moduleName: m.name,
              }))
          );
        }
      })
      .catch(() => {})
      .finally(() => { setModulesLoading(false); setLoading(false); });
  }, [levelId, programId]);

  const updateRule = (key: string, patch: Partial<RuleForm>) =>
    setRules((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        key: `new_${Date.now()}`,
        moduleId: "",
        includeStarterUnit: false,
        unitFrom: "",
        unitTo: "",
        revisionNumber: "",
        orderIndex: prev.length + 1,
      },
    ]);
  };

  const removeRule = (key: string) =>
    setRules((prev) =>
      prev
        .filter((r) => r.key !== key)
        .map((r, i) => ({ ...r, orderIndex: i + 1 }))
    );

  const validate = (): string | null => {
    const r = Number(regularCount);
    const s = Number(starterCount);
    const v = Number(revisionCount);
    if (!r || r <= 0) return "Regular unit lesson plan count phải > 0.";
    if (!s || s <= 0) return "Starter unit lesson plan count phải > 0.";
    if (!v || v <= 0) return "Revision lesson plan count phải > 0.";
    if (!rules.length) return "Phải có ít nhất 1 rule.";
    const moduleIds = rules.map((r) => r.moduleId);
    if (moduleIds.some((id) => !id)) return "Tất cả rule phải chọn Module.";
    const uniqueModules = new Set(moduleIds);
    if (uniqueModules.size !== moduleIds.length) return "Mỗi Module chỉ được xuất hiện 1 lần.";
    const starterRules = rules.filter((r) => r.includeStarterUnit);
    if (starterRules.length > 1) return "Chỉ 1 rule được bật Include Starter Unit.";
    const orderIdxs = rules.map((r) => r.orderIndex);
    if (new Set(orderIdxs).size !== orderIdxs.length) return "orderIndex phải unique.";
    for (const rule of rules) {
      if (rule.unitFrom || rule.unitTo) {
        const from = Number(rule.unitFrom);
        const to = Number(rule.unitTo);
        if (!from || !to) return `Rule ${rule.orderIndex}: unitFrom và unitTo phải cùng có.`;
        if (from <= 0 || to <= 0) return `Rule ${rule.orderIndex}: unitFrom/unitTo phải > 0.`;
        if (from > to) return `Rule ${rule.orderIndex}: unitFrom phải <= unitTo.`;
      }
    }
    // Check unit range overlap
    const ranges = rules
      .filter((r) => r.unitFrom && r.unitTo)
      .map((r) => ({ from: Number(r.unitFrom), to: Number(r.unitTo), idx: r.orderIndex }));
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (ranges[i].from <= ranges[j].to && ranges[j].from <= ranges[i].to) {
          return `Rule ${ranges[i].idx} và ${ranges[j].idx} có khoảng Unit bị overlap.`;
        }
      }
    }
    // revisionNumber unique
    const revNums = rules.filter((r) => r.revisionNumber).map((r) => r.revisionNumber);
    if (new Set(revNums).size !== revNums.length) return "revisionNumber phải unique.";
    return null;
  };

  const handleSave = async () => {
    if (!programId) { setError("Chọn chương trình."); return; }
    if (!levelId) { setError("Chọn level."); return; }
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setSaving(true);
    try {
      const body: UpsertImportConfigRequest = {
        regularUnitLessonPlanCount: Number(regularCount),
        starterUnitLessonPlanCount: Number(starterCount),
        revisionLessonPlanCount: Number(revisionCount),
        isActive,
        rules: rules.map((r) => ({
          moduleId: r.moduleId,
          includeStarterUnit: r.includeStarterUnit,
          unitFrom: r.unitFrom ? Number(r.unitFrom) : null,
          unitTo: r.unitTo ? Number(r.unitTo) : null,
          revisionNumber: r.revisionNumber ? Number(r.revisionNumber) : null,
          orderIndex: r.orderIndex,
        })),
      };
      const res = await upsertImportConfiguration(programId, levelId, body);
      if (!res.isSuccess) {
        setError(res.detail ?? res.message ?? "Lưu cấu hình thất bại.");
        return;
      }
      // Reload config with expectedLessonPlanCount from response
      if (res.data) {
        setRules(
          res.data.rules
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((r, i) => ({
              key: `saved_${i}_${r.moduleId}`,
              moduleId: r.moduleId,
              includeStarterUnit: r.includeStarterUnit,
              unitFrom: r.unitFrom != null ? String(r.unitFrom) : "",
              unitTo: r.unitTo != null ? String(r.unitTo) : "",
              revisionNumber: r.revisionNumber != null ? String(r.revisionNumber) : "",
              orderIndex: r.orderIndex,
              expectedLessonPlanCount: r.expectedLessonPlanCount,
              moduleName: r.moduleName,
            }))
        );
      }
      toast({ title: "Đã lưu cấu hình import", variant: "success" });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white"><Settings2 size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Cấu hình Import Curriculum</h2>
              <p className="text-sm text-white/80">Map Unit / Revision vào Module trước khi import zip</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Program + Level */}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Chương trình *">
              <Select value={programId} onValueChange={(v) => { setProgramId(v); setLevelId(""); }}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Chọn chương trình" /></SelectTrigger>
                <SelectContent>
                  {programOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Level *">
              <Select value={levelId} onValueChange={setLevelId} disabled={!programId || levelsLoading}>
                <SelectTrigger className={cn(inputCls, (!programId || levelsLoading) && "opacity-50 cursor-not-allowed")}>
                  <SelectValue placeholder={levelsLoading ? "Đang tải..." : "Chọn level"} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {levelId && (
            <>
              {/* Counts */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">Số lesson plan kỳ vọng</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Mỗi Unit thường">
                    <input type="number" min={1} value={regularCount} onChange={(e) => setRegularCount(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Unit Starter">
                    <input type="number" min={1} value={starterCount} onChange={(e) => setStarterCount(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Mỗi Revision">
                    <input type="number" min={1} value={revisionCount} onChange={(e) => setRevisionCount(e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
                  Kích hoạt cấu hình này
                </label>
              </div>

              {/* Rules */}
              {loading || modulesLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> Đang tải...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Rules mapping
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">{rules.length}</span>
                    </p>
                    <button type="button" onClick={addRule}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer">
                      <Plus size={13} /> Thêm rule
                    </button>
                  </div>

                  {rules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-gray-400">
                      <GripVertical size={24} className="mb-2 opacity-30" />
                      <p className="text-sm">Chưa có rule nào</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rules.map((rule) => (
                        <div key={rule.key} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 shrink-0">{rule.orderIndex}</span>
                            <div className="flex-1 min-w-0">
                              <Select value={rule.moduleId} onValueChange={(v) => updateRule(rule.key, {
                                moduleId: v,
                                moduleName: modules.find((m) => m.id === v)?.name,
                              })}>
                                <SelectTrigger className={cn(inputCls, "bg-white")}>
                                  <SelectValue placeholder="Chọn Module" />
                                </SelectTrigger>
                                <SelectContent>
                                  {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <button type="button" onClick={() => removeRule(rule.key)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <Field label="Unit từ">
                              <input type="number" min={1} value={rule.unitFrom} onChange={(e) => updateRule(rule.key, { unitFrom: e.target.value })} placeholder="—" className={cn(inputCls, "bg-white")} />
                            </Field>
                            <Field label="Unit đến">
                              <input type="number" min={1} value={rule.unitTo} onChange={(e) => updateRule(rule.key, { unitTo: e.target.value })} placeholder="—" className={cn(inputCls, "bg-white")} />
                            </Field>
                            <Field label="Revision số">
                              <input type="number" min={1} value={rule.revisionNumber} onChange={(e) => updateRule(rule.key, { revisionNumber: e.target.value })} placeholder="—" className={cn(inputCls, "bg-white")} />
                            </Field>
                            <Field label="Kỳ vọng">
                              <div className={cn(inputCls, "bg-gray-100 text-gray-500 cursor-default")}>
                                {rule.expectedLessonPlanCount != null ? rule.expectedLessonPlanCount : "—"}
                              </div>
                            </Field>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={rule.includeStarterUnit} onChange={(e) => updateRule(rule.key, { includeStarterUnit: e.target.checked })} className="rounded" />
                            Gộp Unit Starter vào module này
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Đóng</button>
            <button type="button" onClick={handleSave} disabled={saving || !levelId}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
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
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Chương trình &amp; Level</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Chương trình *">
                  <Select value={programId} onValueChange={(v) => { setProgramId(v); setLevelId(""); }}>
                    <SelectTrigger className={inputCls}>
                      <SelectValue placeholder="Chọn chương trình" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Level *">
                  <Select value={levelId} onValueChange={setLevelId} disabled={!programId || levelsLoading}>
                    <SelectTrigger className={cn(inputCls, (!programId || levelsLoading) && "opacity-50 cursor-not-allowed")}>
                      <SelectValue placeholder={levelsLoading ? "Đang tải..." : "Chọn level"} />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
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
              <Select value={programId} onValueChange={(v) => { setProgramId(v); setLevelId(""); }}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Chọn chương trình" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Level *">
              <Select value={levelId} onValueChange={setLevelId} disabled={!programId || levelsLoading}>
                <SelectTrigger className={cn(inputCls, (!programId || levelsLoading) && "opacity-50 cursor-not-allowed")}>
                  <SelectValue placeholder={levelsLoading ? "Đang tải..." : "Chọn level"} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-4 text-sm text-gray-600 hover:bg-blue-50 transition-colors">
              <Upload size={18} className="text-blue-600 shrink-0" />
              <span className="truncate">{file ? file.name : "Nhấn để chọn file syllabus (.docx)"}</span>
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
  const [configFound, setConfigFound] = useState<boolean | null>(null);
  const [configChecking, setConfigChecking] = useState(false);

  useEffect(() => {
    if (!programId) { setLevels([]); return; }
    setLevelsLoading(true);
    getLevels({ programId }).then((res) => setLevels(res.data?.items ?? [])).catch(() => setLevels([])).finally(() => setLevelsLoading(false));
  }, [programId]);

  useEffect(() => {
    if (!programId || !levelId) { setConfigFound(null); return; }
    setConfigChecking(true);
    getImportConfiguration(programId, levelId)
      .then((res) => setConfigFound(res.isSuccess && res.data != null))
      .catch(() => setConfigFound(false))
      .finally(() => setConfigChecking(false));
  }, [programId, levelId]);

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
          {levelId && !configChecking && configFound === false && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <strong>Chưa có Import Configuration</strong> cho Program + Level này. Vui lòng lưu cấu hình trước khi import zip.
            </div>
          )}
          {levelId && configChecking && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" /> Đang kiểm tra Import Configuration...
            </div>
          )}
          {levelId && !configChecking && configFound === true && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
              Import Configuration đã sẵn sàng.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Chương trình *">
              <Select value={programId} onValueChange={(v) => { setProgramId(v); setLevelId(""); }}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Chọn chương trình" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Level *">
              <Select value={levelId} onValueChange={setLevelId} disabled={!programId || levelsLoading}>
                <SelectTrigger className={cn(inputCls, (!programId || levelsLoading) && "opacity-50 cursor-not-allowed")}>
                  <SelectValue placeholder={levelsLoading ? "Đang tải..." : "Chọn level"} />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 px-4 py-4 text-sm text-gray-600 hover:bg-purple-50 transition-colors">
              <Upload size={18} className="text-purple-600 shrink-0" />
              <span className="truncate">{file ? file.name : "Nhấn để chọn file curriculum (.zip)"}</span>
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
            <button type="submit" disabled={loading || configFound === false} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Import Zip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Import Lesson Plan Words ─────────────────────────────────────────

function ImportLessonPlanWordsModal({
  programOptions,
  loading,
  onClose,
  onSubmit,
}: {
  programOptions: Array<{ id: string; name: string }>;
  loading: boolean;
  onClose: () => void;
  onSubmit: (params: { programId: string; levelId: string; overwriteExisting: boolean; moduleId?: string }, files: File[]) => void;
}) {
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [overwrite, setOverwrite] = useState(true);
  const [moduleId, setModuleId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) { setLevels([]); setLevelId(""); return; }
    setLevelsLoading(true);
    getLevels({ programId }).then((res) => setLevels(res.data?.items ?? [])).catch(() => setLevels([])).finally(() => setLevelsLoading(false));
  }, [programId]);

  useEffect(() => {
    if (!levelId) { setModules([]); setModuleId(""); return; }
    setModulesLoading(true);
    getModules({ levelId }).then((res) => setModules(res.data?.items ?? [])).catch(() => setModules([])).finally(() => setModulesLoading(false));
  }, [levelId]);

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!programId) { setError("Chọn chương trình."); return; }
    if (!levelId) { setError("Chọn level."); return; }
    if (!files.length) { setError("Chọn ít nhất 1 file .docx."); return; }
    onSubmit({ programId, levelId, overwriteExisting: overwrite, moduleId: moduleId || undefined }, files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white"><Upload size={20} /></div>
            <h2 className="text-lg font-bold text-white">Import Lesson Plan (Word)</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/70 hover:bg-white/20 hover:text-white cursor-pointer"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <Field label="Chương trình *">
            <select value={programId} onChange={(e) => { setProgramId(e.target.value); setLevelId(""); }} className={inputCls}>
              <option value="">-- Chọn chương trình --</option>
              {programOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Level *">
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)} disabled={!programId || levelsLoading} className={inputCls}>
              <option value="">{levelsLoading ? "Đang tải..." : "-- Chọn level --"}</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Module (tùy chọn — để trống để auto-map theo config)">
            <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} disabled={!levelId || modulesLoading} className={inputCls}>
              <option value="">{modulesLoading ? "Đang tải..." : "-- Auto-map theo import config --"}</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.code}</option>)}
            </select>
            {levelId && !moduleId && (
              <p className="mt-1 text-xs text-amber-600">Nếu không chọn module, cần có Import Configuration đã được lưu cho Program + Level này.</p>
            )}
          </Field>
          <Field label="Files .docx *">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-4 py-4 text-sm text-gray-600 hover:bg-teal-50 transition-colors">
              <Upload size={20} className="text-teal-600 shrink-0" />
              {files.length === 0 ? (
                <span>Nhấn để chọn nhiều file lesson plan (.docx)</span>
              ) : (
                <span className="font-medium text-teal-700">{files.length} file đã chọn</span>
              )}
              <input type="file" accept=".doc,.docx" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-y-auto space-y-0.5 text-xs text-gray-500">
                {files.map((f, i) => <li key={i} className="truncate">• {f.name}</li>)}
              </ul>
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="rounded" />
            Ghi đè nếu đã tồn tại
          </label>
          {error && <ErrorBox message={error} />}
          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Hủy</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Import Lesson Plans
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
  const stats = [
    { label: "Units", value: detail.unitCount ?? "—", color: "blue" as const },
    { label: "Sessions", value: detail.sessionTemplateCount ?? "—", color: "purple" as const },
    { label: "Tiết học", value: detail.totalPeriods ?? "—", color: "amber" as const },
    { label: "Bài học", value: detail.totalLessons ?? "—", color: "emerald" as const },
  ];

  const infoRows: Array<{ label: string; value: string | number | null | undefined }> = [
    { label: "Chương trình", value: detail.programName },
    { label: "Level", value: detail.levelName },
    { label: "Edition", value: detail.edition },
    { label: "Phút / tiết", value: detail.minutesPerPeriod },
    { label: "File nguồn", value: detail.sourceFileName },
  ];

  const statColors = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    purple: "border-purple-100 bg-purple-50 text-purple-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between rounded-t-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-xl bg-white/20 p-2.5 shrink-0"><BookOpen size={20} className="text-white" /></div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white leading-snug">{detail.title}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs font-bold text-white">{detail.code}</span>
                <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs text-white/90">{detail.version}</span>
                <ActiveBadge isActive={detail.isActive} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <button type="button" onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/30 cursor-pointer transition-colors">
              <Pencil size={14} /> Sửa
            </button>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className={cn("rounded-xl border px-3 py-3 text-center", statColors[s.color])}>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="mt-0.5 text-xs font-medium opacity-80">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Info rows */}
          <div className="overflow-hidden rounded-xl border border-gray-200 divide-y divide-gray-100">
            {infoRows.map(({ label, value }) => value != null && value !== "" ? (
              <div key={label} className="flex gap-4 px-4 py-2.5 text-sm hover:bg-gray-50/70">
                <dt className="w-36 shrink-0 font-medium text-gray-500">{label}</dt>
                <dd className="text-gray-800 break-all min-w-0">{String(value)}</dd>
              </div>
            ) : null)}
          </div>

          {detail.overview && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Tổng quan</p>
              <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{detail.overview}</p>
            </div>
          )}

          {detail.createdAt && (
            <p className="text-right text-xs text-gray-400">
              Tạo lúc: {new Date(detail.createdAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Unit Lesson Plans Result ─────────────────────────────────────────

function UnitLessonPlansResultModal({
  result,
  onClose,
}: {
  result: UnitLessonPlansResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white"><CheckCircle size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Kết quả Import Zip</h2>
              <p className="text-xs text-purple-200">{result.programName} · {result.levelName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="flex gap-4 border-b border-gray-100 px-6 py-4">
          <div className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-3 text-center">
            <div className="text-2xl font-extrabold text-purple-700">{result.totalLessonPlans}</div>
            <div className="text-xs font-medium text-purple-500 mt-0.5">Lesson Plans</div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-center">
            <div className="text-2xl font-extrabold text-blue-700">{result.totalGroups}</div>
            <div className="text-xs font-medium text-blue-500 mt-0.5">Nhóm</div>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-100 px-4 py-2">
          {result.groups.map((group: UnitLessonPlanGroup) => (
            <div key={group.moduleId} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 my-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{group.moduleName}</span>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">{group.lessonPlanCount} bài</span>
              </div>
              {group.moduleCode && (
                <p className="mt-0.5 text-xs text-gray-400">{group.moduleCode}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer">Đóng</button>
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

type ImportMode = "word" | "archive" | "lesson-plan-words" | null;
type ConfigTarget = { programId: string; levelId: string } | null;

export default function SyllabusesPage() {
  const { toast } = useToast();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "vi";

  // Data
  const [items, setItems] = useState<SyllabusListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const PAGE_SIZE = 20;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgramId, setFilterProgramId] = useState(() => searchParams?.get("programId") ?? "");
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
  const [configTarget, setConfigTarget] = useState<ConfigTarget>(null);
  const [unitLessonPlansResult, setUnitLessonPlansResult] = useState<UnitLessonPlansResult | null>(null);

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
      if (res.isSuccess && res.data) {
        setDetail(res.data);
      } else {
        toast({
          title: "Không thể tải chi tiết",
          description: res.message ?? "Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Lỗi kết nối", description: "Không thể tải chi tiết syllabus.", variant: "destructive" });
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
      // Fetch unit-lesson-plans grouped view for the imported syllabus
      const ulpRes = await getUnitLessonPlans(d.syllabusId);
      if (ulpRes.isSuccess && ulpRes.data) {
        setUnitLessonPlansResult(ulpRes.data);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportLessonPlanWords = async (
    params: { programId: string; levelId: string; overwriteExisting: boolean; moduleId?: string },
    files: File[],
  ) => {
    setImportLoading(true);
    try {
      const res = await importLessonPlanWords(params, files);
      if (!res.isSuccess) {
        toast({ title: "Import thất bại", description: res.detail ?? res.message ?? "Lỗi import lesson plan.", variant: "destructive" });
        return;
      }
      const d = res.data!;
      const skippedMsg = d.skippedFiles > 0 ? ` · Bỏ qua ${d.skippedFiles} file` : "";
      toast({
        title: "Import Lesson Plan thành công",
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
    } finally {
      setImportLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const inputCls = "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <a href={`/${locale}/portal/admin/courses`} className="font-medium text-gray-500 hover:text-red-600 transition-colors">← Chương trình</a>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-700">Syllabus</span>
      </nav>
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
          <a href={`/${locale}/portal/admin/documents`}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer">
            <BookOpenCheck size={16} /> Lesson Plans →
          </a>
          <button type="button" onClick={() => setConfigTarget({ programId: "", levelId: "" })}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer">
            <Settings2 size={16} /> Cấu hình Import
          </button>
          <button type="button" onClick={() => setImportMode("word")}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer">
            <FileText size={16} /> Import Word
          </button>
          <button type="button" onClick={() => setImportMode("archive")}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 cursor-pointer">
            <FileArchive size={16} /> Import Zip
          </button>
          <button type="button" onClick={() => setImportMode("lesson-plan-words")}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100 cursor-pointer">
            <Upload size={16} /> Import Lesson Plans
          </button>
          <button type="button" onClick={() => setModal({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer">
            <Plus size={16} /> Tạo Syllabus
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lọc &amp; Tìm kiếm</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Từ khoá</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm tiêu đề, mã, version..." className={cn(inputCls, "pl-9")} />
            </div>
          </div>
          {/* Program */}
          <div className="min-w-[185px]">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Chương trình</label>
            <Select value={filterProgramId || "__all__"} onValueChange={(v) => { setFilterProgramId(v === "__all__" ? "" : v); setFilterLevelId(""); }}>
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả chương trình</SelectItem>
                {programOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Level */}
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Level</label>
            <Select value={filterLevelId || "__all__"} onValueChange={(v) => setFilterLevelId(v === "__all__" ? "" : v)} disabled={filterLevels.length === 0}>
              <SelectTrigger className={cn(inputCls, filterLevels.length === 0 && "opacity-50 cursor-not-allowed")}>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả level</SelectItem>
                {filterLevels.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Status */}
          <div className="min-w-[155px]">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Trạng thái</label>
            <Select value={filterActive} onValueChange={(v) => setFilterActive(v as "all" | "active" | "inactive")}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-semibold text-gray-700">
            Danh sách Syllabus
            <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{totalCount}</span>
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-3" /> Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BookOpen size={36} className="mb-3 opacity-25" />
            <p className="text-sm">Không có syllabus nào phù hợp</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-left">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Tiêu đề</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Chương trình / Level</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Code · Version</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Units</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Sessions</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Trạng thái</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="group hover:bg-red-50/30 transition-colors">
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-700">{item.programName ?? "—"}</p>
                    <p className="text-xs text-gray-400">{item.levelName ?? "—"}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-bold text-gray-700">{item.code}</span>
                    <span className="ml-2 text-xs text-gray-400">{item.version}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex h-7 w-10 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-700">{item.unitCount ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex h-7 w-12 items-center justify-center rounded-lg bg-purple-50 text-xs font-semibold text-purple-700">{item.sessionTemplateCount ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center"><ActiveBadge isActive={item.isActive} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" disabled={detailLoading} onClick={() => handleOpenDetail(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 cursor-pointer transition-colors shadow-sm">
                        <Eye size={13} /> Xem
                      </button>
                      <button type="button" onClick={() => setModal({ mode: "edit", item })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors shadow-sm">
                        <Pencil size={13} /> Sửa
                      </button>
                      {item.programId && item.levelId && (
                        <button type="button" onClick={() => setConfigTarget({ programId: item.programId, levelId: item.levelId })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors shadow-sm">
                          <Settings2 size={13} /> Cấu hình
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination inside card */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-sm text-gray-500">
              <strong>{(pageNumber - 1) * PAGE_SIZE + 1}–{Math.min(pageNumber * PAGE_SIZE, totalCount)}</strong> / {totalCount} syllabus
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={pageNumber <= 1} onClick={() => setPageNumber((p) => p - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-40 cursor-pointer transition-colors shadow-sm">
                <ChevronLeft size={15} /> Trước
              </button>
              <span className="px-3 py-2 text-sm font-semibold text-gray-700">{pageNumber} / {totalPages}</span>
              <button type="button" disabled={pageNumber >= totalPages} onClick={() => setPageNumber((p) => p + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-40 cursor-pointer transition-colors shadow-sm">
                Sau <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

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
          onEdit={() => { setDetail(null); setModal({ mode: "edit", item: detail }); }} />
      )}
      {importMode === "word" && (
        <ImportWordModal programOptions={programOptions} loading={importLoading} onClose={() => setImportMode(null)} onSubmit={handleImportWord} />
      )}
      {importMode === "archive" && (
        <ImportArchiveModal programOptions={programOptions} loading={importLoading} onClose={() => setImportMode(null)} onSubmit={handleImportArchive} />
      )}
      {importMode === "lesson-plan-words" && (
        <ImportLessonPlanWordsModal programOptions={programOptions} loading={importLoading} onClose={() => setImportMode(null)} onSubmit={handleImportLessonPlanWords} />
      )}
      {configTarget !== null && (
        <ImportConfigModal
          programOptions={programOptions}
          initialProgramId={configTarget.programId || undefined}
          initialLevelId={configTarget.levelId || undefined}
          onClose={() => setConfigTarget(null)}
          onSaved={() => setConfigTarget(null)}
        />
      )}
      {unitLessonPlansResult && (
        <UnitLessonPlansResultModal result={unitLessonPlansResult} onClose={() => setUnitLessonPlansResult(null)} />
      )}
    </div>
  );
}

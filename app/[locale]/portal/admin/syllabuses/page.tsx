"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  BookOpenCheck,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileArchive,
  GitBranch,
  FileText,
  Filter,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/lightswind/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getLevels, getModules } from "@/lib/api/academicProgressionService";
import { getAllProgramsForDropdown } from "@/lib/api/programService";
import {
  createSyllabus,
  createManualSyllabusDocument,
  getSyllabusDocument,
  getSyllabusById,
  getSyllabuses,
  importSyllabusPreview,
  importSyllabusCommit,
  importSyllabusArchive,
  importSyllabusWord,
  importLessonPlanWords,
  assignSyllabusToBranch,
  updateSyllabus,
  getImportConfiguration,
  upsertImportConfiguration,
  type ImportedEntry,
  type ImportSkippedItem,
  type ImportSyllabusArchiveResult,
  type CreateSyllabusRequest,
  type UpsertImportConfigRequest,
  type SyllabusDetail,
  type SyllabusDocument,
  type SyllabusDocumentWarning,
  type SyllabusListItem,
  type UpdateSyllabusRequest,
} from "@/lib/api/syllabusService";
import { getAllBranches } from "@/lib/api/branchService";
import type { LevelDto, ModuleDto } from "@/types/academic-progression";
import SyllabusDetailModalBody from "@/components/lesson-plans/SyllabusDetailModalBody";
import SyllabusVersionsModal from "@/components/admin/syllabuses/SyllabusVersionsModal";

type BranchLookupItem = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
};

const SYLLABUS_ARCHIVE_MAX_MB = Number(
  process.env.NEXT_PUBLIC_SYLLABUS_ARCHIVE_MAX_MB ?? "50",
);
const SYLLABUS_ARCHIVE_MAX_BYTES = Math.max(1, SYLLABUS_ARCHIVE_MAX_MB) * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;
  const e = (err ?? {}) as {
    detail?: unknown;
    message?: unknown;
    error?: unknown;
  };
  if (typeof e.detail === "string" && e.detail.trim()) return e.detail;
  if (typeof e.message === "string" && e.message.trim()) return e.message;
  if (typeof e.error === "string" && e.error.trim()) return e.error;
  return fallback;
}

function mapDocumentToSyllabusDetail(doc: SyllabusDocument): SyllabusDetail {
  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  const headingSection = sections.find(
    (section) => (section.type ?? "").toLowerCase() === "heading",
  );
  const findSectionContent = (titleMatcher: RegExp): string | null => {
    const matched = sections.find((section) =>
      titleMatcher.test((section.title ?? "").toLowerCase()),
    );
    if (!matched) return null;
    if (matched.content && matched.content.trim())
      return matched.content.trim();
    return null;
  };

  return {
    id: doc.id,
    programId: doc.programId,
    levelId: doc.levelId,
    programName: null,
    levelName: null,
    code: doc.code,
    version: String(doc.version ?? ""),
    title: doc.title,
    isActive: (doc.status ?? "Draft") !== "Archived",
    edition: doc.edition ?? (headingSection?.content?.trim() || null),
    overview: findSectionContent(/overview|tong quan|what is/),
    overallObjectives: findSectionContent(
      /overall objectives|course objectives|muc tieu tong quat/,
    ),
    specificObjectives: findSectionContent(
      /specific objectives|muc tieu cu the/,
    ),
    ethicsAndAttitudes: findSectionContent(/ethics|attitudes|pham chat/),
    bookOverview: findSectionContent(
      /book overview|text books?|references|giao trinh/,
    ),
    totalPeriods: doc.summary?.totalPeriods ?? null,
    minutesPerPeriod: doc.summary?.minutesPerPeriod ?? null,
    totalLessons: doc.summary?.totalLessons ?? null,
    sourceFileName: doc.sourceFileName ?? null,
    rawContentJson: JSON.stringify(doc),
    units: [],
    lessons: [],
    resources: [],
    sessionTemplates: [],
    unitCount: doc.summary?.totalUnits ?? null,
    sessionTemplateCount: doc.summary?.totalSessions ?? null,
    createdAt: null,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const parts = label.split(/(\*)/);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
        {parts.map((part, idx) =>
          part === "*" ? (
            <span key={idx} className="text-red-600">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </label>
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

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  useEffect(() => {
    if (!programId) {
      setLevels([]);
      setLevelId("");
      return;
    }
    setLevelsLoading(true);
    getLevels({ programId })
      .then((res) => setLevels(res.data?.items ?? []))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [programId]);

  useEffect(() => {
    if (!levelId) {
      setModules([]);
      setRules([]);
      return;
    }
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
                revisionNumber:
                  r.revisionNumber != null ? String(r.revisionNumber) : "",
                orderIndex: r.orderIndex,
                expectedLessonPlanCount: r.expectedLessonPlanCount,
                moduleName: r.moduleName,
              })),
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
              })),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        setModulesLoading(false);
        setLoading(false);
      });
  }, [levelId, programId]);

  const updateRule = (key: string, patch: Partial<RuleForm>) =>
    setRules((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

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
        .map((r, i) => ({ ...r, orderIndex: i + 1 })),
    );

  const hasUnitValue = (value: string) => value.trim() !== "";

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
    if (uniqueModules.size !== moduleIds.length)
      return "Mỗi Module chỉ được xuất hiện 1 lần.";
    const starterRules = rules.filter((r) => r.includeStarterUnit);
    if (starterRules.length > 1)
      return "Chỉ 1 rule được bật Include Starter Unit.";
    const orderIdxs = rules.map((r) => r.orderIndex);
    if (new Set(orderIdxs).size !== orderIdxs.length)
      return "orderIndex phải unique.";
    for (const rule of rules) {
      const hasUnitFrom = hasUnitValue(rule.unitFrom);
      const hasUnitTo = hasUnitValue(rule.unitTo);
      if (hasUnitFrom || hasUnitTo) {
        const from = Number(rule.unitFrom);
        const to = Number(rule.unitTo);
        if (!hasUnitFrom || !hasUnitTo || Number.isNaN(from) || Number.isNaN(to))
          return `Rule ${rule.orderIndex}: unitFrom và unitTo phải cùng có.`;
        if (from < 0 || to < 0)
          return `Rule ${rule.orderIndex}: unitFrom/unitTo phải >= 0.`;
        if (from > to)
          return `Rule ${rule.orderIndex}: unitFrom phải <= unitTo.`;
      }
    }
    // Check unit range overlap
    const ranges = rules
      .filter((r) => hasUnitValue(r.unitFrom) && hasUnitValue(r.unitTo))
      .map((r) => ({
        from: Number(r.unitFrom),
        to: Number(r.unitTo),
        idx: r.orderIndex,
      }));
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (ranges[i].from <= ranges[j].to && ranges[j].from <= ranges[i].to) {
          return `Rule ${ranges[i].idx} và ${ranges[j].idx} có khoảng Unit bị overlap.`;
        }
      }
    }
    // revisionNumber unique
    const revNums = rules
      .filter((r) => r.revisionNumber)
      .map((r) => r.revisionNumber);
    if (new Set(revNums).size !== revNums.length)
      return "revisionNumber phải unique.";
    return null;
  };

  const handleSave = async () => {
  if (!programId) {
    toast({ title: "Chọn chương trình.", variant: "destructive" });
    return;
  }
  if (!levelId) {
    toast({ title: "Chọn level.", variant: "destructive" });
    return;
  }
  const err = validate();
  if (err) {
    toast({ title: err, variant: "destructive" });
    return;
  }
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
        unitFrom: hasUnitValue(r.unitFrom) ? Number(r.unitFrom) : null,
        unitTo: hasUnitValue(r.unitTo) ? Number(r.unitTo) : null,
        revisionNumber: r.revisionNumber ? Number(r.revisionNumber) : null,
        orderIndex: r.orderIndex,
      })),
    };
    const res = await upsertImportConfiguration(programId, levelId, body);
    if (!res.isSuccess) {
      toast({
        title: res.detail ?? res.message ?? "Lưu cấu hình thất bại.",
        variant: "destructive",
      });
      return;
    }
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
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Cấu hình Import Curriculum
              </h2>
              <p className="text-sm text-white/80">
                Map Unit / Revision vào Module trước khi import zip
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* Program + Level */}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Chương trình *">
                <Select
                  value={programId}
                  onValueChange={(v) => {
                    setProgramId(v);
                    setLevelId("");
                  }}
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Chọn chương trình" />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Level *">
                <Select
                  value={levelId}
                  onValueChange={setLevelId}
                  disabled={!programId || levelsLoading}
                >
                  <SelectTrigger
                    className={cn(
                      inputCls,
                      (!programId || levelsLoading) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <SelectValue
                      placeholder={levelsLoading ? "Đang tải..." : "Chọn level"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {levelId && (
              <>
                {/* Counts */}
                <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-red-600">
                    Số lesson plan kỳ vọng
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Mỗi Unit thường">
                      <input
                        type="number"
                        min={1}
                        value={regularCount}
                        onChange={(e) => setRegularCount(e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Unit Starter">
                      <input
                        type="number"
                        min={1}
                        value={starterCount}
                        onChange={(e) => setStarterCount(e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Mỗi Revision">
                      <input
                        type="number"
                        min={1}
                        value={revisionCount}
                        onChange={(e) => setRevisionCount(e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded"
                    />
                    Kích hoạt cấu hình này
                  </label>
                </div>

                {/* Rules */}
                {loading || modulesLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 size={20} className="animate-spin mr-2" /> Đang
                    tải...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        Rules mapping
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                          {rules.length}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={addRule}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 cursor-pointer"
                      >
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
                          <div
                            key={rule.key}
                            className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 shrink-0">
                                {rule.orderIndex}
                              </span>
                              <div className="flex-1 min-w-0">
                                <Select
                                  value={rule.moduleId}
                                  onValueChange={(v) =>
                                    updateRule(rule.key, {
                                      moduleId: v,
                                      moduleName: modules.find(
                                        (m) => m.id === v,
                                      )?.name,
                                    })
                                  }
                                >
                                  <SelectTrigger
                                    className={cn(inputCls, "bg-white")}
                                  >
                                    <SelectValue placeholder="Chọn Module" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {modules.map((m) => (
                                      <SelectItem key={m.id} value={m.id}>
                                        {m.name} ({m.code})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRule(rule.key)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                              <Field label="Unit từ">
                                <input
                                  type="number"
                                  min={0}
                                  value={rule.unitFrom}
                                  onChange={(e) =>
                                    updateRule(rule.key, {
                                      unitFrom: e.target.value,
                                    })
                                  }
                                  placeholder="—"
                                  className={cn(inputCls, "bg-white")}
                                />
                              </Field>
                              <Field label="Unit đến">
                                <input
                                  type="number"
                                  min={0}
                                  value={rule.unitTo}
                                  onChange={(e) =>
                                    updateRule(rule.key, {
                                      unitTo: e.target.value,
                                    })
                                  }
                                  placeholder="—"
                                  className={cn(inputCls, "bg-white")}
                                />
                              </Field>
                              <Field label="Revision số">
                                <input
                                  type="number"
                                  min={1}
                                  value={rule.revisionNumber}
                                  onChange={(e) =>
                                    updateRule(rule.key, {
                                      revisionNumber: e.target.value,
                                    })
                                  }
                                  placeholder="—"
                                  className={cn(inputCls, "bg-white")}
                                />
                              </Field>
                              <Field label="Kỳ vọng">
                                <div
                                  className={cn(
                                    inputCls,
                                    "bg-gray-100 text-gray-500 cursor-default",
                                  )}
                                >
                                  {rule.expectedLessonPlanCount != null
                                    ? rule.expectedLessonPlanCount
                                    : "—"}
                                </div>
                              </Field>
                            </div>

                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rule.includeStarterUnit}
                                onChange={(e) =>
                                  updateRule(rule.key, {
                                    includeStarterUnit: e.target.checked,
                                  })
                                }
                                className="rounded"
                              />
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
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !levelId}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
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
  onSubmit: (
    data: CreateSyllabusRequest | UpdateSyllabusRequest,
  ) => Promise<void>;
}) {
  const [programId, setProgramId] = useState(initial?.programId ?? "");
  const [levelId, setLevelId] = useState(initial?.levelId ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [version, setVersion] = useState(initial?.version ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [edition, setEdition] = useState(
    (initial as SyllabusDetail)?.edition ?? "",
  );
  const [overview, setOverview] = useState(
    (initial as SyllabusDetail)?.overview ?? "",
  );
  const [totalPeriods, setTotalPeriods] = useState(
    String((initial as SyllabusDetail)?.totalPeriods ?? ""),
  );
  const [minutesPerPeriod, setMinutesPerPeriod] = useState(
    String((initial as SyllabusDetail)?.minutesPerPeriod ?? ""),
  );
  const [totalLessons, setTotalLessons] = useState(
    String((initial as SyllabusDetail)?.totalLessons ?? ""),
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) {
      setLevels([]);
      return;
    }
    setLevelsLoading(true);
    getLevels({ programId })
      .then((res) => setLevels(res.data?.items ?? []))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Tiêu đề là bắt buộc.");
      return;
    }
    if (!code.trim()) {
      setError("Mã syllabus là bắt buộc.");
      return;
    }
    if (!version.trim()) {
      setError("Version là bắt buộc.");
      return;
    }
    if (!isEdit && !programId) {
      setError("Chương trình là bắt buộc.");
      return;
    }
    if (!isEdit && !levelId) {
      setError("Level là bắt buộc.");
      return;
    }

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

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? "Sửa Syllabus" : "Tạo Syllabus"}
              </h2>
              <p className="text-sm text-white/80">
                {isEdit ? "Cập nhật thông tin syllabus" : "Tạo syllabus mới"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {!isEdit && (
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Chương trình &amp; Level
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Chương trình *">
                    <Select
                      value={programId}
                      onValueChange={(v) => {
                        setProgramId(v);
                        setLevelId("");
                      }}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Chọn chương trình" />
                      </SelectTrigger>
                      <SelectContent>
                        {programOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Level *">
                    <Select
                      value={levelId}
                      onValueChange={setLevelId}
                      disabled={!programId || levelsLoading}
                    >
                      <SelectTrigger
                        className={cn(
                          inputCls,
                          (!programId || levelsLoading) &&
                            "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <SelectValue
                          placeholder={
                            levelsLoading ? "Đang tải..." : "Chọn level"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Mã Syllabus (code) *">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={inputCls}
                  placeholder="GET_READY_STARTER"
                />
              </Field>
              <Field label="Version *">
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className={inputCls}
                  placeholder="v1"
                />
              </Field>
            </div>

            <Field label="Tiêu đề *">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                placeholder="The Syllabus of Get Ready for Starters"
              />
            </Field>

            <Field label="Edition">
              <input
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                className={inputCls}
                placeholder="Second edition"
              />
            </Field>

            <Field label="Overview (Tổng quan)">
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={6}
                className={cn(inputCls, "resize-vertical")}
                placeholder="Mô tả tổng quan chương trình..."
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Tổng số tiết">
                <input
                  type="number"
                  value={totalPeriods}
                  onChange={(e) => setTotalPeriods(e.target.value)}
                  className={inputCls}
                  placeholder="72"
                  min={0}
                />
              </Field>
              <Field label="Phút / tiết">
                <input
                  type="number"
                  value={minutesPerPeriod}
                  onChange={(e) => setMinutesPerPeriod(e.target.value)}
                  className={inputCls}
                  placeholder="90"
                  min={0}
                />
              </Field>
              <Field label="Tổng bài học">
                <input
                  type="number"
                  value={totalLessons}
                  onChange={(e) => setTotalLessons(e.target.value)}
                  className={inputCls}
                  placeholder="72"
                  min={0}
                />
              </Field>
            </div>

            {isEdit && (
              <Field label="Trạng thái">
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setIsActive(val)}
                      className={cn(
                        "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
                        isActive === val
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white text-gray-600",
                      )}
                    >
                      {val ? "Đang hoạt động" : "Tạm ẩn"}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {error && <ErrorBox message={error} />}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 text-sm rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isEdit && initial) {
                    setCode((initial as any).code ?? "");
                    setVersion((initial as any).version ?? "");
                    setTitle((initial as any).title ?? "");
                    setEdition(
                      (initial as any as SyllabusDetail)?.edition ?? "",
                    );
                    setOverview(
                      (initial as any as SyllabusDetail)?.overview ?? "",
                    );
                    setTotalPeriods(
                      String(
                        (initial as any as SyllabusDetail)?.totalPeriods ?? "",
                      ),
                    );
                    setMinutesPerPeriod(
                      String(
                        (initial as any as SyllabusDetail)?.minutesPerPeriod ??
                          "",
                      ),
                    );
                    setTotalLessons(
                      String(
                        (initial as any as SyllabusDetail)?.totalLessons ?? "",
                      ),
                    );
                    setIsActive((initial as any).isActive ?? true);
                  } else {
                    setCode("");
                    setVersion("");
                    setTitle("");
                    setEdition("");
                    setOverview("");
                    setTotalPeriods("");
                    setMinutesPerPeriod("");
                    setTotalLessons("");
                    setIsActive(true);
                  }
                }}
                disabled={submitting}
                className="px-6 py-2.5 text-sm rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isEdit ? "Khôi phục" : "Đặt lại"}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-sm bg-linear-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
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
  onSubmit: (
    params: {
      programId: string;
      levelId: string;
      code: string;
      version: string;
      overwriteExisting: boolean;
    },
    file: File,
    previewWarnings: SyllabusDocumentWarning[],
  ) => void;
}) {
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState("v1");
  const [overwrite, setOverwrite] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewChecked, setPreviewChecked] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SyllabusDocument | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<
    SyllabusDocumentWarning[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) {
      setLevels([]);
      return;
    }
    setLevelsLoading(true);
    getLevels({ programId })
      .then((res) => setLevels(res.data?.items ?? []))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [programId]);

  useEffect(() => {
    setPreviewChecked(false);
    setPreviewDoc(null);
    setPreviewWarnings([]);
  }, [programId, levelId, file]);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  const validateBeforeImport = () => {
    setError(null);
    if (!programId) {
      setError("Chọn chương trình.");
      return false;
    }
    if (!levelId) {
      setError("Chọn cấp độ.");
      return false;
    }
    if (!code.trim()) {
      setError("Nhập mã syllabus.");
      return false;
    }
    if (!version.trim()) {
      setError("Nhập phiên bản.");
      return false;
    }
    if (!file) {
      setError("Chọn file .docx.");
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validateBeforeImport() || !file) return;
    setPreviewing(true);
    try {
      const res = await importSyllabusPreview({ programId, levelId }, file);
      if (!res.isSuccess || !res.data?.document) {
        setPreviewChecked(false);
        setPreviewDoc(null);
        setPreviewWarnings([]);
        setError(res.detail ?? res.message ?? "Xem trước thất bại.");
        return;
      }

      setPreviewChecked(true);
      setPreviewDoc(res.data.document);
      setPreviewWarnings(
        (res.data.warnings ?? []).map((warning) => ({
          code: warning.code,
          severity: warning.severity ?? null,
          message: warning.message ?? null,
          sectionRef: warning.sectionRef ?? null,
          rowRef: warning.rowRef ?? null,
          cellRef: warning.cellRef ?? null,
        })),
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeImport() || !file) return;
    if (!previewChecked) {
      setError("Vui lòng xem trước trước khi import.");
      return;
    }
    onSubmit(
      {
        programId,
        levelId,
        code: code.trim(),
        version: version.trim(),
        overwriteExisting: overwrite,
      },
      file,
      previewWarnings,
    );
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <FileText size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">
              Import giáo trình (Word)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <form
            id="importWordForm"
            onSubmit={handleSubmit}
            className="space-y-4 p-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Chương trình *">
                <Select
                  value={programId}
                  onValueChange={(v) => {
                    setProgramId(v);
                    setLevelId("");
                  }}
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Chọn chương trình" />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Level *">
                <Select
                  value={levelId}
                  onValueChange={setLevelId}
                  disabled={!programId || levelsLoading}
                >
                  <SelectTrigger
                    className={cn(
                      inputCls,
                      (!programId || levelsLoading) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <SelectValue
                      placeholder={levelsLoading ? "Đang tải..." : "Chọn level"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Mã syllabus *">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={inputCls}
                  placeholder="GET_READY_STARTER"
                />
              </Field>
              <Field label="Phiên bản *">
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className={inputCls}
                  placeholder="v1"
                />
              </Field>
            </div>
            <Field label="File .docx *">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 px-4 py-4 text-sm text-gray-600 hover:bg-red-50 transition-colors">
                <Upload size={18} className="text-red-600 shrink-0" />
                <span className="truncate">
                  {file ? file.name : "Nhấn để chọn file giáo trình (.docx)"}
                </span>
                <input
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="rounded"
              />
              Ghi đè nếu đã tồn tại
            </label>

            {previewDoc && (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                <div className="font-semibold">Xem trước tài liệu</div>
                <div>
                  Tiêu đề:{" "}
                  <span className="font-medium">{previewDoc.title}</span>
                </div>
                <div>
                  Mã: <span className="font-medium">{previewDoc.code}</span>
                </div>
                <div>
                  Ấn bản:{" "}
                  <span className="font-medium">
                    {previewDoc.edition ?? "—"}
                  </span>
                </div>
                <div>
                  Tóm tắt: {previewDoc.summary?.totalUnits ?? 0} unit ·{" "}
                  {previewDoc.summary?.totalSessions ?? 0} buổi ·{" "}
                  {previewDoc.summary?.totalLessons ?? 0} bài học
                </div>
                <div>
                  Mục đã parse:{" "}
                  {Array.isArray(previewDoc.sections)
                    ? previewDoc.sections.length
                    : 0}
                </div>
                {previewWarnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                    <div className="mb-1 font-semibold">
                      Cảnh báo parse ({previewWarnings.length})
                    </div>
                    <ul className="space-y-0.5">
                      {previewWarnings.slice(0, 6).map((warning, idx) => (
                        <li key={`${warning.code}_${idx}`}>
                          <span
                            className={cn(
                              "mr-1.5 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                              (warning.severity ?? "Warning").toLowerCase() ===
                                "error"
                                ? "border-red-200 bg-red-100 text-red-700"
                                : (
                                      warning.severity ?? "Warning"
                                    ).toLowerCase() === "info"
                                  ? "border-blue-200 bg-blue-100 text-blue-700"
                                  : "border-amber-200 bg-amber-100 text-amber-700",
                            )}
                          >
                            {(warning.severity ?? "Warning").toLowerCase() ===
                            "error"
                              ? "Lỗi"
                              : (
                                    warning.severity ?? "Warning"
                                  ).toLowerCase() === "info"
                                ? "Thông tin"
                                : "Cảnh báo"}
                          </span>
                          {warning.code}
                          {warning.message ? `: ${warning.message}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {error && <ErrorBox message={error} />}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading || previewing}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading || previewing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Eye size={16} />
                )}
                Xem trước
              </button>
              <button
                type="submit"
                form="importWordForm"
                disabled={loading || previewing || !previewChecked}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Xác nhận import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Import Archive ────────────────────────────────────────────────────

function ImportArchiveModal({
  programOptions,
  branchOptions,
  loading,
  onClose,
  onSubmit,
}: {
  programOptions: Array<{ id: string; name: string }>;
  branchOptions: Array<{ id: string; name: string }>;
  loading: boolean;
  onClose: () => void;
  onSubmit: (
    params: {
      programId: string;
      levelId: string;
      code: string;
      version: string;
      overwriteExisting: boolean;
      branchId?: string;
    },
    file: File,
  ) => void;
}) {
  const [branchId, setBranchId] = useState("");
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [code, setCode] = useState("");
  const [version, setVersion] = useState("v1");
  const [overwrite, setOverwrite] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configFound, setConfigFound] = useState<boolean | null>(null);
  const [configChecking, setConfigChecking] = useState(false);

  useEffect(() => {
    if (!programId) return;
    getLevels({ programId })
      .then((res) => setLevels(res.data?.items ?? []))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [programId]);

  useEffect(() => {
    if (!programId || !levelId) return;
    getImportConfiguration(programId, levelId)
      .then((res) => setConfigFound(res.isSuccess && res.data != null))
      .catch(() => setConfigFound(false))
      .finally(() => setConfigChecking(false));
  }, [programId, levelId]);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  const handleArchiveFileChange = (nextFile: File | null) => {
    setFile(nextFile);

    if (!nextFile) {
      return;
    }

    const lowerName = nextFile.name.toLowerCase();
    if (lowerName.endsWith(".rar")) {
      setError(
        "BE hiện chỉ hỗ trợ ZIP. Vui lòng đổi file .rar sang .zip trước khi import.",
      );
      return;
    }

    if (!lowerName.endsWith(".zip")) {
      setError("Định dạng không hợp lệ. Chỉ hỗ trợ file .zip.");
      return;
    }

    if (nextFile.size > SYLLABUS_ARCHIVE_MAX_BYTES) {
      setError(
        `File ZIP hiện tại ${formatFileSize(nextFile.size)} vượt giới hạn ${formatFileSize(SYLLABUS_ARCHIVE_MAX_BYTES)}. Vui lòng giảm kích thước archive hoặc tăng limit trên deployment.`,
      );
      return;
    }

    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!programId) {
      setError("Chọn chương trình.");
      return;
    }
    if (!levelId) {
      setError("Chọn cấp độ.");
      return;
    }
    if (!code.trim()) {
      setError("Nhập mã syllabus.");
      return;
    }
    if (!version.trim()) {
      setError("Nhập phiên bản.");
      return;
    }
    if (!file) {
      setError("Chọn file .zip.");
      return;
    }
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".rar")) {
      setError(
        "BE hiện chỉ hỗ trợ ZIP. Vui lòng đổi file .rar sang .zip trước khi import.",
      );
      return;
    }
    if (!lowerName.endsWith(".zip")) {
      setError("Định dạng không hợp lệ. Chỉ hỗ trợ file .zip.");
      return;
    }
    if (file.size > SYLLABUS_ARCHIVE_MAX_BYTES) {
      setError(
        `File ZIP hiện tại ${formatFileSize(file.size)} vượt giới hạn ${formatFileSize(SYLLABUS_ARCHIVE_MAX_BYTES)}. Vui lòng giảm kích thước archive hoặc tăng limit trên deployment.`,
      );
      return;
    }
    onSubmit(
      {
        programId,
        levelId,
        code: code.trim(),
        version: version.trim(),
        overwriteExisting: overwrite,
        branchId: branchId || undefined,
      },
      file,
    );
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <FileArchive size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">
              Import giáo trình (Zip)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <form
            id="importArchiveForm"
            onSubmit={handleSubmit}
            className="space-y-4 p-6"
          >
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              ZIP phải chứa: thư mục <strong>PPCT ...</strong> (file syllabus)
              và các thư mục <strong>UNIT 1</strong>, <strong>UNIT 2</strong>,
              ... (file bài học .docx)
            </div>

            {levelId && !configChecking && configFound === false && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                <strong>Chưa có cấu hình import</strong> cho Chương trình +
                Level này. Vui lòng lưu cấu hình trước khi import zip.
              </div>
            )}
            {levelId && configChecking && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" /> Đang kiểm tra cấu
                hình import...
              </div>
            )}
            {levelId && !configChecking && configFound === true && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
                Cấu hình import đã sẵn sàng.
              </div>
            )}
            <Field label="Chi nhánh (tùy chọn - auto assign sau import)">
              <Select
                value={branchId || "__none__"}
                onValueChange={(value) =>
                  setBranchId(value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Không auto assign vào chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Không auto assign</SelectItem>
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Nếu chọn chi nhánh, backend sẽ tự gán syllabus mới import vào
                branch sau khi xử lý archive.
              </p>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Chương trình *">
                <Select
                  value={programId}
                  onValueChange={(v) => {
                    setProgramId(v);
                    setLevelId("");
                    setLevels([]);
                    setConfigFound(null);
                    setLevelsLoading(true);
                    setConfigChecking(false);
                  }}
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Chọn chương trình" />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cấp độ *">
                <Select
                  value={levelId}
                  onValueChange={(v) => {
                    setLevelId(v);
                    setConfigFound(null);
                    setConfigChecking(true);
                  }}
                  disabled={!programId || levelsLoading}
                >
                  <SelectTrigger
                    className={cn(
                      inputCls,
                      (!programId || levelsLoading) &&
                        "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <SelectValue
                      placeholder={levelsLoading ? "Đang tải..." : "Chọn level"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Mã syllabus *">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={inputCls}
                  placeholder="GET_READY_STARTER"
                />
              </Field>
              <Field label="Phiên bản *">
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className={inputCls}
                  placeholder="v1"
                />
              </Field>
            </div>
            <Field label="File .zip *">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 px-4 py-4 text-sm text-gray-600 hover:bg-red-50 transition-colors">
                <Upload size={18} className="text-red-600 shrink-0" />
                <span className="truncate">
                  {file ? file.name : "Nhấn để chọn file giáo trình (.zip)"}
                </span>
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) =>
                    handleArchiveFileChange(e.target.files?.[0] || null)
                  }
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Giới hạn upload đang áp trên UI: {formatFileSize(SYLLABUS_ARCHIVE_MAX_BYTES)}.
                {file ? ` File đang chọn: ${formatFileSize(file.size)}.` : ""}
              </p>
            </Field>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="rounded"
              />
              Ghi đè nếu đã tồn tại
            </label>
            {error && <ErrorBox message={error} />}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="importArchiveForm"
              disabled={loading || configFound === false}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Nhập từ Zip
            </button>
          </div>
        </div>
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
  onSubmit: (
    params: {
      programId: string;
      levelId: string;
      syllabusId: string;
      overwriteExisting: boolean;
      moduleId?: string;
    },
    files: File[],
  ) => void;
}) {
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [syllabusId, setSyllabusId] = useState("");
  const [overwrite, setOverwrite] = useState(true);
  const [moduleId, setModuleId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [syllabusOptions, setSyllabusOptions] = useState<SyllabusListItem[]>(
    [],
  );
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [syllabusesLoading, setSyllabusesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;
    getLevels({ programId })
      .then((res) => setLevels(res.data?.items ?? []))
      .catch(() => setLevels([]))
      .finally(() => setLevelsLoading(false));
  }, [programId]);

  useEffect(() => {
    if (!levelId) return;
    getModules({ levelId })
      .then((res) => setModules(res.data?.items ?? []))
      .catch(() => setModules([]))
      .finally(() => setModulesLoading(false));
  }, [levelId]);

  useEffect(() => {
    if (!programId || !levelId) return;

    getSyllabuses({
      programId,
      levelId,
      isActive: true,
      pageNumber: 1,
      pageSize: 200,
    })
      .then((res) => setSyllabusOptions(res.isSuccess ? res.data.items : []))
      .catch(() => setSyllabusOptions([]))
      .finally(() => setSyllabusesLoading(false));
  }, [levelId, programId]);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!programId) {
      setError("Chọn chương trình.");
      return;
    }
    if (!levelId) {
      setError("Chọn cấp độ.");
      return;
    }
    if (!syllabusId) {
      setError("Chọn syllabus để import kế hoạch bài dạy.");
      return;
    }
    if (!files.length) {
      setError("Chọn ít nhất 1 file .docx.");
      return;
    }
    onSubmit(
      {
        programId,
        levelId,
        syllabusId,
        overwriteExisting: overwrite,
        moduleId: moduleId || undefined,
      },
      files,
    );
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <Upload size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">
              Import kế hoạch bài dạy (Word)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <form
            id="importLessonPlanWordsForm"
            onSubmit={handleSubmit}
            className="space-y-4 p-6"
          >
            <Field label="Chương trình *">
              <Select
                value={programId || "__none__"}
                onValueChange={(value) => {
                  const newVal = value === "__none__" ? "" : value;
                  setProgramId(newVal);
                  setLevelId("");
                  setLevels([]);
                  setModules([]);
                  setModuleId("");
                  setSyllabusOptions([]);
                  setSyllabusId("");
                  setLevelsLoading(true);
                  setModulesLoading(false);
                  setSyllabusesLoading(false);
                }}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="-- Chọn chương trình --" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cấp độ *">
              <Select
                value={levelId || "__none__"}
                onValueChange={(value) => {
                  const newVal = value === "__none__" ? "" : value;
                  setLevelId(newVal);
                  setModules([]);
                  setModuleId("");
                  setSyllabusOptions([]);
                  setSyllabusId("");
                  setModulesLoading(true);
                  setSyllabusesLoading(true);
                }}
                disabled={!programId || levelsLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue
                    placeholder={
                      levelsLoading ? "Đang tải..." : "-- Chọn level --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Syllabus *">
              <Select
                value={syllabusId || "__none__"}
                onValueChange={(value) =>
                  setSyllabusId(value === "__none__" ? "" : value)
                }
                disabled={!levelId || syllabusesLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue
                    placeholder={
                      syllabusesLoading
                        ? "Đang tải..."
                        : !levelId
                          ? "-- Chọn level trước --"
                          : syllabusOptions.length === 0
                            ? "-- Không có syllabus phù hợp --"
                            : "-- Chọn syllabus --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {syllabusOptions.map((syllabus) => (
                    <SelectItem
                      key={syllabus.id}
                      value={syllabus.id}
                    >{`${syllabus.code} ${syllabus.version} · ${syllabus.title}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                API import Word hiện yêu cầu syllabusId để backend map file vào
                đúng syllabus/version.
              </p>
            </Field>
            <Field label="Module (tùy chọn - để trống để tự map theo cấu hình)">
              <Select
                value={moduleId || "__none__"}
                onValueChange={(value) =>
                  setModuleId(value === "__none__" ? "" : value)
                }
                disabled={!levelId || modulesLoading}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue
                    placeholder={
                      modulesLoading
                        ? "Đang tải..."
                        : "-- Tự map theo cấu hình import --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name ?? m.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {levelId && !moduleId && (
                <p className="mt-1 text-xs text-amber-600">
                  Nếu không chọn module, cần có cấu hình import đã lưu cho
                  Chương trình + Level này.
                </p>
              )}
            </Field>
            <Field label="Files .docx *">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 px-4 py-4 text-sm text-gray-600 hover:bg-red-50 transition-colors">
                <Upload size={20} className="text-red-600 shrink-0" />
                {files.length === 0 ? (
                  <span>Nhấn để chọn nhiều file kế hoạch bài dạy (.docx)</span>
                ) : (
                  <span className="font-medium text-red-700">
                    {files.length} file đã chọn
                  </span>
                )}
                <input
                  type="file"
                  accept=".doc,.docx"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {files.length > 0 && (
                <ul className="mt-2 max-h-32 overflow-y-auto space-y-0.5 text-xs text-gray-500">
                  {files.map((f, i) => (
                    <li key={i} className="truncate">
                      • {f.name}
                    </li>
                  ))}
                </ul>
              )}
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="rounded"
              />
              Ghi đè nếu đã tồn tại
            </label>
            {error && <ErrorBox message={error} />}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="importLessonPlanWordsForm"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Nhập kế hoạch bài dạy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignBranchModal({
  syllabus,
  branchOptions,
  loading,
  onClose,
  onSubmit,
}: {
  syllabus: SyllabusListItem;
  branchOptions: Array<{ id: string; name: string }>;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    branchId: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    isActive: boolean;
  }) => void;
}) {
  const [branchId, setBranchId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [effectiveTo, setEffectiveTo] = useState("");
  const [assignmentAction, setAssignmentAction] = useState<"activate" | "deactivate">("activate");
  const [error, setError] = useState<string | null>(null);

  const isActive = assignmentAction === "activate";
  const selectedBranchName = branchOptions.find((branch) => branch.id === branchId)?.name ?? "Chưa chọn";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!branchId) {
      setError("Chọn chi nhánh để gán syllabus.");
      return;
    }
    if (!effectiveFrom) {
      setError("Vui lòng nhập ngày hiệu lực từ.");
      return;
    }
    if (assignmentAction === "deactivate" && !effectiveTo) {
      setError("Khi ngừng áp dụng, cần nhập ngày hiệu lực đến.");
      return;
    }

    onSubmit({
      branchId,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
      isActive,
    });
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <BookOpenCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Gán syllabus vào chi nhánh
              </h2>
              <p className="text-xs text-red-100">
                {syllabus.code} {syllabus.version} · {syllabus.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            Backend sẽ tự suy ra programId và levelId từ syllabus; FE chỉ cần gửi syllabusId cùng hiệu lực assignment.
          </div>

          <Field label="Bạn muốn làm gì?">
            <div className="grid gap-2 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setAssignmentAction("activate")}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  assignmentAction === "activate"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Gán hoặc kích hoạt lại</div>
                <div className="mt-0.5 text-xs text-gray-500">Syllabus được áp dụng cho chi nhánh đã chọn.</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignmentAction("deactivate");
                  if (!effectiveTo) {
                    setEffectiveTo(new Date().toISOString().slice(0, 10));
                  }
                }}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  assignmentAction === "deactivate"
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">Gỡ khỏi chi nhánh</div>
                <div className="mt-0.5 text-xs text-gray-500">Set không hoạt động để ngừng áp dụng assignment.</div>
              </button>
            </div>
          </Field>

          <Field label="Chi nhánh *">
            <Select value={branchId || "__none__"} onValueChange={(value) => setBranchId(value === "__none__" ? "" : value)}>
              <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Chọn chi nhánh</SelectItem>
                {branchOptions.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hiệu lực từ *">
              <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </Field>
            <Field label={assignmentAction === "deactivate" ? "Hiệu lực đến *" : "Hiệu lực đến"}>
              <input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </Field>
          </div>

          <div className={`rounded-xl border px-4 py-3 text-xs ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            <div className="font-semibold">Xác nhận trước khi lưu</div>
            <div className="mt-1">Chi nhánh: {selectedBranchName}</div>
            <div className="mt-1">Trạng thái assignment sau khi lưu: {isActive ? "Đang hoạt động" : "Ngừng áp dụng"}</div>
            {assignmentAction === "deactivate" ? (
              <div className="mt-1">Khuyến nghị nhập Hiệu lực đến để tránh syllabus tiếp tục hiển thị ở branch.</div>
            ) : null}
          </div>

          {error && <ErrorBox message={error} />}
          <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <BookOpenCheck size={16} />}
              {isActive ? "Lưu gán chi nhánh" : "Lưu và ngừng áp dụng"}
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
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <SyllabusDetailModalBody
          detail={detail}
          onClose={onClose}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}

// ─── Modal: Archive Import Result ────────────────────────────────────────────

type ArchiveImportResultView = {
  programName?: string;
  levelName?: string;
  branchName?: string;
  result: ImportSyllabusArchiveResult;
};

function ArchiveImportResultModal({
  payload,
  onOpenSyllabus,
  onClose,
}: {
  payload: ArchiveImportResultView;
  onOpenSyllabus: (id: string) => void;
  onClose: () => void;
}) {
  const importedEntries = Array.isArray(payload.result.importedEntries)
    ? payload.result.importedEntries
    : [];
  const skippedItems = Array.isArray(payload.result.skippedItems)
    ? payload.result.skippedItems
    : [];
  const skippedEntries = Array.isArray(payload.result.skippedEntries)
    ? payload.result.skippedEntries
    : [];

  const sourceTypeCount = importedEntries.reduce<Record<string, number>>(
    (acc, entry) => {
      const key = (entry.sourceType ?? "Unknown").trim() || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const sourceFolderCount = importedEntries.reduce<Record<string, number>>(
    (acc, entry) => {
      const key =
        (entry.sourceFolder ?? "(Không xác định)").trim() || "(Không xác định)";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const sortedTypeStats = Object.entries(sourceTypeCount).sort(
    (a, b) => b[1] - a[1],
  );
  const sortedFolderStats = Object.entries(sourceFolderCount).sort(
    (a, b) => b[1] - a[1],
  );

  const firstLessonCode = importedEntries.find(
    (entry) => !!entry.lessonCode,
  )?.lessonCode;

  const entryLabel = (entry: ImportedEntry): string => {
    return entry.title || entry.fileName || entry.entryName || "(không có tên)";
  };

  const skippedItemLabel = (item: ImportSkippedItem): string => {
    const subject = item.fileName || item.entryName || "(không rõ file)";
    const reason =
      item.reason || item.message || item.sourceType || "Không có chi tiết";
    return `${subject}: ${reason}`;
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 text-white">
              <CheckCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Kết quả import ZIP
              </h2>
              <p className="text-xs text-red-200">
                {payload.programName || "Chương trình"} ·{" "}
                {payload.levelName || "Level"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white hover:bg-white/20 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 md:grid-cols-4">
            <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-center">
              <div className="text-2xl font-extrabold text-red-700">
                {payload.result.importedLessonPlans}
              </div>
              <div className="mt-0.5 text-xs font-medium text-red-500">
                Lesson plans tạo/cập nhật
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-center">
              <div className="text-2xl font-extrabold text-blue-700">
                {importedEntries.length}
              </div>
              <div className="mt-0.5 text-xs font-medium text-blue-500">
                Imported entries
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-center">
              <div className="text-2xl font-extrabold text-emerald-700">
                {payload.result.syllabusId ? 1 : 0}
              </div>
              <div className="mt-0.5 text-xs font-medium text-emerald-500">
                Syllabus ID nhận được
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-3 text-center">
              <div className="text-2xl font-extrabold text-amber-700">
                {skippedEntries.length}
              </div>
              <div className="mt-0.5 text-xs font-medium text-amber-600">
                Skipped entries
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              FE đang render trực tiếp dữ liệu JSON từ API import archive. Nếu
              cần kiểm tra đầy đủ syllabus sau import, bấm{" "}
              <strong>Mở chi tiết syllabus</strong>.
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Archive
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">File:</span>{" "}
                    {payload.result.archiveFileName || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Parser:</span>{" "}
                    {payload.result.archiveParserVersion || "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Syllabus được chọn
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">File:</span>{" "}
                    {payload.result.selectedSyllabusFileName || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Parser:</span>{" "}
                    {payload.result.selectedSyllabusParserVersion || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Source:</span>{" "}
                    {payload.result.selectedSyllabusSourceType || "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Binding
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Entry:</span>{" "}
                    {payload.result.selectedSyllabusEntryName || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Normalized:</span>{" "}
                    {payload.result.selectedSyllabusNormalizedEntryName || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Chi nhánh:</span>{" "}
                    {payload.branchName || "Chưa auto-assign"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Theo sourceType
                </p>
                <div className="mt-2 space-y-2">
                  {sortedTypeStats.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Chưa có imported entries.
                    </p>
                  ) : (
                    sortedTypeStats.map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {type}
                        </span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Theo sourceFolder (top 8)
                </p>
                <div className="mt-2 space-y-2">
                  {sortedFolderStats.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Chưa có imported entries.
                    </p>
                  ) : (
                    sortedFolderStats.slice(0, 8).map(([folder, count]) => (
                      <div
                        key={folder}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="truncate pr-2 font-medium text-gray-700">
                          {folder}
                        </span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-700">
                  Imported entries (top 20)
                </p>
                <span className="text-xs text-gray-500">
                  Tổng {importedEntries.length}
                </span>
              </div>
              <div className="max-h-72 overflow-auto">
                {importedEntries.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-500">
                    Không có imported entries trong response.
                  </p>
                ) : (
                  <table className="w-full min-w-[860px] text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Entry
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Folder
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Type
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Lesson code
                        </th>
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importedEntries.slice(0, 20).map((entry, idx) => (
                        <tr
                          key={`${entry.entryName || entry.fileName || entry.title || "entry"}_${idx}`}
                        >
                          <td className="px-4 py-2 text-gray-700">
                            {entryLabel(entry)}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {entry.sourceFolder || "—"}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {entry.sourceType || "—"}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {entry.lessonCode || "—"}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {entry.created === false ? "Updated" : "Created"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {(skippedItems.length > 0 || skippedEntries.length > 0) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Skipped entries (top 10)
                </p>
                <div className="mt-2 space-y-1">
                  {skippedItems.slice(0, 10).map((item, idx) => (
                    <p
                      key={`${item.fileName || item.entryName || "skip"}_${idx}`}
                      className="text-xs text-amber-900"
                    >
                      • {skippedItemLabel(item)}
                    </p>
                  ))}
                  {skippedItems.length === 0 &&
                    skippedEntries.slice(0, 10).map((entry, idx) => (
                      <p
                        key={`${entry}_${idx}`}
                        className="text-xs text-amber-900"
                      >
                        • {entry}
                      </p>
                    ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700">
              <p>API check nhanh sau import:</p>
              <p className="mt-1 font-mono">
                GET /api/syllabuses/{payload.result.syllabusId}
              </p>
              {firstLessonCode ? (
                <p className="mt-1 font-mono">
                  GET /api/lessons/{firstLessonCode}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-100 bg-linear-to-r from-red-500/5 to-red-700/5 px-6 py-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenSyllabus(payload.result.syllabusId)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
            >
              <Eye size={16} /> Mở chi tiết syllabus
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg cursor-pointer"
            >
              Đóng
            </button>
          </div>
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
type BranchAssignTarget = SyllabusListItem | null;

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
  const [filterProgramId, setFilterProgramId] = useState(
    () => searchParams?.get("programId") ?? "",
  );
  const [filterLevelId, setFilterLevelId] = useState("");
  const [filterActive, setFilterActive] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Program / Level options
  const [programOptions, setProgramOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [branchOptions, setBranchOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [filterLevels, setFilterLevels] = useState<LevelDto[]>([]);

  // Modals
  const [modal, setModal] = useState<ModalState>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SyllabusDetail | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [configTarget, setConfigTarget] = useState<ConfigTarget>(null);
  const [branchAssignTarget, setBranchAssignTarget] =
    useState<BranchAssignTarget>(null);
  const [versionTarget, setVersionTarget] = useState<SyllabusListItem | null>(null);
  const [archiveImportResult, setArchiveImportResult] =
    useState<ArchiveImportResultView | null>(null);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Load programs once
  useEffect(() => {
    getAllProgramsForDropdown()
      .then((list) =>
        setProgramOptions(list.map((p) => ({ id: p.id, name: p.name }))),
      )
      .catch(() => {});

    getAllBranches({ page: 1, limit: 200, isActive: true })
      .then((response) => {
        const rawData = response?.data as
          | { branches?: BranchLookupItem[] }
          | BranchLookupItem[]
          | undefined;
        const source: BranchLookupItem[] = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.branches)
            ? rawData.branches
            : [];

        setBranchOptions(
          source
            .map((branch) => ({
              id: String(branch.id ?? "").trim(),
              name: String(branch.name ?? branch.code ?? "Chi nhánh").trim(),
            }))
            .filter((branch) => branch.id),
        );
      })
      .catch(() => setBranchOptions([]));
  }, []);

  // Load levels when filter program changes
  useEffect(() => {
    setFilterLevelId("");
    if (!filterProgramId) {
      setFilterLevels([]);
      return;
    }
    getLevels({ programId: filterProgramId })
      .then((res) => setFilterLevels(res.data?.items ?? []))
      .catch(() => setFilterLevels([]));
  }, [filterProgramId]);

  const loadData = useCallback(
    async (page = pageNumber, showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      try {
        const requestParams: {
          pageNumber: number;
          pageSize: number;
          programId?: string;
          levelId?: string;
          searchTerm?: string;
          isActive?: boolean;
        } = { pageNumber: page, pageSize: PAGE_SIZE };
        if (filterProgramId) requestParams.programId = filterProgramId;
        if (filterLevelId) requestParams.levelId = filterLevelId;
        if (searchTerm.trim()) requestParams.searchTerm = searchTerm.trim();
        if (filterActive !== "all")
          requestParams.isActive = filterActive === "active";

        const res = await getSyllabuses(requestParams);
        if (res.isSuccess) {
          setItems(res.data.items);
          setTotalCount(res.data.totalCount);
        } else {
          toast({
            title: "Lỗi tải dữ liệu",
            description: res.message,
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pageNumber,
      filterProgramId,
      filterLevelId,
      searchTerm,
      filterActive,
      toast,
    ],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleCreate = async (
    data: CreateSyllabusRequest | UpdateSyllabusRequest,
  ) => {
    const payload = data as CreateSyllabusRequest;
    const manualRes = await createManualSyllabusDocument({
      programId: payload.programId,
      levelId: payload.levelId,
      code: payload.code,
      title: payload.title,
      edition: payload.edition,
      minutesPerPeriod: payload.minutesPerPeriod,
      status: "Draft",
      sourceType: "Manual",
    });
    if (!manualRes.isSuccess) {
      const legacyRes = await createSyllabus(payload);
      if (!legacyRes.isSuccess)
        throw new Error(
          legacyRes.message ?? manualRes.message ?? "Không thể tạo syllabus.",
        );
    }
    toast({ title: "Đã tạo Syllabus", variant: "success" });
    setModal(null);
    await loadData(1, true);
    setPageNumber(1);
  };

  const handleUpdate = async (
    id: string,
    data: CreateSyllabusRequest | UpdateSyllabusRequest,
  ) => {
    const res = await updateSyllabus(id, data as UpdateSyllabusRequest);
    if (!res.isSuccess)
      throw new Error(res.message ?? "Không thể cập nhật syllabus.");
    toast({ title: "Đã cập nhật Syllabus", variant: "success" });
    setModal(null);
    setDetail(null);
    await loadData(pageNumber, true);
  };

  const handleOpenDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const [docRes, detailRes] = await Promise.all([
        getSyllabusDocument(id),
        getSyllabusById(id),
      ]);

      const fromDocument =
        docRes.isSuccess && docRes.data
          ? mapDocumentToSyllabusDetail(docRes.data)
          : null;
      const fromDetail = detailRes.isSuccess ? detailRes.data : null;

      if (fromDocument && fromDetail) {
        setDetail({
          ...fromDetail,
          ...fromDocument,
          // Keep display metadata from detail endpoint when available.
          programName: fromDetail.programName ?? fromDocument.programName,
          levelName: fromDetail.levelName ?? fromDocument.levelName,
          // Always prefer canonical full document payload for rendering.
          rawContentJson:
            fromDocument.rawContentJson ?? fromDetail.rawContentJson,
          // Preserve richer arrays from detail endpoint when document mapping is empty.
          units:
            Array.isArray(fromDetail.units) && fromDetail.units.length > 0
              ? fromDetail.units
              : fromDocument.units,
          lessons:
            Array.isArray(fromDetail.lessons) && fromDetail.lessons.length > 0
              ? fromDetail.lessons
              : fromDocument.lessons,
          resources:
            Array.isArray(fromDetail.resources) &&
            fromDetail.resources.length > 0
              ? fromDetail.resources
              : fromDocument.resources,
          sessionTemplates:
            Array.isArray(fromDetail.sessionTemplates) &&
            fromDetail.sessionTemplates.length > 0
              ? fromDetail.sessionTemplates
              : fromDocument.sessionTemplates,
        });
      } else if (fromDocument) {
        setDetail(fromDocument);
      } else if (fromDetail) {
        setDetail(fromDetail);
      } else {
        toast({
          title: "Không thể tải chi tiết",
          description:
            docRes.message ?? detailRes.message ?? "Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể tải chi tiết syllabus.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleImportWord = async (
    params: {
      programId: string;
      levelId: string;
      code: string;
      version: string;
      overwriteExisting: boolean;
    },
    file: File,
    _previewWarnings: SyllabusDocumentWarning[],
  ) => {
    setImportLoading(true);
    try {
      void _previewWarnings;
      let importedSyllabusId = "";
      const commitRes = await importSyllabusCommit(
        {
          programId: params.programId,
          levelId: params.levelId,
          code: params.code,
          edition: params.version,
          asDraft: true,
        },
        file,
      );

      if (!commitRes.isSuccess || !commitRes.data) {
        const legacyRes = await importSyllabusWord(params, file);
        if (!legacyRes.isSuccess || !legacyRes.data) {
          toast({
            title: "Import thất bại",
            description:
              commitRes.detail ??
              commitRes.message ??
              legacyRes.detail ??
              legacyRes.message ??
              "Lỗi import Word.",
            variant: "destructive",
          });
          return;
        }

        const d = legacyRes.data;
        importedSyllabusId = d.syllabusId;
        toast({
          title: "Import Word thành công",
          description: `${d.importedUnits} unit · ${d.importedLessons} file bài học · ${d.importedSessionTemplates} session`,
          variant: "success",
        });
      } else {
        const d = commitRes.data;
        importedSyllabusId = d.id;
        const totalUnits = d.summary?.totalUnits ?? 0;
        const totalLessons = d.summary?.totalLessons ?? 0;
        const totalSessions = d.summary?.totalSessions ?? 0;
        toast({
          title: "Import Word thành công",
          description: `${totalUnits} unit · ${totalLessons} file bài học · ${totalSessions} session`,
          variant: "success",
        });
      }

      setImportMode(null);
      await loadData(1, true);
      setPageNumber(1);

      if (importedSyllabusId) {
        // Word import here is syllabus-only; open syllabus detail instead of lesson-plan mapping modal.
        setArchiveImportResult(null);
        await handleOpenDetail(importedSyllabusId);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportArchive = async (
    params: {
      programId: string;
      levelId: string;
      code: string;
      version: string;
      overwriteExisting: boolean;
      branchId?: string;
    },
    file: File,
  ) => {
    setImportLoading(true);
    try {
      const res = await importSyllabusArchive(params, file);
      if (!res.isSuccess) {
        toast({
          title: "Import thất bại",
          description: res.detail ?? res.message ?? "Lỗi import zip.",
          variant: "destructive",
        });
        return;
      }
      const d = res.data!;
      const skippedMsg =
        d.skippedFiles > 0 ? ` · Bỏ qua ${d.skippedFiles} file` : "";
      toast({
        title: "Import Zip thành công",
        description: `${d.importedLessonPlans} file bài học${skippedMsg}`,
        variant: "success",
      });
      if (d.skippedEntries.length > 0) {
        toast({
          title: `Bỏ qua ${d.skippedEntries.length} file`,
          description: d.skippedEntries.slice(0, 5).join(" | "),
          variant: "warning",
        });
      }

      const programName = programOptions.find(
        (program) => program.id === params.programId,
      )?.name;
      const levelName = filterLevels.find(
        (level) => level.id === params.levelId,
      )?.name;
      const branchName = branchOptions.find(
        (branch) => branch.id === params.branchId,
      )?.name;

      setArchiveImportResult({
        programName,
        levelName,
        branchName,
        result: d,
      });

      setImportMode(null);
      await loadData(1, true);
      setPageNumber(1);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportLessonPlanWords = async (
    params: {
      programId: string;
      levelId: string;
      syllabusId: string;
      overwriteExisting: boolean;
      moduleId?: string;
    },
    files: File[],
  ) => {
    setImportLoading(true);
    try {
      const res = await importLessonPlanWords(params, files);
      if (!res.isSuccess) {
        toast({
          title: "Import thất bại",
          description:
            res.detail ?? res.message ?? "Lỗi import kế hoạch bài dạy.",
          variant: "destructive",
        });
        return;
      }
      const d = res.data!;
      const skippedMsg =
        d.skippedFiles > 0 ? ` · Bỏ qua ${d.skippedFiles} file` : "";
      toast({
        title: "Import kế hoạch bài dạy thành công",
        description: `${d.importedLessonPlans} file bài học${skippedMsg}`,
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

  const handleAssignBranch = async (
    syllabus: SyllabusListItem,
    payload: {
      branchId: string;
      effectiveFrom: string;
      effectiveTo?: string | null;
      isActive: boolean;
    },
  ) => {
    setImportLoading(true);
    try {
      const res = await assignSyllabusToBranch(payload.branchId, {
        syllabusId: syllabus.id,
        effectiveFrom: payload.effectiveFrom,
        effectiveTo: payload.effectiveTo ?? null,
        isActive: payload.isActive,
      });

      if (!res.isSuccess) {
        toast({
          title: "Không thể gán syllabus vào chi nhánh",
          description: res.detail ?? res.message ?? "Vui lòng thử lại.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Đã gán syllabus vào chi nhánh",
        description: `${syllabus.code} ${syllabus.version} đã được cập nhật assignment cho branch đã chọn.`,
        variant: "success",
      });
      setBranchAssignTarget(null);
    } finally {
      setImportLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Sorting functions
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="text-red-600" />
    ) : (
      <ArrowDown size={14} className="text-red-600" />
    );
  };

  const sortedItems = useMemo(() => {
    let sorted = [...items];
    if (sortColumn) {
      sorted.sort((a, b) => {
        let aVal: any = "";
        let bVal: any = "";

        switch (sortColumn) {
          case "title":
            aVal = (a.title ?? "").toLowerCase();
            bVal = (b.title ?? "").toLowerCase();
            break;
          case "code":
            aVal = (a.code ?? "").toLowerCase();
            bVal = (b.code ?? "").toLowerCase();
            break;
          case "version":
            aVal = (a.version ?? "").toLowerCase();
            bVal = (b.version ?? "").toLowerCase();
            break;
          case "unitCount":
            aVal = a.unitCount ?? 0;
            bVal = b.unitCount ?? 0;
            break;
          case "sessionTemplateCount":
            aVal = a.sessionTemplateCount ?? 0;
            bVal = b.sessionTemplateCount ?? 0;
            break;
          case "isActive":
            aVal = a.isActive ? 1 : 0;
            bVal = b.isActive ? 1 : 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [items, sortColumn, sortDirection]);

  const inputCls =
    "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200";
  const lessonPlanWorkspaceHref = `/${locale}/portal/admin/documents/templates${filterProgramId ? `?programId=${encodeURIComponent(filterProgramId)}` : ""}`;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-2">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <a
          href={`/${locale}/portal/admin/courses`}
          className="font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          ← Chương trình
        </a>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-700">Syllabus</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-3 text-white shadow-lg">
            <BookOpen size={25} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 md:text-2xl">
              Syllabus
            </h1>
            <div className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              <p className="max-w-4xl text-sm leading-6 text-gray-600">
                Quản lý tài liệu giảng dạy và kế hoạch bài học
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 cursor-pointer">
              <Upload size={16} /> Nhập dữ liệu
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Luồng import
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setImportMode("word")}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5"
              >
                <FileText size={16} className="text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Nhập Word</div>
                  <div className="text-xs text-gray-500">
                    Tạo syllabus từ một file Word.
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setImportMode("archive")}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5"
              >
                <FileArchive size={16} className="text-violet-600" />
                <div>
                  <div className="font-medium text-gray-900">Nhập Zip</div>
                  <div className="text-xs text-gray-500">
                    Dùng cho gói dữ liệu syllabus đầy đủ.
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setImportMode("lesson-plan-words")}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5"
              >
                <BookOpenCheck size={16} className="text-teal-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Import Bài Dạy
                  </div>
                  <div className="text-xs text-gray-500">
                    Bổ sung file bài dạy vào syllabus đã có.
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer">
              <Settings2 size={16} /> Tiện ích
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 rounded-xl border border-gray-200 bg-white p-1 shadow-xl"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Tác vụ phụ
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = lessonPlanWorkspaceHref;
                  }
                }}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5"
              >
                <BookOpenCheck size={16} className="text-emerald-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Mẫu giáo án chuẩn
                  </div>
                  <div className="text-xs text-gray-500">
                    Mở template chuẩn theo bộ lọc syllabus hiện tại.
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-gray-100" />
              <DropdownMenuItem
                onClick={() => setConfigTarget({ programId: "", levelId: "" })}
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5"
              >
                <Settings2 size={16} className="text-indigo-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Cấu hình import
                  </div>
                  <div className="text-xs text-gray-500">
                    Thiết lập rule import cho chương trình và level.
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setModal({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
          >
            <Plus size={16} /> Tạo Syllabus
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4">
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-red-200">
            {(["all", "active", "inactive"] as const).map((status) => {
              const counts: Record<typeof status, number> = {
                all: totalCount,
                active: items.filter((s) => s.isActive).length,
                inactive: items.filter((s) => !s.isActive).length,
              };

              const labels: Record<typeof status, string> = {
                all: "Tất cả",
                active: "Đang hoạt động",
                inactive: "Tạm ẩn",
              };

              const isActive = filterActive === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterActive(status)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-linear-to-r from-red-600 to-red-700 text-white border-red-600 shadow-md"
                      : "bg-white border-red-200 text-gray-700 hover:bg-red-50",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {labels[status]}
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        isActive
                          ? "bg-white/30 text-white"
                          : "bg-red-50 text-red-600",
                      )}
                    >
                      {counts[status]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Filters Row */}
          <div className="flex gap-3 items-end">
            {/* Search */}
            <div className="flex-[4]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tiêu đề, mã, phiên bản..."
                  className={cn(inputCls, "pl-9 w-full")}
                />
              </div>
            </div>
            {/* Program */}
            <div className="flex-1">
              <Select
                value={filterProgramId || "__all__"}
                onValueChange={(v) => {
                  setFilterProgramId(v === "__all__" ? "" : v);
                  setFilterLevelId("");
                }}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Chương trình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả chương trình</SelectItem>
                  {programOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Level */}
            <div className="flex-1">
              <Select
                value={filterLevelId || "__all__"}
                onValueChange={(v) =>
                  setFilterLevelId(v === "__all__" ? "" : v)
                }
                disabled={filterLevels.length === 0}
              >
                <SelectTrigger
                  className={cn(
                    inputCls,
                    filterLevels.length === 0 &&
                      "opacity-50 cursor-not-allowed",
                  )}
                >
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả level</SelectItem>
                  {filterLevels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm">
        <div className="border-b border-red-200 bg-linear-to-r from-red-500/10 to-red-700/10 px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Danh sách syllabus
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">
                  {totalCount} syllabus
                </span>
              </span>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-3" /> Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <BookOpen size={36} className="mb-3 opacity-25" />
            <p className="text-sm">Không có syllabus phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-sm">
              <thead className="border-b border-red-200 bg-linear-to-r from-red-600/5 to-red-700/5">
                <tr className="text-left font-semibold text-gray-700">
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("title")}
                  >
                    <span className="inline-flex items-center gap-2">
                      Tiêu đề {getSortIcon("title")}
                    </span>
                  </th>
                  <th className="px-6 py-4">Chương trình / Level</th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("code")}
                  >
                    <span className="inline-flex items-center gap-2">
                      Mã Phiên bản {getSortIcon("code")}
                    </span>
                  </th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("unitCount")}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Unit {getSortIcon("unitCount")}
                    </span>
                  </th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("sessionTemplateCount")}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Session {getSortIcon("sessionTemplateCount")}
                    </span>
                  </th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer hover:bg-red-50 transition-colors select-none"
                    onClick={() => handleSort("isActive")}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Trạng thái {getSortIcon("isActive")}
                    </span>
                  </th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-red-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 max-w-xs">
                      <p
                        className="font-semibold text-gray-900 truncate cursor-help"
                        title={item.title}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                          : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-700">
                        {item.programName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.levelName ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs font-bold text-gray-700">
                        {item.code}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {item.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-7 w-10 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-700">
                        {item.unitCount ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-7 w-12 items-center justify-center rounded-lg bg-purple-50 text-xs font-semibold text-purple-700">
                        {item.sessionTemplateCount ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ActiveBadge isActive={item.isActive} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Xem"
                          disabled={detailLoading}
                          onClick={() => handleOpenDetail(item.id)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <a
                          href={`/${locale}/portal/admin/syllabuses/${item.id}/editor`}
                          title="Editor"
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          <BookOpen size={14} />
                        </a>
                        <a
                          href={`/${locale}/portal/admin/documents/templates?programId=${encodeURIComponent(item.programId)}&syllabusId=${encodeURIComponent(item.id)}`}
                          title="Mẫu giáo án chuẩn"
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-emerald-600 cursor-pointer transition-colors"
                        >
                          <BookOpenCheck size={14} />
                        </a>
                        <button
                          type="button"
                          title="Phiên bản"
                          onClick={() => setVersionTarget(item)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          <GitBranch size={14} />
                        </button>
                        <button
                          type="button"
                          title="Gán chi nhánh"
                          onClick={() => setBranchAssignTarget(item)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-amber-600 cursor-pointer transition-colors"
                        >
                          <Building2 size={14} />
                        </button>
                        <button
                          type="button"
                          title="Sửa"
                          onClick={() => setModal({ mode: "edit", item })}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-600 cursor-pointer transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        {item.programId && item.levelId && (
                          <button
                            type="button"
                            title="Cấu hình"
                            onClick={() =>
                              setConfigTarget({
                                programId: item.programId,
                                levelId: item.levelId,
                              })
                            }
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            <Settings2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination inside card */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-red-100 px-6 py-4">
            <p className="text-sm text-gray-600">
              <strong className="text-gray-700">
                {(pageNumber - 1) * PAGE_SIZE + 1}–
                {Math.min(pageNumber * PAGE_SIZE, totalCount)}
              </strong>{" "}
              / {totalCount} bản ghi
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-40 cursor-pointer transition-colors shadow-sm"
              >
                <ChevronLeft size={15} /> Trước
              </button>
              <span className="px-3 py-2 text-sm font-semibold text-gray-700">
                {pageNumber} / {totalPages}
              </span>
              <button
                type="button"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((p) => p + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 disabled:opacity-40 cursor-pointer transition-colors shadow-sm"
              >
                Sau <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.mode === "create" && (
        <SyllabusFormModal
          isEdit={false}
          programOptions={programOptions}
          onClose={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal?.mode === "edit" && (
        <SyllabusFormModal
          isEdit
          initial={detail ?? modal.item}
          programOptions={programOptions}
          onClose={() => setModal(null)}
          onSubmit={(data) => handleUpdate(modal.item.id, data)}
        />
      )}
      {detail && (
        <SyllabusDetailModal
          detail={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setDetail(null);
            setModal({ mode: "edit", item: detail });
          }}
        />
      )}
      {importMode === "word" && (
        <ImportWordModal
          programOptions={programOptions}
          loading={importLoading}
          onClose={() => setImportMode(null)}
          onSubmit={handleImportWord}
        />
      )}
      {importMode === "archive" && (
        <ImportArchiveModal
          programOptions={programOptions}
          branchOptions={branchOptions}
          loading={importLoading}
          onClose={() => setImportMode(null)}
          onSubmit={handleImportArchive}
        />
      )}
      {importMode === "lesson-plan-words" && (
        <ImportLessonPlanWordsModal
          programOptions={programOptions}
          loading={importLoading}
          onClose={() => setImportMode(null)}
          onSubmit={handleImportLessonPlanWords}
        />
      )}
      {branchAssignTarget && (
        <AssignBranchModal
          syllabus={branchAssignTarget}
          branchOptions={branchOptions}
          loading={importLoading}
          onClose={() => setBranchAssignTarget(null)}
          onSubmit={(payload) =>
            void handleAssignBranch(branchAssignTarget, payload)
          }
        />
      )}
      <SyllabusVersionsModal
        open={!!versionTarget}
        syllabusId={versionTarget?.id ?? ""}
        syllabusTitle={versionTarget ? `[${versionTarget.code}] ${versionTarget.title}` : ""}
        onClose={() => setVersionTarget(null)}
      />
      {configTarget !== null && (
        <ImportConfigModal
          programOptions={programOptions}
          initialProgramId={configTarget.programId || undefined}
          initialLevelId={configTarget.levelId || undefined}
          onClose={() => setConfigTarget(null)}
          onSaved={() => setConfigTarget(null)}
        />
      )}
      {archiveImportResult && (
        <ArchiveImportResultModal
          payload={archiveImportResult}
          onOpenSyllabus={(id) => {
            setArchiveImportResult(null);
            void handleOpenDetail(id);
          }}
          onClose={() => {
            setArchiveImportResult(null);
          }}
        />
      )}
    </div>
  );
}

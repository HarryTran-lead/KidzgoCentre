"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BookOpen, Clock, DollarSign, Layers, ListChecks, Tag, Wallet, X } from "lucide-react";
import { getProgramsForBranch, type ProgramOption } from "@/lib/api/tuitionPlanService";
import { getLevels, getModules } from "@/lib/api/academicProgressionService";
import { getLearningTicketTypes } from "@/lib/api/learningTicketTypeService";
import { getSyllabuses, getSyllabusById, type SyllabusDetail, type SyllabusListItem } from "@/lib/api/syllabusService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import type { LearningTicketType } from "@/types/learning-ticket-type";
import type { LevelDto, ModuleDto } from "@/types/academic-progression";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

type TuitionPlanKind = "regular" | "syllabus";

type SelectableModule = {
  id: string;
  code: string;
  name: string;
  order: number;
  plannedSessionCount: number;
};

export type TuitionPlanFormData = {
  branchId: string;
  planType: TuitionPlanKind;
  programId: string;
  levelId: string;
  syllabusId: string;
  moduleIds: string[];
  name: string;
  sessionCount: string;
  tuitionAmount: string;
  unitPriceSession: string;
  currency: string;
  status: "active" | "inactive";
  learningTicketTypeId: string;
};

type TuitionPlanTextField = Exclude<keyof TuitionPlanFormData, "moduleIds" | "planType" | "status">;
type TuitionPlanStringField = TuitionPlanTextField | "planType" | "status";

const initialFormData: TuitionPlanFormData = {
  branchId: "",
  planType: "regular",
  programId: "",
  levelId: "",
  syllabusId: "",
  moduleIds: [],
  name: "",
  sessionCount: "",
  tuitionAmount: "",
  unitPriceSession: "",
  currency: "VND",
  status: "active",
  learningTicketTypeId: "",
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function textFrom(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function collectModuleIds(items: unknown[] | undefined, target: Set<string>) {
  for (const item of items ?? []) {
    const source = toRecord(item);
    const nestedModule = toRecord(source.module ?? source.Module);
    const moduleId = textFrom(source, "moduleId", "ModuleId") || textFrom(nestedModule, "id", "Id", "moduleId", "ModuleId");
    if (moduleId) target.add(moduleId);
  }
}

function buildSyllabusModuleIds(detail: SyllabusDetail | null): Set<string> {
  const ids = new Set<string>();
  if (!detail) return ids;
  collectModuleIds(detail.sessionTemplates, ids);
  collectModuleIds(detail.units, ids);
  collectModuleIds(detail.lessons, ids);
  return ids;
}

function displaySyllabus(item: SyllabusListItem): string {
  return [item.code, item.version, item.title].filter(Boolean).join(" - ");
}

function displayModule(module: SelectableModule): string {
  const code = module.code ? `${module.code} - ` : "";
  return `${code}${module.name}`;
}

function rangeFromModules(modules: SelectableModule[], startId: string, endId: string): string[] {
  const startIndex = modules.findIndex((module) => module.id === startId);
  const endIndex = modules.findIndex((module) => module.id === endId);
  if (startIndex < 0 || endIndex < 0) return [];
  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);
  return modules.slice(from, to + 1).map((module) => module.id);
}

export default function TuitionPlanModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  initialData,
  defaultBranchId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TuitionPlanFormData) => void;
  mode?: "create" | "edit";
  initialData?: TuitionPlanFormData | null;
  defaultBranchId?: string | null;
}) {
  const [formData, setFormData] = useState<TuitionPlanFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof TuitionPlanFormData, string>>>({});
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [syllabuses, setSyllabuses] = useState<SyllabusListItem[]>([]);
  const [loadingSyllabuses, setLoadingSyllabuses] = useState(false);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [syllabusDetail, setSyllabusDetail] = useState<SyllabusDetail | null>(null);
  const [loadingSyllabusDetail, setLoadingSyllabusDetail] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<LearningTicketType[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const isSyllabusPlan = formData.planType === "syllabus";

  const validModules = useMemo<SelectableModule[]>(() => {
    if (!isSyllabusPlan || !syllabusDetail) return [];
    const moduleIds = buildSyllabusModuleIds(syllabusDetail);
    const summaryEntries = (syllabusDetail.lessonPlanTemplateSummaries ?? [])
      .filter((item) => item.moduleId)
      .map((item): [string, NonNullable<SyllabusDetail["lessonPlanTemplateSummaries"]>[number]] => [item.moduleId as string, item]);
    const summaryByModule = new Map(summaryEntries);

    return modules
      .filter((module) => moduleIds.has(module.id))
      .map((module) => {
        const summary = summaryByModule.get(module.id);
        return {
          id: module.id,
          code: module.code || summary?.moduleCode || "",
          name: module.name || summary?.moduleName || module.id,
          order: Number(module.order ?? module.orderIndex ?? summary?.moduleOrder ?? 0),
          plannedSessionCount: Number(module.plannedSessionCount ?? module.totalSessions ?? summary?.plannedSessionCount ?? 0),
        };
      })
      .sort((a, b) => a.order - b.order || a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [isSyllabusPlan, modules, syllabusDetail]);

  const selectedModules = useMemo(() => {
    const selected = new Set(formData.moduleIds);
    return validModules.filter((module) => selected.has(module.id));
  }, [formData.moduleIds, validModules]);

  const selectedStartId = selectedModules[0]?.id ?? "";
  const selectedEndId = selectedModules[selectedModules.length - 1]?.id ?? "";
  const calculatedSessions = selectedModules.reduce((total, module) => total + module.plannedSessionCount, 0);
  const isLookupLoading = loadingSyllabuses || loadingModules || loadingSyllabusDetail;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        ...initialFormData,
        branchId: defaultBranchId || "",
      });
    }
    setErrors({});
  }, [isOpen, mode, initialData, defaultBranchId]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPrograms() {
      try {
        setLoadingPrograms(true);
        const branchId = formData.branchId || defaultBranchId || undefined;
        const items = await getProgramsForBranch(branchId);
        setPrograms(items.filter((x) => x.isActive !== false));
      } catch {
        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    }

    loadPrograms();
  }, [isOpen, formData.branchId, defaultBranchId]);

  useEffect(() => {
    if (!isOpen || !formData.programId) {
      setLevels([]);
      return;
    }

    async function loadLevels() {
      try {
        setLoadingLevels(true);
        const res = await getLevels({ programId: formData.programId, isActive: true });
        setLevels(res.isSuccess ? res.data.items : []);
      } catch {
        setLevels([]);
      } finally {
        setLoadingLevels(false);
      }
    }

    loadLevels();
  }, [isOpen, formData.programId]);

  useEffect(() => {
    if (!isOpen || !formData.programId || !formData.levelId) {
      setSyllabuses([]);
      return;
    }

    async function loadSyllabuses() {
      try {
        setLoadingSyllabuses(true);
        const res = await getSyllabuses({
          programId: formData.programId,
          levelId: formData.levelId,
          isActive: true,
          pageNumber: 1,
          pageSize: 200,
        });
        setSyllabuses(res.isSuccess ? res.data.items : []);
      } catch {
        setSyllabuses([]);
      } finally {
        setLoadingSyllabuses(false);
      }
    }

    loadSyllabuses();
  }, [isOpen, formData.programId, formData.levelId]);

  useEffect(() => {
    if (!isOpen || !formData.levelId) {
      setModules([]);
      return;
    }

    async function loadModules() {
      try {
        setLoadingModules(true);
        const res = await getModules({ levelId: formData.levelId, isActive: true });
        setModules(res.isSuccess ? res.data.items : []);
      } catch {
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    }

    loadModules();
  }, [isOpen, formData.levelId]);

  useEffect(() => {
    if (!isOpen || !formData.syllabusId) {
      setSyllabusDetail(null);
      return;
    }

    async function loadSyllabusDetail() {
      try {
        setLoadingSyllabusDetail(true);
        const res = await getSyllabusById(formData.syllabusId);
        setSyllabusDetail(res.isSuccess ? res.data : null);
      } catch {
        setSyllabusDetail(null);
      } finally {
        setLoadingSyllabusDetail(false);
      }
    }

    loadSyllabusDetail();
  }, [isOpen, formData.syllabusId]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadTicketTypes() {
      try {
        const items = await getLearningTicketTypes({ isActive: true });
        setTicketTypes(items);
      } catch {
        setTicketTypes([]);
      }
    }

    loadTicketTypes();
  }, [isOpen]);

  useEffect(() => {
    if (!isSyllabusPlan) return;
    const next = calculatedSessions > 0 ? String(calculatedSessions) : "";
    setFormData((prev) => (prev.sessionCount === next ? prev : { ...prev, sessionCount: next }));
  }, [calculatedSessions, isSyllabusPlan]);

  useEffect(() => {
    if (!isSyllabusPlan || validModules.length === 0 || formData.moduleIds.length === 0 || selectedModules.length === 0) return;

    const normalizedIds = rangeFromModules(
      validModules,
      selectedModules[0].id,
      selectedModules[selectedModules.length - 1].id,
    );
    if (normalizedIds.join("|") !== formData.moduleIds.join("|")) {
      setFormData((prev) => ({ ...prev, moduleIds: normalizedIds }));
    }
  }, [formData.moduleIds, isSyllabusPlan, selectedModules, validModules]);

  useEffect(() => {
    const sessions = Number(formData.sessionCount);
    const tuition = Number(formData.tuitionAmount.replace(/[^\d]/g, ""));

    if (sessions > 0 && tuition > 0 && !isNaN(sessions) && !isNaN(tuition)) {
      const pricePerSession = Math.round(tuition / sessions);
      const next = String(pricePerSession);
      setFormData((prev) => (prev.unitPriceSession === next ? prev : { ...prev, unitPriceSession: next }));
    } else if (!formData.sessionCount || !formData.tuitionAmount) {
      setFormData((prev) => (prev.unitPriceSession ? { ...prev, unitPriceSession: "" } : prev));
    }
  }, [formData.sessionCount, formData.tuitionAmount]);

  const clearError = (field: keyof TuitionPlanFormData) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChange = (field: TuitionPlanStringField, value: string) => {
    setFormData((prev) => {
      const next: TuitionPlanFormData = { ...prev };
      if (field === "planType") {
        next.planType = value as TuitionPlanKind;
      } else if (field === "status") {
        next.status = value as TuitionPlanFormData["status"];
      } else {
        next[field] = value;
      }

      if (field === "planType") {
        next.syllabusId = "";
        next.moduleIds = [];
        if (value === "regular") next.sessionCount = "";
      }

      if (field === "programId") {
        next.levelId = "";
        next.syllabusId = "";
        next.moduleIds = [];
      }

      if (field === "levelId") {
        next.syllabusId = "";
        next.moduleIds = [];
      }

      if (field === "syllabusId") {
        next.moduleIds = [];
      }

      return next;
    });
    clearError(field);
  };

  const setModuleRange = (startId: string, endId: string) => {
    const nextIds = rangeFromModules(validModules, startId, endId);
    setFormData((prev) => ({ ...prev, moduleIds: nextIds }));
    clearError("moduleIds");
  };

  const handleStartModuleChange = (startId: string) => {
    const startIndex = validModules.findIndex((module) => module.id === startId);
    const endIndex = validModules.findIndex((module) => module.id === selectedEndId);
    const nextEndId = endIndex >= startIndex && endIndex >= 0 ? selectedEndId : startId;
    setModuleRange(startId, nextEndId);
  };

  const handleEndModuleChange = (endId: string) => {
    const startId = selectedStartId || endId;
    setModuleRange(startId, endId);
  };

  const validate = () => {
    const next: Partial<Record<keyof TuitionPlanFormData, string>> = {};

    if (!formData.programId) next.programId = "Chương trình học là bắt buộc";
    if (!formData.levelId) next.levelId = "Level là bắt buộc";
    if (!formData.name.trim()) next.name = "Tên gói học là bắt buộc";
    if (!formData.tuitionAmount || Number(formData.tuitionAmount.replace(/[^\d]/g, "")) <= 0) {
      next.tuitionAmount = "Học phí phải lớn hơn 0";
    }
    if (!formData.currency.trim()) next.currency = "Tiền tệ là bắt buộc";

    if (isSyllabusPlan) {
      if (!formData.syllabusId) next.syllabusId = "Syllabus là bắt buộc";
      if (formData.moduleIds.length === 0) next.moduleIds = "Vui lòng chọn module bắt đầu và kết thúc";
      if (calculatedSessions <= 0) next.sessionCount = "Các module đã chọn chưa có số buổi hợp lệ";
    } else if (!formData.sessionCount || Number(formData.sessionCount) <= 0) {
      next.sessionCount = "Số buổi học phải lớn hơn 0";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      syllabusId: isSyllabusPlan ? formData.syllabusId : "",
      moduleIds: isSyllabusPlan ? formData.moduleIds : [],
      sessionCount: isSyllabusPlan ? String(calculatedSessions) : formData.sessionCount,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div ref={modalRef} className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-red-600 to-red-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === "edit" ? "Cập nhật gói học" : "Tạo gói học mới"}
                </h2>
                <p className="text-sm text-red-100">Cấu hình học phí theo chương trình, syllabus và module</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(["regular", "syllabus"] as const).map((type) => {
                const active = formData.planType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange("planType", type)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer",
                      active
                        ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {type === "regular" ? <Wallet size={18} /> : <ListChecks size={18} />}
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {type === "regular" ? "Gói thường" : "Gói theo syllabus/module"}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {type === "regular" ? "Nhập số buổi thủ công" : "Tự tính số buổi từ module liên tiếp"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <BookOpen size={16} className="text-red-600" />
                  Chương trình học <span className="text-red-600">*</span>
                </label>
                <Select value={formData.programId} onValueChange={(value) => handleChange("programId", value)}>
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                    errors.programId ? "border-red-500" : "border-gray-200",
                    loadingPrograms ? "opacity-50 cursor-not-allowed" : "",
                  )}>
                    <SelectValue placeholder="Chọn chương trình học" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.programId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.programId}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Layers size={16} className="text-red-600" />
                  Level <span className="text-red-600">*</span>
                </label>
                <Select
                  value={formData.levelId}
                  onValueChange={(value) => handleChange("levelId", value)}
                  disabled={!formData.programId || loadingLevels}
                >
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                    errors.levelId ? "border-red-500" : "border-gray-200",
                    (!formData.programId || loadingLevels) ? "opacity-50 cursor-not-allowed" : "",
                  )}>
                    <SelectValue placeholder={loadingLevels ? "Đang tải..." : "Chọn level"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        <span className="font-mono font-bold text-red-700 mr-2">{l.code}</span>{l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.levelId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.levelId}</p>}
              </div>
            </div>

            {isSyllabusPlan && (
              <div className="space-y-4 rounded-xl border border-red-100 bg-red-50/40 p-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen size={16} className="text-red-600" />
                    Syllabus <span className="text-red-600">*</span>
                  </label>
                  <Select
                    value={formData.syllabusId}
                    onValueChange={(value) => handleChange("syllabusId", value)}
                    disabled={!formData.programId || !formData.levelId || loadingSyllabuses}
                  >
                    <SelectTrigger className={cn(
                      "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                      errors.syllabusId ? "border-red-500" : "border-gray-200",
                      (!formData.programId || !formData.levelId || loadingSyllabuses) ? "opacity-50 cursor-not-allowed" : "",
                    )}>
                      <SelectValue placeholder={loadingSyllabuses ? "Đang tải..." : "Chọn syllabus"} />
                    </SelectTrigger>
                    <SelectContent>
                      {syllabuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{displaySyllabus(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.syllabusId && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.syllabusId}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <ListChecks size={16} className="text-blue-600" />
                      Module bắt đầu <span className="text-red-600">*</span>
                    </label>
                    <Select
                      value={selectedStartId}
                      onValueChange={handleStartModuleChange}
                      disabled={!formData.syllabusId || isLookupLoading || validModules.length === 0}
                    >
                      <SelectTrigger className={cn(
                        "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                        errors.moduleIds ? "border-red-500" : "border-gray-200",
                        (!formData.syllabusId || isLookupLoading || validModules.length === 0) ? "opacity-50 cursor-not-allowed" : "",
                      )}>
                        <SelectValue placeholder={isLookupLoading ? "Đang tải..." : "Chọn module bắt đầu"} />
                      </SelectTrigger>
                      <SelectContent>
                        {validModules.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{displayModule(m)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <ListChecks size={16} className="text-blue-600" />
                      Module kết thúc <span className="text-red-600">*</span>
                    </label>
                    <Select
                      value={selectedEndId}
                      onValueChange={handleEndModuleChange}
                      disabled={!selectedStartId || isLookupLoading || validModules.length === 0}
                    >
                      <SelectTrigger className={cn(
                        "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                        errors.moduleIds ? "border-red-500" : "border-gray-200",
                        (!selectedStartId || isLookupLoading || validModules.length === 0) ? "opacity-50 cursor-not-allowed" : "",
                      )}>
                        <SelectValue placeholder={isLookupLoading ? "Đang tải..." : "Chọn module kết thúc"} />
                      </SelectTrigger>
                      <SelectContent>
                        {validModules
                          .filter((module) => {
                            const startIndex = validModules.findIndex((item) => item.id === selectedStartId);
                            const index = validModules.findIndex((item) => item.id === module.id);
                            return startIndex < 0 || index >= startIndex;
                          })
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>{displayModule(m)}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {errors.moduleIds && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.moduleIds}</p>}
                {formData.syllabusId && !isLookupLoading && validModules.length === 0 && (
                  <p className="text-sm text-amber-700 flex items-center gap-1"><AlertCircle size={14} /> Syllabus này chưa có module hợp lệ để chọn.</p>
                )}

                {selectedModules.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedModules.map((module) => (
                      <span key={module.id} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                        {module.code || module.name}
                        <span className="text-gray-500">{module.plannedSessionCount} buổi</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Wallet size={16} className="text-red-600" />
                  Tên gói học <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.name ? "border-red-500" : "border-gray-200",
                  )}
                  placeholder="VD: Gói Module 1-2"
                />
                {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock size={16} className="text-red-600" />
                  Số buổi học <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sessionCount}
                  onChange={(e) => handleChange("sessionCount", e.target.value)}
                  readOnly={isSyllabusPlan}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    isSyllabusPlan ? "bg-gray-50 cursor-not-allowed" : "bg-white",
                    errors.sessionCount ? "border-red-500" : "border-gray-200",
                  )}
                  placeholder={isSyllabusPlan ? "Tự động tính" : "VD: 24"}
                />
                {errors.sessionCount && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.sessionCount}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Học phí <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tuitionAmount}
                  onChange={(e) => handleChange("tuitionAmount", e.target.value.replace(/[^\d]/g, ""))}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all",
                    errors.tuitionAmount ? "border-red-500" : "border-gray-200",
                  )}
                  placeholder="VD: 7200000"
                />
                {errors.tuitionAmount && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.tuitionAmount}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Giá mỗi buổi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unitPriceSession ? Number(formData.unitPriceSession).toLocaleString("vi-VN") : ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                  placeholder="Tự động tính"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign size={16} className="text-red-600" />
                  Tiền tệ <span className="text-red-600">*</span>
                </label>
                <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
                  <SelectTrigger className={cn(
                    "w-full rounded-xl border bg-white text-sm text-gray-900 transition-all",
                    errors.currency ? "border-red-500" : "border-gray-200",
                  )}>
                    <SelectValue placeholder="Chọn tiền tệ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {errors.currency}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Tag size={16} className="text-purple-600" />
                  Loại vé học
                  <span className="text-xs text-gray-400 font-normal">- tùy chọn</span>
                </label>
                <Select
                  value={formData.learningTicketTypeId || "__none__"}
                  onValueChange={(value) => handleChange("learningTicketTypeId", value === "__none__" ? "" : value)}
                >
                  <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 transition-all">
                    <SelectValue placeholder="Không phân loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-gray-500">Không phân loại</span>
                    </SelectItem>
                    {ticketTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="font-mono font-bold text-purple-700 mr-2">{t.code}</span>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "edit" && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Trạng thái</label>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold",
                    formData.status === "active"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200",
                  )}>
                    {formData.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChange("status", formData.status === "active" ? "inactive" : "active")}
                    className={cn(
                      "relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer",
                      formData.status === "active"
                        ? "bg-gradient-to-r from-red-600 to-red-700"
                        : "bg-gray-300",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform",
                        formData.status === "active" ? "translate-x-9" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="border-t border-gray-200 bg-linear-to-r from-red-500/5 to-red-700/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={submit}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 text-sm text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
              >
                {mode === "edit" ? "Lưu thay đổi" : "Tạo gói học"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

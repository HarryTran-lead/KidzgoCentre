"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Layers,
  Pencil,
  Plus,
  Search,
  X,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Grid3X3,
  Zap,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import {
  getLevels,
  getModules,
  createLevel,
  updateLevel,
  createModule,
  updateModule,
} from "@/lib/api/academicProgressionService";
import { get } from "@/lib/axios";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type {
  LevelDto,
  ModuleDto,
  CreateLevelRequest,
  UpdateLevelRequest,
  CreateModuleRequest,
  UpdateModuleRequest,
  ModuleType,
} from "@/types/academic-progression";

export type LevelModuleRoleMode = "admin" | "staff";

interface Props {
  roleMode: LevelModuleRoleMode;
  programId?: string;
}

const EMPTY_LEVEL_FORM: CreateLevelRequest = {
  programId: "",
  code: "",
  name: "",
  order: 1,
  description: "",
  isActive: true,
};

const EMPTY_MODULE_FORM: Omit<CreateModuleRequest, "levelId"> = {
  code: "",
  name: "",
  order: 1,
  description: "",
  plannedSessionCount: 6,
  isActive: true,
  type: "core",
};

interface ProgramOption {
  id: string;
  name: string;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Module Type Badge Component
function ModuleTypeBadge({ type }: { type: ModuleType }) {
  const config = {
    core: { label: "Core", color: "blue", icon: Target },
    revision: { label: "Revision", color: "amber", icon: RefreshIcon },
    test: { label: "Test", color: "red", icon: AlertCircle },
    placement: { label: "Placement", color: "purple", icon: TrendingUp },
    trial: { label: "Trial", color: "green", icon: Sparkles },
  };
  const c = config[type] || config.core;
  const Icon = c.icon;
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        colorClasses[c.color as keyof typeof colorClasses],
      )}
    >
      <Icon size={10} />
      {c.label}
    </span>
  );
}

// Level Card Component - Cân đối và hiện đại
function LevelCard({
  level,
  programName,
  isExpanded,
  modules,
  isLoadingModules,
  roleMode,
  onToggle,
  onEditLevel,
  onAddModule,
  onEditModule,
}: {
  level: LevelDto;
  programName: string;
  isExpanded: boolean;
  modules: ModuleDto[];
  isLoadingModules: boolean;
  roleMode: LevelModuleRoleMode;
  onToggle: () => void;
  onEditLevel: () => void;
  onAddModule: () => void;
  onEditModule: (module: ModuleDto) => void;
}) {
  const moduleCount = modules?.length || 0;
  const activeModules = modules?.filter((m) => m.isActive).length || 0;

  return (
    <div className="group rounded-xl border border-red-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Level Header */}
      <div
        className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all"
        onClick={onToggle}
      >
        {/* Expand/Collapse Icon */}
        <div
          className={classNames(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all",
            isExpanded
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-500",
          )}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {/* Level Info - Flex với gap đều */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {/* Code Badge */}
            <span className="shrink-0 rounded-md bg-gradient-to-r from-red-500 to-rose-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              {level.code}
            </span>

            {/* Level Name */}
            <span className="font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">
              {level.name}
            </span>

            {/* Program Badge */}
            <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
              {programName}
            </span>

            {/* Status Badge */}
            <span
              className={classNames(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                level.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {level.isActive ? "● Đang hoạt động" : "○ Tạm dừng"}
            </span>

            {/* Stats - Hide on mobile, show on desktop */}
            <div className="hidden md:flex items-center gap-3 ml-auto text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50">
                  <Grid3X3 size={11} className="text-blue-500" />
                </div>
                <span>{moduleCount} modules</span>
              </div>

            </div>
          </div>

          {/* Description - với ellipsis */}
          {/* {level.description && (
            <p className="mt-1.5 text-xs text-gray-500 truncate">
              {level.description}
            </p>
          )} */}
        </div>

        {/* Action Buttons */}
        {roleMode === "admin" && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditLevel();
              }}
              className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:border-gray-300 transition-all cursor-pointer"
              title="Sửa Level"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddModule();
              }}
              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-400 hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-all cursor-pointer"
              title="Thêm Module"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Stats - Show only on mobile when expanded */}
      {isExpanded && (
        <div className="md:hidden border-t border-gray-100 px-5 py-2 bg-gray-50/50">
          <div className="flex items-center justify-around gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50">
                <Grid3X3 size={11} className="text-blue-500" />
              </div>
              <span className="text-gray-600">{moduleCount} modules</span>
            </div>
          </div>
        </div>
      )}

      {/* Modules Section */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/30 to-white px-5 py-4">
          {isLoadingModules ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              <span className="text-xs text-gray-400">Đang tải modules...</span>
            </div>
          ) : !modules || modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-gray-100 p-3 mb-2">
                <FolderTree size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">Chưa có module nào</p>
              {roleMode === "admin" && (
                <button
                  onClick={onAddModule}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Plus size={12} />
                  Thêm module đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((mod, idx) => (
                <div
                  key={mod.id}
                  className="group/module flex items-center gap-3 rounded-lg border border-red-100 cursor-pointer bg-white px-4 py-3 transition-all hover:shadow-md hover:border-red-100"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Module Icon */}
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-100 to-red-100">
                      <BookOpen size={14} className="text-red-500" />
                    </div>
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono font-semibold text-gray-600">
                        {mod.code}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[150px] md:max-w-xs">
                        {mod.name}
                      </span>
                      {/* <ModuleTypeBadge type={mod.type || "core"} /> */}
                      {mod.plannedSessionCount && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 shrink-0">
                          <Clock size={10} />
                          {mod.plannedSessionCount} buổi
                        </span>
                      )}
                      <span
                        className={classNames(
                          "ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-2.5 py-1 text-xs font-semibold",
                          mod.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600",
                        )}
                      >
                        <span
                          className={classNames(
                            "inline-block h-1.5 w-1.5 rounded-full",
                            mod.isActive ? "bg-emerald-600" : "bg-gray-400",
                          )}
                        />
                        {mod.isActive ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </div>
                    {/* {mod.description && (
                      <p className="mt-1 text-xs text-gray-400 truncate">
                        {mod.description}
                      </p>
                    )} */}
                  </div>

                  {/* Edit Button */}
                  {roleMode === "admin" && (
                    <button
                      onClick={() => onEditModule(mod)}
                      className="rounded-lg p-1.5 text-gray-400 opacity-0 group-hover/module:opacity-100 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer shrink-0"
                      title="Sửa Module"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Custom Refresh Icon component
function RefreshIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </svg>
  );
}

// Loader Icon Component
function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function LevelModuleWorkspace({ roleMode, programId }: Props) {
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [modules, setModules] = useState<Record<string, ModuleDto[]>>({});
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingModules, setLoadingModules] = useState<Record<string, boolean>>(
    {},
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState(
    programId || "all",
  );
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  useEffect(() => {
    get<any>(ADMIN_ENDPOINTS.PROGRAMS_ACTIVE)
      .then((res) => {
        const raw = res?.data;
        const list: ProgramOption[] =
          raw?.programs?.items ??
          raw?.items ??
          raw?.programs ??
          (Array.isArray(raw) ? raw : []);
        setPrograms(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // Level form state
  const [levelFormOpen, setLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelDto | null>(null);
  const [levelForm, setLevelForm] =
    useState<CreateLevelRequest>(EMPTY_LEVEL_FORM);
  const [levelFormSaving, setLevelFormSaving] = useState(false);
  const [levelFormError, setLevelFormError] = useState<string | null>(null);

  // Module form state
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [moduleFormLevelId, setModuleFormLevelId] = useState<string>("");
  const [editingModule, setEditingModule] = useState<ModuleDto | null>(null);
  const [moduleForm, setModuleForm] =
    useState<Omit<CreateModuleRequest, "levelId">>(EMPTY_MODULE_FORM);
  const [moduleFormSaving, setModuleFormSaving] = useState(false);
  const [moduleFormError, setModuleFormError] = useState<string | null>(null);

  const programNameById = useMemo(
    () =>
      new Map(
        programs
          .filter((prog) => prog.id && prog.name)
          .map((prog) => [prog.id, prog.name]),
      ),
    [programs],
  );

  const getProgramName = useCallback(
    (level: LevelDto) =>
      level.programName?.trim() ||
      programNameById.get(level.programId) ||
      "Chưa rõ chương trình",
    [programNameById],
  );

  const programFilterOptions = useMemo(() => {
    const mapped = new Map<string, string>();

    for (const prog of programs) {
      if (prog.id && prog.name) {
        mapped.set(prog.id, prog.name);
      }
    }

    for (const level of levels) {
      if (!level.programId || mapped.has(level.programId)) continue;
      mapped.set(level.programId, getProgramName(level));
    }

    return Array.from(mapped.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [getProgramName, levels, programs]);

  const filteredLevels = useMemo(() => {
    if (selectedProgramFilter === "all") {
      return levels;
    }
    return levels.filter((level) => level.programId === selectedProgramFilter);
  }, [levels, selectedProgramFilter]);

  const groupedLevels = useMemo(() => {
    const groupedMap = new Map<
      string,
      { programId: string; programName: string; levels: LevelDto[] }
    >();

    for (const level of filteredLevels) {
      const key = level.programId || "unknown";
      const current = groupedMap.get(key);
      if (current) {
        current.levels.push(level);
        continue;
      }

      groupedMap.set(key, {
        programId: level.programId,
        programName: getProgramName(level),
        levels: [level],
      });
    }

    return Array.from(groupedMap.values()).sort((a, b) =>
      a.programName.localeCompare(b.programName, "vi"),
    );
  }, [filteredLevels, getProgramName]);

  useEffect(() => {
    if (programId) {
      setSelectedProgramFilter(programId);
    }
  }, [programId]);

  const loadLevels = useCallback(async () => {
    setLoadingLevels(true);
    setError(null);
    const res = await getLevels({
      programId,
      searchTerm: searchTerm || undefined,
    });
    if (res.isSuccess) {
      setLevels(res.data.items);
    } else {
      setError(res.message ?? "Không thể tải danh sách Level");
    }
    setLoadingLevels(false);
  }, [programId, searchTerm]);

  const loadModulesForLevel = useCallback(async (levelId: string) => {
    setLoadingModules((prev) => ({ ...prev, [levelId]: true }));
    const res = await getModules({ levelId });
    if (res.isSuccess) {
      setModules((prev) => ({ ...prev, [levelId]: res.data.items }));
    }
    setLoadingModules((prev) => ({ ...prev, [levelId]: false }));
  }, []);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) {
        next.delete(levelId);
      } else {
        next.add(levelId);
        if (!modules[levelId]) loadModulesForLevel(levelId);
      }
      return next;
    });
  };

  // Level form handlers
  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({
      ...EMPTY_LEVEL_FORM,
      programId: programId ?? (programs.length === 1 ? programs[0].id : ""),
    });
    setLevelFormError(null);
    setLevelFormOpen(true);
  };

  const openEditLevel = (level: LevelDto) => {
    setEditingLevel(level);
    setLevelForm({
      programId: level.programId,
      code: level.code,
      name: level.name,
      order: level.order,
      description: level.description ?? "",
      isActive: level.isActive,
    });
    setLevelFormError(null);
    setLevelFormOpen(true);
  };

  const saveLevelForm = async () => {
    if (!levelForm.programId.trim()) {
      setLevelFormError("Vui lòng chọn chương trình");
      return;
    }
    if (!levelForm.code.trim()) {
      setLevelFormError("Vui lòng nhập mã Level");
      return;
    }
    if (!levelForm.name.trim()) {
      setLevelFormError("Vui lòng nhập tên Level");
      return;
    }
    setLevelFormSaving(true);
    setLevelFormError(null);
    let res;
    if (editingLevel) {
      const updateBody: UpdateLevelRequest = {
        code: levelForm.code,
        name: levelForm.name,
        order: levelForm.order,
        description: levelForm.description,
        isActive: levelForm.isActive,
      };
      res = await updateLevel(editingLevel.id, updateBody);
    } else {
      res = await createLevel(levelForm);
    }
    if (res.isSuccess) {
      setLevelFormOpen(false);
      loadLevels();
    } else {
      setLevelFormError(res.message ?? "Lưu thất bại");
    }
    setLevelFormSaving(false);
  };

  // Module form handlers
  const openCreateModule = (levelId: string) => {
    setEditingModule(null);
    setModuleFormLevelId(levelId);
    setModuleForm({ ...EMPTY_MODULE_FORM });
    setModuleFormError(null);
    setModuleFormOpen(true);
  };

  const openEditModule = (mod: ModuleDto) => {
    setEditingModule(mod);
    setModuleFormLevelId(mod.levelId);
    setModuleForm({
      code: mod.code,
      name: mod.name,
      order: mod.order,
      description: mod.description ?? "",
      plannedSessionCount: mod.plannedSessionCount ?? 6,
      isActive: mod.isActive,
      type: mod.type ?? "core",
    });
    setModuleFormError(null);
    setModuleFormOpen(true);
  };

  const saveModuleForm = async () => {
    if (!moduleForm.code.trim()) {
      setModuleFormError("Vui lòng nhập mã Module");
      return;
    }
    if (!moduleForm.name.trim()) {
      setModuleFormError("Vui lòng nhập tên Module");
      return;
    }
    setModuleFormSaving(true);
    setModuleFormError(null);
    let res;
    if (editingModule) {
      const updateBody: UpdateModuleRequest = { ...moduleForm };
      res = await updateModule(editingModule.id, updateBody);
    } else {
      res = await createModule({ levelId: moduleFormLevelId, ...moduleForm });
    }
    if (res.isSuccess) {
      setModuleFormOpen(false);
      loadModulesForLevel(moduleFormLevelId);
    } else {
      setModuleFormError(res.message ?? "Lưu thất bại");
    }
    setModuleFormSaving(false);
  };

  const totalModules = Object.values(modules).flat().length;
  const activeLevels = filteredLevels.filter((l) => l.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="space-y-6 ">
        {/* Header */}
        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Layers className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Cấu trúc học thuật
                </h1>
                <p className="text-sm text-gray-500">
                  Quản lý Level và Module chương trình
                </p>
              </div>
            </div>
            {roleMode === "admin" && (
              <button
                onClick={openCreateLevel}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Thêm Level
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards - Updated with better styling */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 - Tổng số Level */}
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-red-600 p-2.5 transition-all duration-300 group-hover:bg-blue-100">
                <Layers size={18} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {filteredLevels.length}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Tổng số Level
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {activeLevels} đang hoạt động
            </p>
          </div>

          {/* Card 2 - Tổng số Module */}
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-purple-600 p-2.5 transition-all duration-300 group-hover:bg-purple-100">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {totalModules}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Tổng số Module
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Phân bố theo các Level
            </p>
          </div>

          {/* Card 3 - Level đang hoạt động */}
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-emerald-600 p-2.5 transition-all duration-300 group-hover:bg-emerald-100">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {activeLevels}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Level đang hoạt động
            </p>
            <p className="mt-0.5 text-xs text-gray-400">Sẵn sàng sử dụng</p>
          </div>

          {/* Card 4 - Core Modules */}
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-102">
            <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10 blur-xl bg-gradient-to-r from-red-600 to-red-700"></div>
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-amber-500 p-2.5 transition-all duration-300 group-hover:bg-orange-100">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {
                  Object.values(modules)
                    .flat()
                    .filter((m) => m.type === "core").length
                }
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Core Modules
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Module chính trong chương trình
            </p>
          </div>
        </div>

        {/* Search and quick filters */}
        <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Chương trình
            </label>
            <Select
              value={selectedProgramFilter}
              onValueChange={setSelectedProgramFilter}
              disabled={Boolean(programId)}
              searchPlaceholder="Tìm chương trình..."
              emptyText="Không có chương trình"
            >
              <SelectTrigger
                disabled={Boolean(programId)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              >
                <SelectValue placeholder="Tất cả chương trình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chương trình</SelectItem>
                {programFilterOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
              placeholder="Tìm kiếm Level theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Levels List */}
        {loadingLevels ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-200 blur-xl opacity-50 animate-pulse" />
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent relative" />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Đang tải danh sách Level...
            </p>
          </div>
        ) : filteredLevels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <FolderTree size={32} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {levels.length === 0
                ? "Chưa có Level nào"
                : "Không có Level nào khớp bộ lọc"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {levels.length === 0
                ? "Hãy thêm Level đầu tiên để bắt đầu"
                : "Hãy thử đổi chương trình hoặc từ khóa tìm kiếm"}
            </p>
            {roleMode === "admin" && (
              <button
                onClick={openCreateLevel}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Thêm Level
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedLevels.map((group) => (
              <section key={group.programId || group.programName} className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white px-4 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <Layers size={14} className="text-red-500" />
                    <span>{group.programName}</span>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 border border-red-100">
                    {group.levels.length} level
                  </span>
                </div>

                <div className="space-y-3">
                  {group.levels.map((level) => (
                    <LevelCard
                      key={level.id}
                      level={level}
                      programName={getProgramName(level)}
                      isExpanded={expandedLevels.has(level.id)}
                      modules={modules[level.id] || []}
                      isLoadingModules={loadingModules[level.id] || false}
                      roleMode={roleMode}
                      onToggle={() => toggleLevel(level.id)}
                      onEditLevel={() => openEditLevel(level)}
                      onAddModule={() => openCreateModule(level.id)}
                      onEditModule={(mod) => openEditModule(mod)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Level Form Modal */}
      {levelFormOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLevelFormOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                    <Layers size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingLevel ? "Cập nhật Level" : "Thêm Level mới"}
                    </h2>
                    <p className="text-sm text-red-100">
                      Điền thông tin chi tiết bên dưới
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLevelFormOpen(false)}
                  className="rounded-full p-2 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              {!programId && (
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                    <div className="rounded-md bg-red-50 p-1.5">
                      <FolderTree size={14} className="text-red-600" />
                    </div>
                    Chương trình <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={levelForm.programId}
                    onValueChange={(value) =>
                      setLevelForm((p) => ({ ...p, programId: value }))
                    }
                  >
                    <SelectTrigger className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100">
                      <SelectValue placeholder="-- Chọn chương trình --" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((prog) => (
                        <SelectItem key={prog.id} value={prog.id}>
                          {prog.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                  <div className="rounded-md bg-red-50 p-1.5">
                    <Layers size={14} className="text-red-600" />
                  </div>
                  Tên Level <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                  placeholder="Ví dụ: Starters, Movers, Flyers"
                  value={levelForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name
                      .trim()
                      .toUpperCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^A-Z0-9_]/g, "");
                    setLevelForm((p) => ({ ...p, name, code: autoCode }));
                  }}
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                  <div className="rounded-md bg-red-50 p-1.5">
                    <Grid3X3 size={14} className="text-red-600" />
                  </div>
                  Mã Level <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="STARTERS"
                  value={levelForm.code}
                  onChange={(e) =>
                    setLevelForm((p) => ({
                      ...p,
                      code: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, ""),
                    }))
                  }
                />
                <p className="mt-1 text-xs text-gray-400">
                  Mã tự động sinh từ tên, có thể chỉnh sửa
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                    <div className="rounded-md bg-red-50 p-1.5">
                      <TrendingUp size={14} className="text-red-600" />
                    </div>
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                    value={levelForm.order}
                    onChange={(e) =>
                      setLevelForm((p) => ({
                        ...p,
                        order: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={levelForm.isActive}
                      onChange={(e) =>
                        setLevelForm((p) => ({
                          ...p,
                          isActive: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span>Đang hoạt động</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                  <div className="rounded-md bg-red-50 p-1.5">
                    <BookOpen size={14} className="text-red-600" />
                  </div>
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Mô tả chi tiết về Level này..."
                  value={levelForm.description ?? ""}
                  onChange={(e) =>
                    setLevelForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>

              {levelFormError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {levelFormError}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50/50 p-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setLevelFormOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={saveLevelForm}
                  disabled={levelFormSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {levelFormSaving && <LoaderIcon className="animate-spin" />}
                  {levelFormSaving ? "Đang lưu..." : "Lưu Level"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {moduleFormOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setModuleFormOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingModule ? "Cập nhật Module" : "Thêm Module mới"}
                    </h2>
                    <p className="text-sm text-red-100">
                      Điền thông tin module bên dưới
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModuleFormOpen(false)}
                  className="rounded-full p-2 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                  <div className="rounded-md bg-red-50 p-1.5">
                    <BookOpen size={14} className="text-red-600" />
                  </div>
                  Tên Module <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                  placeholder="Ví dụ: Alphabet, Numbers, Grammar"
                  value={moduleForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const levelCode =
                      levels.find((l) => l.id === moduleFormLevelId)?.code ??
                      "";
                    const suffix = name
                      .trim()
                      .toUpperCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^A-Z0-9_]/g, "");
                    const autoCode = levelCode
                      ? `${levelCode}_${suffix}`
                      : suffix;
                    setModuleForm((p) => ({ ...p, name, code: autoCode }));
                  }}
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                  <div className="rounded-md bg-red-50 p-1.5">
                    <Grid3X3 size={14} className="text-red-600" />
                  </div>
                  Mã Module <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="STARTERS_M1"
                  value={moduleForm.code}
                  onChange={(e) =>
                    setModuleForm((p) => ({
                      ...p,
                      code: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, ""),
                    }))
                  }
                />
                <p className="mt-1 text-sm text-gray-400">
                  Mã tự động sinh từ Level và tên Module
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                    <div className="rounded-md bg-red-50 p-1.5">
                      <Target size={14} className="text-red-600" />
                    </div>
                    Loại Module
                  </label>
                  <Select
                    value={moduleForm.type ?? "core"}
                    onValueChange={(value) =>
                      setModuleForm((p) => ({
                        ...p,
                        type: value as ModuleType,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core"> Core - Module chính</SelectItem>
                      <SelectItem value="revision">
                        Revision - Ôn tập
                      </SelectItem>
                      <SelectItem value="test"> Test - Kiểm tra</SelectItem>
                      <SelectItem value="placement">
                        Placement - Xếp lớp
                      </SelectItem>
                      <SelectItem value="trial"> Trial - Thử nghiệm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                    <div className="rounded-md bg-red-50 p-1.5">
                      <TrendingUp size={14} className="text-red-600" />
                    </div>
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                    value={moduleForm.order}
                    onChange={(e) =>
                      setModuleForm((p) => ({
                        ...p,
                        order: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                    <div className="rounded-md bg-red-50 p-1.5">
                      <Clock size={14} className="text-red-600" />
                    </div>
                    Số buổi kế hoạch
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                    value={moduleForm.plannedSessionCount ?? 6}
                    onChange={(e) =>
                      setModuleForm((p) => ({
                        ...p,
                        plannedSessionCount: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moduleForm.isActive}
                      onChange={(e) =>
                        setModuleForm((p) => ({
                          ...p,
                          isActive: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span>Đang hoạt động</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700  tracking-wide">
                  <div className="rounded-md bg-red-50 p-1.5">
                    <BookOpen size={14} className="text-red-600" />
                  </div>
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Mô tả chi tiết về Module này..."
                  value={moduleForm.description ?? ""}
                  onChange={(e) =>
                    setModuleForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {moduleFormError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {moduleFormError}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50/50 p-6">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setModuleFormOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={saveModuleForm}
                  disabled={moduleFormSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {moduleFormSaving && <LoaderIcon className="animate-spin" />}
                  {moduleFormSaving ? "Đang lưu..." : "Lưu Module"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

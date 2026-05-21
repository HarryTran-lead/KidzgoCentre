"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Layers, Pencil, Plus, Search, X } from "lucide-react";
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

interface ProgramOption { id: string; name: string; }

export default function LevelModuleWorkspace({ roleMode, programId }: Props) {
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [modules, setModules] = useState<Record<string, ModuleDto[]>>({});
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingModules, setLoadingModules] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  useEffect(() => {
    get<any>(ADMIN_ENDPOINTS.PROGRAMS_ACTIVE).then((res) => {
      // Response shape: { isSuccess, data: { programs: { items: [] } } } or { data: { items: [] } }
      const raw = res?.data;
      const list: ProgramOption[] =
        raw?.programs?.items ??
        raw?.items ??
        raw?.programs ??
        (Array.isArray(raw) ? raw : []);
      setPrograms(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  // Level form state
  const [levelFormOpen, setLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelDto | null>(null);
  const [levelForm, setLevelForm] = useState<CreateLevelRequest>(EMPTY_LEVEL_FORM);
  const [levelFormSaving, setLevelFormSaving] = useState(false);
  const [levelFormError, setLevelFormError] = useState<string | null>(null);

  // Module form state
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [moduleFormLevelId, setModuleFormLevelId] = useState<string>("");
  const [editingModule, setEditingModule] = useState<ModuleDto | null>(null);
  const [moduleForm, setModuleForm] = useState<Omit<CreateModuleRequest, "levelId">>(EMPTY_MODULE_FORM);
  const [moduleFormSaving, setModuleFormSaving] = useState(false);
  const [moduleFormError, setModuleFormError] = useState<string | null>(null);

  const loadLevels = useCallback(async () => {
    setLoadingLevels(true);
    setError(null);
    const res = await getLevels({ programId, searchTerm: searchTerm || undefined });
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

  // ─── Level form handlers ────────────────────────────────────────────────────
  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({ ...EMPTY_LEVEL_FORM, programId: programId ?? (programs.length === 1 ? programs[0].id : "") });
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
    if (!levelForm.programId.trim()) { setLevelFormError("Vui lòng chọn chương trình"); return; }
    if (!levelForm.code.trim()) { setLevelFormError("Vui lòng nhập mã Level"); return; }
    if (!levelForm.name.trim()) { setLevelFormError("Vui lòng nhập tên Level"); return; }
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

  // ─── Module form handlers ───────────────────────────────────────────────────
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
    if (!moduleForm.code.trim()) { setModuleFormError("Vui lòng nhập mã Module"); return; }
    if (!moduleForm.name.trim()) { setModuleFormError("Vui lòng nhập tên Module"); return; }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-white p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-red-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Layers className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Cấu trúc học thuật</h1>
                <p className="text-sm text-gray-500">Quản lý Level và Module chương trình</p>
              </div>
            </div>
            {roleMode === "admin" && (
              <button
                onClick={openCreateLevel}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
                Thêm Level
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-red-400 focus:outline-none"
            placeholder="Tìm kiếm Level..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Levels list */}
        {loadingLevels ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <span className="ml-2 text-sm">Đang tải...</span>
          </div>
        ) : levels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen className="mb-3 h-10 w-10" />
            <p className="text-sm">Chưa có Level nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {levels.map((level) => (
              <div key={level.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Level row */}
                <div
                  className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-gray-50"
                  onClick={() => toggleLevel(level.id)}
                >
                  <div className="text-gray-400">
                    {expandedLevels.has(level.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        {level.code}
                      </span>
                      <span className="font-semibold text-gray-800">{level.name}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${level.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {level.isActive ? "Đang hoạt động" : "Tạm dừng"}
                      </span>
                    </div>
                    {level.description && (
                      <p className="mt-0.5 text-xs text-gray-500">{level.description}</p>
                    )}
                  </div>
                  {roleMode === "admin" && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditLevel(level); }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openCreateModule(level.id); }}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Modules */}
                {expandedLevels.has(level.id) && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3">
                    {loadingModules[level.id] ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                        <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                        Đang tải modules...
                      </div>
                    ) : !modules[level.id] || modules[level.id].length === 0 ? (
                      <p className="py-2 text-xs text-gray-400">Chưa có module nào</p>
                    ) : (
                      <div className="space-y-2">
                        {modules[level.id].map((mod) => (
                          <div
                            key={mod.id}
                            className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm"
                          >
                            <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-600">
                                  {mod.code}
                                </span>
                                <span className="text-sm font-medium text-gray-700">{mod.name}</span>
                              {mod.plannedSessionCount && (
                                  <span className="text-xs text-gray-400">
                                    · {mod.plannedSessionCount} buổi
                                  </span>
                                )}
                                {mod.type && (
                                  <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                                    mod.type === 'core' ? 'bg-blue-50 text-blue-600' :
                                    mod.type === 'revision' ? 'bg-yellow-50 text-yellow-700' :
                                    mod.type === 'test' ? 'bg-red-50 text-red-600' :
                                    mod.type === 'placement' ? 'bg-purple-50 text-purple-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {mod.type}
                                  </span>
                                )}
                                <span className={`ml-auto text-xs ${mod.isActive ? "text-green-600" : "text-gray-400"}`}>
                                  {mod.isActive ? "Hoạt động" : "Tạm dừng"}
                                </span>
                              </div>
                              {mod.description && (
                                <p className="mt-0.5 text-xs text-gray-400">{mod.description}</p>
                              )}
                            </div>
                            {roleMode === "admin" && (
                              <button
                                onClick={() => openEditModule(mod)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Level Form Modal */}
      {levelFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                {editingLevel ? "Cập nhật Level" : "Thêm Level mới"}
              </h2>
              <button onClick={() => setLevelFormOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {/* Program selector — ẩn nếu đã truyền programId từ props */}
              {!programId && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Chương trình *</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                    value={levelForm.programId}
                    onChange={(e) => setLevelForm((p) => ({ ...p, programId: e.target.value }))}
                  >
                    <option value="">-- Chọn chương trình --</option>
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.id}>{prog.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tên Level *</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  placeholder="Starters"
                  value={levelForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
                    setLevelForm((p) => ({ ...p, name, code: autoCode }));
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Mã Level *
                  <span className="ml-1 font-normal text-gray-400">(tự sinh — có thể sửa)</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-red-400 focus:outline-none"
                  placeholder="STARTERS"
                  value={levelForm.code}
                  onChange={(e) => setLevelForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Thứ tự</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  value={levelForm.order}
                  onChange={(e) => setLevelForm((p) => ({ ...p, order: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mô tả</label>
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  value={levelForm.description ?? ""}
                  onChange={(e) => setLevelForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={levelForm.isActive}
                  onChange={(e) => setLevelForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                Đang hoạt động
              </label>
            </div>
            {levelFormError && (
              <p className="mt-3 text-xs text-red-500">{levelFormError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setLevelFormOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={saveLevelForm}
                disabled={levelFormSaving}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {levelFormSaving && <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {moduleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                {editingModule ? "Cập nhật Module" : "Thêm Module mới"}
              </h2>
              <button onClick={() => setModuleFormOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tên Module *</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  placeholder="Alphabet"
                  value={moduleForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const levelCode = levels.find((l) => l.id === moduleFormLevelId)?.code ?? "";
                    const suffix = name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
                    const autoCode = levelCode ? `${levelCode}_${suffix}` : suffix;
                    setModuleForm((p) => ({ ...p, name, code: autoCode }));
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Mã Module *
                  <span className="ml-1 font-normal text-gray-400">(tự sinh — có thể sửa)</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-red-400 focus:outline-none"
                  placeholder="STARTERS_M1"
                  value={moduleForm.code}
                  onChange={(e) => setModuleForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Loại Module</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                    value={moduleForm.type ?? "core"}
                    onChange={(e) => setModuleForm((p) => ({ ...p, type: e.target.value as ModuleType }))}
                  >
                    <option value="core">Core</option>
                    <option value="revision">Revision</option>
                    <option value="test">Test</option>
                    <option value="placement">Placement</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Thứ tự</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                    value={moduleForm.order}
                    onChange={(e) => setModuleForm((p) => ({ ...p, order: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Số buổi kế hoạch</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  value={moduleForm.plannedSessionCount ?? 6}
                  onChange={(e) => setModuleForm((p) => ({ ...p, plannedSessionCount: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mô tả</label>
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  value={moduleForm.description ?? ""}
                  onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={moduleForm.isActive}
                  onChange={(e) => setModuleForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                Đang hoạt động
              </label>
            </div>
            {moduleFormError && (
              <p className="mt-3 text-xs text-red-500">{moduleFormError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModuleFormOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={saveModuleForm}
                disabled={moduleFormSaving}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {moduleFormSaving && <div className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

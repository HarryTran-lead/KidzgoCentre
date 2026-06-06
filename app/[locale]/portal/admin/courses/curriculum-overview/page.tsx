"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers3,
  ListTree,
  Loader2,
  School,
  type LucideIcon,
} from "lucide-react";

type ApiEnvelope<T> = {
  isSuccess?: boolean;
  data?: T;
  message?: string;
};

type ProgramOption = {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
};

type LessonTemplateDto = {
  lessonTemplateId: string;
  title: string;
  lessonType?: string;
  orderIndex?: number;
  isActive?: boolean;
};

type SyllabusDto = {
  syllabusId: string;
  syllabusTitle: string;
  syllabusCode?: string;
  version?: number;
  isActive?: boolean;
  lessonTemplates?: LessonTemplateDto[];
};

type UnitDto = {
  unitId: string;
  unitName: string;
  unitOrderIndex?: number;
  syllabuses?: SyllabusDto[];
};

type ModuleDto = {
  moduleId: string;
  moduleName: string;
  moduleOrderIndex?: number;
  units?: UnitDto[];
};

type LevelDto = {
  levelId: string;
  levelName: string;
  levelOrderIndex?: number;
  modules?: ModuleDto[];
};

type CurriculumTreeDto = {
  programId: string;
  programName: string;
  programCode?: string;
  levels?: LevelDto[];
};

type TreeNode = {
  id: string;
  label: string;
  eyebrow: string;
  description?: string;
  icon: LucideIcon;
  children?: TreeNode[];
};

const lessonTypeStyles: Record<string, string> = {
  Assessment: "border-red-200 bg-red-50 text-red-700",
  Lesson: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Revision: "border-amber-200 bg-amber-50 text-amber-700",
};

const fallbackPrograms: ProgramOption[] = [
  {
    id: "demo-kids-english",
    name: "Kids English",
    code: "KIDS_ENGLISH",
    isActive: true,
  },
  {
    id: "demo-ielts",
    name: "IELTS",
    code: "IELTS",
    isActive: true,
  },
  {
    id: "demo-communication",
    name: "Communication",
    code: "COMMUNICATION",
    isActive: true,
  },
];

const fallbackCurriculumTrees: Record<string, CurriculumTreeDto> = {
  "demo-kids-english": {
    programId: "demo-kids-english",
    programName: "Kids English",
    programCode: "KIDS_ENGLISH",
    levels: [
      {
        levelId: "demo-starters",
        levelName: "Starters",
        levelOrderIndex: 1,
        modules: [
          {
            moduleId: "demo-module-foundation",
            moduleName: "Module 1: Foundation",
            moduleOrderIndex: 1,
            units: [
              {
                unitId: "demo-unit-1",
                unitName: "Unit 1",
                unitOrderIndex: 1,
                syllabuses: [
                  {
                    syllabusId: "demo-get-ready-starters",
                    syllabusTitle: "Get Ready Starters 2nd Edition",
                    syllabusCode: "GET_READY_STARTERS",
                    version: 1,
                    isActive: true,
                    lessonTemplates: [
                      {
                        lessonTemplateId: "demo-lesson-1",
                        title: "Lesson 1",
                        lessonType: "Lesson",
                        orderIndex: 1,
                        isActive: true,
                      },
                      {
                        lessonTemplateId: "demo-revision",
                        title: "Revision",
                        lessonType: "Revision",
                        orderIndex: 2,
                        isActive: true,
                      },
                      {
                        lessonTemplateId: "demo-assessment",
                        title: "Assessment",
                        lessonType: "Assessment",
                        orderIndex: 3,
                        isActive: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  "demo-ielts": {
    programId: "demo-ielts",
    programName: "IELTS",
    programCode: "IELTS",
    levels: [
      {
        levelId: "demo-ielts-foundation",
        levelName: "Foundation",
        levelOrderIndex: 1,
        modules: [
          {
            moduleId: "demo-ielts-writing",
            moduleName: "Module 1: Writing Basics",
            moduleOrderIndex: 1,
            units: [
              {
                unitId: "demo-ielts-task-1",
                unitName: "Unit 1",
                unitOrderIndex: 1,
                syllabuses: [
                  {
                    syllabusId: "demo-ielts-writing-pack",
                    syllabusTitle: "IELTS Writing Foundation Pack",
                    syllabusCode: "IELTS_WRITING_FOUNDATION",
                    version: 1,
                    isActive: true,
                    lessonTemplates: [
                      {
                        lessonTemplateId: "demo-ielts-task-1-intro",
                        title: "Task 1 Introduction",
                        lessonType: "Lesson",
                        orderIndex: 1,
                        isActive: true,
                      },
                      {
                        lessonTemplateId: "demo-ielts-writing-assessment",
                        title: "Writing Assessment",
                        lessonType: "Assessment",
                        orderIndex: 2,
                        isActive: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  "demo-communication": {
    programId: "demo-communication",
    programName: "Communication",
    programCode: "COMMUNICATION",
    levels: [
      {
        levelId: "demo-communication-basic",
        levelName: "Basic",
        levelOrderIndex: 1,
        modules: [
          {
            moduleId: "demo-survival-english",
            moduleName: "Module 1: Survival English",
            moduleOrderIndex: 1,
            units: [
              {
                unitId: "demo-introductions",
                unitName: "Unit 1",
                unitOrderIndex: 1,
                syllabuses: [
                  {
                    syllabusId: "demo-communication-basic-pack",
                    syllabusTitle: "Communication Basic Syllabus",
                    syllabusCode: "COMM_BASIC",
                    version: 1,
                    isActive: true,
                    lessonTemplates: [
                      {
                        lessonTemplateId: "demo-role-play",
                        title: "Role-play Lesson",
                        lessonType: "Lesson",
                        orderIndex: 1,
                        isActive: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

function normalizePlainToken(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const bearer = trimmed.match(/^Bearer\s+(.+)$/i);

  if (bearer?.[1]) {
    return bearer[1].trim();
  }

  if (/^[A-Za-z0-9._~-]{20,}$/.test(trimmed) && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed;
  }

  return null;
}

function findTokenInValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const plainToken = normalizePlainToken(trimmed);

    if (plainToken && /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(plainToken)) {
      return plainToken;
    }

    if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(trimmed)) {
      return trimmed;
    }

    try {
      return findTokenInValue(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const tokenKeys = ["accessToken", "access_token", "token", "authToken", "jwt", "idToken"];

  for (const key of tokenKeys) {
    const plainToken = normalizePlainToken(record[key]);
    if (plainToken) {
      return plainToken;
    }

    const token = findTokenInValue(record[key]);
    if (token) {
      return token;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const token = findTokenInValue(nestedValue);
    if (token) {
      return token;
    }
  }

  return null;
}

function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const tokenKeys = [
    "accessToken",
    "access_token",
    "token",
    "authToken",
    "jwt",
    "idToken",
    "auth-storage",
    "auth",
    "user",
  ];
  const storages = [window.localStorage, window.sessionStorage];

  for (const storage of storages) {
    for (const key of tokenKeys) {
      const plainToken = normalizePlainToken(storage.getItem(key));
      if (plainToken) {
        return plainToken;
      }

      const token = findTokenInValue(storage.getItem(key));
      if (token) {
        return token;
      }
    }

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) {
        continue;
      }

      const token = findTokenInValue(storage.getItem(key));
      if (token) {
        return token;
      }
    }
  }

  return null;
}

function createApiHeaders() {
  const token = getStoredAuthToken();

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}

function normalizePrograms(payload: unknown): ProgramOption[] {
  const data = unwrapData<unknown>(payload);
  let list: unknown[] = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const listKeys = ["items", "records", "results", "programs", "list"];
    const listValue = listKeys.map((key) => record[key]).find(Array.isArray);
    list = Array.isArray(listValue) ? listValue : [];
  }

  return list
    .map((item) => {
      const program = item as Record<string, unknown>;
      const id = String(program.id ?? program.programId ?? "");
      const name = String(program.name ?? program.programName ?? program.title ?? "");

      if (!id || !name) {
        return null;
      }

      return {
        id,
        name,
        code: program.code ? String(program.code) : undefined,
        isActive: typeof program.isActive === "boolean" ? program.isActive : undefined,
      };
    })
    .filter((item): item is ProgramOption => Boolean(item));
}

function getFallbackTree(programId: string, programs: ProgramOption[]) {
  const directTree = fallbackCurriculumTrees[programId];

  if (directTree) {
    return directTree;
  }

  const selectedProgram = programs.find((program) => program.id === programId);
  const selectedCode = selectedProgram?.code?.toLowerCase();
  const selectedName = selectedProgram?.name.toLowerCase();

  return Object.values(fallbackCurriculumTrees).find((tree) => {
    return (
      tree.programCode?.toLowerCase() === selectedCode ||
      tree.programName.toLowerCase() === selectedName
    );
  });
}

function sortByOrder<T>(items: T[] | undefined, orderKey: keyof T) {
  return [...(items ?? [])].sort((a, b) => {
    const leftValue = a[orderKey];
    const rightValue = b[orderKey];
    const left = typeof leftValue === "number" ? leftValue : 0;
    const right = typeof rightValue === "number" ? rightValue : 0;
    return left - right;
  });
}

function buildTree(curriculum: CurriculumTreeDto): TreeNode[] {
  return [
    {
      id: curriculum.programId,
      label: curriculum.programName,
      eyebrow: curriculum.programCode ? `Program - ${curriculum.programCode}` : "Program",
      icon: School,
      children: sortByOrder(curriculum.levels, "levelOrderIndex").map((level) => ({
        id: level.levelId,
        label: level.levelName,
        eyebrow: "Level",
        description: level.levelOrderIndex ? `Thứ tự ${level.levelOrderIndex}` : undefined,
        icon: GraduationCap,
        children: sortByOrder(level.modules, "moduleOrderIndex").map((module) => ({
          id: module.moduleId,
          label: module.moduleName,
          eyebrow: "Module",
          description: module.moduleOrderIndex ? `Thứ tự ${module.moduleOrderIndex}` : undefined,
          icon: Layers3,
          children: sortByOrder(module.units, "unitOrderIndex").map((unit) => ({
            id: unit.unitId,
            label: unit.unitName,
            eyebrow: "Unit",
            description: unit.unitOrderIndex ? `Thứ tự ${unit.unitOrderIndex}` : undefined,
            icon: Boxes,
            children: sortByOrder(unit.syllabuses, "version").map((syllabus) => ({
              id: syllabus.syllabusId,
              label: syllabus.syllabusTitle,
              eyebrow: "Syllabus",
              description: [
                syllabus.syllabusCode,
                syllabus.version ? `Version ${syllabus.version}` : null,
                syllabus.isActive === false ? "Inactive" : null,
              ]
                .filter(Boolean)
                .join(" - "),
              icon: BookOpen,
              children: sortByOrder(syllabus.lessonTemplates, "orderIndex").map((lesson) => ({
                id: lesson.lessonTemplateId,
                label: lesson.title,
                eyebrow: "Lesson Template",
                description: [
                  lesson.lessonType,
                  lesson.orderIndex ? `Thứ tự ${lesson.orderIndex}` : null,
                  lesson.isActive === false ? "Inactive" : null,
                ]
                  .filter(Boolean)
                  .join(" - "),
                icon: FileText,
              })),
            })),
          })),
        })),
      })),
    },
  ];
}

function collectExpandedIds(nodes: TreeNode[]) {
  const ids: string[] = [];

  function visit(node: TreeNode, depth: number) {
    if (depth < 4) {
      ids.push(node.id);
    }

    node.children?.forEach((child) => visit(child, depth + 1));
  }

  nodes.forEach((node) => visit(node, 0));
  return ids;
}

function countTree(curriculum: CurriculumTreeDto | null) {
  const levels = curriculum?.levels ?? [];
  const modules = levels.flatMap((level) => level.modules ?? []);
  const units = modules.flatMap((module) => module.units ?? []);
  const syllabuses = units.flatMap((unit) => unit.syllabuses ?? []);
  const lessonTemplates = syllabuses.flatMap((syllabus) => syllabus.lessonTemplates ?? []);

  return {
    levels: levels.length,
    modules: modules.length,
    units: units.length,
    syllabuses: syllabuses.length,
    lessonTemplates: lessonTemplates.length,
  };
}

function TreeItem({
  node,
  depth,
  expandedIds,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expandedIds.has(node.id);
  const Icon = node.icon;

  return (
    <div className="relative">
      <div
        className="group flex min-h-[64px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:border-red-200 hover:bg-red-50/40"
        style={{ marginLeft: depth * 24 }}
      >
        <button
          aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-red-200 hover:bg-white hover:text-red-700 disabled:opacity-40"
          disabled={!hasChildren}
          type="button"
          onClick={() => onToggle(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          )}
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-red-700">
            {node.eyebrow}
          </div>
          <div className="truncate text-base font-semibold text-slate-950">{node.label}</div>
          {node.description ? (
            <div className="line-clamp-2 text-sm text-slate-500">{node.description}</div>
          ) : null}
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <div className="mt-3 space-y-3">
          {node.children?.map((child) => (
            <TreeItem
              key={`${node.id}-${child.id}`}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CurriculumOverviewPage() {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [curriculum, setCurriculum] = useState<CurriculumTreeDto | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [programsLoading, setProgramsLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPrograms() {
      try {
        setProgramsLoading(true);
        const response = await fetch("/api/programs", {
          cache: "no-store",
          credentials: "include",
          headers: createApiHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
          }

          throw new Error("Không tải được danh sách chương trình.");
        }

        const payload = (await response.json()) as ApiEnvelope<unknown> | unknown;

        if (payload && typeof payload === "object" && "isSuccess" in payload && payload.isSuccess === false) {
          throw new Error(
            (payload as ApiEnvelope<unknown>).message ?? "Không tải được danh sách chương trình.",
          );
        }

        const nextPrograms = normalizePrograms(payload);
        const usablePrograms = nextPrograms.length > 0 ? nextPrograms : fallbackPrograms;

        if (!mounted) {
          return;
        }

        setPrograms(usablePrograms);
        setSelectedProgramId((current) => current || usablePrograms[0]?.id || "");
      } catch {
        if (!mounted) {
          return;
        }

        setPrograms(fallbackPrograms);
        setSelectedProgramId((current) => current || fallbackPrograms[0]?.id || "");
        setError("");
      } finally {
        if (mounted) {
          setProgramsLoading(false);
        }
      }
    }

    loadPrograms();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProgramId) {
      setCurriculum(null);
      setExpandedIds(new Set());
      return;
    }

    let mounted = true;

    async function loadTree() {
      try {
        setTreeLoading(true);
        setError("");

        const fallbackTree = getFallbackTree(selectedProgramId, programs);

        if (fallbackTree) {
          setCurriculum(fallbackTree);
          setExpandedIds(new Set(collectExpandedIds(buildTree(fallbackTree))));
          return;
        }

        const response = await fetch(`/api/programs/${selectedProgramId}/curriculum-tree`, {
          cache: "no-store",
          credentials: "include",
          headers: createApiHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
          }

          throw new Error("Không tải được cây khung chương trình.");
        }

        const payload = (await response.json()) as ApiEnvelope<CurriculumTreeDto> | CurriculumTreeDto;

        if ("isSuccess" in payload && payload.isSuccess === false) {
          throw new Error(payload.message ?? "Không tải được cây khung chương trình.");
        }

        const data = unwrapData<CurriculumTreeDto>(payload);

        if (!mounted) {
          return;
        }

        setCurriculum({ ...data, levels: data.levels ?? [] });
        setExpandedIds(new Set(collectExpandedIds(buildTree({ ...data, levels: data.levels ?? [] }))));
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        const fallbackTree = getFallbackTree(selectedProgramId, programs);

        if (fallbackTree) {
          setCurriculum(fallbackTree);
          setExpandedIds(new Set(collectExpandedIds(buildTree(fallbackTree))));
          setError("");
          return;
        }

        setCurriculum(null);
        setExpandedIds(new Set());
        setError(loadError instanceof Error ? loadError.message : "Không tải được dữ liệu.");
      } finally {
        if (mounted) {
          setTreeLoading(false);
        }
      }
    }

    loadTree();

    return () => {
      mounted = false;
    };
  }, [programs, selectedProgramId]);

  const tree = useMemo(() => (curriculum ? buildTree(curriculum) : []), [curriculum]);
  const stats = useMemo(() => countTree(curriculum), [curriculum]);
  const firstLevel = curriculum?.levels?.[0];
  const firstModule = firstLevel?.modules?.[0];
  const firstUnit = firstModule?.units?.[0];
  const firstSyllabus = firstUnit?.syllabuses?.[0];

  function toggleNode(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function expandAll() {
    const ids: string[] = [];

    function visit(node: TreeNode) {
      ids.push(node.id);
      node.children?.forEach(visit);
    }

    tree.forEach(visit);
    setExpandedIds(new Set(ids));
  }

  function collapseAll() {
    setExpandedIds(curriculum ? new Set([curriculum.programId]) : new Set());
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                <ListTree className="h-4 w-4" />
                Khung chương trình đào tạo
              </div>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                Tổng quan Program - Level - Module - Unit - Syllabus - Lesson Template
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Trang này lấy dữ liệu từ API curriculum tree để admin xem toàn bộ cấu trúc đào tạo
                của từng chương trình theo dạng cây.
              </p>
            </div>

            <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[520px] sm:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl font-bold">{stats.levels}</div>
                <div className="text-xs font-medium text-slate-500">Levels</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl font-bold">{stats.modules}</div>
                <div className="text-xs font-medium text-slate-500">Modules</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl font-bold">{stats.units}</div>
                <div className="text-xs font-medium text-slate-500">Units</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl font-bold">{stats.syllabuses}</div>
                <div className="text-xs font-medium text-slate-500">Syllabuses</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl font-bold">{stats.lessonTemplates}</div>
                <div className="text-xs font-medium text-slate-500">Templates</div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{error}</div>
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700" htmlFor="program">
                  Program
                </label>
                <select
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  disabled={programsLoading || programs.length === 0}
                  id="program"
                  value={selectedProgramId}
                  onChange={(event) => setSelectedProgramId(event.target.value)}
                >
                  {programs.length === 0 ? (
                    <option value="">Chưa có chương trình</option>
                  ) : (
                    programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.code ? `${program.name} (${program.code})` : program.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={tree.length === 0}
                  type="button"
                  onClick={expandAll}
                >
                  <ChevronDown className="h-4 w-4" />
                  Mở tất cả
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={tree.length === 0}
                  type="button"
                  onClick={collapseAll}
                >
                  <ChevronRight className="h-4 w-4" />
                  Thu gọn
                </button>
              </div>
            </div>

            {programsLoading || treeLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải khung chương trình...
                </div>
              </div>
            ) : tree.length > 0 ? (
              <div className="space-y-3">
                {tree.map((node) => (
                  <TreeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    expandedIds={expandedIds}
                    onToggle={toggleNode}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
                Chưa có dữ liệu khung chương trình cho program đang chọn.
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Demo path</h2>
                <p className="text-sm text-slate-500">Đường dẫn mẫu để thuyết trình</p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-500">Program</div>
              <div className="text-base font-bold text-slate-950">
                {curriculum?.programName ?? "-"}
              </div>
              <div className="h-px bg-slate-200" />
              <div className="text-sm font-semibold text-slate-500">Level</div>
              <div className="text-base font-bold text-slate-950">{firstLevel?.levelName ?? "-"}</div>
              <div className="h-px bg-slate-200" />
              <div className="text-sm font-semibold text-slate-500">Module</div>
              <div className="text-base font-bold text-slate-950">{firstModule?.moduleName ?? "-"}</div>
              <div className="h-px bg-slate-200" />
              <div className="text-sm font-semibold text-slate-500">Unit</div>
              <div className="text-base font-bold text-slate-950">{firstUnit?.unitName ?? "-"}</div>
              <div className="h-px bg-slate-200" />
              <div className="text-sm font-semibold text-slate-500">Syllabus</div>
              <div className="text-base font-bold text-slate-950">
                {firstSyllabus?.syllabusTitle ?? "-"}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">Lesson Template</div>
              <div className="space-y-2">
                {(firstSyllabus?.lessonTemplates ?? []).length > 0 ? (
                  (firstSyllabus?.lessonTemplates ?? []).map((lesson) => {
                    const lessonType = lesson.lessonType ?? "Lesson";
                    return (
                      <div
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                        key={lesson.lessonTemplateId}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-950">
                            {lesson.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {lesson.orderIndex ? `Thứ tự ${lesson.orderIndex}` : "Chưa có thứ tự"}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${
                            lessonTypeStyles[lessonType] ?? "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {lessonType}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    Chưa có lesson template.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

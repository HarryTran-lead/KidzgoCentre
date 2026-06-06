"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers3,
  ListTree,
  Loader2,
  School,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

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

  if (
    /^[A-Za-z0-9._~-]{20,}$/.test(trimmed) &&
    !trimmed.startsWith("{") &&
    !trimmed.startsWith("[")
  ) {
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
  const tokenKeys = [
    "accessToken",
    "access_token",
    "token",
    "authToken",
    "jwt",
    "idToken",
  ];

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

  const programs: ProgramOption[] = [];

  list.forEach((item) => {
    const program = item as Record<string, unknown>;
    const id = String(program.id ?? program.programId ?? "");
    const name = String(
      program.name ?? program.programName ?? program.title ?? "",
    );

    if (!id || !name) {
      return;
    }

    const option: ProgramOption = { id, name };

    if (program.code) {
      option.code = String(program.code);
    }

    if (typeof program.isActive === "boolean") {
      option.isActive = program.isActive;
    }

    programs.push(option);
  });

  return programs;
}

function getFallbackTree(programId: string, programs: ProgramOption[]) {
  const directTree = fallbackCurriculumTrees[programId];

  if (directTree) {
    return directTree;
  }

  const selectedProgram = programs.find((program) => program.id === programId);
  const selectedCode = selectedProgram?.code?.toLowerCase();
  const selectedName = selectedProgram?.name.toLowerCase();
  const selectedText = `${selectedCode ?? ""} ${selectedName ?? ""}`;

  if (selectedText.includes("kid")) {
    return fallbackCurriculumTrees["demo-kids-english"];
  }

  if (selectedText.includes("ielts")) {
    return fallbackCurriculumTrees["demo-ielts"];
  }

  if (
    selectedText.includes("communication") ||
    selectedText.includes("giao tiếp")
  ) {
    return fallbackCurriculumTrees["demo-communication"];
  }

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
      eyebrow: curriculum.programCode
        ? `Program - ${curriculum.programCode}`
        : "Program",
      icon: School,
      children: sortByOrder(curriculum.levels, "levelOrderIndex").map(
        (level) => ({
          id: level.levelId,
          label: level.levelName,
          eyebrow: "Level",
          description: level.levelOrderIndex
            ? `Thứ tự ${level.levelOrderIndex}`
            : undefined,
          icon: GraduationCap,
          children: sortByOrder(level.modules, "moduleOrderIndex").map(
            (module) => ({
              id: module.moduleId,
              label: module.moduleName,
              eyebrow: "Module",
              description: module.moduleOrderIndex
                ? `Thứ tự ${module.moduleOrderIndex}`
                : undefined,
              icon: Layers3,
              children: sortByOrder(module.units, "unitOrderIndex").map(
                (unit) => ({
                  id: unit.unitId,
                  label: unit.unitName,
                  eyebrow: "Unit",
                  description: unit.unitOrderIndex
                    ? `Thứ tự ${unit.unitOrderIndex}`
                    : undefined,
                  icon: Boxes,
                  children: sortByOrder(unit.syllabuses, "version").map(
                    (syllabus) => ({
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
                      children: sortByOrder(
                        syllabus.lessonTemplates,
                        "orderIndex",
                      ).map((lesson) => ({
                        id: lesson.lessonTemplateId,
                        label: lesson.title,
                        eyebrow: "Lesson Template",
                        description: [
                          lesson.lessonType,
                          lesson.orderIndex
                            ? `Thứ tự ${lesson.orderIndex}`
                            : null,
                          lesson.isActive === false ? "Inactive" : null,
                        ]
                          .filter(Boolean)
                          .join(" - "),
                        icon: FileText,
                      })),
                    }),
                  ),
                }),
              ),
            }),
          ),
        }),
      ),
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
  const lessonTemplates = syllabuses.flatMap(
    (syllabus) => syllabus.lessonTemplates ?? [],
  );

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
      {/* Tree connector line */}
      {depth > 0 && (
        <>
          {/* Vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-red-300 to-transparent" style={{ left: depth * 24 - 12 }} />
          {/* Horizontal connector */}
          <div className="absolute top-7 h-px bg-red-200" style={{ left: depth * 24 - 12, width: 12 }} />
        </>
      )}
      
      <div
        className="group relative flex min-h-14 items-center cursor-pointer gap-3 rounded-xl border border-red-100 bg-gradient-to-r from-red-50/40 to-slate-50 px-4 py-3 shadow-sm transition-all duration-500 hover:border-red-300 hover:bg-gradient-to-r hover:from-red-50/60 hover:to-white hover:shadow-lg hover:scale-102 hover:-translate-y-1"
        style={{ marginLeft: depth * 24 }}
        onClick={() => onToggle(node.id)}
      >
        {/* Left accent bar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-linear-to-b from-red-400 to-red-600 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {/* Toggle Button */}
        <button
          aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
          className="flex h-8 w-8 shrink-0 items-center cursor-pointer justify-center rounded-md border border-slate-300 bg-slate-100 text-slate-600 transition-all duration-200 hover:border-red-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 disabled:cursor-default"
          disabled={!hasChildren}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-300" />
            )
          ) : (
            <span className="h-2 w-2 rounded-full bg-slate-400" />
          )}
        </button>

        {/* Icon Box with gradient */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-red-600 bg-gradient-to-br from-red-50 to-red-100 text-red-600 shadow-md transition-all duration-500 group-hover:shadow-lg group-hover:scale-110 group-hover:-rotate-6">
          <Icon className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-widest text-red-600 group-hover:text-red-700 transition-colors duration-300">
            {node.eyebrow}
          </div>
          <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-red-700 transition-colors duration-300">
            {node.label}
          </div>
          {node.description ? (
            <div className="line-clamp-1 text-xs text-slate-500 group-hover:text-slate-600 transition-colors duration-300">
              {node.description}
            </div>
          ) : null}
        </div>

        {/* Right accent on hover */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="h-1 w-1 rounded-full bg-red-400 transition-all duration-500 group-hover:scale-125" />
          <div className="h-1 w-1 rounded-full bg-red-500 transition-all duration-500 group-hover:scale-125" />
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 transition-opacity duration-500 group-hover:opacity-5`}
      />

      {/* Animated blur effect */}
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-r ${color} opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-20 group-hover:scale-150`}
      />

      <div className="relative flex items-center justify-between gap-3">
        <div
          className={`transform rounded-xl bg-gradient-to-r ${color} p-2 text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <div className="text-sm font-medium text-gray-600 truncate">
            {label}
          </div>
          <div className="text-2xl font-bold text-gray-900 leading-tight transition-all duration-300 group-hover:scale-105 origin-right">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CurriculumOverviewPage() {
  const initialFallbackProgramId = fallbackPrograms[0]!.id;
  const initialFallbackTree =
    fallbackCurriculumTrees[initialFallbackProgramId]!;
  const [programs, setPrograms] = useState<ProgramOption[]>(fallbackPrograms);
  const [selectedProgramId, setSelectedProgramId] = useState(
    initialFallbackProgramId,
  );
  const [curriculum, setCurriculum] = useState<CurriculumTreeDto | null>(
    initialFallbackTree,
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(collectExpandedIds(buildTree(initialFallbackTree))),
  );
  const [programsLoading, setProgramsLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
            throw new Error(
              "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
            );
          }

          throw new Error("Không tải được danh sách chương trình.");
        }

        const payload = (await response.json()) as
          | ApiEnvelope<unknown>
          | unknown;

        if (
          payload &&
          typeof payload === "object" &&
          "isSuccess" in payload &&
          payload.isSuccess === false
        ) {
          throw new Error(
            (payload as ApiEnvelope<unknown>).message ??
              "Không tải được danh sách chương trình.",
          );
        }

        const nextPrograms = normalizePrograms(payload);
        const usablePrograms =
          nextPrograms.length > 0 ? nextPrograms : fallbackPrograms;

        if (!mounted) {
          return;
        }

        setPrograms(usablePrograms);
        setSelectedProgramId(
          (current) => current || usablePrograms[0]?.id || "",
        );
      } catch {
        if (!mounted) {
          return;
        }

        setPrograms(fallbackPrograms);
        setSelectedProgramId(
          (current) => current || fallbackPrograms[0]?.id || "",
        );
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

        const response = await fetch(
          `/api/programs/${selectedProgramId}/curriculum-tree`,
          {
            cache: "no-store",
            credentials: "include",
            headers: createApiHeaders(),
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
            );
          }

          throw new Error("Không tải được cây khung chương trình.");
        }

        const payload = (await response.json()) as
          | ApiEnvelope<CurriculumTreeDto>
          | CurriculumTreeDto;

        if ("isSuccess" in payload && payload.isSuccess === false) {
          throw new Error(
            payload.message ?? "Không tải được cây khung chương trình.",
          );
        }

        const data = unwrapData<CurriculumTreeDto>(payload);

        if (!mounted) {
          return;
        }

        setCurriculum({ ...data, levels: data.levels ?? [] });
        setExpandedIds(
          new Set(
            collectExpandedIds(
              buildTree({ ...data, levels: data.levels ?? [] }),
            ),
          ),
        );
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
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không tải được dữ liệu.",
        );
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

  // Set page loaded state for animations
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const tree = useMemo(
    () => (curriculum ? buildTree(curriculum) : []),
    [curriculum],
  );
  const stats = useMemo(() => countTree(curriculum), [curriculum]);

  // Filter tree nodes based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return tree;

    const searchLower = searchTerm.toLowerCase();

    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce<TreeNode[]>((acc, node) => {
        const matchesSelf =
          node.label.toLowerCase().includes(searchLower) ||
          node.eyebrow.toLowerCase().includes(searchLower) ||
          (node.description &&
            node.description.toLowerCase().includes(searchLower));

        let filteredChildren: TreeNode[] | undefined;
        if (node.children) {
          filteredChildren = filterNodes(node.children);
        }

        if (matchesSelf || (filteredChildren && filteredChildren.length > 0)) {
          acc.push({
            ...node,
            children: matchesSelf ? node.children : filteredChildren,
          });
        }

        return acc;
      }, []);
    };

    return filterNodes(tree);
  }, [tree, searchTerm]);

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
    <div className="min-h-screen bg-linear-to-b from-red-50/30 to-white p-2 space-y-6">
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-r from-red-600 to-red-700 rounded-xl shadow-lg">
            <School size={25} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-2xl font-extrabold text-gray-900">
              Quản lý chương trình đào tạo
            </h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-red-600" />
              Xem toàn bộ cấu trúc đào tạo theo dạng cây phân cấp
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-5 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <StatCard
          label="Cấp độ"
          value={stats.levels}
          icon={<Layers3 size={20} />}
          color="from-red-600 to-red-700"
        />
        <StatCard
          label="Môđun"
          value={stats.modules}
          icon={<Boxes size={20} />}
          color="from-blue-600 to-blue-700"
        />
        <StatCard
          label="Đơn vị"
          value={stats.units}
          icon={<BookOpen size={20} />}
          color="from-emerald-600 to-emerald-700"
        />
        <StatCard
          label="Chương trình"
          value={stats.syllabuses}
          icon={<ClipboardList size={20} />}
          color="from-amber-600 to-amber-700"
        />
        <StatCard
          label="Bài học"
          value={stats.lessonTemplates}
          icon={<FileText size={20} />}
          color="from-purple-600 to-purple-700"
        />
      </div>

      {/* Error Alert */}
      {error ? (
        <div
          className={`flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>{error}</div>
        </div>
      ) : null}

      {/* Content Section */}
      <div
        className={`rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Section Header */}
        <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ListTree size={20} className="text-red-600" />
              Cấu trúc chương trình
            </h2>
          </div>
        </div>

        {/* Program Selector & Search */}
        <div className="p-6 border-b border-red-100 bg-gradient-to-b from-white via-red-50/20 to-white">
          <div className="flex items-end gap-4 flex-wrap lg:flex-nowrap">
            {/* Search Box - wider */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-semibold text-gray-700 mb-2.5" htmlFor="search">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200" />
                <input
                  type="text"
                  id="search"
                  placeholder="Tìm kiếm theo tên, mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 rounded-xl border border-red-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-red-400 focus:ring-2 focus:ring-red-200/50 placeholder:text-gray-400 hover:border-red-300 shadow-sm"
                />
              </div>
            </div>

            {/* Select with Lightswind */}
            <div className="w-full lg:w-72">
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Chọn chương trình
              </label>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="w-full h-11 rounded-xl border border-red-200 bg-white shadow-sm hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200/50">
                  <SelectValue placeholder="Chọn chương trình" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {programs.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Chưa có chương trình</div>
                  ) : (
                    programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.code ? `${program.name} (${program.code})` : program.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>

        {/* Tree Content */}
        <div className="p-6">
          {treeLoading && !curriculum ? (
            <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải khung chương trình...
              </div>
            </div>
          ) : filteredTree.length > 0 ? (
            <div className="space-y-3">
              {filteredTree.map((node) => (
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
            <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed  border-red-200 bg-red-50/30 px-4 text-center text-sm text-gray-500">
              {searchTerm
                ? "Không tìm thấy kết quả phù hợp."
                : "Chưa có dữ liệu khung chương trình cho chương trình đang chọn."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

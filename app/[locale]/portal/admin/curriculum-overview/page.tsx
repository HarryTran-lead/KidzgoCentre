"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  Link2,
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
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { getAccessToken } from "@/lib/store/authToken";

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
  sessionTemplateId?: string | null;
  title: string;
  lessonType?: string;
  sessionIndex?: number | null;
  sessionOrder?: number | null;
  sessionIndexInModule?: number | null;
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
  unitId: string | null;
  unitKey?: string;
  unitName: string;
  unitNumber?: number;
  unitTitle?: string;
  unitOrderIndex?: number;
  isSynthetic?: boolean;
  syllabuses?: SyllabusDto[];
};

type ModuleDto = {
  moduleId: string;
  moduleCode?: string;
  moduleName: string;
  moduleOrderIndex?: number;
  moduleType?: string;
  isActive?: boolean;
  units?: UnitDto[];
};

type LevelDto = {
  levelId: string;
  levelCode?: string;
  levelName: string;
  levelOrderIndex?: number;
  isActive?: boolean;
  modules?: ModuleDto[];
};

type CurriculumTreeDto = {
  programId: string;
  programName: string;
  programCode?: string;
  isActive?: boolean;
  levels?: LevelDto[];
};

type TreeNode = {
  id: string;
  label: string;
  eyebrow: string;
  description?: string;
  sourceHref?: string;
  icon: LucideIcon;
  children?: TreeNode[];
};

type SyllabusViewMode = "applied" | "all";

type CurriculumFilterOption = {
  id: string;
  label: string;
  hint?: string;
  programId?: string;
};

const defaultCurriculumProgram: ProgramOption = {
  id: "48eba459-7a08-4461-b1f9-acec097c6185",
  name: "Kids English",
  code: "KIDSENGLIS",
  isActive: true,
};

const ALL_PROGRAMS_VALUE = "__all_programs__";
const ALL_FILTER_VALUE = "all";
const DEEP_LINK_NODE_PARAM = "node";
const DEEP_LINK_PROGRAM_PARAM = "programId";
const DEEP_LINK_SYLLABUS_PARAM = "syllabusId";
const DEEP_LINK_MODULE_PARAM = "moduleId";
const DEEP_LINK_VIEW_PARAM = "view";
const RETURN_TO_PARAM = "returnTo";

function buildAdminSourceHref(
  locale: string,
  path: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : "";
  return `/${locale}/portal/admin/${path}${suffix}`;
}

function appendReturnToParam(href: string, returnTo: string) {
  const url = new URL(href, "http://rex.local");
  url.searchParams.set(RETURN_TO_PARAM, returnTo);
  return `${url.pathname}${url.search}${url.hash}`;
}

const fallbackPrograms: ProgramOption[] = [defaultCurriculumProgram];

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

  const accessToken = normalizePlainToken(getAccessToken());
  if (accessToken) {
    return accessToken;
  }

  const tokenKeys = [
    "kidzgo.accessToken",
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
    } else if (program.programCode) {
      option.code = String(program.programCode);
    }

    if (typeof program.isActive === "boolean") {
      option.isActive = program.isActive;
    }

    programs.push(option);
  });

  return programs;
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

function sortLessonTemplates(lessons?: LessonTemplateDto[]) {
  return [...(lessons ?? [])].sort((left, right) => {
    const orderPairs = [
      [left.orderIndex, right.orderIndex],
      [left.sessionOrder, right.sessionOrder],
      [left.sessionIndexInModule, right.sessionIndexInModule],
      [left.sessionIndex, right.sessionIndex],
    ];

    for (const [leftOrder, rightOrder] of orderPairs) {
      const hasLeftOrder = typeof leftOrder === "number";
      const hasRightOrder = typeof rightOrder === "number";

      if (hasLeftOrder && hasRightOrder && leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      if (hasLeftOrder !== hasRightOrder) {
        return hasLeftOrder ? -1 : 1;
      }
    }

    return left.title.localeCompare(right.title);
  });
}

const MAX_SORT_ORDER = Number.MAX_SAFE_INTEGER;

function isOfficialUnit(unit: UnitDto) {
  return unit.isSynthetic !== true && Boolean(unit.unitId);
}

function getOfficialUnits(units?: UnitDto[]) {
  return (units ?? []).filter(isOfficialUnit);
}

function getFirstNumberAfterKeyword(keyword: string, values: unknown[]) {
  const pattern = new RegExp(`\\b${keyword}\\W*0*(\\d+)\\b`, "i");

  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const text = String(value ?? "").trim();
    if (!text) {
      continue;
    }

    if (/^\d+$/.test(text)) {
      return Number(text);
    }

    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

function normalizeUnitSortText(value: unknown) {
  return String(value ?? "")
    .replace(/[_|:.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function includesAnyKeyword(values: unknown[], keywords: string[]) {
  return values.some((value) => {
    const text = normalizeUnitSortText(value);
    return keywords.some((keyword) => text.includes(keyword));
  });
}

function getLessonModuleOrder(lesson: LessonTemplateDto) {
  const orderCandidates = [
    lesson.sessionIndexInModule,
    lesson.sessionOrder,
    lesson.sessionIndex,
  ];

  for (const order of orderCandidates) {
    if (typeof order === "number" && Number.isFinite(order)) {
      return order;
    }
  }

  return MAX_SORT_ORDER;
}

function getUnitFirstLessonOrder(unit: UnitDto) {
  const syllabuses = unit.syllabuses ?? [];
  const activeSyllabuses = syllabuses.filter(
    (syllabus) => syllabus.isActive === true,
  );
  const sourceSyllabuses = activeSyllabuses.length
    ? activeSyllabuses
    : syllabuses;
  const lessonOrders = sourceSyllabuses
    .flatMap((syllabus) => syllabus.lessonTemplates ?? [])
    .map(getLessonModuleOrder)
    .filter((order) => order !== MAX_SORT_ORDER);

  return lessonOrders.length ? Math.min(...lessonOrders) : MAX_SORT_ORDER;
}

function getUnitSortKey(unit: UnitDto) {
  const textValues = [unit.unitName, unit.unitTitle, unit.unitKey];
  const isRevision = includesAnyKeyword(textValues, ["REVISION"]);
  const explicitUnitNumber =
    !isRevision && typeof unit.unitNumber === "number"
      ? unit.unitNumber
      : null;
  const unitNumber =
    explicitUnitNumber ?? getFirstNumberAfterKeyword("unit", textValues);
  const revisionNumber = getFirstNumberAfterKeyword(
    "revision",
    textValues,
  );
  const isIntroUnit = includesAnyKeyword(textValues, [
    "UNIT STARTER",
    "UNIT HELLO",
    "UNIT WELCOME",
    "UNIT INTRO",
    "STARTER",
    "HELLO",
    "WELCOME",
  ]);
  const unitOrder =
    typeof unit.unitOrderIndex === "number"
      ? unit.unitOrderIndex
      : MAX_SORT_ORDER;

  if (unitNumber !== null) {
    return {
      group: unitNumber <= 0 ? 0 : 1,
      naturalOrder: unitNumber,
      unitOrder,
    };
  }

  if (isIntroUnit) {
    return {
      group: 0,
      naturalOrder: 0,
      unitOrder,
    };
  }

  if (isRevision || revisionNumber !== null) {
    return {
      group: 2,
      naturalOrder: revisionNumber ?? unitOrder,
      unitOrder,
    };
  }

  return {
    group: 3,
    naturalOrder: unitOrder,
    unitOrder,
  };
}

function sortUnitsByLessonPlanOrder(units?: UnitDto[]) {
  return [...(units ?? [])]
    .map((unit, index) => ({
      unit,
      index,
      firstLessonOrder: getUnitFirstLessonOrder(unit),
      sortKey: getUnitSortKey(unit),
    }))
    .sort((left, right) => {
      if (left.firstLessonOrder !== right.firstLessonOrder) {
        return left.firstLessonOrder - right.firstLessonOrder;
      }

      if (left.sortKey.group !== right.sortKey.group) {
        return left.sortKey.group - right.sortKey.group;
      }

      if (left.sortKey.naturalOrder !== right.sortKey.naturalOrder) {
        return left.sortKey.naturalOrder - right.sortKey.naturalOrder;
      }

      if (left.sortKey.unitOrder !== right.sortKey.unitOrder) {
        return left.sortKey.unitOrder - right.sortKey.unitOrder;
      }

      const labelCompare = left.unit.unitName.localeCompare(
        right.unit.unitName,
        "vi",
      );
      return labelCompare || left.index - right.index;
    })
    .map(({ unit }) => unit);
}

function makeTreeNodeId(...parts: Array<string | number | null | undefined>) {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join("::");
}

function joinMeta(fields: Array<string | null | undefined>) {
  return fields.filter((field): field is string => Boolean(field)).join(" · ");
}

function formatStatus(isActive?: boolean) {
  if (isActive === true) {
    return "Đang hoạt động";
  }

  if (isActive === false) {
    return "Tạm ngưng";
  }

  return null;
}

function formatCount(count: number | null | undefined, label: string) {
  if (typeof count !== "number") {
    return null;
  }

  return `${count} ${label}`;
}

function formatCode(code?: string | null) {
  const trimmed = code?.trim();
  return trimmed ? `Mã ${trimmed}` : null;
}

function formatVersion(version?: number | null) {
  return typeof version === "number" ? `Phiên bản ${version}` : null;
}

function formatAppliedVersion(version?: number | null) {
  return typeof version === "number" ? `Đang áp dụng phiên bản ${version}` : null;
}

function getLessonModuleDisplayOrder(lesson: LessonTemplateDto) {
  const order =
    lesson.sessionIndexInModule ?? lesson.sessionOrder ?? lesson.sessionIndex;

  return typeof order === "number" ? `Buổi ${order} trong module` : null;
}

function getLessonDisplayType(lessonType?: string) {
  return lessonType?.trim() || "Bài học";
}

function createEmptyCurriculum(program: ProgramOption): CurriculumTreeDto {
  return {
    programId: program.id,
    programName: program.name,
    programCode: program.code,
    isActive: program.isActive,
    levels: [],
  };
}

type TreeContext = {
  curriculum: CurriculumTreeDto;
  level: LevelDto;
  module: ModuleDto;
  unit: UnitDto;
};

function getSyllabusVersion(syllabus: SyllabusDto) {
  return typeof syllabus.version === "number"
    ? syllabus.version
    : Number.NEGATIVE_INFINITY;
}

function compareSyllabusByAppliedPriority(
  left: SyllabusDto,
  right: SyllabusDto,
) {
  const activePriority =
    Number(right.isActive === true) - Number(left.isActive === true);

  if (activePriority !== 0) {
    return activePriority;
  }

  const versionPriority = getSyllabusVersion(right) - getSyllabusVersion(left);

  if (versionPriority !== 0) {
    return versionPriority;
  }

  return left.syllabusTitle.localeCompare(right.syllabusTitle);
}

function sortSyllabusesByAppliedPriority(syllabuses?: SyllabusDto[]) {
  return [...(syllabuses ?? [])].sort(compareSyllabusByAppliedPriority);
}

function getSyllabusIdentity(syllabus: SyllabusDto) {
  return (
    syllabus.syllabusCode?.trim() ||
    syllabus.syllabusTitle?.trim() ||
    syllabus.syllabusId
  ).toLowerCase();
}

type SyllabusGroup = {
  key: string;
  title: string;
  code?: string;
  versions: SyllabusDto[];
};

function groupSyllabuses(syllabuses?: SyllabusDto[]) {
  const groups = new Map<string, SyllabusGroup>();

  sortSyllabusesByAppliedPriority(syllabuses).forEach((syllabus) => {
    const key = getSyllabusIdentity(syllabus);
    const currentGroup = groups.get(key);

    if (currentGroup) {
      currentGroup.versions.push(syllabus);
      return;
    }

    groups.set(key, {
      key,
      title: syllabus.syllabusTitle,
      code: syllabus.syllabusCode,
      versions: [syllabus],
    });
  });

  return Array.from(groups.values());
}

function pickAppliedSyllabusVersion(group: SyllabusGroup) {
  return group.versions[0];
}

function getAppliedSyllabusesForUnit(unit: UnitDto) {
  return groupSyllabuses(unit.syllabuses)
    .map(pickAppliedSyllabusVersion)
    .filter((syllabus): syllabus is SyllabusDto => Boolean(syllabus));
}

function formatSyllabusFilterLabel(syllabus: SyllabusDto) {
  const code = syllabus.syllabusCode?.trim() || "Syllabus";
  const version =
    typeof syllabus.version === "number" ? ` ${syllabus.version}` : "";

  return `${code}${version} · ${syllabus.syllabusTitle}`;
}

function collectSyllabusOptions(curriculums: CurriculumTreeDto[]) {
  const optionMap = new Map<string, CurriculumFilterOption>();

  for (const curriculum of curriculums) {
    for (const level of curriculum.levels ?? []) {
      for (const curriculumModule of level.modules ?? []) {
        for (const unit of getOfficialUnits(curriculumModule.units)) {
          for (const syllabus of unit.syllabuses ?? []) {
            if (optionMap.has(syllabus.syllabusId)) {
              continue;
            }

            optionMap.set(syllabus.syllabusId, {
              id: syllabus.syllabusId,
              label: formatSyllabusFilterLabel(syllabus),
              hint: curriculum.programName,
              programId: curriculum.programId,
            });
          }
        }
      }
    }
  }

  return Array.from(optionMap.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function collectModuleOptions(
  curriculums: CurriculumTreeDto[],
  selectedSyllabusId: string,
) {
  if (selectedSyllabusId === ALL_FILTER_VALUE) {
    return [];
  }

  const optionMap = new Map<string, CurriculumFilterOption>();

  for (const curriculum of curriculums) {
    for (const level of curriculum.levels ?? []) {
      for (const curriculumModule of level.modules ?? []) {
        const hasSelectedSyllabus = getOfficialUnits(
          curriculumModule.units,
        ).some((unit) =>
          (unit.syllabuses ?? []).some(
            (syllabus) => syllabus.syllabusId === selectedSyllabusId,
          ),
        );

        if (
          !hasSelectedSyllabus ||
          optionMap.has(curriculumModule.moduleId)
        ) {
          continue;
        }

        optionMap.set(curriculumModule.moduleId, {
          id: curriculumModule.moduleId,
          label: curriculumModule.moduleName,
          hint: [
            curriculumModule.moduleCode,
            level.levelName,
            curriculum.programName,
          ]
            .filter((value): value is string => Boolean(value))
            .join(" · "),
          programId: curriculum.programId,
        });
      }
    }
  }

  return Array.from(optionMap.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function filterCurriculums(
  curriculums: CurriculumTreeDto[],
  selectedSyllabusId: string,
  selectedModuleId: string,
): CurriculumTreeDto[] {
  if (
    selectedSyllabusId === ALL_FILTER_VALUE &&
    selectedModuleId === ALL_FILTER_VALUE
  ) {
    return curriculums;
  }

  const filteredCurriculums: CurriculumTreeDto[] = [];

  for (const curriculum of curriculums) {
    const levels: LevelDto[] = [];

    for (const level of curriculum.levels ?? []) {
      const modules: ModuleDto[] = [];

      for (const curriculumModule of level.modules ?? []) {
        if (
          selectedModuleId !== ALL_FILTER_VALUE &&
          curriculumModule.moduleId !== selectedModuleId
        ) {
          continue;
        }

        const units: UnitDto[] = [];

        for (const unit of getOfficialUnits(curriculumModule.units)) {
          const syllabuses =
            selectedSyllabusId === ALL_FILTER_VALUE
              ? (unit.syllabuses ?? [])
              : (unit.syllabuses ?? []).filter(
                  (syllabus) => syllabus.syllabusId === selectedSyllabusId,
                );

          if (
            selectedSyllabusId !== ALL_FILTER_VALUE &&
            syllabuses.length === 0
          ) {
            continue;
          }

          units.push({ ...unit, syllabuses });
        }

        if (selectedSyllabusId !== ALL_FILTER_VALUE && units.length === 0) {
          continue;
        }

        modules.push({ ...curriculumModule, units });
      }

      if (modules.length === 0) {
        continue;
      }

      levels.push({ ...level, modules });
    }

    if (levels.length === 0) {
      continue;
    }

    filteredCurriculums.push({ ...curriculum, levels });
  }

  return filteredCurriculums;
}

function buildLessonNodes(
  { curriculum, level, module, unit }: TreeContext,
  syllabus: SyllabusDto,
  scope: string,
  locale: string,
): TreeNode[] {
  return sortLessonTemplates(syllabus.lessonTemplates).map((lesson) => ({
    id: makeTreeNodeId(
      curriculum.programId,
      level.levelId,
      module.moduleId,
      unit.unitId,
      scope,
      syllabus.syllabusId,
      "version",
      syllabus.version ?? "none",
      "lesson",
      lesson.lessonTemplateId,
    ),
    label: lesson.title,
    eyebrow: "Bài học mẫu",
    description: joinMeta([
      getLessonDisplayType(lesson.lessonType),
      getLessonModuleDisplayOrder(lesson),
      formatStatus(lesson.isActive),
    ]),
    sourceHref: buildAdminSourceHref(locale, "documents/templates", {
      programId: curriculum.programId,
      syllabusId: syllabus.syllabusId,
      moduleId: module.moduleId,
      unitId: unit.unitId,
      templateId: lesson.lessonTemplateId,
    }),
    icon: FileText,
  }));
}

function buildVersionNode(
  context: TreeContext,
  syllabus: SyllabusDto,
  syllabusKey: string,
  scope: string,
  locale: string,
): TreeNode {
  const { curriculum, level, module, unit } = context;
  const versionLabel = formatVersion(syllabus.version) ?? "Chưa có phiên bản";

  return {
    id: makeTreeNodeId(
      curriculum.programId,
      level.levelId,
      module.moduleId,
      unit.unitId,
      scope,
      "syllabus",
      syllabusKey,
      "version",
      syllabus.version ?? "none",
      syllabus.syllabusId,
    ),
    label: versionLabel,
    eyebrow: "Phiên bản syllabus",
    description: joinMeta([
      formatStatus(syllabus.isActive),
      formatCount(syllabus.lessonTemplates?.length ?? 0, "bài học mẫu"),
    ]),
    sourceHref: buildAdminSourceHref(
      locale,
      `syllabuses/${encodeURIComponent(syllabus.syllabusId)}/editor`,
      { version: syllabus.version },
    ),
    icon: ClipboardList,
    children: buildLessonNodes(context, syllabus, scope, locale),
  };
}

function buildSyllabusGroupNode(
  context: TreeContext,
  group: SyllabusGroup,
  syllabusViewMode: SyllabusViewMode,
  locale: string,
): TreeNode {
  const { curriculum, level, module, unit } = context;
  const versions =
    syllabusViewMode === "all"
      ? group.versions
      : group.versions.slice(0, 1);
  const appliedSyllabus = pickAppliedSyllabusVersion(group);

  return {
    id: makeTreeNodeId(
      curriculum.programId,
      level.levelId,
      module.moduleId,
      unit.unitId,
      "syllabus",
      group.key,
    ),
    label: group.title,
    eyebrow: "Syllabus",
    description: joinMeta([
      formatCode(group.code),
      formatCount(group.versions.length, "phiên bản"),
      formatAppliedVersion(appliedSyllabus?.version),
      formatCount(appliedSyllabus?.lessonTemplates?.length ?? 0, "bài học mẫu"),
    ]),
    sourceHref: appliedSyllabus
      ? buildAdminSourceHref(
          locale,
          `syllabuses/${encodeURIComponent(appliedSyllabus.syllabusId)}/editor`,
        )
      : buildAdminSourceHref(locale, "syllabuses", {
          programId: curriculum.programId,
        }),
    icon: BookOpen,
    children: versions.map((syllabus) =>
      buildVersionNode(context, syllabus, group.key, syllabusViewMode, locale),
    ),
  };
}

function buildUnitSyllabusNodes(
  context: TreeContext,
  syllabusViewMode: SyllabusViewMode,
  locale: string,
) {
  return groupSyllabuses(context.unit.syllabuses).map((group) =>
    buildSyllabusGroupNode(context, group, syllabusViewMode, locale),
  );
}

function buildTree(
  curriculum: CurriculumTreeDto,
  syllabusViewMode: SyllabusViewMode,
  locale: string,
): TreeNode[] {
  return [
    {
      id: curriculum.programId,
      label: curriculum.programName,
      eyebrow: "Chương trình",
      description: joinMeta([
        formatCode(curriculum.programCode),
        formatStatus(curriculum.isActive),
        formatCount(curriculum.levels?.length ?? 0, "cấp độ"),
      ]),
      sourceHref: buildAdminSourceHref(locale, "courses", {
        programId: curriculum.programId,
      }),
      icon: School,
      children: sortByOrder(curriculum.levels, "levelOrderIndex").map(
        (level) => ({
          id: makeTreeNodeId(curriculum.programId, "level", level.levelId),
          label: level.levelName,
          eyebrow: "Cấp độ",
          description: joinMeta([
            formatCode(level.levelCode),
            formatStatus(level.isActive),
            formatCount(level.modules?.length ?? 0, "module"),
          ]),
          sourceHref: buildAdminSourceHref(locale, "academic-progression", {
            tab: "levels",
            programId: curriculum.programId,
            levelId: level.levelId,
          }),
          icon: GraduationCap,
          children: sortByOrder(level.modules, "moduleOrderIndex").map(
            (module) => {
              const displayUnits = sortUnitsByLessonPlanOrder(
                getOfficialUnits(module.units),
              );

              return {
                id: makeTreeNodeId(
                  curriculum.programId,
                  level.levelId,
                  "module",
                  module.moduleId,
                ),
                label: module.moduleName,
                eyebrow: "Module",
                description: joinMeta([
                  formatCode(module.moduleCode),
                  module.moduleType,
                  formatStatus(module.isActive),
                  formatCount(displayUnits.length, "unit"),
                ]),
                sourceHref: buildAdminSourceHref(
                  locale,
                  "academic-progression",
                  {
                    tab: "levels",
                    programId: curriculum.programId,
                    levelId: level.levelId,
                    moduleId: module.moduleId,
                  },
                ),
                icon: Layers3,
                children: displayUnits.map((unit) => ({
                  id: makeTreeNodeId(
                    curriculum.programId,
                    level.levelId,
                    module.moduleId,
                    "unit",
                    unit.unitId,
                  ),
                  label: unit.unitName,
                  eyebrow: "Unit",
                  description: joinMeta([
                    unit.unitTitle?.trim() || null,
                    formatCount(unit.syllabuses?.length ?? 0, "syllabus"),
                  ]),
                  sourceHref: buildAdminSourceHref(locale, "documents/templates", {
                    programId: curriculum.programId,
                    syllabusId: getAppliedSyllabusesForUnit(unit)[0]?.syllabusId,
                    moduleId: module.moduleId,
                    unitId: unit.unitId,
                  }),
                  icon: Boxes,
                  children: buildUnitSyllabusNodes(
                    { curriculum, level, module, unit },
                    syllabusViewMode,
                    locale,
                  ),
                })),
              };
            },
          ),
        }),
      ),
    },
  ];
}

function countTrees(curriculums: CurriculumTreeDto[]) {
  const levels = curriculums.flatMap((curriculum) => curriculum.levels ?? []);
  const modules = levels.flatMap((level) => level.modules ?? []);
  const units = modules.flatMap((module) => getOfficialUnits(module.units));
  const appliedSyllabuses = units.flatMap(getAppliedSyllabusesForUnit);
  const appliedSyllabusKeys = new Set(
    appliedSyllabuses.map(getSyllabusIdentity),
  );
  const appliedLessonTemplateKeys = new Set(
    appliedSyllabuses.flatMap(
      (syllabus) =>
        syllabus.lessonTemplates?.map((lesson) => lesson.lessonTemplateId) ?? [],
    ),
  );
  const lessonTemplates = appliedSyllabuses.flatMap(
    (syllabus) => syllabus.lessonTemplates ?? [],
  );

  return {
    programs: curriculums.length,
    levels: levels.length,
    modules: modules.length,
    units: units.length,
    syllabuses: appliedSyllabusKeys.size,
    lessonTemplates:
      appliedLessonTemplateKeys.size > 0
        ? appliedLessonTemplateKeys.size
        : lessonTemplates.length,
  };
}

function collectExpandableNodeIds(nodes: TreeNode[]) {
  const ids: string[] = [];

  function visit(node: TreeNode) {
    if (node.children?.length) {
      ids.push(node.id);
      node.children.forEach(visit);
    }
  }

  nodes.forEach(visit);
  return ids;
}

function findTreeNodePath(nodes: TreeNode[], targetId: string): string[] | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [node.id];
    }

    const childPath = node.children
      ? findTreeNodePath(node.children, targetId)
      : null;

    if (childPath) {
      return [node.id, ...childPath];
    }
  }

  return null;
}

function getTreeNodeDomId(nodeId: string) {
  return `curriculum-node-${encodeURIComponent(nodeId).replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

function readDeepLinkParams() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);

  return {
    nodeId: params.get(DEEP_LINK_NODE_PARAM),
    programId: params.get(DEEP_LINK_PROGRAM_PARAM),
    syllabusId: params.get(DEEP_LINK_SYLLABUS_PARAM),
    moduleId: params.get(DEEP_LINK_MODULE_PARAM),
    viewMode: params.get(DEEP_LINK_VIEW_PARAM),
  };
}

function TreeItem({
  node,
  depth,
  expandedIds,
  onToggle,
  getSourceHref,
  highlightedNodeId,
}: {
  node: TreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  getSourceHref: (node: TreeNode) => string | undefined;
  highlightedNodeId: string | null;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expandedIds.has(node.id);
  const isHighlighted = highlightedNodeId === node.id;
  const sourceHref = getSourceHref(node);
  const Icon = node.icon;

  return (
    <div id={getTreeNodeDomId(node.id)} className="relative scroll-mt-24">
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
        className={`group relative flex min-h-14 items-center cursor-pointer gap-3 rounded-xl border bg-gradient-to-r from-red-50/40 to-slate-50 px-4 py-3 shadow-sm transition-all duration-500 hover:border-red-300 hover:bg-gradient-to-r hover:from-red-50/60 hover:to-white hover:shadow-lg hover:scale-102 hover:-translate-y-1 ${
          isHighlighted
            ? "border-red-400 ring-2 ring-red-200"
            : "border-red-100"
        }`}
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
          <div className="break-words text-sm font-semibold text-slate-900 group-hover:text-red-700 transition-colors duration-300">
            {node.label}
          </div>
          {node.description ? (
            <div className="break-words text-xs leading-relaxed text-slate-500 group-hover:text-slate-600 transition-colors duration-300">
              {node.description}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          {sourceHref ? (
            <Link
              aria-label={`Mở trang gốc của ${node.label}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-400 opacity-60 transition-all duration-200 hover:border-red-200 hover:bg-white hover:text-red-600 group-hover:opacity-100"
              href={sourceHref}
              title="Mở trang gốc"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Link2 className="h-4 w-4" />
            </Link>
          ) : null}

          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="h-1 w-1 rounded-full bg-red-400 transition-all duration-500 group-hover:scale-125" />
            <div className="h-1 w-1 rounded-full bg-red-500 transition-all duration-500 group-hover:scale-125" />
          </div>
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
              getSourceHref={getSourceHref}
              highlightedNodeId={highlightedNodeId}
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
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-red-100 bg-linear-to-br from-white to-red-50/30 p-4 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
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
  const { selectedBranchId, isLoaded: branchFilterLoaded } = useBranchFilter();
  const routeParams = useParams<{ locale?: string }>();
  const locale = routeParams?.locale || "vi";
  const [programs, setPrograms] = useState<ProgramOption[]>(fallbackPrograms);
  const [selectedProgramId, setSelectedProgramId] = useState(
    ALL_PROGRAMS_VALUE,
  );
  const [curriculums, setCurriculums] = useState<CurriculumTreeDto[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [syllabusViewMode, setSyllabusViewMode] =
    useState<SyllabusViewMode>("applied");
  const [selectedSyllabusId, setSelectedSyllabusId] =
    useState(ALL_FILTER_VALUE);
  const [selectedModuleId, setSelectedModuleId] = useState(ALL_FILTER_VALUE);
  const [deepLinkTargetId, setDeepLinkTargetId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const params = readDeepLinkParams();
    if (!params) {
      return;
    }

    if (params.programId) {
      setSelectedProgramId(params.programId);
    }

    if (
      params.viewMode === "all" ||
      params.viewMode === "applied"
    ) {
      setSyllabusViewMode(params.viewMode);
    }

    if (params.syllabusId) {
      setSelectedSyllabusId(params.syllabusId);
    }

    if (params.moduleId) {
      setSelectedModuleId(params.moduleId);
    }

    if (params.nodeId) {
      setDeepLinkTargetId(params.nodeId);
      setHighlightedNodeId(params.nodeId);
    }
  }, []);

  useEffect(() => {
    if (selectedProgramId.startsWith("demo-")) {
      setSelectedProgramId(ALL_PROGRAMS_VALUE);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    let mounted = true;

    async function loadPrograms() {
      if (!branchFilterLoaded) {
        return;
      }

      try {
        const programsEndpoint = selectedBranchId
          ? `/api/branches/${selectedBranchId}/programs`
          : "/api/programs";
        const response = await fetch(programsEndpoint, {
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
          nextPrograms.length > 0
            ? nextPrograms.some(
                (program) => program.id === defaultCurriculumProgram.id,
              )
              ? nextPrograms
              : [defaultCurriculumProgram, ...nextPrograms]
            : fallbackPrograms;

        if (!mounted) {
          return;
        }

        setPrograms(usablePrograms);
        setSelectedProgramId(
          (current) =>
            current === ALL_PROGRAMS_VALUE ||
            usablePrograms.some((program) => program.id === current)
              ? current
              : usablePrograms[0]?.id || "",
        );
      } catch {
        if (!mounted) {
          return;
        }

        setPrograms(fallbackPrograms);
        setSelectedProgramId(
          (current) =>
            current === ALL_PROGRAMS_VALUE ||
            fallbackPrograms.some((program) => program.id === current)
              ? current
              : fallbackPrograms[0]?.id || "",
        );
        setError("");
      }
    }

    loadPrograms();

    return () => {
      mounted = false;
    };
  }, [branchFilterLoaded, selectedBranchId]);

  useEffect(() => {
    if (!selectedProgramId) {
      setCurriculums([]);
      setExpandedIds(new Set());
      return;
    }

    let mounted = true;

    async function fetchCurriculumTree(
      programId: string,
    ): Promise<CurriculumTreeDto> {
      const response = await fetch(
        `/api/programs/${programId}/curriculum-tree`,
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
      return { ...data, levels: data.levels ?? [] };
    }

    async function loadTree() {
      try {
        setTreeLoading(true);
        setError("");

        if (selectedProgramId === ALL_PROGRAMS_VALUE) {
          const targetPrograms = programs.filter(
            (program) => program.id && !program.id.startsWith("demo-"),
          );

          if (targetPrograms.length === 0) {
            setCurriculums([]);
            setExpandedIds(new Set());
            return;
          }

          const results = await Promise.allSettled(
            targetPrograms.map((program) => fetchCurriculumTree(program.id)),
          );
          const loadedCurriculums = results.map((result, index) =>
            result.status === "fulfilled"
              ? result.value
              : createEmptyCurriculum(targetPrograms[index]!),
          );

          if (!mounted) {
            return;
          }

          const failedCount = results.filter(
            (result) => result.status === "rejected",
          ).length;

          if (failedCount === results.length) {
            const firstError = results.find(
              (result): result is PromiseRejectedResult =>
                result.status === "rejected",
            )?.reason;

            throw firstError instanceof Error
              ? firstError
              : new Error("Không tải được dữ liệu.");
          }

          setCurriculums(loadedCurriculums);
          setExpandedIds(new Set());

          if (failedCount > 0) {
            setError(`Không tải được ${failedCount} chương trình.`);
          }

          return;
        }

        const demoTree = fallbackCurriculumTrees[selectedProgramId];

        if (demoTree) {
          setCurriculums([demoTree]);
          setExpandedIds(new Set());
          return;
        }

        const data = await fetchCurriculumTree(selectedProgramId);

        if (!mounted) {
          return;
        }

        setCurriculums([data]);
        setExpandedIds(new Set());
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setCurriculums([]);
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

  const syllabusOptions = useMemo(
    () => collectSyllabusOptions(curriculums),
    [curriculums],
  );
  const moduleOptions = useMemo(
    () => collectModuleOptions(curriculums, selectedSyllabusId),
    [curriculums, selectedSyllabusId],
  );
  const effectiveSelectedModuleId = useMemo(() => {
    if (selectedSyllabusId === ALL_FILTER_VALUE) {
      return ALL_FILTER_VALUE;
    }

    return moduleOptions.some((option) => option.id === selectedModuleId)
      ? selectedModuleId
      : ALL_FILTER_VALUE;
  }, [moduleOptions, selectedModuleId, selectedSyllabusId]);
  const filteredCurriculums = useMemo(
    () =>
      filterCurriculums(
        curriculums,
        selectedSyllabusId,
        effectiveSelectedModuleId,
      ),
    [curriculums, effectiveSelectedModuleId, selectedSyllabusId],
  );

  useEffect(() => {
    if (selectedSyllabusId === ALL_FILTER_VALUE) {
      return;
    }

    if (treeLoading || curriculums.length === 0) {
      return;
    }

    if (!syllabusOptions.some((option) => option.id === selectedSyllabusId)) {
      setSelectedSyllabusId(ALL_FILTER_VALUE);
      setSelectedModuleId(ALL_FILTER_VALUE);
    }
  }, [curriculums.length, selectedSyllabusId, syllabusOptions, treeLoading]);

  useEffect(() => {
    if (selectedSyllabusId === ALL_FILTER_VALUE) {
      setSelectedModuleId(ALL_FILTER_VALUE);
      return;
    }

    if (treeLoading || curriculums.length === 0) {
      return;
    }

    if (
      selectedModuleId !== ALL_FILTER_VALUE &&
      !moduleOptions.some((option) => option.id === selectedModuleId)
    ) {
      setSelectedModuleId(ALL_FILTER_VALUE);
    }
  }, [
    curriculums.length,
    moduleOptions,
    selectedModuleId,
    selectedSyllabusId,
    treeLoading,
  ]);

  const tree = useMemo(
    () =>
      filteredCurriculums.flatMap((curriculum) =>
        buildTree(curriculum, syllabusViewMode, locale),
      ),
    [filteredCurriculums, locale, syllabusViewMode],
  );
  const stats = useMemo(
    () => countTrees(filteredCurriculums),
    [filteredCurriculums],
  );

  useEffect(() => {
    if (!deepLinkTargetId || tree.length === 0) {
      return;
    }

    const nodePath = findTreeNodePath(tree, deepLinkTargetId);
    if (!nodePath) {
      return;
    }

    setExpandedIds((current) => {
      const next = new Set(current);
      nodePath.forEach((id) => next.add(id));
      return next;
    });
    setHighlightedNodeId(deepLinkTargetId);

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(getTreeNodeDomId(deepLinkTargetId))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(scrollTimer);
  }, [deepLinkTargetId, tree]);

  useEffect(() => {
    if (selectedSyllabusId === ALL_FILTER_VALUE) {
      return;
    }

    setExpandedIds(new Set(collectExpandableNodeIds(tree)));
  }, [selectedSyllabusId, tree]);

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

  function handleProgramChange(programId: string) {
    setSelectedProgramId(programId);
    setSelectedSyllabusId(ALL_FILTER_VALUE);
    setSelectedModuleId(ALL_FILTER_VALUE);
  }

  function handleSyllabusChange(syllabusId: string) {
    setSelectedSyllabusId(syllabusId);
    setSelectedModuleId(ALL_FILTER_VALUE);
  }

  function createNodeReturnHref(nodeId: string) {
    const params = new URLSearchParams();

    params.set(DEEP_LINK_NODE_PARAM, nodeId);

    if (selectedProgramId !== ALL_PROGRAMS_VALUE) {
      params.set(DEEP_LINK_PROGRAM_PARAM, selectedProgramId);
    }

    if (syllabusViewMode !== "applied") {
      params.set(DEEP_LINK_VIEW_PARAM, syllabusViewMode);
    }

    if (selectedSyllabusId !== ALL_FILTER_VALUE) {
      params.set(DEEP_LINK_SYLLABUS_PARAM, selectedSyllabusId);

      if (effectiveSelectedModuleId !== ALL_FILTER_VALUE) {
        params.set(DEEP_LINK_MODULE_PARAM, effectiveSelectedModuleId);
      }
    }

    return `/${locale}/portal/admin/curriculum-overview?${params.toString()}`;
  }

  function getNodeSourceHref(node: TreeNode) {
    if (!node.sourceHref) {
      return undefined;
    }

    return appendReturnToParam(node.sourceHref, createNodeReturnHref(node.id));
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
        className={`grid gap-4 md:grid-cols-2 lg:grid-cols-6 transition-all duration-700 delay-100 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <StatCard
          label="Chương trình"
          value={stats.programs}
          icon={<School size={20} />}
          color="from-red-600 to-red-700"
        />
        <StatCard
          label="Cấp độ"
          value={stats.levels}
          icon={<Layers3 size={20} />}
          color="from-blue-600 to-blue-700"
        />
        <StatCard
          label="Môđun"
          value={stats.modules}
          icon={<Boxes size={20} />}
          color="from-cyan-600 to-cyan-700"
        />
        <StatCard
          label="Đơn vị"
          value={stats.units}
          icon={<BookOpen size={20} />}
          color="from-emerald-600 to-emerald-700"
        />
        <StatCard
          label="Syllabus"
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

            <div className="w-full lg:w-56">
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Phiên bản
              </label>
              <Select
                value={syllabusViewMode}
                onValueChange={(value) =>
                  setSyllabusViewMode(value as SyllabusViewMode)
                }
              >
                <SelectTrigger className="w-full h-11 rounded-xl border border-red-200 bg-white shadow-sm hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200/50">
                  <SelectValue placeholder="Phiên bản" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="applied">Đang áp dụng</SelectItem>
                  <SelectItem value="all">Tất cả phiên bản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select with Lightswind */}
            <div className="w-full lg:w-72">
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Chọn chương trình
              </label>
              <Select value={selectedProgramId} onValueChange={handleProgramChange}>
                <SelectTrigger className="w-full h-11 rounded-xl border border-red-200 bg-white shadow-sm hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200/50">
                  <SelectValue placeholder="Chọn chương trình" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_PROGRAMS_VALUE}>
                    Tất cả chương trình
                  </SelectItem>
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

            <div className="w-full lg:w-72">
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Chọn syllabus
              </label>
              <Select value={selectedSyllabusId} onValueChange={handleSyllabusChange}>
                <SelectTrigger className="w-full h-11 rounded-xl border border-red-200 bg-white shadow-sm hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200/50">
                  <SelectValue placeholder="Chọn syllabus" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL_FILTER_VALUE}>Tất cả syllabus</SelectItem>
                  {syllabusOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Chưa có syllabus</div>
                  ) : (
                    syllabusOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSyllabusId !== ALL_FILTER_VALUE ? (
              <div className="w-full lg:w-56">
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Chọn module
                </label>
                <Select
                  value={effectiveSelectedModuleId}
                  onValueChange={setSelectedModuleId}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl border border-red-200 bg-white shadow-sm hover:border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200/50">
                    <SelectValue placeholder="Chọn module" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={ALL_FILTER_VALUE}>Tất cả module</SelectItem>
                    {moduleOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

          </div>
        </div>

        {/* Tree Content */}
        <div className="p-6">
          {treeLoading && curriculums.length === 0 ? (
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
                  getSourceHref={getNodeSourceHref}
                  highlightedNodeId={highlightedNodeId}
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

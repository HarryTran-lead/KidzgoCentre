import type { TuitionPlan } from "@/types/admin/tuition_plan";
import type { SuggestedClassBucket } from "@/types/registration";

export type ClassModuleEligibilityLike = {
  status?: string | null;
  startModuleId?: string | null;
  startModuleName?: string | null;
};

type TuitionPlanModuleRefs = {
  moduleIds: Set<string>;
  moduleNames: Set<string>;
  moduleCount: number;
};

function normalizeId(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeModuleName(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function addNormalizedValue(
  target: Set<string>,
  value: string | null | undefined,
  normalizer: (value?: string | null) => string,
) {
  const normalized = normalizer(value);
  if (normalized) target.add(normalized);
}

function getTuitionPlanModuleRefs(
  tuitionPlan?: TuitionPlan | null,
): TuitionPlanModuleRefs {
  const moduleIds = new Set<string>();
  const moduleNames = new Set<string>();
  const uniqueModuleNames = new Set<string>();

  (tuitionPlan?.moduleIds || []).forEach((moduleId) =>
    addNormalizedValue(moduleIds, moduleId, normalizeId),
  );

  (tuitionPlan?.modules || []).forEach((module) => {
    addNormalizedValue(moduleIds, module.moduleId, normalizeId);
    addNormalizedValue(moduleNames, module.moduleName, normalizeModuleName);
    addNormalizedValue(uniqueModuleNames, module.moduleName, normalizeModuleName);
    addNormalizedValue(moduleNames, module.moduleCode, normalizeModuleName);
  });

  addNormalizedValue(moduleIds, tuitionPlan?.moduleId, normalizeId);
  addNormalizedValue(moduleNames, tuitionPlan?.moduleName, normalizeModuleName);
  addNormalizedValue(uniqueModuleNames, tuitionPlan?.moduleName, normalizeModuleName);

  const moduleCount = Math.max(
    moduleIds.size,
    uniqueModuleNames.size,
    tuitionPlan?.modules?.length || 0,
    tuitionPlan?.moduleIds?.length || 0,
    tuitionPlan?.moduleId ? 1 : 0,
  );

  return {
    moduleIds,
    moduleNames,
    moduleCount,
  };
}

function isUpcomingClass(cls?: ClassModuleEligibilityLike | null) {
  const status = normalizeId(cls?.status);
  return status === "planned" || status === "recruiting" || status === "sắp khai giảng";
}

function hasClassStartModule(cls?: ClassModuleEligibilityLike | null) {
  return Boolean(
    normalizeId(cls?.startModuleId) || normalizeModuleName(cls?.startModuleName),
  );
}

function classStartModuleMatchesTuitionPlan(
  cls: ClassModuleEligibilityLike,
  refs: TuitionPlanModuleRefs,
) {
  const startModuleId = normalizeId(cls.startModuleId);
  if (startModuleId && refs.moduleIds.has(startModuleId)) return true;

  const startModuleName = normalizeModuleName(cls.startModuleName);
  if (startModuleName && refs.moduleNames.has(startModuleName)) return true;

  return false;
}

export function isFullLevelTuitionPlan(tuitionPlan?: TuitionPlan | null) {
  return getTuitionPlanModuleRefs(tuitionPlan).moduleCount > 1;
}

export function isClassEligibleForTuitionPlan(
  cls?: ClassModuleEligibilityLike | null,
  tuitionPlan?: TuitionPlan | null,
) {
  if (!cls) return false;

  const refs = getTuitionPlanModuleRefs(tuitionPlan);
  if (refs.moduleCount === 0) return true;

  if (refs.moduleCount === 1) {
    return isUpcomingClass(cls) && classStartModuleMatchesTuitionPlan(cls, refs);
  }

  if (!isUpcomingClass(cls)) return false;

  if (!hasClassStartModule(cls)) return true;

  return classStartModuleMatchesTuitionPlan(cls, refs);
}

export function filterClassesByTuitionPlanEligibility<
  T extends ClassModuleEligibilityLike,
>(classes: T[], tuitionPlan?: TuitionPlan | null) {
  return classes.filter((cls) => isClassEligibleForTuitionPlan(cls, tuitionPlan));
}

export function filterSuggestedClassBucketByTuitionPlanEligibility(
  bucket: SuggestedClassBucket,
  tuitionPlan?: TuitionPlan | null,
): SuggestedClassBucket {
  const suggestedClasses = filterClassesByTuitionPlanEligibility(
    bucket.suggestedClasses || [],
    tuitionPlan,
  );
  const alternativeClasses = filterClassesByTuitionPlanEligibility(
    bucket.alternativeClasses || [],
    tuitionPlan,
  );
  const secondarySuggestedClasses = filterClassesByTuitionPlanEligibility(
    bucket.secondarySuggestedClasses || [],
    tuitionPlan,
  );
  const secondaryAlternativeClasses = filterClassesByTuitionPlanEligibility(
    bucket.secondaryAlternativeClasses || [],
    tuitionPlan,
  );

  return {
    ...bucket,
    length:
      suggestedClasses.length +
      alternativeClasses.length +
      secondarySuggestedClasses.length +
      secondaryAlternativeClasses.length,
    suggestedClasses,
    alternativeClasses,
    secondarySuggestedClasses,
    secondaryAlternativeClasses,
  };
}

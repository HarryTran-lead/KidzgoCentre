"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Save,
  Settings2,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LeadPagination from "@/components/portal/leads/LeadPagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";
import {
  createProgramProgressionRule,
  getProgramProgressionProgramOptions,
  getProgramProgressionRules,
  updateProgramProgressionRule,
  type ProgramProgressionLookupOption,
} from "@/lib/api/programProgressionService";
import type {
  ProgramProgressionClassificationBand,
  ProgramProgressionMethod,
  ProgramProgressionRule,
  ProgramProgressionRuleUpsertPayload,
  ProgramProgressionShieldMapping,
} from "@/types/program-progression";

type ProgramProgressionRulesPanelProps = {
  canManageRules: boolean;
  isStudentView?: boolean;
};

type ShieldMappingFormRow = {
  id: string;
  skill: string;
  sourceShieldId: string;
  targetShieldId: string;
};

type ClassificationBandFormRow = {
  id: string;
  minimumScore: string;
  maximumScore: string;
  classification: string;
  targetProgramId: string;
};

type ShieldOption = {
  id: string;
  name: string;
  skill?: string;
  programId?: string;
};

type RuleFormState = {
  sourceProgramId: string;
  targetProgramId: string;
  method: ProgramProgressionMethod;
  minimumShieldCount: string;
  minimumSkillShieldCount: string;
  minimumOverallScore: string;
  carryOverRemainingSessions: boolean;
  stopCurrentEnrollmentOnApproval: boolean;
  isActive: boolean;
  notes: string;
  shieldMappings: ShieldMappingFormRow[];
  classificationBands: ClassificationBandFormRow[];
};

const FILTER_ALL_VALUE = "all";
const TARGET_NONE_VALUE = "__none__";
const EMPTY_SELECT_VALUE = "__empty__";
const PAGE_SIZE = 10;

const DEFAULT_SKILL_OPTIONS = ["Listening", "Speaking", "Reading", "Writing"];

const DEFAULT_RULE_FORM: RuleFormState = {
  sourceProgramId: "",
  targetProgramId: "",
  method: "Shields",
  minimumShieldCount: "",
  minimumSkillShieldCount: "",
  minimumOverallScore: "",
  carryOverRemainingSessions: true,
  stopCurrentEnrollmentOnApproval: true,
  isActive: true,
  notes: "",
  shieldMappings: [],
  classificationBands: [],
};

function createRowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createShieldMappingRow(partial?: Partial<ShieldMappingFormRow>): ShieldMappingFormRow {
  return {
    id: createRowId("shield"),
    skill: partial?.skill || "",
    sourceShieldId: partial?.sourceShieldId || "",
    targetShieldId: partial?.targetShieldId || "",
  };
}

function createClassificationBandRow(
  partial?: Partial<ClassificationBandFormRow>
): ClassificationBandFormRow {
  return {
    id: createRowId("band"),
    minimumScore: partial?.minimumScore || "",
    maximumScore: partial?.maximumScore || "",
    classification: partial?.classification || "",
    targetProgramId: partial?.targetProgramId || "",
  };
}

function pickText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function toOptionalNumber(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function rangesOverlap(
  first: { min: number; max: number | null },
  second: { min: number; max: number | null }
): boolean {
  const firstMax = first.max == null ? Number.POSITIVE_INFINITY : first.max;
  const secondMax = second.max == null ? Number.POSITIVE_INFINITY : second.max;
  return first.min <= secondMax && second.min <= firstMax;
}

function resolveProgramProgressionErrorMessage(error: unknown): string {
  const fallback = "Vui lòng kiểm tra dữ liệu và thử lại.";
  const err = (error || {}) as {
    message?: string;
    response?: {
      data?: {
        title?: string;
        code?: string;
        message?: string;
        detail?: string;
        errors?: unknown;
      };
    };
  };

  const responseData = err.response?.data;
  const candidates = [
    responseData?.title,
    responseData?.code,
    responseData?.message,
    responseData?.detail,
    err.message,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (
    candidates.includes("prompt.programprogression.classificationbandsoverlap") ||
    candidates.includes("classificationbandsoverlap")
  ) {
    return "Các mức phân loại bị chồng chéo hoặc sát biên. Vui lòng chỉnh lại khoảng điểm để mỗi mức tách biệt (ví dụ: 1-4, 5-10).";
  }

  if (
    /classificationbands\[\d+\]\.label/i.test(candidates) ||
    candidates.includes("classificationbands") && candidates.includes("label") && candidates.includes("required")
  ) {
    return "Mỗi mức phân loại phải có trường Xếp loại (Label).";
  }

  if (
    candidates.includes("targetprogramduplicated") ||
    (candidates.includes("source") && candidates.includes("target") && candidates.includes("duplicate"))
  ) {
    return "Chương trình nguồn và chương trình áp dụng không được trùng nhau.";
  }

  if (
    candidates.includes("one or more validation errors occurred") ||
    candidates.includes("validation")
  ) {
    return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc và khoảng điểm phân loại.";
  }

  return fallback;
}

function formatMethodLabel(method: ProgramProgressionMethod): string {
  if (method === "PassFail") return "Đạt / Chưa đạt";
  if (method === "Shields") return "Khiên";
  return "Thang Cambridge";
}

export default function ProgramProgressionRulesPanel({
  canManageRules,
  isStudentView = false,
}: ProgramProgressionRulesPanelProps) {
  const { toast } = useToast();
  const [rules, setRules] = useState<ProgramProgressionRule[]>([]);
  const [programOptions, setProgramOptions] = useState<ProgramProgressionLookupOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sourceProgramIdFilter, setSourceProgramIdFilter] = useState(FILTER_ALL_VALUE);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ProgramProgressionRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(DEFAULT_RULE_FORM);

  const query = useMemo(() => {
    return {
      sourceProgramId:
        sourceProgramIdFilter === FILTER_ALL_VALUE
          ? undefined
          : sourceProgramIdFilter,
      isActive:
        activeFilter === "all"
          ? undefined
          : activeFilter === "active"
          ? true
          : false,
    };
  }, [sourceProgramIdFilter, activeFilter]);

  const mergedProgramOptions = useMemo(() => {
    const optionMap = new Map<string, ProgramProgressionLookupOption>();

    for (const option of programOptions) {
      optionMap.set(option.id, option);
    }

    for (const rule of rules) {
      if (rule.sourceProgramId && !optionMap.has(rule.sourceProgramId)) {
        optionMap.set(rule.sourceProgramId, {
          id: rule.sourceProgramId,
          name: rule.sourceProgramName || rule.sourceProgramId,
        });
      }

      if (rule.targetProgramId && !optionMap.has(rule.targetProgramId)) {
        optionMap.set(rule.targetProgramId, {
          id: rule.targetProgramId,
          name: rule.targetProgramName || rule.targetProgramId,
        });
      }
    }

    return Array.from(optionMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "vi")
    );
  }, [programOptions, rules]);

  const programNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of mergedProgramOptions) {
      map.set(option.id, option.name);
    }
    return map;
  }, [mergedProgramOptions]);

  const shieldOptionPools = useMemo(() => {
    const source: ShieldOption[] = [];
    const target: ShieldOption[] = [];

    for (const rule of rules) {
      const mappings = Array.isArray(rule.shieldMappings) ? rule.shieldMappings : [];

      for (const mapping of mappings) {
        const raw = mapping as unknown as Record<string, unknown>;
        const skill = pickText(raw.skill, raw.skillName, raw.skillCode) || undefined;

        const sourceShieldId = pickText(
          raw.sourceShieldId,
          raw.sourceBadgeId,
          raw.sourceId
        );
        const sourceShieldName = pickText(
          raw.sourceShieldName,
          raw.sourceBadgeName,
          raw.sourceName,
          sourceShieldId
        );

        if (sourceShieldId) {
          source.push({
            id: sourceShieldId,
            name: sourceShieldName || sourceShieldId,
            skill,
            programId: rule.sourceProgramId || undefined,
          });
        }

        const targetShieldId = pickText(
          raw.targetShieldId,
          raw.targetBadgeId,
          raw.targetId
        );
        const targetShieldName = pickText(
          raw.targetShieldName,
          raw.targetBadgeName,
          raw.targetName,
          targetShieldId
        );

        if (targetShieldId) {
          target.push({
            id: targetShieldId,
            name: targetShieldName || targetShieldId,
            skill,
            programId: rule.targetProgramId || undefined,
          });
        }
      }
    }

    const dedupe = (items: ShieldOption[]): ShieldOption[] => {
      const map = new Map<string, ShieldOption>();

      for (const item of items) {
        const key = `${item.id}::${item.skill || ""}::${item.programId || ""}`;
        if (!map.has(key)) {
          map.set(key, item);
        }
      }

      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
    };

    return {
      source: dedupe(source),
      target: dedupe(target),
    };
  }, [rules]);

  const skillOptions = useMemo(() => {
    const options = new Set<string>(DEFAULT_SKILL_OPTIONS);

    for (const rule of rules) {
      const mappings = Array.isArray(rule.shieldMappings) ? rule.shieldMappings : [];
      for (const mapping of mappings) {
        const raw = mapping as unknown as Record<string, unknown>;
        const skill = pickText(raw.skill, raw.skillName, raw.skillCode);
        if (skill) options.add(skill);
      }
    }

    for (const row of form.shieldMappings) {
      if (row.skill.trim()) {
        options.add(row.skill.trim());
      }
    }

    return Array.from(options).sort((a, b) => a.localeCompare(b, "vi"));
  }, [form.shieldMappings, rules]);

  const resolveShieldOptions = useCallback(
    (kind: "source" | "target", skill: string, currentValue: string): ShieldOption[] => {
      const selectedProgramId =
        kind === "source" ? form.sourceProgramId.trim() : form.targetProgramId.trim();

      const optionPool = kind === "source" ? shieldOptionPools.source : shieldOptionPools.target;

      let options = optionPool.filter((option) => {
        const matchesProgram = selectedProgramId
          ? !option.programId || option.programId === selectedProgramId
          : true;

        const matchesSkill = skill
          ? !option.skill || option.skill === skill
          : true;

        return matchesProgram && matchesSkill;
      });

      if (currentValue && !options.some((option) => option.id === currentValue)) {
        options = [
          ...options,
          {
            id: currentValue,
            name: currentValue,
            skill: skill || undefined,
            programId: selectedProgramId || undefined,
          },
        ];
      }

      return options.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    },
    [form.sourceProgramId, form.targetProgramId, shieldOptionPools.source, shieldOptionPools.target]
  );

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getProgramProgressionRules(query);
      setRules(items);
    } catch (error) {
      console.error("Failed to load program progression rules", error);
      toast({
        variant: "destructive",
        title: "Không thể tải quy tắc",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, toast]);

  const loadProgramOptions = useCallback(async () => {
    setIsLoadingPrograms(true);
    try {
      const options = await getProgramProgressionProgramOptions();
      setProgramOptions(options);
    } catch (error) {
      console.error("Failed to load program options", error);
      toast({
        variant: "warning",
        title: "Không thể tải danh sách chương trình",
        description: "Bạn vẫn có thể xem dữ liệu hiện tại và thử tải lại.",
      });
    } finally {
      setIsLoadingPrograms(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  useEffect(() => {
    void loadProgramOptions();
  }, [loadProgramOptions]);

  const filteredRules = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rules;

    return rules.filter((rule) => {
      const sourceName =
        (rule.sourceProgramId ? programNameById.get(rule.sourceProgramId) : undefined) ||
        rule.sourceProgramName ||
        rule.sourceProgramId ||
        "";
      const targetName =
        (rule.targetProgramId ? programNameById.get(rule.targetProgramId) : undefined) ||
        rule.targetProgramName ||
        rule.targetProgramId ||
        "";

      const searchable = [
        sourceName,
        rule.sourceProgramId,
        targetName,
        rule.targetProgramId,
        formatMethodLabel(rule.method),
        rule.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [rules, searchQuery, programNameById]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sourceProgramIdFilter, activeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentRows = filteredRules.slice(startIndex, startIndex + PAGE_SIZE);

  const ruleStats = useMemo(() => {
    const activeCount = rules.filter((rule) => rule.isActive).length;
    const inactiveCount = rules.length - activeCount;
    const shieldCount = rules.filter((rule) => rule.method === "Shields").length;
    const cambridgeCount = rules.filter((rule) => rule.method === "CambridgeScale").length;

    return {
      totalCount: rules.length,
      activeCount,
      inactiveCount,
      shieldCount,
      cambridgeCount,
    };
  }, [rules]);

  const resolveProgramName = useCallback(
    (programId?: string | null, fallbackName?: string | null): string => {
      if (!programId) return fallbackName || "--";
      return programNameById.get(programId) || fallbackName || programId;
    },
    [programNameById]
  );

  const openCreate = () => {
    setEditingRule(null);
    setForm({
      ...DEFAULT_RULE_FORM,
      shieldMappings: [createShieldMappingRow()],
    });
    setIsModalOpen(true);
  };

  const openEdit = (rule: ProgramProgressionRule) => {
    const shieldMappings = (Array.isArray(rule.shieldMappings) ? rule.shieldMappings : [])
      .map((mapping) => {
        const raw = mapping as unknown as Record<string, unknown>;
        return createShieldMappingRow({
          skill: pickText(raw.skill, raw.skillName, raw.skillCode),
          sourceShieldId: pickText(
            raw.sourceShieldId,
            raw.sourceBadgeId,
            raw.sourceId
          ),
          targetShieldId: pickText(
            raw.targetShieldId,
            raw.targetBadgeId,
            raw.targetId
          ),
        });
      })
      .filter((item) => item.skill || item.sourceShieldId || item.targetShieldId);

    const classificationBands = (Array.isArray(rule.classificationBands)
      ? rule.classificationBands
      : []
    )
      .map((band) => {
        const raw = band as unknown as Record<string, unknown>;
        return createClassificationBandRow({
          minimumScore:
            band.minimumScore == null || Number.isNaN(Number(band.minimumScore))
              ? ""
              : String(band.minimumScore),
          maximumScore:
            band.maximumScore == null || Number.isNaN(Number(band.maximumScore))
              ? ""
              : String(band.maximumScore),
          classification: pickText(raw.label, raw.classification, raw.classificationName),
          targetProgramId: pickText(raw.targetProgramId),
        });
      })
      .filter(
        (item) =>
          item.minimumScore ||
          item.maximumScore ||
          item.classification ||
          item.targetProgramId
      );

    setEditingRule(rule);
    setForm({
      sourceProgramId: rule.sourceProgramId || "",
      targetProgramId: rule.targetProgramId || "",
      method: rule.method,
      minimumShieldCount:
        rule.minimumShieldCount == null ? "" : String(rule.minimumShieldCount),
      minimumSkillShieldCount:
        rule.minimumSkillShieldCount == null
          ? ""
          : String(rule.minimumSkillShieldCount),
      minimumOverallScore:
        rule.minimumOverallScore == null ? "" : String(rule.minimumOverallScore),
      carryOverRemainingSessions: rule.carryOverRemainingSessions,
      stopCurrentEnrollmentOnApproval: rule.stopCurrentEnrollmentOnApproval,
      isActive: rule.isActive,
      notes: rule.notes || "",
      shieldMappings,
      classificationBands,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingRule(null);
    setForm(DEFAULT_RULE_FORM);
  };

  const addShieldMappingRow = () => {
    setForm((prev) => ({
      ...prev,
      shieldMappings: [...prev.shieldMappings, createShieldMappingRow()],
    }));
  };

  const updateShieldMappingRow = (
    rowId: string,
    field: "skill" | "sourceShieldId" | "targetShieldId",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      shieldMappings: prev.shieldMappings.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const removeShieldMappingRow = (rowId: string) => {
    setForm((prev) => ({
      ...prev,
      shieldMappings: prev.shieldMappings.filter((row) => row.id !== rowId),
    }));
  };

  const addClassificationBandRow = () => {
    setForm((prev) => ({
      ...prev,
      classificationBands: [...prev.classificationBands, createClassificationBandRow()],
    }));
  };

  const updateClassificationBandRow = (
    rowId: string,
    field: "minimumScore" | "maximumScore" | "classification" | "targetProgramId",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      classificationBands: prev.classificationBands.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const removeClassificationBandRow = (rowId: string) => {
    setForm((prev) => ({
      ...prev,
      classificationBands: prev.classificationBands.filter((row) => row.id !== rowId),
    }));
  };

  const onSubmit = async () => {
    const sourceProgramId = form.sourceProgramId.trim();
    const targetProgramId = form.targetProgramId.trim();
    if (!sourceProgramId) {
      toast({
        variant: "warning",
        title: "Thiếu dữ liệu",
        description: "Chương trình nguồn là bắt buộc.",
      });
      return;
    }

    if (targetProgramId && sourceProgramId === targetProgramId) {
      toast({
        variant: "warning",
        title: "Chương trình không hợp lệ",
        description: "Chương trình nguồn và chương trình áp dụng không được trùng nhau.",
      });
      return;
    }

    if ((form.method === "PassFail" || form.method === "Shields") && !targetProgramId) {
      toast({
        variant: "warning",
        title: "Thiếu chương trình áp dụng",
        description: "Phương pháp này yêu cầu chọn chương trình áp dụng cố định.",
      });
      return;
    }

    const sanitizedShieldMappings = form.shieldMappings.map((item) => ({
      skill: item.skill.trim(),
      sourceShieldId: item.sourceShieldId.trim(),
      targetShieldId: item.targetShieldId.trim(),
    }));

    const hasIncompleteShieldMapping = sanitizedShieldMappings.some((item) => {
      const filled = [item.skill, item.sourceShieldId, item.targetShieldId].filter(Boolean).length;
      return filled > 0 && filled < 3;
    });

    if (form.method === "Shields" && hasIncompleteShieldMapping) {
      toast({
        variant: "warning",
        title: "Thiếu dữ liệu ánh xạ khiên",
        description: "Mỗi dòng phải chọn đủ Kỹ năng, Khiên chương trình gốc và Khiên áp dụng.",
      });
      return;
    }

    const shieldMappings: ProgramProgressionShieldMapping[] = sanitizedShieldMappings
      .filter((item) => item.skill && item.sourceShieldId && item.targetShieldId)
      .map((item) => ({
        skill: item.skill,
        sourceShieldId: item.sourceShieldId,
        targetShieldId: item.targetShieldId,
      }));

    if (form.method === "Shields" && shieldMappings.length === 0) {
      toast({
        variant: "warning",
        title: "Thiếu ánh xạ khiên",
        description: "Vui lòng thêm ít nhất một dòng ánh xạ khiên hợp lệ.",
      });
      return;
    }

    if (
      form.method === "Shields" &&
      toOptionalNumber(form.minimumShieldCount) == null &&
      toOptionalNumber(form.minimumSkillShieldCount) == null
    ) {
      toast({
        variant: "warning",
        title: "Thiếu điều kiện khiên",
        description: "Cần ít nhất một điều kiện: Số khiên tối thiểu hoặc Số khiên kỹ năng tối thiểu.",
      });
      return;
    }

    const sanitizedBands = form.classificationBands.map((band) => ({
      minimumScoreRaw: band.minimumScore.trim(),
      maximumScoreRaw: band.maximumScore.trim(),
      minimumScore: toOptionalNumber(band.minimumScore),
      maximumScore: toOptionalNumber(band.maximumScore),
      classification: band.classification.trim(),
      targetProgramId: band.targetProgramId.trim(),
    }));

    const hasIncompleteBand = sanitizedBands.some((band) => {
      const hasAnyValue =
        Boolean(band.minimumScoreRaw) ||
        Boolean(band.maximumScoreRaw) ||
        Boolean(band.classification) ||
        Boolean(band.targetProgramId);

      if (!hasAnyValue) return false;

      const filled = [
        band.minimumScoreRaw,
        band.classification,
        band.targetProgramId,
      ].filter(Boolean).length;

      return filled < 3;
    });

    if (form.method === "CambridgeScale" && hasIncompleteBand) {
      toast({
        variant: "warning",
        title: "Thiếu dữ liệu mức phân loại",
        description: "Mỗi dòng phải có đủ Điểm tối thiểu, Xếp loại và Chương trình áp dụng. Điểm tối đa có thể để trống cho mức cuối.",
      });
      return;
    }

    const hasInvalidBandRange = sanitizedBands.some(
      (band) =>
        band.minimumScore != null &&
        band.maximumScore != null &&
        band.minimumScore > band.maximumScore
    );

    if (form.method === "CambridgeScale" && hasInvalidBandRange) {
      toast({
        variant: "warning",
        title: "Khoảng điểm không hợp lệ",
        description: "Điểm Min không được lớn hơn điểm Max.",
      });
      return;
    }

    const classificationBands: ProgramProgressionClassificationBand[] = sanitizedBands
      .filter(
        (band) =>
          band.minimumScore != null &&
          band.classification &&
          band.targetProgramId
      )
      .map((band) => ({
        minimumScore: band.minimumScore as number,
        maximumScore: band.maximumScore ?? null,
        label: band.classification,
        classification: band.classification,
        targetProgramId: band.targetProgramId,
      }));

    // Backend thường validate theo thứ tự tăng điểm tối thiểu.
    const sortedClassificationBands = [...classificationBands].sort(
      (a, b) => a.minimumScore - b.minimumScore
    );

    const hasOpenEndedBeforeLater = sortedClassificationBands.some(
      (band, index) => band.maximumScore == null && index < sortedClassificationBands.length - 1
    );

    if (form.method === "CambridgeScale" && hasOpenEndedBeforeLater) {
      toast({
        variant: "warning",
        title: "Khoảng điểm mở chưa hợp lệ",
        description: "Khoảng không có Điểm tối đa chỉ được phép nằm ở mức phân loại cuối cùng.",
      });
      return;
    }

    const hasBandsOverlap = sortedClassificationBands.some((currentBand, index) =>
      sortedClassificationBands
        .slice(index + 1)
        .some((nextBand) =>
          rangesOverlap(
            { min: currentBand.minimumScore, max: currentBand.maximumScore ?? null },
            { min: nextBand.minimumScore, max: nextBand.maximumScore ?? null }
          )
        )
    );

    if (form.method === "CambridgeScale" && hasBandsOverlap) {
      toast({
        variant: "warning",
        title: "Khoảng điểm bị chồng chéo",
        description: "Các mức phân loại không được giao nhau. Ví dụ hợp lệ: 1-4 và 5-10.",
      });
      return;
    }

    const minimumOverallScore = toOptionalNumber(form.minimumOverallScore);

    if (form.method === "CambridgeScale" && minimumOverallScore == null) {
      toast({
        variant: "warning",
        title: "Thiếu điểm tổng tối thiểu",
        description: "Phương pháp Thang Cambridge bắt buộc có Điểm tổng tối thiểu.",
      });
      return;
    }

    if (
      form.method === "CambridgeScale" &&
      !targetProgramId &&
      sortedClassificationBands.length === 0
    ) {
      toast({
        variant: "warning",
        title: "Thiếu mức phân loại",
        description: "Khi không chọn chương trình áp dụng cố định, cần thêm ít nhất một mức phân loại hợp lệ.",
      });
      return;
    }

    const payload: ProgramProgressionRuleUpsertPayload = {
      sourceProgramId,
      targetProgramId: targetProgramId || null,
      method: form.method,
      minimumShieldCount:
        form.method === "Shields" ? toOptionalNumber(form.minimumShieldCount) : null,
      minimumSkillShieldCount:
        form.method === "Shields" ? toOptionalNumber(form.minimumSkillShieldCount) : null,
      minimumOverallScore: form.method === "CambridgeScale" ? minimumOverallScore : null,
      carryOverRemainingSessions: form.carryOverRemainingSessions,
      stopCurrentEnrollmentOnApproval: form.stopCurrentEnrollmentOnApproval,
      isActive: form.isActive,
      notes: form.notes.trim() || null,
      shieldMappings: form.method === "Shields" ? shieldMappings : [],
      classificationBands:
        form.method === "CambridgeScale" && !targetProgramId ? sortedClassificationBands : [],
    };

    setIsSubmitting(true);
    try {
      if (editingRule) {
        await updateProgramProgressionRule(editingRule.id, payload);
      } else {
        await createProgramProgressionRule(payload);
      }

      toast({
        variant: "success",
        title: editingRule ? "Cập nhật thành công" : "Tạo mới thành công",
        description: "Quy tắc tiến trình đã được lưu.",
      });

      closeModal();
      await loadRules();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Không thể lưu quy tắc",
        description: resolveProgramProgressionErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-red-600 to-red-700 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-2 text-white shadow-sm">
              <Settings2 size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Tổng quy tắc</div>
              <div className="text-xl font-bold text-gray-900">{ruleStats.totalCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-red-500 to-red-600 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-red-500 to-red-600 p-2 text-white shadow-sm">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Đang hoạt động</div>
              <div className="text-xl font-bold text-gray-900">{ruleStats.activeCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-gray-600 to-gray-700 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-gray-600 to-gray-700 p-2 text-white shadow-sm">
              <XCircle size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Ngưng hoạt động</div>
              <div className="text-xl font-bold text-gray-900">{ruleStats.inactiveCount}</div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full bg-linear-to-r from-red-400 to-rose-500 opacity-5 blur-xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="rounded-xl bg-linear-to-r from-red-400 to-rose-500 p-2 text-white shadow-sm">
              <BarChart3 size={18} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xs font-medium text-gray-600">Khiên / Cambridge</div>
              <div className="text-xl font-bold text-gray-900">
                {ruleStats.shieldCount} / {ruleStats.cambridgeCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          isStudentView
            ? "rounded-2xl border border-white/15 bg-white/5 p-4"
            : "rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50 p-4"
        }
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative lg:flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo chương trình, phương pháp, ghi chú..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <Select
              value={sourceProgramIdFilter}
              onValueChange={setSourceProgramIdFilter}
              searchPlaceholder="Tìm chương trình..."
              emptyText="Không có chương trình phù hợp."
            >
              <SelectTrigger className="h-10 min-w-44 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn chương trình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>Tất cả chương trình</SelectItem>
                {mergedProgramOptions.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={activeFilter}
              onValueChange={(value) =>
                setActiveFilter(value as "all" | "active" | "inactive")
              }
              searchPlaceholder="Tìm kiếm trạng thái..."
              emptyText="Không có trạng thái phù hợp."
            >
              <SelectTrigger className="h-10 min-w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void Promise.all([loadProgramOptions(), loadRules()]);
            }}
            className={
              isStudentView
                ? "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                : "inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
            }
          >
            <RefreshCw size={16} /> Làm mới
          </button>

          {canManageRules && (
            <button
              type="button"
              onClick={openCreate}
              className={
                isStudentView
                  ? "inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white"
                  : "inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white"
              }
            >
              <Plus size={16} /> Tạo quy tắc
            </button>
          )}
        </div>
      </div>

      <div
        className={
          isStudentView
            ? "rounded-2xl border border-white/15 bg-white/5"
            : "overflow-hidden rounded-2xl border border-red-200 bg-white"
        }
      >
        <div
          className={
            isStudentView
              ? "border-b border-white/10 p-4"
              : "border-b border-red-100 bg-linear-to-r from-red-500/10 to-red-700/10 p-4"
          }
        >
          <div className="flex items-center justify-between">
            <h3
              className={
                isStudentView
                  ? "text-sm font-semibold text-white"
                  : "text-sm font-semibold text-gray-900"
              }
            >
              Danh sách quy tắc chuyển chương trình
            </h3>
            {!isLoading && (
              <span className={isStudentView ? "text-xs text-indigo-100" : "text-xs text-gray-500"}>
                {filteredRules.length} quy tắc
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {isLoading || isLoadingPrograms ? (
            <div className={isStudentView ? "text-sm text-indigo-100" : "text-sm text-gray-500"}>
              Đang tải dữ liệu...
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="border border-dashed border-red-200 p-6 text-center">
              <Settings2 size={22} className="mx-auto mb-2 text-red-500" />
              <div className="text-sm font-semibold text-gray-900">Chưa có quy tắc nào</div>
              <p className="mt-1 text-xs text-gray-500">
                Bạn có thể tạo quy tắc mới hoặc nới bộ lọc.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden border border-red-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Chương trình nguồn
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Chương trình áp dụng
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Phương pháp
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Điều kiện
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {currentRows.map((rule) => (
                      <tr
                        key={rule.id}
                        className="group hover:bg-linear-to-r hover:from-red-50/50 hover:to-white transition-all duration-200"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">
                            {resolveProgramName(rule.sourceProgramId, rule.sourceProgramName)}
                          </div>
                          <div className="text-xs text-gray-500">{rule.sourceProgramId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-1 font-medium">
                            <ArrowRight size={12} className="text-gray-400" />
                            <span>
                              {rule.targetProgramId
                                ? resolveProgramName(rule.targetProgramId, rule.targetProgramName)
                                : "Dùng phân loại"}
                            </span>
                          </div>
                          {rule.targetProgramId && (
                            <div className="text-xs text-gray-500">{rule.targetProgramId}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatMethodLabel(rule.method)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          <div>
                            Khiên: {rule.minimumShieldCount ?? "--"} | Khiên kỹ năng: {rule.minimumSkillShieldCount ?? "--"}
                          </div>
                          <div>
                            Điểm tổng: {rule.minimumOverallScore ?? "--"} | Bảo lưu: {rule.carryOverRemainingSessions ? "Có" : "Không"}
                          </div>
                          <div>
                            Dừng ghi danh: {rule.stopCurrentEnrollmentOnApproval ? "Có" : "Không"}
                          </div>
                          {rule.notes && <div className="text-gray-500">Ghi chú: {rule.notes}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              rule.isActive
                                ? "rounded-full border border-green-200 bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                                : "rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600"
                            }
                          >
                            {rule.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {canManageRules ? (
                            <button
                              type="button"
                              onClick={() => openEdit(rule)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700"
                            >
                              <Pencil size={12} /> Sửa
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Chỉ xem</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <LeadPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={PAGE_SIZE}
                totalCount={filteredRules.length}
                itemLabel="quy tắc"
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={() => undefined}
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-linear-to-r from-red-600 to-red-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {editingRule ? "Cập nhật quy tắc" : "Tạo quy tắc mới"}
                  </h3>
                  <p className="text-xs text-red-100">Thiết lập điều kiện chuyển chương trình</p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full p-1 hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Chương trình gốc *</label>
                  <Select
                    value={form.sourceProgramId}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, sourceProgramId: value }))
                    }
                    searchPlaceholder="Tìm chương trình gốc..."
                    emptyText="Không có chương trình phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue placeholder="Chọn chương trình gốc" />
                    </SelectTrigger>
                    <SelectContent>
                      {mergedProgramOptions.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">
                    Chương trình áp dụng
                  </label>
                  <Select
                    value={form.targetProgramId || TARGET_NONE_VALUE}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        targetProgramId: value === TARGET_NONE_VALUE ? "" : value,
                      }))
                    }
                    searchPlaceholder="Tìm chương trình áp dụng..."
                    emptyText="Không có chương trình phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue placeholder="Chọn chương trình áp dụng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TARGET_NONE_VALUE}>Không cố định (dùng phân loại)</SelectItem>
                      {mergedProgramOptions.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.method === "CambridgeScale" && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Với Cambridge, bạn có thể chọn chương trình áp dụng cố định hoặc để trống để dùng mức phân loại bên dưới.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">Phương pháp</label>
                  <Select
                    value={form.method}
                    onValueChange={(value) => {
                      const nextMethod = value as ProgramProgressionMethod;
                      setForm((prev) => ({
                        ...prev,
                        method: nextMethod,
                        minimumOverallScore:
                          nextMethod === "CambridgeScale" ? prev.minimumOverallScore : "",
                        minimumShieldCount:
                          nextMethod === "Shields" ? prev.minimumShieldCount : "",
                        minimumSkillShieldCount:
                          nextMethod === "Shields" ? prev.minimumSkillShieldCount : "",
                        shieldMappings:
                          nextMethod === "Shields" && prev.shieldMappings.length === 0
                            ? [createShieldMappingRow()]
                            : nextMethod === "Shields"
                            ? prev.shieldMappings
                            : [],
                        classificationBands:
                          nextMethod === "CambridgeScale" && prev.classificationBands.length === 0
                            ? [createClassificationBandRow()]
                            : nextMethod === "CambridgeScale"
                            ? prev.classificationBands
                            : [],
                      }));
                    }}
                    searchPlaceholder="Tìm kiếm phương pháp..."
                    emptyText="Không có phương pháp phù hợp."
                  >
                    <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                      <SelectValue placeholder="Chọn phương pháp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PassFail">Đạt / Chưa đạt</SelectItem>
                      <SelectItem value="Shields">Khiên</SelectItem>
                      <SelectItem value="CambridgeScale">Thang Cambridge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.method === "CambridgeScale" && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">Điểm tổng tối thiểu</label>
                    <input
                      value={form.minimumOverallScore}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, minimumOverallScore: event.target.value }))
                      }
                      className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {form.method === "Shields" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">Số khiên tối thiểu</label>
                      <input
                        value={form.minimumShieldCount}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, minimumShieldCount: event.target.value }))
                        }
                        className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-gray-600">Số khiên kỹ năng tối thiểu</label>
                      <input
                        value={form.minimumSkillShieldCount}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            minimumSkillShieldCount: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.carryOverRemainingSessions}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        carryOverRemainingSessions: event.target.checked,
                      }))
                    }
                  />
                  Bảo lưu số buổi còn lại
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.stopCurrentEnrollmentOnApproval}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        stopCurrentEnrollmentOnApproval: event.target.checked,
                      }))
                    }
                  />
                  Dừng ghi danh hiện tại khi duyệt
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                    }
                  />
                  Đang hoạt động
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-600">Ghi chú</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                />
              </div>

              {form.method === "Shields" && (
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/30 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Ánh xạ khiên</h4>
                      <p className="text-xs text-gray-500">
                        Chọn theo thứ tự: Kỹ năng - Khiên chương trình gốc - Khiên áp dụng.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addShieldMappingRow}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700"
                    >
                      <Plus size={12} /> Thêm dòng
                    </button>
                  </div>

                  {form.shieldMappings.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-red-200 bg-white p-3 text-xs text-gray-600">
                      Chưa có ánh xạ khiên. Bấm "Thêm dòng" để bắt đầu.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.shieldMappings.map((row) => {
                        const sourceShieldOptions = resolveShieldOptions(
                          "source",
                          row.skill,
                          row.sourceShieldId
                        );
                        const targetShieldOptions = resolveShieldOptions(
                          "target",
                          row.skill,
                          row.targetShieldId
                        );

                        return (
                          <div
                            key={row.id}
                            className="grid gap-2 rounded-xl border border-red-100 bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                          >
                            <div>
                              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                                Kỹ năng
                              </label>
                              <Select
                                value={row.skill || EMPTY_SELECT_VALUE}
                                onValueChange={(value) =>
                                  updateShieldMappingRow(
                                    row.id,
                                    "skill",
                                    value === EMPTY_SELECT_VALUE ? "" : value
                                  )
                                }
                                searchPlaceholder="Tìm kỹ năng..."
                                emptyText="Không có kỹ năng phù hợp."
                              >
                                <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                                  <SelectValue placeholder="Chọn kỹ năng" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={EMPTY_SELECT_VALUE}>Chưa chọn</SelectItem>
                                  {skillOptions.map((skill) => (
                                    <SelectItem key={skill} value={skill}>
                                      {skill}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                                Khiên chương trình gốc
                              </label>
                              <Select
                                value={row.sourceShieldId || EMPTY_SELECT_VALUE}
                                onValueChange={(value) =>
                                  updateShieldMappingRow(
                                    row.id,
                                    "sourceShieldId",
                                    value === EMPTY_SELECT_VALUE ? "" : value
                                  )
                                }
                                searchPlaceholder="Tìm khiên nguồn..."
                                emptyText="Không có khiên nguồn phù hợp."
                              >
                                <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                                  <SelectValue placeholder="Chọn khiên nguồn" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={EMPTY_SELECT_VALUE}>Chưa chọn</SelectItem>
                                  {sourceShieldOptions.map((option) => (
                                    <SelectItem key={`${row.id}-source-${option.id}`} value={option.id}>
                                      {option.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                                Khiên áp dụng
                              </label>
                              <Select
                                value={row.targetShieldId || EMPTY_SELECT_VALUE}
                                onValueChange={(value) =>
                                  updateShieldMappingRow(
                                    row.id,
                                    "targetShieldId",
                                    value === EMPTY_SELECT_VALUE ? "" : value
                                  )
                                }
                                searchPlaceholder="Tìm khiên áp dụng..."
                                emptyText="Không có khiên áp dụng phù hợp."
                              >
                                <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                                  <SelectValue placeholder="Chọn khiên áp dụng" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={EMPTY_SELECT_VALUE}>Chưa chọn</SelectItem>
                                  {targetShieldOptions.map((option) => (
                                    <SelectItem key={`${row.id}-target-${option.id}`} value={option.id}>
                                      {option.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeShieldMappingRow(row.id)}
                                className="rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                Xóa
                              </button>
                            </div>

                            {(sourceShieldOptions.length === 0 || targetShieldOptions.length === 0) && (
                              <p className="md:col-span-4 text-[11px] text-amber-700">
                                Một số danh sách khiên đang trống theo chương trình đã chọn. Bạn có thể tạo quy tắc mẫu trước để hệ thống ghi nhận danh mục khiên.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {form.method === "CambridgeScale" && (
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/30 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Mức phân loại</h4>
                      <p className="text-xs text-gray-500">
                        Cấu hình theo từng khoảng điểm: Tối thiểu - Tối đa - Xếp loại - Chương trình áp dụng.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addClassificationBandRow}
                      disabled={Boolean(form.targetProgramId.trim())}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={12} /> Thêm mức
                    </button>
                  </div>

                  {form.targetProgramId.trim() ? (
                    <div className="rounded-lg border border-dashed border-red-200 bg-white p-3 text-xs text-gray-600">
                      Đang dùng chương trình áp dụng cố định. Bỏ chọn "Chương trình áp dụng" nếu bạn muốn phân luồng theo các mức phân loại.
                    </div>
                  ) : form.classificationBands.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-red-200 bg-white p-3 text-xs text-gray-600">
                      Chưa có mức phân loại. Bấm "Thêm mức" để bắt đầu.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.classificationBands.map((row, index) => (
                        <div
                          key={row.id}
                          className="grid gap-2 rounded-xl border border-red-100 bg-white p-3 md:grid-cols-[90px_90px_1fr_1fr_auto]"
                        >
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600">
                            Điểm tối thiểu
                            </label>
                            <input
                              type="number"
                              value={row.minimumScore}
                              onChange={(event) =>
                                updateClassificationBandRow(
                                  row.id,
                                  "minimumScore",
                                  event.target.value
                                )
                              }
                              className="w-full rounded-xl border border-red-200 px-2 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600">
                            Điểm tối đa
                            </label>
                            <input
                              type="number"
                              value={row.maximumScore}
                              onChange={(event) =>
                                updateClassificationBandRow(
                                  row.id,
                                  "maximumScore",
                                  event.target.value
                                )
                              }
                              className="w-full rounded-xl border border-red-200 px-2 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600">
                              Xếp loại
                            </label>
                            <input
                              value={row.classification}
                              onChange={(event) =>
                                updateClassificationBandRow(
                                  row.id,
                                  "classification",
                                  event.target.value
                                )
                              }
                              placeholder="Ví dụ: Distinction"
                              className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-600">
                              Chương trình áp dụng
                            </label>
                            <Select
                              value={row.targetProgramId || EMPTY_SELECT_VALUE}
                              onValueChange={(value) =>
                                updateClassificationBandRow(
                                  row.id,
                                  "targetProgramId",
                                  value === EMPTY_SELECT_VALUE ? "" : value
                                )
                              }
                              searchPlaceholder="Tìm chương trình đích..."
                              emptyText="Không có chương trình phù hợp."
                            >
                              <SelectTrigger className="w-full rounded-xl border border-red-200 bg-white text-sm text-gray-700 data-[state=open]:border-red-300 data-[state=open]:ring-2 data-[state=open]:ring-red-100">
                                <SelectValue placeholder="Chọn chương trình" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={EMPTY_SELECT_VALUE}>Chưa chọn</SelectItem>
                                {mergedProgramOptions.map((program) => (
                                  <SelectItem key={`${row.id}-program-${program.id}`} value={program.id}>
                                    {program.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeClassificationBandRow(row.id)}
                              className="rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>

                          <p className="md:col-span-5 text-[11px] text-gray-500">
                            Mức {index + 1}: học viên có điểm trong khoảng này sẽ chuyển tới chương trình được chọn.
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.method === "PassFail" && (
                <div className="rounded-xl border border-red-200 bg-red-50/30 p-3 text-xs text-gray-600">
                  Phương pháp Đạt / Chưa đạt không yêu cầu ánh xạ khiên hoặc mức phân loại.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-red-100 bg-red-50/40 p-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void onSubmit()}
                disabled={isSubmitting || !form.sourceProgramId.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                <Save size={14} /> {isSubmitting ? "Đang lưu..." : "Lưu quy tắc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  Loader2,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import LeadPagination from "@/components/portal/leads/LeadPagination";
import RegistrationAssignModal from "@/components/portal/registrations/modals/RegistrationAssignModal";
import RegistrationDetailModal from "@/components/portal/registrations/modals/RegistrationDetailModal";
import RegistrationTransferModal from "@/components/portal/registrations/modals/RegistrationTransferModal";
import RegistrationUpgradeModal from "@/components/portal/registrations/modals/RegistrationUpgradeModal";
import { useToast } from "@/hooks/use-toast";
import {
  assignClassToRegistration,
  getRegistrationById,
  getRegistrations,
  suggestClassesForRegistration,
  transferRegistrationClass,
  upgradeRegistration,
} from "@/lib/api/registrationService";
import { getAllClasses } from "@/lib/api/classService";
import { getTuitionPlans } from "@/lib/api/tuitionPlanService";
import type { TuitionPlan } from "@/types/admin/tuition_plan";
import type {
  Registration,
  RegistrationStatus,
  RegistrationTrackType,
  SuggestedClassBucket,
} from "@/types/registration";
import RegistrationFilters from "./RegistrationFilters";

type Props = {
  branchId?: string;
  onTotalChange?: (total: number) => void;
};

type RegistrationSortKey =
  | "studentName"
  | "programName"
  | "tuitionPlanName"
  | "className"
  | "status"
  | "createdAt";

function statusLabel(status: RegistrationStatus) {
  const labels: Record<RegistrationStatus, string> = {
    New: "Mới",
    WaitingForClass: "Chờ xếp lớp",
    ClassAssigned: "Đã xếp lớp",
    Studying: "Đang học",
    Paused: "Tạm dừng",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return labels[status];
}

function statusClass(status: RegistrationStatus) {
  const classes: Record<RegistrationStatus, string> = {
    New: "border border-blue-200 bg-blue-50 text-blue-700",
    WaitingForClass: "border border-amber-200 bg-amber-50 text-amber-700",
    ClassAssigned: "border border-cyan-200 bg-cyan-50 text-cyan-700",
    Studying: "border border-green-200 bg-green-50 text-green-700",
    Paused: "border border-orange-200 bg-orange-50 text-orange-700",
    Completed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border border-red-200 bg-red-50 text-red-700",
  };
  return classes[status];
}

function toDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function formatSchedulePattern(value?: string | null) {
  if (!value) return "-";
  const raw = String(value).trim();
  if (!raw) return "-";
  if (!raw.includes("RRULE")) return raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;

  const normalized = raw.replace(/^RRULE:/i, "");
  const tokens = normalized.split(";").map((item) => item.trim());
  const map = new Map<string, string>();

  tokens.forEach((token) => {
    const [k, v] = token.split("=");
    if (!k || !v) return;
    map.set(k.toUpperCase(), v);
  });

  const dayMap: Record<string, string> = {
    MO: "T2",
    TU: "T3",
    WE: "T4",
    TH: "T5",
    FR: "T6",
    SA: "T7",
    SU: "CN",
  };

  const days = (map.get("BYDAY") || "")
    .split(",")
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean)
    .map((d) => dayMap[d] || d);
  const hour = map.get("BYHOUR");
  const minute = map.get("BYMINUTE") || "0";

  const pieces: string[] = [];
  if (days.length > 0) pieces.push(`Thứ: ${days.join(", ")}`);
  if (hour) pieces.push(`Lúc: ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);

  return pieces.length > 0 ? pieces.join(" • ") : raw;
}

function pickClassItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.page?.items)) return payload.data.page.items;
  if (Array.isArray(payload?.data?.classes?.items)) return payload.data.classes.items;
  if (Array.isArray(payload?.data?.classes)) return payload.data.classes;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getClassRemainingSlots(cls: any) {
  if (typeof cls?.remainingSlots === "number") return cls.remainingSlots;
  if (typeof cls?.capacity === "number" && typeof cls?.currentEnrollment === "number") {
    return cls.capacity - cls.currentEnrollment;
  }
  if (typeof cls?.capacity === "number" && typeof cls?.currentEnrollmentCount === "number") {
    return cls.capacity - cls.currentEnrollmentCount;
  }
  if (typeof cls?.maxStudents === "number" && typeof cls?.currentStudentCount === "number") {
    return cls.maxStudents - cls.currentStudentCount;
  }
  return null;
}

function getClassDisplayName(cls: any) {
  return String(cls?.className || cls?.title || cls?.name || cls?.code || cls?.id || "");
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export default function StaffRegistrationOverview({
  branchId,
  onTotalChange,
}: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Registration[]>([]);
  const [summaryRows, setSummaryRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RegistrationStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Registration | null>(
    null,
  );
  const [sortKey, setSortKey] = useState<RegistrationSortKey | null>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selectedActionRegistration, setSelectedActionRegistration] =
    useState<Registration | null>(null);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTuitionPlanId, setUpgradeTuitionPlanId] = useState("");
  const [upgradeTuitionPlans, setUpgradeTuitionPlans] = useState<TuitionPlan[]>([]);
  const [isLoadingUpgradeOptions, setIsLoadingUpgradeOptions] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignViewMode, setAssignViewMode] = useState<"none" | "suggested" | "manual">("none");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedClasses, setSuggestedClasses] = useState<SuggestedClassBucket | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<RegistrationTrackType>("primary");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [manualClasses, setManualClasses] = useState<any[]>([]);
  const [manualPrimaryClassId, setManualPrimaryClassId] = useState("");
  const [manualSecondaryClassId, setManualSecondaryClassId] = useState("");
  const [manualPrimarySessionPattern, setManualPrimarySessionPattern] = useState("");
  const [manualSecondarySessionPattern, setManualSecondarySessionPattern] = useState("");
  const [isLoadingManualClasses, setIsLoadingManualClasses] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTrack, setTransferTrack] = useState<RegistrationTrackType>("primary");
  const [transferClassId, setTransferClassId] = useState("");
  const [transferEffectiveDate, setTransferEffectiveDate] = useState("");
  const [transferSessionPattern, setTransferSessionPattern] = useState("");
  const [transferClasses, setTransferClasses] = useState<any[]>([]);
  const [isLoadingTransferClasses, setIsLoadingTransferClasses] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const filteredUpgradeTuitionPlans = useMemo(() => {
    const targetProgramId = selectedActionRegistration?.programId || "";
    return upgradeTuitionPlans.filter((p) => {
      if (!p.isActive) return false;
      if (!targetProgramId) return true;
      return p.programId === targetProgramId;
    });
  }, [upgradeTuitionPlans, selectedActionRegistration?.programId]);

  const hasSecondaryTrack = useMemo(
    () =>
      Boolean(
        selectedActionRegistration?.secondaryProgramId ||
          suggestedClasses?.secondaryProgramId,
      ),
    [selectedActionRegistration?.secondaryProgramId, suggestedClasses?.secondaryProgramId],
  );

  const activeSuggestedClasses =
    selectedTrack === "secondary"
      ? (suggestedClasses?.secondarySuggestedClasses ?? [])
      : (suggestedClasses?.suggestedClasses ?? []);

  const activeAlternativeClasses =
    selectedTrack === "secondary"
      ? (suggestedClasses?.secondaryAlternativeClasses ?? [])
      : (suggestedClasses?.alternativeClasses ?? []);

  const manualClassOptions = useMemo(
    () =>
      manualClasses.map((cls) => {
        const classId = String(cls?.id || "");
        const remainingSlots = getClassRemainingSlots(cls);
        const scheduleLabel = formatSchedulePattern(cls?.schedulePattern);
        const className = getClassDisplayName(cls);
        const safeRemaining =
          typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : null;
        return {
          id: classId,
          remainingSlots: safeRemaining,
          disabled: safeRemaining !== null && safeRemaining <= 0,
          label: `${className} • Còn chỗ: ${safeRemaining ?? "-"} • Lịch: ${scheduleLabel}`,
        };
      }),
    [manualClasses],
  );

  const transferClassOptions = useMemo(
    () =>
      transferClasses
        .map((cls) => {
          const id = String(cls?.id || "");
          const remainingSlots = getClassRemainingSlots(cls);
          const safeRemaining =
            typeof remainingSlots === "number" ? Math.max(0, remainingSlots) : null;
          return {
            id,
            name: getClassDisplayName(cls),
            schedule: formatSchedulePattern(cls?.schedulePattern),
            remainingSlots: safeRemaining,
            programId: String(cls?.programId || cls?.program?.id || ""),
            programName: String(cls?.programName || cls?.program?.name || ""),
            levelName: String(cls?.levelName || cls?.courseLevel || ""),
          };
        })
        .filter((item) => {
          if (!item.id) return false;

          const targetProgramId =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryProgramId || "")
              : String(selectedActionRegistration?.programId || "");
          const targetProgramName =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryProgramName || "")
              : String(selectedActionRegistration?.programName || "");

          const sameProgramById = targetProgramId
            ? item.programId === targetProgramId
            : true;
          const sameProgramByName = !targetProgramId && targetProgramName
            ? normalizeText(item.programName) === normalizeText(targetProgramName)
            : true;

          if (!sameProgramById || !sameProgramByName) return false;

          const currentClassId =
            transferTrack === "secondary"
              ? String(selectedActionRegistration?.secondaryClassId || "")
              : String(selectedActionRegistration?.classId || "");
          if (currentClassId && item.id === currentClassId) return false;
          return item.remainingSlots === null || item.remainingSlots > 0;
        }),
    [transferClasses, transferTrack, selectedActionRegistration?.classId, selectedActionRegistration?.secondaryClassId],
  );

  const registrationStatusCounts = useMemo(() => {
    const counts: Record<"ALL" | RegistrationStatus, number> = {
      ALL: summaryRows.length,
      New: summaryRows.filter((r) => r.status === "New").length,
      WaitingForClass: summaryRows.filter((r) => r.status === "WaitingForClass")
        .length,
      ClassAssigned: summaryRows.filter((r) => r.status === "ClassAssigned").length,
      Studying: summaryRows.filter((r) => r.status === "Studying").length,
      Completed: summaryRows.filter((r) => r.status === "Completed").length,
      Paused: summaryRows.filter((r) => r.status === "Paused").length,
      Cancelled: summaryRows.filter((r) => r.status === "Cancelled").length,
    };
    return counts;
  }, [summaryRows]);

  const fetchSummary = useCallback(async () => {
    if (!branchId) {
      setSummaryRows([]);
      onTotalChange?.(0);
      return;
    }

    try {
      const response = await getRegistrations({
        branchId,
        pageNumber: 1,
        pageSize: 1000,
      });
      const items = response.items || [];
      const nextTotal = Math.max(
        Number(response.totalCount || 0),
        items.length,
      );
      setSummaryRows(items);
      onTotalChange?.(nextTotal);
    } catch (error: any) {
      setSummaryRows([]);
      onTotalChange?.(0);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải thống kê đăng ký.",
        variant: "destructive",
      });
    }
  }, [branchId, onTotalChange, toast]);

  const fetchRows = useCallback(async () => {
    if (!branchId) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }

    try {
      setLoading(true);
      const response = await getRegistrations({
        branchId,
        status: status === "ALL" ? undefined : status,
        pageNumber: currentPage,
        pageSize,
      });
      setRows(response.items || []);
      const nextTotal = Math.max(
        Number(response.totalCount || 0),
        (response.items || []).length,
      );
      setTotalCount(nextTotal);
      setTotalPages(response.totalPages || 1);
      if (status === "ALL") {
        onTotalChange?.(nextTotal);
      }
    } catch (error: any) {
      setRows([]);
      setTotalCount(0);
      setTotalPages(1);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách đăng ký.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, currentPage, pageSize, status, toast, onTotalChange]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setCurrentPage(1);
  }, [status, query]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const qMatched =
        !q ||
        [
          r.id,
          r.studentName || "",
          r.programName || "",
          r.tuitionPlanName || "",
          r.className || "",
          r.note || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return qMatched;
    });
  }, [rows, query, status]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    const copy = [...filteredRows];
    copy.sort((a, b) => {
      if (sortKey === "createdAt") {
        const av = new Date(a.createdAt || "").getTime();
        const bv = new Date(b.createdAt || "").getTime();
        const an = Number.isNaN(av) ? 0 : av;
        const bn = Number.isNaN(bv) ? 0 : bv;
        return sortDir === "asc" ? an - bn : bn - an;
      }

      const getValue = (row: Registration) => {
        switch (sortKey) {
          case "studentName":
            return row.studentName || "";
          case "programName":
            return row.programName || "";
          case "tuitionPlanName":
            return row.tuitionPlanName || "";
          case "className":
            return row.className || "";
          case "status":
            return statusLabel(row.status);
          default:
            return "";
        }
      };

      const av = getValue(a);
      const bv = getValue(b);
      const compared = av.localeCompare(bv, "vi", {
        numeric: true,
        sensitivity: "base",
      });
      return sortDir === "asc" ? compared : -compared;
    });

    return copy;
  }, [filteredRows, sortKey, sortDir]);

  const handleSort = (key: RegistrationSortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
      return;
    }

    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }

    setSortKey(null);
    setSortDir("asc");
  };

  const SortHeader = ({
    label,
    keyName,
  }: {
    label: string;
    keyName: RegistrationSortKey;
  }) => (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => handleSort(keyName)}
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide font-semibold text-gray-600 hover:text-red-700 cursor-pointer"
      >
        {label}
        <ArrowUpDown
          size={12}
          className={sortKey === keyName ? "text-red-600" : "text-gray-400"}
        />
      </button>
    </th>
  );

  const statCards = useMemo(() => {
    const waiting = summaryRows.filter(
      (r) => r.status === "WaitingForClass",
    ).length;
    const studying = summaryRows.filter((r) => r.status === "Studying").length;
    const completed = summaryRows.filter(
      (r) => r.status === "Completed",
    ).length;
    return [
      {
        title: "Đăng ký mới",
        value: summaryRows.length,
        subtitle: "Tổng hồ sơ đăng ký",
        icon: Sparkles,
        color: "from-red-600 to-red-700",
      },
      {
        title: "Chờ xếp lớp",
        value: waiting,
        subtitle: "Đang chờ phân lớp",
        icon: Clock3,
        color: "from-gray-600 to-gray-700",
      },
      {
        title: "Đang học",
        value: studying,
        subtitle: "Đang theo lớp",
        icon: BookOpen,
        color: "from-gray-700 to-gray-800",
      },
      {
        title: "Hoàn thành",
        value: completed,
        subtitle: "Đã kết thúc chương trình",
        icon: CheckCircle2,
        color: "from-red-500 to-red-600",
      },
    ];
  }, [summaryRows]);

  const openDetail = async (id: string) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedDetail(null);
      const detail = await getRegistrationById(id);
      setSelectedDetail(detail);
    } catch (error: any) {
      setDetailOpen(false);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải chi tiết đăng ký.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const getErrorMessage = (error: any, fallback: string) => {
    return (
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      fallback
    );
  };

  const refreshRegistrationData = async () => {
    await Promise.all([fetchRows(), fetchSummary()]);
  };

  const openUpgradeModal = async (row: Registration) => {
    const targetBranchId = String(row.branchId || branchId || "");
    if (!targetBranchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được chi nhánh để tải danh sách gói học.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedActionRegistration(row);
      setUpgradeOpen(true);
      setUpgradeTuitionPlanId("");
      setIsLoadingUpgradeOptions(true);
      const plans = await getTuitionPlans({
        pageNumber: 1,
        pageSize: 500,
        branchId: targetBranchId,
      });
      setUpgradeTuitionPlans(plans || []);
    } catch (error: any) {
      setUpgradeOpen(false);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể tải danh sách gói học."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingUpgradeOptions(false);
    }
  };

  const handleUpgradeRegistration = async () => {
    if (!selectedActionRegistration?.id || !upgradeTuitionPlanId) return;

    try {
      setIsUpgrading(true);
      await upgradeRegistration(selectedActionRegistration.id, upgradeTuitionPlanId);
      toast({
        title: "Thành công",
        description: "Đã gia hạn gói học cho đăng ký.",
        variant: "success",
      });
      setUpgradeOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể gia hạn gói học."),
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const openAssignModal = (row: Registration) => {
    setSelectedActionRegistration(row);
    setAssignOpen(true);
    setAssignViewMode("none");
    setSuggestedClasses(null);
    setSelectedTrack("primary");
    setSelectedClassId("");
    setManualClasses([]);
    setManualPrimaryClassId("");
    setManualSecondaryClassId("");
    setManualPrimarySessionPattern("");
    setManualSecondarySessionPattern("");
  };

  const handleSuggestClasses = async () => {
    if (!selectedActionRegistration?.id) return;

    try {
      setIsSuggesting(true);
      setAssignViewMode("suggested");
      const suggestions = await suggestClassesForRegistration(selectedActionRegistration.id);
      setSuggestedClasses(suggestions);

      const primaryCount = suggestions?.suggestedClasses?.length ?? 0;
      const secondaryCount = suggestions?.secondarySuggestedClasses?.length ?? 0;
      const defaultTrack: RegistrationTrackType =
        primaryCount > 0 ? "primary" : secondaryCount > 0 ? "secondary" : "primary";
      const defaultClass =
        defaultTrack === "secondary"
          ? suggestions?.secondarySuggestedClasses?.[0]
          : suggestions?.suggestedClasses?.[0];

      setSelectedTrack(defaultTrack);
      setSelectedClassId(defaultClass?.id ? String(defaultClass.id) : "");

      toast({
        title: "Thành công",
        description:
          defaultClass?.id
            ? `Đã gợi ý ${suggestions.length || 0} lớp phù hợp cho đăng ký.`
            : "Hiện chưa có lớp gợi ý phù hợp.",
        variant: defaultClass?.id ? "success" : "default",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể lấy danh sách lớp gợi ý."),
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleLoadManualClasses = async () => {
    const targetBranchId = String(selectedActionRegistration?.branchId || branchId || "");
    if (!targetBranchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được chi nhánh để tải lớp.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingManualClasses(true);
      setAssignViewMode("manual");

      const response = await getAllClasses({
        pageNumber: 1,
        pageSize: 1000,
        branchId: targetBranchId,
      });

      const items = pickClassItems(response)
        .filter((item) => item?.id)
        .filter((item) => {
          const statusValue = String(item?.status || "").toLowerCase();
          return statusValue !== "cancelled" && statusValue !== "completed";
        });

      setManualClasses(items);

      if (items.length > 0) {
        const selectable = items.filter((item) => {
          const remaining = getClassRemainingSlots(item);
          return typeof remaining !== "number" || remaining > 0;
        });
        const fallback = items[0];
        const firstClass = selectable[0] || fallback;
        const secondClass = selectable[1] || selectable[0] || fallback;
        setManualPrimaryClassId(String(firstClass?.id || ""));
        setManualSecondaryClassId(String(secondClass?.id || firstClass?.id || ""));
      } else {
        setManualPrimaryClassId("");
        setManualSecondaryClassId("");
      }

      setManualPrimarySessionPattern("");
      setManualSecondarySessionPattern("");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể tải danh sách lớp thủ công."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingManualClasses(false);
    }
  };

  const handleAssignClass = async () => {
    if (!selectedActionRegistration?.id || !selectedClassId) return;

    try {
      setIsAssigning(true);
      await assignClassToRegistration(selectedActionRegistration.id, {
        classId: selectedClassId,
        entryType: "Immediate",
        track: selectedTrack,
      });
      toast({
        title: "Thành công",
        description: "Đã xếp lớp cho đăng ký.",
        variant: "success",
      });
      setAssignOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể xếp lớp đã chọn."),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignManualClasses = async () => {
    if (!selectedActionRegistration?.id || !manualPrimaryClassId) return;

    if (hasSecondaryTrack && !manualSecondaryClassId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn lớp cho chương trình secondary.",
        variant: "destructive",
      });
      return;
    }

    if (hasSecondaryTrack && manualPrimaryClassId === manualSecondaryClassId) {
      toast({
        title: "Không hợp lệ",
        description: "Lớp Primary và Secondary phải khác nhau.",
        variant: "destructive",
      });
      return;
    }

    if (!manualPrimarySessionPattern) {
      toast({
        title: "Thiếu lịch học",
        description: "Vui lòng chọn ngày/giờ học cho lớp Primary.",
        variant: "destructive",
      });
      return;
    }

    if (hasSecondaryTrack && !manualSecondarySessionPattern) {
      toast({
        title: "Thiếu lịch học",
        description: "Vui lòng chọn ngày/giờ học cho lớp Secondary.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAssigning(true);
      await assignClassToRegistration(selectedActionRegistration.id, {
        classId: manualPrimaryClassId,
        entryType: "Immediate",
        track: "primary",
        sessionSelectionPattern: manualPrimarySessionPattern,
      });

      if (hasSecondaryTrack && manualSecondaryClassId) {
        await assignClassToRegistration(selectedActionRegistration.id, {
          classId: manualSecondaryClassId,
          entryType: "Immediate",
          track: "secondary",
          sessionSelectionPattern: manualSecondarySessionPattern,
        });
      }

      toast({
        title: "Thành công",
        description: "Đã xếp lớp thủ công cho đăng ký.",
        variant: "success",
      });
      setAssignOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể xếp lớp thủ công."),
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleMoveToWaitingList = async () => {
    if (!selectedActionRegistration?.id) return;

    try {
      setIsWaiting(true);
      await assignClassToRegistration(selectedActionRegistration.id, {
        entryType: "Wait",
        track: selectedTrack,
      });
      toast({
        title: "Thành công",
        description: "Đã chuyển đăng ký vào danh sách chờ xếp lớp.",
        variant: "success",
      });
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể chuyển vào danh sách chờ."),
        variant: "destructive",
      });
    } finally {
      setIsWaiting(false);
    }
  };

  const openTransferModal = async (row: Registration) => {
    const targetBranchId = String(row.branchId || branchId || "");
    if (!targetBranchId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Không xác định được chi nhánh để tải lớp chuyển.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedActionRegistration(row);
      setTransferOpen(true);
      setTransferTrack(row.classId ? "primary" : "secondary");
      setTransferClassId("");
      setTransferEffectiveDate("");
      setTransferSessionPattern("");
      setIsLoadingTransferClasses(true);

      const response = await getAllClasses({
        pageNumber: 1,
        pageSize: 1000,
        branchId: targetBranchId,
      });
      const items = pickClassItems(response)
        .filter((item) => item?.id)
        .filter((item) => {
          const statusValue = String(item?.status || "").toLowerCase();
          return statusValue !== "cancelled" && statusValue !== "completed";
        });

      setTransferClasses(items);
    } catch (error: any) {
      setTransferOpen(false);
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể tải danh sách lớp để chuyển."),
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransferClasses(false);
    }
  };

  const handleTransferClass = async () => {
    if (!selectedActionRegistration?.id || !transferClassId) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng chọn lớp mới để chuyển.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTransferring(true);
      await transferRegistrationClass(
        selectedActionRegistration.id,
        transferClassId,
        transferEffectiveDate || undefined,
        {
          track: transferTrack,
          sessionSelectionPattern: transferSessionPattern || undefined,
        },
      );

      toast({
        title: "Thành công",
        description: "Đã chuyển lớp cho đăng ký.",
        variant: "success",
      });
      setTransferOpen(false);
      await refreshRegistrationData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(error, "Không thể chuyển lớp."),
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (!transferOpen) return;
    setTransferClassId("");
  }, [transferTrack, transferOpen]);

  return (
    <div className="space-y-4">
      {!branchId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chưa xác định được chi nhánh của staff. Không thể tải dữ liệu đăng ký.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-md"
            >
              <div
                className={`absolute right-0 top-0 h-16 w-16 -translate-y-1/2 translate-x-1/2 rounded-full opacity-5 blur-xl bg-linear-to-r ${item.color}`}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div
                  className={`rounded-xl bg-linear-to-r ${item.color} p-2 text-white shadow-sm`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-gray-600">
                    {item.title}
                  </div>
                  <div className="leading-tight text-xl font-bold text-gray-900">
                    {item.value}
                  </div>
                  <div className="truncate text-[11px] text-gray-500">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <RegistrationFilters
        searchQuery={query}
        selectedStatus={status}
        pageSize={pageSize}
        statusCounts={registrationStatusCounts}
        onSearchChange={setQuery}
        onStatusChange={setStatus}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <div className="rounded-2xl border border-red-200 bg-linear-to-br from-white to-red-50/30 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-red-500/10 to-red-700/10 border-b border-red-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách Đăng ký
            </h3>
            <button
              type="button"
              onClick={() => {
                fetchRows();
                fetchSummary();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-220">
            <thead className="bg-linear-to-r from-red-500/5 to-red-700/5 border-b border-red-200 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <SortHeader label="Học viên" keyName="studentName" />
                <SortHeader label="Chương trình" keyName="programName" />
                <SortHeader label="Gói học" keyName="tuitionPlanName" />
                <SortHeader label="Lớp" keyName="className" />
                <SortHeader label="Trạng thái" keyName="status" />
                <SortHeader label="Ngày tạo" keyName="createdAt" />
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-600"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Đang tải
                      danh sách đăng ký...
                    </span>
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Không có đăng ký nào phù hợp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-red-100 text-sm text-gray-800 hover:bg-red-50/30"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.studentName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {row.secondaryProgramName
                        ? `${row.programName || "-"} • ${row.secondaryProgramName}`
                        : row.programName || "-"}
                    </td>
                    <td className="px-4 py-3">{row.tuitionPlanName || "-"}</td>
                    <td className="px-4 py-3">
                      {row.secondaryClassName
                        ? `${row.className || "Chưa xếp lớp"} • ${row.secondaryClassName}`
                        : row.className || "Chưa xếp lớp"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{toDate(row.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(row.id)}
                          title="Xem chi tiết"
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                        >
                          <Eye size={12} />
                        </button>

                        {(!row.classId || row.status === "WaitingForClass" || row.status === "New") && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(row)}
                            title="Gợi ý và xếp lớp"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <Users size={12} />
                          </button>
                        )}

                        {row.status !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => openUpgradeModal(row)}
                            title="Gia hạn gói học"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <Rocket size={12} />
                          </button>
                        )}

                        {(row.classId || row.secondaryClassId) && row.status !== "Cancelled" && (
                          <button
                            type="button"
                            onClick={() => openTransferModal(row)}
                            title="Chuyển lớp"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <LeadPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemLabel="đăng ký"
          />
        )}
      </div>

      <RegistrationDetailModal
        isOpen={detailOpen}
        item={selectedDetail}
        isLoading={detailLoading}
        onClose={() => {
          setDetailOpen(false);
          setSelectedDetail(null);
        }}
      />

      <RegistrationUpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        isLoadingOptions={isLoadingUpgradeOptions}
        upgradeTuitionPlanId={upgradeTuitionPlanId}
        setUpgradeTuitionPlanId={setUpgradeTuitionPlanId}
        filteredTuitionPlans={filteredUpgradeTuitionPlans}
        selectedRegistration={selectedActionRegistration}
        handleUpgrade={handleUpgradeRegistration}
        isUpgrading={isUpgrading}
      />

      <RegistrationAssignModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        selectedRegistration={selectedActionRegistration}
        branchId={branchId}
        isSuggesting={isSuggesting}
        assignViewMode={assignViewMode}
        handleSuggestClasses={handleSuggestClasses}
        handleLoadManualClasses={handleLoadManualClasses}
        isLoadingManualClasses={isLoadingManualClasses}
        handleMoveToWaitingList={handleMoveToWaitingList}
        isWaiting={isWaiting}
        suggestedClasses={suggestedClasses}
        hasSecondaryTrack={hasSecondaryTrack}
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        activeSuggestedClasses={activeSuggestedClasses}
        activeAlternativeClasses={activeAlternativeClasses}
        formatSchedulePattern={formatSchedulePattern}
        handleAssignClass={handleAssignClass}
        isAssigning={isAssigning}
        manualClasses={manualClasses}
        manualClassOptions={manualClassOptions}
        manualPrimaryClassId={manualPrimaryClassId}
        setManualPrimaryClassId={setManualPrimaryClassId}
        manualSecondaryClassId={manualSecondaryClassId}
        setManualSecondaryClassId={setManualSecondaryClassId}
        manualPrimarySessionPattern={manualPrimarySessionPattern}
        setManualPrimarySessionPattern={setManualPrimarySessionPattern}
        manualSecondarySessionPattern={manualSecondarySessionPattern}
        setManualSecondarySessionPattern={setManualSecondarySessionPattern}
        handleAssignManualClasses={handleAssignManualClasses}
      />

      <RegistrationTransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        selectedRegistration={selectedActionRegistration}
        transferTrack={transferTrack}
        setTransferTrack={setTransferTrack}
        transferClassId={transferClassId}
        setTransferClassId={setTransferClassId}
        transferEffectiveDate={transferEffectiveDate}
        setTransferEffectiveDate={setTransferEffectiveDate}
        transferSessionPattern={transferSessionPattern}
        setTransferSessionPattern={setTransferSessionPattern}
        transferClassOptions={transferClassOptions}
        isLoadingTransferClasses={isLoadingTransferClasses}
        isTransferring={isTransferring}
        onConfirmTransfer={handleTransferClass}
      />
    </div>
  );
}

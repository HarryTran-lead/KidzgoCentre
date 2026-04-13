// Theme: matches accounts page (red/white light theme) — replaced by bulk update
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCheck,
  Coins,
  Gift,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  Upload,
  UserRound,
} from "lucide-react";
import { buildFileUrl } from "@/constants/apiURL";
import { useToast } from "@/hooks/use-toast";
import { isUploadSuccess, uploadFile } from "@/lib/api/fileService";
import { getTeacherClasses } from "@/lib/api/teacherService";
import { get } from "@/lib/axios";
import {
  addStars,
  addXp,
  approveRewardRedemption,
  batchDeliverRewardRedemptions,
  cancelRewardRedemption,
  createMission,
  createRewardStoreItem,
  deductStars,
  deleteMission,
  deleteRewardStoreItem,
  getAttendanceStreak,
  getLevel,
  getMissionClassOptions,
  getMissionProgress,
  getRewardRedemption,
  getStarBalance,
  getStarTransactions,
  listMissions,
  listRewardRedemptions,
  listRewardStoreItems,
  markRewardRedemptionDelivered,
  toggleRewardStoreItemStatus,
  updateMission,
  updateRewardStoreItem,
} from "@/lib/api/gamificationService";
import type {
  AttendanceStreakInfo,
  ClassOptionLite,
  LevelInfo,
  Mission,
  MissionProgress,
  MissionProgressMode,
  MissionScope,
  MissionType,
  RewardRedemption,
  RewardStoreItem,
} from "@/types/gamification";
import {
  cx,
  DialogShell,
  EmptyState,
  MetricCard,
  Panel,
  SectionTitle,
  StatusPill,
  Tabs,
  extractStudentOptions,
  formatDate,
  formatDateTime,
  formatNumber,
  getMissionProgressPercent,
  getMissionProgressClasses,
  getRedemptionStatusClasses,
  mapMissionProgressModeLabel,
  mapMissionScopeLabel,
  mapMissionTypeLabel,
  mapProgressStatusLabel,
  mapRedemptionStatusLabel,
  normalizeProblemMessage,
  normalizeProblemMessages,
  toDatetimeLocal,
  toIsoString,
  type StudentOption,
} from "./shared";

type StaffRole = "Admin" | "ManagementStaff" | "Teacher";
type StaffTab = "missions" | "students" | "rewardStore" | "redemptions";

type MissionFormState = {
  id?: string;
  title: string;
  description: string;
  scope: MissionScope;
  targetClassId: string;
  targetStudentId: string;
  targetGroupIds: string[];
  missionType: MissionType | "";
  progressMode: MissionProgressMode;
  startAt: string;
  endAt: string;
  totalRequired: string;
};

type RewardFormState = {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  costStars: string;
  isActive: boolean;
};

type MissionFormErrors = Partial<
  Record<
    | "title"
    | "missionType"
    | "targetClassId"
    | "targetStudentId"
    | "targetGroupIds"
    | "startAt"
    | "endAt"
    | "progressMode"
    | "totalRequired",
    string
  >
>;

type RewardFormErrors = Partial<Record<"title" | "costStars", string>>;

type StudentActionState = {
  starAmount: string;
  starReason: string;
  xpAmount: string;
  xpReason: string;
};

type StudentActionErrors = Partial<Record<"starAmount" | "xpAmount", string>>;

const inputClass =
  "w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100";
const textareaClass = `${inputClass} min-h-[112px]`;
const ghostButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-red-50 cursor-pointer";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";
const dangerGhostButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60";
const errorTextClass = "mt-2 text-xs font-medium text-rose-600";

const missionSeed: MissionFormState = {
  title: "",
  description: "",
  scope: "Student",
  targetClassId: "",
  targetStudentId: "",
  targetGroupIds: [],
  missionType: "",
  progressMode: "Count",
  startAt: "",
  endAt: "",
  totalRequired: "",
};

const rewardSeed: RewardFormState = {
  title: "",
  description: "",
  imageUrl: "",
  costStars: "",
  isActive: true,
};

const studentActionSeed: StudentActionState = {
  starAmount: "",
  starReason: "",
  xpAmount: "",
  xpReason: "",
};

function FormLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={errorTextClass}>{message}</p>;
}

function getFieldClass(baseClass: string, hasError?: boolean) {
  return cx(
    baseClass,
    hasError
      ? "border-rose-300 bg-rose-50/70 text-rose-900 placeholder:text-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : undefined
  );
}

function getCurrentMinute() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function parseNumericInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function StaffGamificationWorkspace({
  role,
  title,
}: {
  role: StaffRole;
  title: string;
}) {
  const { toast } = useToast();
  const canManageStore = role !== "Teacher";
  const canDeleteMission = role !== "Teacher";
  const canViewRedemptions = true;
  const tabs = [
    { id: "missions" as const, label: "Nhiệm vụ" },
    { id: "students" as const, label: "Sao / XP" },
    ...(canManageStore ? ([{ id: "rewardStore" as const, label: "Kho quà" }] as const) : []),
    ...(canViewRedemptions ? ([{ id: "redemptions" as const, label: "Đổi thưởng" }] as const) : []),
  ];
  const [activeTab, setActiveTab] = useState<StaffTab>("missions");
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOptionLite[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [rewardItems, setRewardItems] = useState<RewardStoreItem[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentBalance, setStudentBalance] = useState(0);
  const [studentLevel, setStudentLevel] = useState<LevelInfo | null>(null);
  const [studentStreak, setStudentStreak] = useState<AttendanceStreakInfo | null>(null);
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getStarTransactions>>["transactions"]>([]);
  const [missionForm, setMissionForm] = useState<MissionFormState>(missionSeed);
  const [missionErrors, setMissionErrors] = useState<MissionFormErrors>({});
  const [rewardForm, setRewardForm] = useState<RewardFormState>(rewardSeed);
  const [rewardErrors, setRewardErrors] = useState<RewardFormErrors>({});
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [progressDialog, setProgressDialog] = useState<{ mission: Mission | null; items: MissionProgress[]; open: boolean }>({ mission: null, items: [], open: false });
  const [redemptionDetail, setRedemptionDetail] = useState<RewardRedemption | null>(null);
  const [cancelRedemptionId, setCancelRedemptionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [groupClassFilter, setGroupClassFilter] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("");
  const [missionStudentClassFilter, setMissionStudentClassFilter] = useState("");
  const [studentAction, setStudentAction] = useState<StudentActionState>(studentActionSeed);
  const [studentActionErrors, setStudentActionErrors] = useState<StudentActionErrors>({});
  const [batchYear, setBatchYear] = useState("");
  const [batchMonth, setBatchMonth] = useState("");
  const [redemptionPage, setRedemptionPage] = useState(1);
  const [redemptionTotalPages, setRedemptionTotalPages] = useState(1);
  const [imageUploading, setImageUploading] = useState(false);
  const rewardImageInputRef = useRef<HTMLInputElement>(null);
  const rewardImagePreviewUrl = buildFileUrl(rewardForm.imageUrl);

  const selectedStudent = useMemo(
    () => students.find((item) => item.id === selectedStudentId) ?? null,
    [selectedStudentId, students]
  );

  const selectedMissionTargetStudent = useMemo(
    () => students.find((item) => item.id === missionForm.targetStudentId) ?? null,
    [missionForm.targetStudentId, students]
  );

  const selectedMissionGroupStudents = useMemo(
    () =>
      missionForm.targetGroupIds
        .map((studentId) => students.find((item) => item.id === studentId) ?? null)
        .filter((item): item is StudentOption => Boolean(item)),
    [missionForm.targetGroupIds, students]
  );

  function normalizeMissionTargetGroup(value: Mission["targetGroup"]): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to comma-separated values.
      }

      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function closeMissionDialog() {
    setMissionDialogOpen(false);
    setMissionErrors({});
    setMissionStudentClassFilter("");
  }

  function closeRewardDialog() {
    setRewardDialogOpen(false);
    setRewardErrors({});
  }

  function clearMissionErrors(fields: Array<keyof MissionFormErrors>) {
    setMissionErrors((current) => {
      if (fields.every((field) => !current[field])) {
        return current;
      }

      const next = { ...current };
      for (const field of fields) {
        delete next[field];
      }
      return next;
    });
  }

  function clearRewardErrors(fields: Array<keyof RewardFormErrors>) {
    setRewardErrors((current) => {
      if (fields.every((field) => !current[field])) {
        return current;
      }

      const next = { ...current };
      for (const field of fields) {
        delete next[field];
      }
      return next;
    });
  }

  function clearStudentActionErrors(fields: Array<keyof StudentActionErrors>) {
    setStudentActionErrors((current) => {
      if (fields.every((field) => !current[field])) {
        return current;
      }

      const next = { ...current };
      for (const field of fields) {
        delete next[field];
      }
      return next;
    });
  }

  function inferMissionErrorsFromMessages(messages: string[]): MissionFormErrors {
    const nextErrors: MissionFormErrors = {};

    for (const message of messages) {
      const normalized = message.toLowerCase();

      if (normalized.includes("tiêu đề") || normalized.includes("title")) {
        nextErrors.title = "Vui lòng nhập tiêu đề nhiệm vụ.";
      }

      if (normalized.includes("loại nhiệm vụ") || normalized.includes("mission type")) {
        nextErrors.missionType = "Vui lòng chọn loại nhiệm vụ.";
      }

      if (normalized.includes("lớp áp dụng") || normalized.includes("targetclass") || normalized.includes("class")) {
        nextErrors.targetClassId = "Vui lòng chọn lớp áp dụng.";
      }

      if (normalized.includes("học sinh áp dụng") || normalized.includes("targetstudent")) {
        nextErrors.targetStudentId = "Vui lòng chọn học sinh áp dụng.";
      }

      if (normalized.includes("nhóm áp dụng") || normalized.includes("targetgroup") || normalized.includes("group")) {
        nextErrors.targetGroupIds = "Vui lòng chọn ít nhất một học sinh cho nhóm áp dụng.";
      }

      if (normalized.includes("ngày bắt đầu") || normalized.includes("start")) {
        nextErrors.startAt = normalized.includes("quá khứ") || normalized.includes("past")
          ? "Ngày bắt đầu không được ở trong quá khứ."
          : "Vui lòng kiểm tra lại ngày bắt đầu.";
      }

      if (normalized.includes("ngày kết thúc") || normalized.includes("end")) {
        nextErrors.endAt = normalized.includes("sau ngày bắt đầu") || normalized.includes("after")
          ? "Ngày kết thúc phải sau ngày bắt đầu."
          : "Vui lòng kiểm tra lại ngày kết thúc.";
      }

      if (
        normalized.includes("mục tiêu") ||
        normalized.includes("totalrequired") ||
        normalized.includes("reward rule") ||
        normalized.includes("missionrewardrule")
      ) {
        nextErrors.totalRequired =
          normalized.includes("not configured") || normalized.includes("không cấu hình")
            ? "Chưa có rule phần thưởng phù hợp với loại nhiệm vụ, cách tính và mục tiêu này."
            : "Mục tiêu hoàn thành phải lớn hơn 0.";
      }
    }

    return nextErrors;
  }

  function inferRewardErrorsFromMessages(messages: string[]): RewardFormErrors {
    const nextErrors: RewardFormErrors = {};

    for (const message of messages) {
      const normalized = message.toLowerCase();

      if (normalized.includes("tên vật phẩm") || normalized.includes("title")) {
        nextErrors.title = "Vui lòng nhập tên vật phẩm.";
      }

      if (normalized.includes("số sao đổi") || normalized.includes("coststars") || normalized.includes("cost stars")) {
        nextErrors.costStars = "Số sao đổi phải lớn hơn 0.";
      }

    }

    return nextErrors;
  }

  function validateMissionForm() {
    const nextErrors: MissionFormErrors = {};
    const startDate = missionForm.startAt ? new Date(missionForm.startAt) : null;
    const endDate = missionForm.endAt ? new Date(missionForm.endAt) : null;
    const totalRequired = parseNumericInput(missionForm.totalRequired);
    const currentMinute = getCurrentMinute();

    if (!missionForm.title.trim()) {
      nextErrors.title = "Vui lòng nhập tiêu đề nhiệm vụ.";
    }

    if (!missionForm.missionType) {
      nextErrors.missionType = "Vui lòng chọn loại nhiệm vụ.";
    }

    if (!missionForm.progressMode) {
      nextErrors.progressMode = "Vui lòng chọn cách tính tiến độ.";
    }

    if (missionForm.scope === "Student" && !missionForm.targetStudentId) {
      nextErrors.targetStudentId = "Vui lòng chọn học sinh áp dụng.";
    }

    if (missionForm.scope === "Class" && !missionForm.targetClassId) {
      nextErrors.targetClassId = "Vui lòng chọn lớp áp dụng.";
    }

    if (missionForm.scope === "Group" && missionForm.targetGroupIds.length === 0) {
      nextErrors.targetGroupIds = "Vui lòng chọn ít nhất một học sinh cho nhóm áp dụng.";
    }

    // startAt is optional - if empty, mission starts immediately
    if (missionForm.startAt && startDate && Number.isNaN(startDate.getTime())) {
      nextErrors.startAt = "Ngày bắt đầu không hợp lệ.";
    } else if (
      missionForm.startAt &&
      startDate &&
      startDate.getTime() < currentMinute.getTime()
    ) {
      nextErrors.startAt = "Ngày bắt đầu không được ở trong quá khứ.";
    }

    if (missionForm.endAt && (!endDate || Number.isNaN(endDate.getTime()))) {
      nextErrors.endAt = "Ngày kết thúc không hợp lệ.";
    } else if (
      missionForm.endAt &&
      endDate &&
      endDate.getTime() < currentMinute.getTime()
    ) {
      nextErrors.endAt = "Ngày kết thúc không được ở trong quá khứ.";
    }

    if (
      !nextErrors.startAt &&
      !nextErrors.endAt &&
      startDate &&
      endDate &&
      endDate.getTime() <= startDate.getTime()
    ) {
      nextErrors.endAt = "Ngày kết thúc phải sau ngày bắt đầu.";
    }

    if (totalRequired === null) {
      nextErrors.totalRequired = "Vui lòng nhập mục tiêu hoàn thành.";
    } else if (Number.isNaN(totalRequired) || totalRequired <= 0) {
      nextErrors.totalRequired = "Mục tiêu hoàn thành phải lớn hơn 0.";
    }

    return nextErrors;
  }

  function validateRewardForm() {
    const nextErrors: RewardFormErrors = {};
    const costStars = parseNumericInput(rewardForm.costStars);

    if (!rewardForm.title.trim()) {
      nextErrors.title = "Vui lòng nhập tên vật phẩm.";
    }

    if (costStars === null) {
      nextErrors.costStars = "Vui lòng nhập số sao đổi.";
    } else if (Number.isNaN(costStars) || costStars <= 0) {
      nextErrors.costStars = "Số sao đổi phải lớn hơn 0.";
    }

    return nextErrors;
  }

  function validateStudentAction(action: "addStars" | "deductStars" | "addXp") {
    const field = action.includes("Stars") ? "starAmount" : "xpAmount";
    const label = field === "starAmount" ? "số sao" : "số XP";
    const amount = parseNumericInput(
      field === "starAmount" ? studentAction.starAmount : studentAction.xpAmount
    );
    const nextErrors: StudentActionErrors = {};

    if (amount === null) {
      nextErrors[field] = `Vui lòng nhập ${label}.`;
    } else if (Number.isNaN(amount) || amount <= 0) {
      nextErrors[field] = `${label === "số sao" ? "Số sao" : "Số XP"} phải lớn hơn 0.`;
    }

    return nextErrors;
  }

  async function loadBaseData() {
    setLoading(true);
    setPageError(null);

    // Teacher: load classes from teacher API, then derive students from those classes
    const classOptionsPromise = role === "Teacher"
      ? getTeacherClasses({ pageNumber: 1, pageSize: 200 }).then((res) => {
          const items = res?.data?.classes?.items ?? [];
          return items.map((c: any) => ({ id: c.id, code: c.code, title: c.title ?? c.name, name: c.name ?? c.title })) as ClassOptionLite[];
        }).catch(() => [] as ClassOptionLite[])
      : getMissionClassOptions();

    const studentsPromise = (async (): Promise<StudentOption[]> => {
      try {
        let classItems: { id: string; code?: string; title?: string; name?: string }[] = [];
        if (role === "Teacher") {
          const res = await getTeacherClasses({ pageNumber: 1, pageSize: 200 });
          classItems = (res?.data?.classes?.items ?? []).map((c: any) => ({ id: c.id, code: c.code, title: c.title ?? c.name, name: c.name ?? c.title }));
        } else {
          const res = await get<any>("/api/classes", { params: { status: "Active", pageNumber: 1, pageSize: 200 } });
          classItems = (res?.data?.classes?.items ?? []).map((c: any) => ({ id: c.id, code: c.code, title: c.title ?? c.name, name: c.name ?? c.title }));
        }
        const allStudents: StudentOption[] = [];
        const seenKeys = new Set<string>();
        for (const cls of classItems) {
          try {
            const resp = await get<any>(`/api/classes/${cls.id}/students`, { params: { pageNumber: 1, pageSize: 200 } });
            const items: any[] = resp?.data?.students?.items ?? [];
            for (const s of items) {
              const id = String(s.studentProfileId ?? s.id ?? s.profileId ?? "").trim();
              if (!id) continue;
              const compositeKey = `${id}::${cls.id}`;
              if (seenKeys.has(compositeKey)) continue;
              seenKeys.add(compositeKey);
              const label = s.fullName || s.name || s.displayName || s.userName || id;
              const classText = cls.code ? `${cls.code} - ${cls.title ?? cls.name ?? ""}`.trim() : (cls.title ?? cls.name ?? "");
              allStudents.push({ id, label, studentId: s.studentId, classId: cls.id, classText, helperText: classText, dropdownLabel: classText ? `${label} • ${classText}` : label });
            }
          } catch { /* skip classes with errors */ }
        }
        return allStudents;
      } catch { return []; }
    })();

    const results = await Promise.allSettled([
      listMissions({ pageNumber: 1, pageSize: 50 }),
      classOptionsPromise,
      studentsPromise,
      canManageStore
        ? listRewardStoreItems({ page: 1, pageSize: 50 })
        : Promise.resolve({ items: [], pageNumber: 1, totalPages: 1, totalCount: 0 }),
      listRewardRedemptions({ page: redemptionPage, pageSize: 10 }),
    ]);

    const [missionResult, classResult, studentResult, rewardResult, redemptionResult] = results;
    if (missionResult.status === "fulfilled") setMissions(missionResult.value.items);
    if (classResult.status === "fulfilled") setClassOptions(classResult.value as ClassOptionLite[]);
    if (studentResult.status === "fulfilled") {
      const options = studentResult.value as StudentOption[];
      setStudents(options);
      setSelectedStudentId((current) => current || options[0]?.id || "");
    }
    if (rewardResult.status === "fulfilled") setRewardItems((rewardResult.value as any).items);
    if (redemptionResult.status === "fulfilled") {
      setRedemptions(redemptionResult.value.items);
      setRedemptionTotalPages(redemptionResult.value.totalPages);
    }
    if (results.every((result) => result.status === "rejected")) {
      setPageError("Không thể tải dữ liệu gamification trong thời điểm này.");
    }
    setLoading(false);
  }

  async function loadStudentSnapshot(studentProfileId: string) {
    if (!studentProfileId) return;
    setStudentLoading(true);
    const results = await Promise.allSettled([
      getStarBalance(studentProfileId),
      getLevel(studentProfileId),
      getAttendanceStreak(studentProfileId),
      getStarTransactions({ studentProfileId, page: 1, pageSize: 10 }),
    ]);
    const [balanceResult, levelResult, streakResult, transactionResult] = results;
    if (balanceResult.status === "fulfilled") setStudentBalance(balanceResult.value.balance);
    if (levelResult.status === "fulfilled") setStudentLevel(levelResult.value);
    if (streakResult.status === "fulfilled") setStudentStreak(streakResult.value);
    if (transactionResult.status === "fulfilled") setTransactions(transactionResult.value.transactions);
    setStudentLoading(false);
  }

  useEffect(() => {
    void loadBaseData();
  }, []);

  useEffect(() => {
    if (!loading) {
      listRewardRedemptions({ page: redemptionPage, pageSize: 10 })
        .then((result) => {
          setRedemptions(result.items);
          setRedemptionTotalPages(result.totalPages);
        })
        .catch(() => {});
    }
  }, [redemptionPage]);

  useEffect(() => {
    setStudentAction(studentActionSeed);
    setStudentActionErrors({});
    if (selectedStudentId) void loadStudentSnapshot(selectedStudentId);
  }, [selectedStudentId]);

  function openCreateMission() {
    setMissionForm(missionSeed);
    setMissionErrors({});
    setMissionStudentClassFilter("");
    setMissionDialogOpen(true);
  }

  function openEditMission(mission: Mission) {
    setMissionErrors({});
    setMissionStudentClassFilter("");
    setMissionForm({
      id: mission.id,
      title: mission.title,
      description: mission.description ?? "",
      scope: mission.scope,
      targetClassId: mission.targetClassId ?? "",
      targetStudentId: mission.targetStudentId ?? "",
      targetGroupIds: normalizeMissionTargetGroup(mission.targetGroup),
      missionType: mission.missionType,
      progressMode: mission.progressMode ?? "Count",
      startAt: toDatetimeLocal(mission.startAt),
      endAt: toDatetimeLocal(mission.endAt),
      totalRequired: mission.totalRequired ? String(mission.totalRequired) : "",
    });
    setMissionDialogOpen(true);
  }

  async function submitMission() {
    const nextErrors = validateMissionForm();
    if (Object.keys(nextErrors).length > 0) {
      setMissionErrors(nextErrors);
      toast.destructive({
        title: "Thông tin nhiệm vụ chưa hợp lệ",
        description:
          Object.values(nextErrors)[0] ||
          "Vui lòng kiểm tra lại các trường được đánh dấu đỏ.",
      });
      return;
    }

    if (missionForm.scope === "Class" && !missionForm.targetClassId) {
      toast.destructive({
        title: "Thiếu lớp áp dụng",
        description: "Vui lòng chọn lớp cho nhiệm vụ theo lớp.",
        variant: "destructive",
      });
      return;
    }

    if (missionForm.scope === "Student" && !missionForm.targetStudentId) {
      toast.destructive({
        title: "Thiếu học sinh áp dụng",
        description: "Vui lòng chọn học sinh cụ thể cho nhiệm vụ này.",
        variant: "destructive",
      });
      return;
    }

    if (missionForm.scope === "Group" && missionForm.targetGroupIds.length === 0) {
      toast.destructive({
        title: "Thiếu nhóm áp dụng",
        description: "Vui lòng chọn ít nhất một học sinh cho nhiệm vụ nhóm.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBusyAction("submit-mission");
      const payload = {
        title: missionForm.title.trim(),
        description: missionForm.description.trim() || undefined,
        scope: missionForm.scope,
        targetClassId:
          missionForm.scope === "Class"
            ? missionForm.targetClassId || undefined
            : undefined,
        targetStudentId:
          missionForm.scope === "Student"
            ? missionForm.targetStudentId || undefined
            : undefined,
        targetGroup:
          missionForm.scope === "Group"
            ? missionForm.targetGroupIds
            : undefined,
        missionType: missionForm.missionType as MissionType,
        progressMode: missionForm.progressMode,
        startAt: missionForm.startAt ? toIsoString(missionForm.startAt) : undefined,
        endAt: missionForm.endAt ? toIsoString(missionForm.endAt) : undefined,
        totalRequired: Number(missionForm.totalRequired),
      };
      if (missionForm.id) await updateMission(missionForm.id, payload);
      else await createMission(payload);
      toast.success({
        title: missionForm.id ? "Đã cập nhật nhiệm vụ" : "Đã tạo nhiệm vụ mới",
      });
      closeMissionDialog();
      setMissionForm(missionSeed);
      await loadBaseData();
    } catch (error) {
      const messages = normalizeProblemMessages(error);
      const backendErrors = inferMissionErrorsFromMessages(messages);
      if (Object.keys(backendErrors).length > 0) {
        setMissionErrors((current) => ({ ...current, ...backendErrors }));
      }
      toast.destructive({
        title: "Không thể lưu nhiệm vụ",
        description: messages[0] || normalizeProblemMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  function toggleMissionGroupStudent(studentId: string) {
    clearMissionErrors(["targetGroupIds"]);
    setMissionForm((current) => ({
      ...current,
      targetGroupIds: current.targetGroupIds.includes(studentId)
        ? current.targetGroupIds.filter((id) => id !== studentId)
        : [...current.targetGroupIds, studentId],
    }));
  }

  async function removeMission(id: string) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) return;
    try {
      setBusyAction(`delete-mission-${id}`);
      await deleteMission(id);
      toast.success({ title: "Đã xóa nhiệm vụ" });
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể xóa nhiệm vụ",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function showProgress(mission: Mission) {
    try {
      setBusyAction(`progress-${mission.id}`);
      const result = await getMissionProgress(mission.id, {
        pageNumber: 1,
        pageSize: 50,
      });
      setProgressDialog({
        mission,
        items: result.progresses.items,
        open: true,
      });
    } catch (error) {
      toast({
        title: "Không thể tải tiến độ nhiệm vụ",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  function openCreateReward() {
    setRewardForm(rewardSeed);
    setRewardErrors({});
    setRewardDialogOpen(true);
  }

  function openEditReward(item: RewardStoreItem) {
    setRewardErrors({});
    setRewardForm({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      costStars: String(item.costStars),
      isActive: item.isActive,
    });
    setRewardDialogOpen(true);
  }

  async function submitRewardItem() {
    const nextErrors = validateRewardForm();
    if (Object.keys(nextErrors).length > 0) {
      setRewardErrors(nextErrors);
      toast.destructive({
        title: "Thông tin vật phẩm chưa hợp lệ",
        description:
          Object.values(nextErrors)[0] ||
          "Vui lòng kiểm tra lại các trường được đánh dấu đỏ.",
      });
      return;
    }

    try {
      setBusyAction("submit-reward");
      const payload = {
        title: rewardForm.title.trim(),
        description: rewardForm.description.trim() || undefined,
        imageUrl: rewardForm.imageUrl.trim() || undefined,
        costStars: Number(rewardForm.costStars),
        isActive: rewardForm.isActive,
      };
      if (rewardForm.id) await updateRewardStoreItem(rewardForm.id, payload);
      else await createRewardStoreItem(payload);
      toast.success({
        title: rewardForm.id
          ? "Đã cập nhật quà thưởng"
          : "Đã tạo quà thưởng mới",
      });
      closeRewardDialog();
      setRewardForm(rewardSeed);
      await loadBaseData();
    } catch (error) {
      const messages = normalizeProblemMessages(error);
      const backendErrors = inferRewardErrorsFromMessages(messages);
      if (Object.keys(backendErrors).length > 0) {
        setRewardErrors((current) => ({ ...current, ...backendErrors }));
      }
      toast.destructive({
        title: "Không thể lưu quà thưởng",
        description: messages[0] || normalizeProblemMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function removeRewardItem(id: string) {
    if (!window.confirm("Bạn có chắc chắn muốn xoá vật phẩm này?")) return;
    try {
      setBusyAction(`delete-reward-${id}`);
      await deleteRewardStoreItem(id);
      toast.success({ title: "Đã xoá vật phẩm" });
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể xoá vật phẩm",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function toggleRewardStatus(id: string) {
    try {
      setBusyAction(`toggle-reward-${id}`);
      await toggleRewardStoreItemStatus(id);
      toast.success({ title: "Đã cập nhật trạng thái vật phẩm" });
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể đổi trạng thái vật phẩm",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function runStudentAction(
    action: "addStars" | "deductStars" | "addXp"
  ) {
    if (!selectedStudentId) return;

    const nextErrors = validateStudentAction(action);
    if (Object.keys(nextErrors).length > 0) {
      setStudentActionErrors((current) => ({ ...current, ...nextErrors }));
      toast.destructive({
        title: "Dữ liệu điều chỉnh chưa hợp lệ",
        description:
          Object.values(nextErrors)[0] ||
          "Vui lòng kiểm tra lại giá trị vừa nhập.",
      });
      return;
    }

    try {
      setBusyAction(action);
      const amount = Number(
        action.includes("Stars")
          ? studentAction.starAmount
          : studentAction.xpAmount
      );
      const reason = action.includes("Stars")
        ? studentAction.starReason
        : studentAction.xpReason;
      if (action === "addStars")
        await addStars({ studentProfileId: selectedStudentId, amount, reason });
      if (action === "deductStars")
        await deductStars({
          studentProfileId: selectedStudentId,
          amount,
          reason,
        });
      if (action === "addXp")
        await addXp({ studentProfileId: selectedStudentId, amount, reason });
      toast.success({ title: "Đã cập nhật dữ liệu học sinh" });
      await loadStudentSnapshot(selectedStudentId);
      setStudentAction(studentActionSeed);
      setStudentActionErrors({});
    } catch (error) {
      toast.destructive({
        title: "Không thể cập nhật dữ liệu",
        description: normalizeProblemMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function openRedemptionDetail(id: string) {
    try {
      setBusyAction(`redemption-${id}`);
      const result = await getRewardRedemption(id);
      setRedemptionDetail(result);
    } catch (error) {
      toast({
        title: "Không thể tải chi tiết đổi thưởng",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function transitionRedemption(
    id: string,
    action: "approve" | "cancel" | "deliver"
  ) {
    try {
      setBusyAction(`${action}-${id}`);
      if (action === "approve") await approveRewardRedemption(id);
      if (action === "cancel") {
        setCancelRedemptionId(id);
        setCancelReason("");
        setBusyAction(null);
        return; // Show cancel modal instead of window.prompt
      }
      if (action === "deliver") await markRewardRedemptionDelivered(id);
      toast.success({ title: "Đã cập nhật trạng thái đổi thưởng" });
      await loadBaseData();
      if (redemptionDetail?.id === id) {
        const latest = await getRewardRedemption(id);
        setRedemptionDetail(latest);
      }
    } catch (error) {
      toast({
        title: "Không thể cập nhật đổi thưởng",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function confirmCancelRedemption() {
    if (!cancelRedemptionId) return;
    try {
      setBusyAction(`cancel-${cancelRedemptionId}`);
      await cancelRewardRedemption(cancelRedemptionId, { reason: cancelReason.trim() || undefined });
      toast.success({ title: "Đã hủy đổi thưởng" });
      setCancelRedemptionId(null);
      setCancelReason("");
      await loadBaseData();
      if (redemptionDetail?.id === cancelRedemptionId) {
        const latest = await getRewardRedemption(cancelRedemptionId);
        setRedemptionDetail(latest);
      }
    } catch (error) {
      toast({
        title: "Không thể hủy đổi thưởng",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function runBatchDeliver() {
    try {
      setBusyAction("batch-deliver");
      await batchDeliverRewardRedemptions({
        year: batchYear ? Number(batchYear) : undefined,
        month: batchMonth ? Number(batchMonth) : undefined,
      });
      toast.success({ title: "Đã chạy giao hàng loạt" });
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể chạy giao hàng loạt",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRewardImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "File ảnh chưa hợp lệ",
        description: "Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ảnh quá lớn",
        description: "Vui lòng chọn ảnh nhỏ hơn hoặc bằng 10MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    try {
      setImageUploading(true);
      const result = await uploadFile(file, "gamification");
      if (!isUploadSuccess(result)) {
        throw new Error(
          result.detail || result.error || result.title || "Upload ảnh thất bại."
        );
      }

      setRewardForm((current) => ({ ...current, imageUrl: result.url }));
      toast.success({
        title: "Đã tải ảnh lên",
        description: "Ảnh vật phẩm đã sẵn sàng để lưu.",
      });
    } catch (error) {
      toast({
        title: "Không thể tải ảnh lên",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
      if (rewardImageInputRef.current) {
        rewardImageInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6 rounded-3xl">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
          <Sparkles className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Gamification cho {title.toLowerCase()}
          </h1>
          <p className="text-sm text-gray-600">Mission, sao, XP và đổi thưởng trong một workspace</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard icon={<Target className="h-5 w-5" />} label="Mission hiện có" value={formatNumber(missions.length)} accent="from-red-600 to-red-700" theme="staff" />
        <MetricCard icon={<Gift className="h-5 w-5" />} label="Đơn đổi quà mở" value={formatNumber(redemptions.filter((item) => item.status !== "Received" && item.status !== "Cancelled").length)} accent="from-violet-500 via-fuchsia-500 to-pink-500" theme="staff" />
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={tabs} theme="staff" />

      {loading ? <Panel theme="staff" className="py-14"><div className="flex items-center justify-center gap-3 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /><span>Đang tải dữ liệu gamification...</span></div></Panel> : null}
      {!loading && pageError ? <Panel theme="staff" className="border-rose-200 bg-rose-50"><div className="flex items-start gap-3 text-rose-700"><AlertCircle className="mt-0.5 h-5 w-5" /><div><h2 className="text-lg font-semibold">Không thể tải dữ liệu</h2><p className="mt-1 text-sm">{pageError}</p></div></div></Panel> : null}

      {!loading && !pageError && activeTab === "missions" ? (
        <Panel theme="staff">
          <SectionTitle
            title="Quản lý nhiệm vụ"
            description="Tạo nhiệm vụ mới, cập nhật phạm vi áp dụng, xem tiến độ và theo dõi các luồng backend tự cộng progress."
            theme="staff"
            action={
              <button type="button" onClick={openCreateMission} className={primaryButton}>
                  <Plus className="h-4 w-4" />
                  Tạo nhiệm vụ
                </button>
            }
          />
          <div className="space-y-4">
            {missions.map((mission) => (
              <div key={mission.id} className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{mission.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                      <StatusPill label={mapMissionTypeLabel(mission.missionType)} className="border-red-200 bg-white text-gray-700" />
                      <StatusPill label={mapMissionProgressModeLabel(mission.progressMode)} className="border-indigo-200 bg-indigo-50 text-indigo-700" />
                      <StatusPill label={mapMissionScopeLabel(mission.scope)} className="border-amber-200 bg-amber-50 text-amber-700" />
                      {mission.scope === "Class" && (mission.targetClassCode || mission.targetClassTitle) ? (
                        <StatusPill
                          label={mission.targetClassCode ? `${mission.targetClassCode}${mission.targetClassTitle ? ` - ${mission.targetClassTitle}` : ""}` : (mission.targetClassTitle ?? "")}
                          className="border-blue-200 bg-blue-50 text-blue-700"
                        />
                      ) : null}
                    </div>
                    {mission.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{mission.description}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
                      <span>Bắt đầu: {formatDateTime(mission.startAt)}</span>
                      <span>Kết thúc: {formatDateTime(mission.endAt)}</span>
                      <span>Thưởng: {formatNumber(mission.rewardStars)} sao • {formatNumber(mission.rewardExp)} XP</span>
                      <span>Mục tiêu: {mission.totalRequired ? `${formatNumber(mission.totalRequired)} lần` : "Chưa đặt"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void showProgress(mission)} disabled={busyAction === `progress-${mission.id}`} className={ghostButton}>
                      {busyAction === `progress-${mission.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Tiến độ
                    </button>
                    <button type="button" onClick={() => openEditMission(mission)} className={ghostButton}>
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </button>
                    {canDeleteMission ? (
                      <button type="button" onClick={() => void removeMission(mission.id)} disabled={busyAction === `delete-mission-${mission.id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {missions.length === 0 ? <EmptyState title="Chưa có nhiệm vụ" description="Tạo nhiệm vụ đầu tiên để bắt đầu các luồng gamification cho học sinh." icon={<Target className="h-5 w-5" />} theme="staff" /> : null}
          </div>
        </Panel>
      ) : null}

      {!loading && !pageError && activeTab === "students" ? (
        <Panel theme="staff">
          <SectionTitle title="Sao, XP và streak theo học sinh" description="Chọn học sinh để xem số sao, cấp độ, streak điểm danh và lịch sử giao dịch sao." theme="staff" />
          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Lớp</label>
              <select value={studentClassFilter} onChange={(event) => { setStudentClassFilter(event.target.value); setSelectedStudentId(""); }} className={inputClass}>
                <option value="">Tất cả lớp</option>
                {classOptions.map((cls) => <option key={cls.id} value={cls.id}>{cls.code ? `${cls.code} - ${cls.title ?? cls.name ?? ""}`.trim() : (cls.title ?? cls.name ?? cls.id)}</option>)}
              </select>
              <label className="mb-2 mt-3 block text-sm font-semibold text-gray-700">Học sinh</label>
              <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} className={inputClass}>
                <option value="">Chọn học sinh</option>
                {(studentClassFilter ? students.filter((s) => s.classId === studentClassFilter) : students).map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
              </select>
              <button type="button" onClick={() => selectedStudentId && void loadStudentSnapshot(selectedStudentId)} className={`${ghostButton} mt-3 w-full`}>Làm mới dữ liệu</button>
              <div className="mt-5 rounded-3xl border border-white bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white"><UserRound className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedStudent?.label ?? "Chưa chọn học sinh"}</p>
                    <p className="text-sm text-gray-500">{selectedStudent?.helperText || selectedStudent?.studentId || "Hãy chọn một học sinh để thao tác"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {studentLoading ? <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-8 text-center text-sm text-gray-500"><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />Đang tải snapshot học sinh...</div> : null}
              {!studentLoading && selectedStudentId ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard theme="staff" icon={<Star className="h-5 w-5" />} label="Số sao hiện tại" value={formatNumber(studentBalance)} accent="from-amber-500 via-orange-500 to-red-500" />
                    <MetricCard theme="staff" icon={<Sparkles className="h-5 w-5" />} label="XP hiện tại" value={formatNumber(studentLevel?.xp)} hint={`Cần ${formatNumber(studentLevel?.xpRequiredForNextLevel)} XP để lên cấp`} accent="from-cyan-500 via-blue-500 to-indigo-500" />
                    <MetricCard theme="staff" icon={<Trophy className="h-5 w-5" />} label="Cấp độ" value={studentLevel?.level != null && Number.isFinite(studentLevel.level) ? `Cấp ${studentLevel.level}` : "Chưa có"} hint={`XP: ${formatNumber(studentLevel?.xp)}`} accent="from-violet-500 via-fuchsia-500 to-pink-500" />
                    <MetricCard theme="staff" icon={<CheckCheck className="h-5 w-5" />} label="Streak hiện tại" value={`${formatNumber(studentStreak?.currentStreak)} ngày`} hint={`Kỷ lục ${formatNumber(studentStreak?.maxStreak)} ngày`} accent="from-emerald-500 via-teal-500 to-cyan-500" />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                      <h3 className="text-lg font-bold text-gray-900">Điều chỉnh sao</h3>
                      <div className="mt-4 space-y-3">
                        <input
                          value={studentAction.starAmount}
                          onChange={(event) => {
                            clearStudentActionErrors(["starAmount"]);
                            setStudentAction((current) => ({
                              ...current,
                              starAmount: event.target.value,
                            }));
                          }}
                          className={getFieldClass(inputClass, Boolean(studentActionErrors.starAmount))}
                          inputMode="numeric"
                          placeholder="Số sao"
                        />
                        <FieldError message={studentActionErrors.starAmount} />
                        <input value={studentAction.starReason} onChange={(event) => setStudentAction((current) => ({ ...current, starReason: event.target.value }))} className={inputClass} placeholder="Lý do" />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void runStudentAction("addStars")} disabled={busyAction === "addStars"} className={primaryButton}><Plus className="h-4 w-4" />Cộng sao</button>
                          <button type="button" onClick={() => void runStudentAction("deductStars")} disabled={busyAction === "deductStars"} className={ghostButton}><Coins className="h-4 w-4" />Trừ sao</button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                      <h3 className="text-lg font-bold text-gray-900">Điều chỉnh XP</h3>
                      <div className="mt-4 space-y-3">
                        <input
                          value={studentAction.xpAmount}
                          onChange={(event) => {
                            clearStudentActionErrors(["xpAmount"]);
                            setStudentAction((current) => ({
                              ...current,
                              xpAmount: event.target.value,
                            }));
                          }}
                          className={getFieldClass(inputClass, Boolean(studentActionErrors.xpAmount))}
                          inputMode="numeric"
                          placeholder="Số XP"
                        />
                        <FieldError message={studentActionErrors.xpAmount} />
                        <input value={studentAction.xpReason} onChange={(event) => setStudentAction((current) => ({ ...current, xpReason: event.target.value }))} className={inputClass} placeholder="Lý do" />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void runStudentAction("addXp")} disabled={busyAction === "addXp"} className={primaryButton}><Plus className="h-4 w-4" />Cộng XP</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                      <h3 className="text-lg font-bold text-gray-900">Giao dịch sao gần nhất</h3>
                      <div className="mt-4 space-y-3">
                        {transactions.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-white bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-gray-900">{item.reason || "Không có lý do"}</p>
                              <p className={`text-sm font-bold ${item.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{item.amount >= 0 ? "+" : ""}{formatNumber(item.amount)}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Balance sau giao dịch: {formatNumber(item.balanceAfter)} • {formatDateTime(item.createdAt)}</p>
                          </div>
                        ))}
                        {transactions.length === 0 ? <EmptyState title="Chưa có giao dịch sao" description="Sau khi cộng hoặc trừ sao, lịch sử sẽ hiển thị tại đây." icon={<Star className="h-5 w-5" />} theme="staff" /> : null}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                      <h3 className="text-lg font-bold text-gray-900">Điểm danh gần nhất</h3>
                      <div className="mt-4 space-y-3">
                        {(studentStreak?.recentStreaks ?? []).map((item) => (
                          <div key={item.id} className="rounded-2xl border border-white bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-gray-900">{formatDate(item.attendanceDate)}</p>
                              <p className="text-sm font-semibold text-amber-600">+{formatNumber(item.rewardStars)} sao</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Streak {formatNumber(item.currentStreak)} ngày • +{formatNumber(item.rewardExp)} XP</p>
                          </div>
                        ))}
                        {(studentStreak?.recentStreaks ?? []).length === 0 ? <EmptyState title="Chưa có lịch sử streak" description="Dữ liệu điểm danh của học sinh sẽ hiển thị tại đây." icon={<CheckCheck className="h-5 w-5" />} theme="staff" /> : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              {!studentLoading && !selectedStudentId ? <EmptyState title="Chưa chọn học sinh" description="Chọn một học sinh ở cột bên trái để thao tác sao, XP và streak." icon={<UserRound className="h-5 w-5" />} theme="staff" /> : null}
            </div>
          </div>
        </Panel>
      ) : null}

      {!loading && !pageError && canManageStore && activeTab === "rewardStore" ? (
        <Panel theme="staff">
          <SectionTitle
            title="Kho quà thưởng"
            description="Quản lý vật phẩm đổi thưởng, giá sao và trạng thái hiển thị trên cửa hàng learner."
            theme="staff"
            action={
              <button type="button" onClick={openCreateReward} className={primaryButton}>
                <Plus className="h-4 w-4" />
                Tạo vật phẩm
              </button>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {rewardItems.map((item) => {
              const itemImageUrl = buildFileUrl(item.imageUrl);

              return (
                <div key={item.id} className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-2xl border border-red-200 bg-red-50 sm:w-24">
                      {itemImageUrl ? (
                        <img
                          src={itemImageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-red-300">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-gray-900">{item.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description || "Chưa có mô tả"}</p>
                        </div>
                        <StatusPill
                          label={item.isActive ? "Đang mở" : "Đang ẩn"}
                          className={item.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-white text-gray-700"}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
                        <span>Giá: {formatNumber(item.costStars)} sao</span>
                        <span>Tạo lúc: {formatDateTime(item.createdAt)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => openEditReward(item)} className={ghostButton}>
                          <Pencil className="h-4 w-4" />
                          Sửa
                        </button>
                        <button type="button" onClick={() => void toggleRewardStatus(item.id)} disabled={busyAction === `toggle-reward-${item.id}`} className={ghostButton}>
                          {item.isActive ? "Ẩn vật phẩm" : "Mở vật phẩm"}
                        </button>
                        <button type="button" onClick={() => void removeRewardItem(item.id)} disabled={busyAction === `delete-reward-${item.id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60">
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div> 
        );
      })}
            {rewardItems.length === 0 ? (
              <EmptyState
                title="Chưa có vật phẩm"
                description="Hãy tạo vật phẩm đầu tiên để học sinh có thể đổi thưởng."
                icon={<Package className="h-5 w-5" />}
                theme="staff"
              />
            ) : null}
          </div> {/* Đóng grid ở đúng vị trí */}
        </Panel>
      ) : null}

      {!loading && !pageError && activeTab === "redemptions" ? (
        <Panel theme="staff">
          <SectionTitle
            title="Yêu cầu đổi thưởng"
            description="Theo dõi yêu cầu đổi thưởng, xem chi tiết và xử lý trạng thái của từng đơn."
            theme="staff"
            action={
              canManageStore ? (
                <div className="flex flex-wrap gap-2">
                  <input value={batchYear} onChange={(event) => setBatchYear(event.target.value)} className="w-28 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm" inputMode="numeric" placeholder="Năm" />
                  <input value={batchMonth} onChange={(event) => setBatchMonth(event.target.value)} className="w-24 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm" inputMode="numeric" placeholder="Tháng" />
                  <button type="button" onClick={() => void runBatchDeliver()} disabled={busyAction === "batch-deliver"} className={primaryButton}>Giao hàng loạt</button>
                </div>
              ) : undefined
            }
          />
          <div className="space-y-4">
            {redemptions.map((item) => (
              <div key={item.id} className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{item.itemName}</h3>
                      <StatusPill label={mapRedemptionStatusLabel(item.status)} className={getRedemptionStatusClasses(item.status)} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-5 text-sm text-gray-500">
                      <span>Học sinh: {item.studentName || item.studentProfileId}</span>
                      <span>Số lượng: {formatNumber(item.quantity)}</span>
                      <span>Chi nhánh: {item.branchName || "Chưa có"}</span>
                      <span>Sao đã trừ: {formatNumber(item.starsDeducted)}</span>
                      <span>Tạo lúc: {formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void openRedemptionDetail(item.id)} className={ghostButton}>Chi tiết</button>
                    {canManageStore && item.status === "Requested" ? <button type="button" onClick={() => void transitionRedemption(item.id, "approve")} disabled={busyAction === `approve-${item.id}`} className={primaryButton}>Duyệt</button> : null}
                    {canManageStore && (item.status === "Requested" || item.status === "Approved") ? <button type="button" onClick={() => void transitionRedemption(item.id, "cancel")} disabled={busyAction === `cancel-${item.id}`} className={ghostButton}>Hủy</button> : null}
                    {canManageStore && item.status === "Approved" ? <button type="button" onClick={() => void transitionRedemption(item.id, "deliver")} disabled={busyAction === `deliver-${item.id}`} className={ghostButton}>Đánh dấu đã giao</button> : null}
                  </div>
                </div>
              </div>
            ))}
            {redemptions.length === 0 ? <EmptyState title="Chưa có đơn đổi thưởng" description="Khi học sinh gửi yêu cầu đổi quà, danh sách sẽ hiển thị tại đây." icon={<Gift className="h-5 w-5" />} theme="staff" /> : null}
            {redemptionTotalPages > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setRedemptionPage((p) => Math.max(1, p - 1))}
                  disabled={redemptionPage <= 1}
                  className={ghostButton}
                >
                  Trước
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  Trang {redemptionPage} / {redemptionTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setRedemptionPage((p) => Math.min(redemptionTotalPages, p + 1))}
                  disabled={redemptionPage >= redemptionTotalPages}
                  className={ghostButton}
                >
                  Sau
                </button>
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <DialogShell
        open={missionDialogOpen}
        onClose={closeMissionDialog}
        title={missionForm.id ? "Cập nhật nhiệm vụ" : "Tạo nhiệm vụ mới"}
        description="Điền đúng phạm vi, cách tính tiến độ và mục tiêu để backend tự resolve phần thưởng theo reward rule."
        theme="staff"
      >
        <p className="mb-4 text-xs font-medium text-rose-600">
          Các trường đánh dấu * là bắt buộc.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormLabel label="Tiêu đề" required />
            <input
              value={missionForm.title}
              onChange={(event) => {
                clearMissionErrors(["title"]);
                setMissionForm((current) => ({ ...current, title: event.target.value }));
              }}
              className={getFieldClass(inputClass, Boolean(missionErrors.title))}
            />
            <FieldError message={missionErrors.title} />
          </div>

          <div className="md:col-span-2">
            <FormLabel label="Mô tả" />
            <textarea
              value={missionForm.description}
              onChange={(event) =>
                setMissionForm((current) => ({ ...current, description: event.target.value }))
              }
              className={textareaClass}
            />
          </div>

          <div>
            <FormLabel label="Phạm vi" />
            <select
              value={missionForm.scope}
              onChange={(event) => {
                clearMissionErrors(["targetClassId", "targetStudentId", "targetGroupIds"]);
                setMissionStudentClassFilter("");
                setMissionForm((current) => ({
                  ...current,
                  scope: event.target.value as MissionScope,
                  targetClassId: "",
                  targetStudentId: "",
                  targetGroupIds: [],
                }));
              }}
              className={inputClass}
            >
              <option value="Student">Học sinh</option>
              <option value="Class">Lớp</option>
              <option value="Group">Nhóm</option>
            </select>
          </div>

          <div>
            <FormLabel label="Loại nhiệm vụ" required />
            <select
              value={missionForm.missionType}
              onChange={(event) => {
                clearMissionErrors(["missionType"]);
                setMissionForm((current) => ({
                  ...current,
                  missionType: event.target.value as MissionType | "",
                }));
              }}
              className={getFieldClass(inputClass, Boolean(missionErrors.missionType))}
            >
              <option value="">Chọn loại nhiệm vụ</option>
              <option value="Custom">Tùy chỉnh</option>
              <option value="HomeworkStreak">Chuỗi bài tập</option>
              <option value="ReadingStreak">Chuỗi đọc sách</option>
              <option value="NoUnexcusedAbsence">Chuỗi điểm danh</option>
              <option value="ClassAttendance">Chuyên cần lớp học</option>
            </select>
            <FieldError message={missionErrors.missionType} />
          </div>

          <div>
            <FormLabel label="Cách tính tiến độ" required />
            <select
              value={missionForm.progressMode}
              onChange={(event) => {
                clearMissionErrors(["progressMode"]);
                setMissionForm((current) => ({
                  ...current,
                  progressMode: event.target.value as MissionProgressMode,
                }));
              }}
              className={getFieldClass(inputClass, Boolean(missionErrors.progressMode))}
            >
              <option value="Count">Theo số lần</option>
              <option value="Streak">Theo chuỗi</option>
            </select>
            <FieldError message={missionErrors.progressMode} />
          </div>

          {missionForm.scope === "Student" ? (
            <div className="md:col-span-2 space-y-3">
              <div>
                <FormLabel label="Lớp" required />
                <select
                  value={missionStudentClassFilter}
                  onChange={(event) => {
                    setMissionStudentClassFilter(event.target.value);
                    clearMissionErrors(["targetStudentId"]);
                    setMissionForm((current) => ({ ...current, targetStudentId: "" }));
                  }}
                  className={inputClass}
                >
                  <option value="">Chọn lớp</option>
                  {classOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} - ` : ""}
                      {item.title || item.name || item.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FormLabel label="Học sinh áp dụng" required />
                <select
                  value={missionForm.targetStudentId}
                  onChange={(event) => {
                    clearMissionErrors(["targetStudentId"]);
                    setMissionForm((current) => ({
                      ...current,
                      targetStudentId: event.target.value,
                    }));
                  }}
                  className={getFieldClass(inputClass, Boolean(missionErrors.targetStudentId))}
                  disabled={!missionStudentClassFilter}
                >
                  <option value="">
                    {missionStudentClassFilter ? "Chọn học sinh" : "Chọn lớp trước"}
                  </option>
                  {(missionStudentClassFilter
                    ? students.filter((s) => s.classId === missionStudentClassFilter)
                    : []
                  ).map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.dropdownLabel || student.label}
                    </option>
                  ))}
                </select>
                <FieldError message={missionErrors.targetStudentId} />
                {selectedMissionTargetStudent ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedMissionTargetStudent.helperText ||
                      selectedMissionTargetStudent.studentId ||
                      "Học sinh đã chọn"}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {missionForm.scope === "Class" ? (
            <div className="md:col-span-2">
              <FormLabel label="Lớp áp dụng" required />
              <select
                value={missionForm.targetClassId}
                onChange={(event) => {
                  clearMissionErrors(["targetClassId"]);
                  setMissionForm((current) => ({
                    ...current,
                    targetClassId: event.target.value,
                  }));
                }}
                className={getFieldClass(inputClass, Boolean(missionErrors.targetClassId))}
              >
                <option value="">Chọn lớp</option>
                {classOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code ? `${item.code} - ` : ""}
                    {item.title || item.name || item.id}
                  </option>
                ))}
              </select>
              <FieldError message={missionErrors.targetClassId} />
            </div>
          ) : null}

          {missionForm.scope === "Group" ? (
            <div className="md:col-span-2">
              <FormLabel label="Nhóm áp dụng" required />
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-500">Lọc theo lớp</label>
                <select
                  value={groupClassFilter}
                  onChange={(event) => setGroupClassFilter(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Tất cả học sinh</option>
                  {classOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} - ` : ""}
                      {item.title || item.name || item.id}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className={cx(
                  "max-h-64 space-y-2 overflow-y-auto rounded-2xl border p-3",
                  missionErrors.targetGroupIds
                    ? "border-rose-300 bg-rose-50/70"
                    : "border-red-200 bg-red-50/40"
                )}
              >
                {students.filter((student) => {
                  if (!groupClassFilter) return true;
                  // Filter students by class: check classText for matching class
                  const classOpt = classOptions.find((c) => c.id === groupClassFilter);
                  if (!classOpt) return true;
                  const classLabel = (classOpt.code || classOpt.title || classOpt.name || classOpt.id).toLowerCase();
                  return (student.classText || "").toLowerCase().includes(classLabel) || (student.helperText || "").toLowerCase().includes(classLabel);
                }).map((student) => {
                  const checked = missionForm.targetGroupIds.includes(student.id);

                  return (
                    <label
                      key={student.id}
                      className={cx(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition",
                        checked
                          ? "border-red-300 bg-white"
                          : "border-transparent bg-white/70 hover:border-red-200"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMissionGroupStudent(student.id)}
                        className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900">
                          {student.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {student.helperText || student.studentId || student.id}
                        </span>
                      </span>
                    </label>
                  );
                })}
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có danh sách học sinh để chọn.</p>
                ) : null}
              </div>
              <FieldError message={missionErrors.targetGroupIds} />
              {selectedMissionGroupStudents.length > 0 ? (
                <p className="mt-2 text-xs text-gray-500">
                  Đã chọn {selectedMissionGroupStudents.length} học sinh.
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <FormLabel label="Bắt đầu" />
            <input
              type="datetime-local"
              value={missionForm.startAt}
              onChange={(event) => {
                clearMissionErrors(["startAt"]);
                setMissionForm((current) => ({ ...current, startAt: event.target.value }));
              }}
              className={getFieldClass(inputClass, Boolean(missionErrors.startAt))}
            />
            <FieldError message={missionErrors.startAt} />
            <p className="mt-1 text-xs text-gray-400">Để trống nếu muốn bắt đầu ngay lập tức.</p>
          </div>

          <div>
            <FormLabel label="Kết thúc" />
            <input
              type="datetime-local"
              value={missionForm.endAt}
              onChange={(event) => {
                clearMissionErrors(["endAt"]);
                setMissionForm((current) => ({ ...current, endAt: event.target.value }));
              }}
              className={getFieldClass(inputClass, Boolean(missionErrors.endAt))}
            />
            <FieldError message={missionErrors.endAt} />
            <p className="mt-1 text-xs text-gray-400">Có thể để trống nếu mission không giới hạn ngày kết thúc.</p>
          </div>

          <div className="md:col-span-2">
            <FormLabel label="Mục tiêu hoàn thành (totalRequired)" required />
            <input
              value={missionForm.totalRequired}
              onChange={(event) => {
                clearMissionErrors(["totalRequired"]);
                setMissionForm((current) => ({ ...current, totalRequired: event.target.value }));
              }}
              inputMode="numeric"
              className={getFieldClass(inputClass, Boolean(missionErrors.totalRequired))}
              placeholder="Ví dụ: 5 (hoàn thành 5 lần bài tập để đạt mục tiêu)"
            />
            <FieldError message={missionErrors.totalRequired} />
            <p className="mt-1 text-xs text-gray-400">
              Backend dùng loại nhiệm vụ + cách tính tiến độ + totalRequired để tự resolve phần thưởng từ reward rule đang active.
            </p>
            {missionForm.id && (
              <p className="mt-1 text-xs text-gray-500">
                Phần thưởng hiện tại: {formatNumber(missions.find((item) => item.id === missionForm.id)?.rewardStars)} sao • {formatNumber(missions.find((item) => item.id === missionForm.id)?.rewardExp)} XP
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={closeMissionDialog} className={ghostButton}>
            Đóng
          </button>
          <button
            type="button"
            onClick={() => void submitMission()}
            disabled={busyAction === "submit-mission"}
            className={primaryButton}
          >
            {busyAction === "submit-mission" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Lưu nhiệm vụ
          </button>
        </div>
      </DialogShell>

      <DialogShell
        open={rewardDialogOpen}
        onClose={closeRewardDialog}
        title={rewardForm.id ? "Cập nhật vật phẩm" : "Tạo vật phẩm mới"}
        description="Số sao đổi phải lớn hơn 0. Backend hiện không dùng quantity ở API reward store."
        theme="staff"
      >
        <p className="mb-4 text-xs font-medium text-rose-600">
          Các trường đánh dấu * là bắt buộc.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormLabel label="Tên vật phẩm" required />
            <input
              value={rewardForm.title}
              onChange={(event) => {
                clearRewardErrors(["title"]);
                setRewardForm((current) => ({ ...current, title: event.target.value }));
              }}
              className={getFieldClass(inputClass, Boolean(rewardErrors.title))}
            />
            <FieldError message={rewardErrors.title} />
          </div>

          <div className="md:col-span-2">
            <FormLabel label="Mô tả" />
            <textarea
              value={rewardForm.description}
              onChange={(event) =>
                setRewardForm((current) => ({ ...current, description: event.target.value }))
              }
              className={textareaClass}
            />
          </div>

          <div className="md:col-span-2">
            <FormLabel label="Ảnh vật phẩm" />
            <input
              ref={rewardImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void handleRewardImageChange(event)}
            />
            {rewardForm.imageUrl ? (
              <div className="overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30">
                <div className="aspect-[16/8] w-full bg-red-50">
                  <img
                    src={rewardImagePreviewUrl || rewardForm.imageUrl}
                    alt="Ảnh vật phẩm"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-red-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    <span className="max-w-[420px] truncate">{rewardForm.imageUrl}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => rewardImageInputRef.current?.click()}
                      disabled={imageUploading}
                      className={ghostButton}
                    >
                      {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setRewardForm((current) => ({ ...current, imageUrl: "" }))}
                      disabled={imageUploading}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => rewardImageInputRef.current?.click()}
                disabled={imageUploading}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-red-200 bg-gradient-to-br from-white to-red-50/30 px-6 py-10 text-center transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {imageUploading ? <Loader2 className="h-8 w-8 animate-spin text-gray-500" /> : <Upload className="h-8 w-8 text-gray-500" />}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {imageUploading ? "Đang tải ảnh lên..." : "Chọn ảnh từ máy"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 10MB.</p>
                </div>
              </button>
            )}
          </div>

          <div>
            <FormLabel label="Số sao đổi" required />
            <input
              value={rewardForm.costStars}
              onChange={(event) => {
                clearRewardErrors(["costStars"]);
                setRewardForm((current) => ({ ...current, costStars: event.target.value }));
              }}
              inputMode="numeric"
              className={getFieldClass(inputClass, Boolean(rewardErrors.costStars))}
            />
            <FieldError message={rewardErrors.costStars} />
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={rewardForm.isActive}
              onChange={(event) =>
                setRewardForm((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            Hiển thị trên cửa hàng
          </label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={closeRewardDialog}
            className={ghostButton}
            disabled={imageUploading}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => void submitRewardItem()}
            disabled={busyAction === "submit-reward" || imageUploading}
            className={primaryButton}
          >
            {busyAction === "submit-reward" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Lưu vật phẩm
          </button>
        </div>
      </DialogShell>

      <DialogShell open={progressDialog.open} onClose={() => setProgressDialog({ mission: null, items: [], open: false })} title={progressDialog.mission?.title || "Tiến độ nhiệm vụ"} description="Danh sách tiến độ hiện có theo nhiệm vụ được chọn." theme="staff">
        <div className="space-y-3">
          {progressDialog.items.map((item) => {
            const pct = getMissionProgressPercent({
              progressValue: item.progressValue,
              totalRequired:
                item.totalRequired ?? progressDialog.mission?.totalRequired,
              fallback: item.progressPercentage,
            });
            return (
              <div key={item.id} className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{item.studentName || item.studentProfileId}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Tiến độ: {formatNumber(item.progressValue)}{(item.totalRequired ?? progressDialog.mission?.totalRequired) ? ` / ${formatNumber(item.totalRequired ?? progressDialog.mission?.totalRequired)}` : ""}</span>
                        <span className="font-semibold text-gray-700">{pct}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div className={cx("h-full rounded-full transition-all duration-500", pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-blue-500" : "bg-gray-300")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <StatusPill label={mapProgressStatusLabel(item.status)} className={getMissionProgressClasses(item.status)} />
                </div>
              </div>
            );
          })}
          {progressDialog.items.length === 0 ? <EmptyState title="Chưa có tiến độ nhiệm vụ" description="Nhiệm vụ này chưa phát sinh tiến độ hoặc backend chưa ghi nhận dữ liệu." icon={<Target className="h-5 w-5" />} theme="staff" /> : null}
        </div>
      </DialogShell>

      <DialogShell open={Boolean(redemptionDetail)} onClose={() => setRedemptionDetail(null)} title={redemptionDetail?.itemName || "Chi tiết yêu cầu đổi thưởng"} description="Thông tin chi tiết của yêu cầu đổi quà để staff và người học tiện theo dõi." theme="staff">
        {redemptionDetail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <StatusPill label={mapRedemptionStatusLabel(redemptionDetail.status)} className={getRedemptionStatusClasses(redemptionDetail.status)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Học sinh</p>
                <p className="mt-1 font-semibold text-gray-900">{redemptionDetail.studentName || redemptionDetail.studentProfileId}</p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chi nhánh</p>
                <p className="mt-1 font-semibold text-gray-900">{redemptionDetail.branchName || "Chưa có"}</p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Số lượng</p>
                <p className="mt-1 font-semibold text-gray-900">{formatNumber(redemptionDetail.quantity)}</p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sao đã trừ</p>
                <p className="mt-1 font-semibold text-gray-900">{formatNumber(redemptionDetail.starsDeducted)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span className="text-gray-500">Tạo lúc</span><span className="font-medium text-gray-900">{formatDateTime(redemptionDetail.createdAt)}</span></div>
              {redemptionDetail.handledAt ? <div className="flex justify-between"><span className="text-gray-500">Xử lý lúc</span><span className="font-medium text-gray-900">{formatDateTime(redemptionDetail.handledAt)}</span></div> : null}
              {redemptionDetail.deliveredAt ? <div className="flex justify-between"><span className="text-gray-500">Giao lúc</span><span className="font-medium text-gray-900">{formatDateTime(redemptionDetail.deliveredAt)}</span></div> : null}
              {redemptionDetail.receivedAt ? <div className="flex justify-between"><span className="text-gray-500">Nhận lúc</span><span className="font-medium text-gray-900">{formatDateTime(redemptionDetail.receivedAt)}</span></div> : null}
            </div>
            {redemptionDetail.status === "Cancelled" && redemptionDetail.cancellationReason ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-medium text-rose-500 uppercase tracking-wide">Lý do hủy</p>
                <p className="mt-1 text-sm text-rose-700">{redemptionDetail.cancellationReason}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogShell>

      {/* Cancel Redemption Dialog */}
      <DialogShell
        open={Boolean(cancelRedemptionId)}
        onClose={() => { setCancelRedemptionId(null); setCancelReason(""); }}
        title="Hủy yêu cầu đổi thưởng"
        description="Nhập lý do hủy (không bắt buộc). Sao sẽ được hoàn lại cho học sinh."
        theme="staff"
        widthClass="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <FormLabel label="Lý do hủy" />
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              className={textareaClass}
              placeholder="Nhập lý do hủy (không bắt buộc)..."
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => { setCancelRedemptionId(null); setCancelReason(""); }}
              className={ghostButton}
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => void confirmCancelRedemption()}
              disabled={busyAction === `cancel-${cancelRedemptionId}`}
              className={dangerGhostButton}
            >
              {busyAction === `cancel-${cancelRedemptionId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Xác nhận hủy
            </button>
          </div>
        </div>
      </DialogShell>
    </div>
  );
}

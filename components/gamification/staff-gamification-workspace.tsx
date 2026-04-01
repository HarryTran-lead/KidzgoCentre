// Theme: matches accounts page (red/white light theme) — replaced by bulk update
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCheck,
  Coins,
  Gift,
  ImageIcon,
  Link2,
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
import { fetchHomework } from "@/lib/api/homeworkService";
import { getAllStudents } from "@/lib/api/studentService";
import {
  addStars,
  addXp,
  approveRewardRedemption,
  batchDeliverRewardRedemptions,
  cancelRewardRedemption,
  createMission,
  createRewardStoreItem,
  deductStars,
  deductXp,
  deleteMission,
  deleteRewardStoreItem,
  getAttendanceStreak,
  getLevel,
  getMissionClassOptions,
  getMissionProgress,
  getRewardRedemption,
  getStarBalance,
  getStarTransactions,
  linkHomeworkToMission,
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
  MissionScope,
  MissionType,
  RewardRedemption,
  RewardStoreItem,
} from "@/types/gamification";
import type { HomeworkSubmission } from "@/types/teacher/homework";
import {
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
  getMissionProgressClasses,
  getRedemptionStatusClasses,
  mapMissionScopeLabel,
  mapMissionTypeLabel,
  mapProgressStatusLabel,
  mapRedemptionStatusLabel,
  normalizeProblemMessage,
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
  missionType: MissionType;
  startAt: string;
  endAt: string;
  rewardStars: string;
  rewardExp: string;
};

type RewardFormState = {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  costStars: string;
  quantity: string;
  isActive: boolean;
};

type HomeworkLinkOption = {
  id: string;
  title: string;
  classTitle?: string;
  dueAt?: string;
};

const inputClass =
  "w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100";
const textareaClass = `${inputClass} min-h-[112px]`;
const ghostButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-red-50 cursor-pointer";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";
const dangerGhostButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60";

const missionSeed: MissionFormState = {
  title: "",
  description: "",
  scope: "Student",
  targetClassId: "",
  targetStudentId: "",
  targetGroupIds: [],
  missionType: "Custom",
  startAt: "",
  endAt: "",
  rewardStars: "",
  rewardExp: "",
};

const rewardSeed: RewardFormState = {
  title: "",
  description: "",
  imageUrl: "",
  costStars: "",
  quantity: "",
  isActive: true,
};

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
  const tabs = [
    { id: "missions" as const, label: "Nhiệm vụ" },
    { id: "students" as const, label: "Sao / XP" },
    ...(canManageStore ? ([{ id: "rewardStore" as const, label: "Kho quà" }] as const) : []),
    { id: "redemptions" as const, label: "Đổi thưởng" },
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
  const [rewardForm, setRewardForm] = useState<RewardFormState>(rewardSeed);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [progressDialog, setProgressDialog] = useState<{ mission: Mission | null; items: MissionProgress[]; open: boolean }>({ mission: null, items: [], open: false });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ homeworkId: "", missionId: "" });
  const [homeworkOptions, setHomeworkOptions] = useState<HomeworkLinkOption[]>([]);
  const [homeworkOptionsLoading, setHomeworkOptionsLoading] = useState(false);
  const [homeworkOptionsError, setHomeworkOptionsError] = useState<string | null>(null);
  const [redemptionDetail, setRedemptionDetail] = useState<RewardRedemption | null>(null);
  const [studentAction, setStudentAction] = useState({ starAmount: "", starReason: "", xpAmount: "", xpReason: "" });
  const [batchYear, setBatchYear] = useState("");
  const [batchMonth, setBatchMonth] = useState("");
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

  const selectedHomeworkOption = useMemo(
    () => homeworkOptions.find((item) => item.id === linkForm.homeworkId) ?? null,
    [homeworkOptions, linkForm.homeworkId]
  );

  const selectedMissionOption = useMemo(
    () => missions.find((item) => item.id === linkForm.missionId) ?? null,
    [missions, linkForm.missionId]
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

  async function loadBaseData() {
    setLoading(true);
    setPageError(null);
    const results = await Promise.allSettled([
      listMissions({ pageNumber: 1, pageSize: 50 }),
      getMissionClassOptions(),
      getAllStudents({ profileType: "Student", pageNumber: 1, pageSize: 200 }),
      canManageStore
        ? listRewardStoreItems({ page: 1, pageSize: 50 })
        : Promise.resolve({ items: [], pageNumber: 1, totalPages: 1, totalCount: 0 }),
      listRewardRedemptions({ page: 1, pageSize: 50 }),
    ]);

    const [missionResult, classResult, studentResult, rewardResult, redemptionResult] = results;
    if (missionResult.status === "fulfilled") setMissions(missionResult.value.items);
    if (classResult.status === "fulfilled") setClassOptions(classResult.value);
    if (studentResult.status === "fulfilled") {
      const options = extractStudentOptions(studentResult.value);
      setStudents(options);
      setSelectedStudentId((current) => current || options[0]?.id || "");
    }
    if (rewardResult.status === "fulfilled") setRewardItems(rewardResult.value.items);
    if (redemptionResult.status === "fulfilled") setRedemptions(redemptionResult.value.items);
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
    if (selectedStudentId) void loadStudentSnapshot(selectedStudentId);
  }, [selectedStudentId]);

  function openCreateMission() {
    setMissionForm(missionSeed);
    setMissionDialogOpen(true);
  }

  function openEditMission(mission: Mission) {
    setMissionForm({
      id: mission.id,
      title: mission.title,
      description: mission.description ?? "",
      scope: mission.scope,
      targetClassId: mission.targetClassId ?? "",
      targetStudentId: mission.targetStudentId ?? "",
      targetGroupIds: normalizeMissionTargetGroup(mission.targetGroup),
      missionType: mission.missionType,
      startAt: toDatetimeLocal(mission.startAt),
      endAt: toDatetimeLocal(mission.endAt),
      rewardStars: mission.rewardStars ? String(mission.rewardStars) : "",
      rewardExp: mission.rewardExp ? String(mission.rewardExp) : "",
    });
    setMissionDialogOpen(true);
  }

  async function submitMission() {
    if (missionForm.scope === "Class" && !missionForm.targetClassId) {
      toast({
        title: "Thiếu lớp áp dụng",
        description: "Vui lòng chọn lớp cho nhiệm vụ theo lớp.",
        variant: "destructive",
      });
      return;
    }

    if (missionForm.scope === "Student" && !missionForm.targetStudentId) {
      toast({
        title: "Thiếu học sinh áp dụng",
        description: "Vui lòng chọn học sinh cụ thể cho nhiệm vụ này.",
        variant: "destructive",
      });
      return;
    }

    if (missionForm.scope === "Group" && missionForm.targetGroupIds.length === 0) {
      toast({
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
        missionType: missionForm.missionType,
        startAt: toIsoString(missionForm.startAt),
        endAt: toIsoString(missionForm.endAt),
        rewardStars: missionForm.rewardStars
          ? Number(missionForm.rewardStars)
          : undefined,
        rewardExp: missionForm.rewardExp
          ? Number(missionForm.rewardExp)
          : undefined,
      };
      if (missionForm.id) await updateMission(missionForm.id, payload);
      else await createMission(payload);
      toast({
        title: missionForm.id ? "Đã cập nhật nhiệm vụ" : "Đã tạo nhiệm vụ mới",
      });
      setMissionDialogOpen(false);
      setMissionForm(missionSeed);
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể lưu nhiệm vụ",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  function toggleMissionGroupStudent(studentId: string) {
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
      toast({ title: "Đã xóa nhiệm vụ" });
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
    setRewardDialogOpen(true);
  }

  async function loadHomeworkOptions() {
    try {
      setHomeworkOptionsLoading(true);
      setHomeworkOptionsError(null);

      const result = await fetchHomework({ pageNumber: 1, pageSize: 200 });
      if (!result.ok) {
        throw new Error(result.error || "Không thể tải danh sách bài tập.");
      }

      const optionMap = new Map<string, HomeworkLinkOption>();

      for (const item of result.data.data) {
        const homework = item as HomeworkSubmission;
        const id = String(homework.assignmentId || homework.id || "").trim();
        if (!id || optionMap.has(id)) {
          continue;
        }

        optionMap.set(id, {
          id,
          title: homework.title || `Bài tập ${id}`,
          classTitle: homework.classTitle || undefined,
          dueAt: homework.dueAt || undefined,
        });
      }

      setHomeworkOptions(Array.from(optionMap.values()));
    } catch (error) {
      setHomeworkOptions([]);
      setHomeworkOptionsError(normalizeProblemMessage(error));
    } finally {
      setHomeworkOptionsLoading(false);
    }
  }

  function openLinkHomeworkDialog() {
    setLinkForm((current) => ({
      homeworkId: current.homeworkId,
      missionId: current.missionId,
    }));
    setLinkDialogOpen(true);
  }

  function openEditReward(item: RewardStoreItem) {
    setRewardForm({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      costStars: String(item.costStars),
      quantity: String(item.quantity),
      isActive: item.isActive,
    });
    setRewardDialogOpen(true);
  }

  async function submitRewardItem() {
    try {
      setBusyAction("submit-reward");
      const payload = {
        title: rewardForm.title.trim(),
        description: rewardForm.description.trim() || undefined,
        imageUrl: rewardForm.imageUrl.trim() || undefined,
        costStars: Number(rewardForm.costStars || 0),
        quantity: Number(rewardForm.quantity || 0),
        isActive: rewardForm.isActive,
      };
      if (rewardForm.id) await updateRewardStoreItem(rewardForm.id, payload);
      else await createRewardStoreItem(payload);
      toast({
        title: rewardForm.id
          ? "Đã cập nhật quà thưởng"
          : "Đã tạo quà thưởng mới",
      });
      setRewardDialogOpen(false);
      setRewardForm(rewardSeed);
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể lưu quà thưởng",
        description: normalizeProblemMessage(error),
        variant: "destructive",
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
      toast({ title: "Đã xoá vật phẩm" });
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
    action: "addStars" | "deductStars" | "addXp" | "deductXp"
  ) {
    if (!selectedStudentId) return;
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
      if (action === "deductXp")
        await deductXp({ studentProfileId: selectedStudentId, amount, reason });
      toast({ title: "Đã cập nhật dữ liệu học sinh" });
      await loadStudentSnapshot(selectedStudentId);
      setStudentAction({
        starAmount: "",
        starReason: "",
        xpAmount: "",
        xpReason: "",
      });
    } catch (error) {
      toast({
        title: "Không thể cập nhật dữ liệu",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function submitLinkHomework() {
    if (!linkForm.homeworkId.trim() || !linkForm.missionId.trim()) {
      toast({
        title: "Thiếu thông tin liên kết",
        description: "Vui lòng chọn bài tập và nhiệm vụ cần liên kết.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBusyAction("link-homework");
      await linkHomeworkToMission(
        linkForm.homeworkId.trim(),
        linkForm.missionId.trim()
      );
      toast({ title: "Đã liên kết bài tập với nhiệm vụ" });
      setLinkDialogOpen(false);
      setLinkForm({ homeworkId: "", missionId: "" });
    } catch (error) {
      toast({
        title: "Không thể liên kết bài tập",
        description: normalizeProblemMessage(error),
        variant: "destructive",
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
        const reason = window.prompt("Nhập lý do hủy (không bắt buộc):") ?? "";
        await cancelRewardRedemption(id, { reason: reason.trim() || undefined });
      }
      if (action === "deliver") await markRewardRedemptionDelivered(id);
      toast({ title: "Đã cập nhật trạng thái đổi thưởng" });
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

  async function runBatchDeliver() {
    try {
      setBusyAction("batch-deliver");
      await batchDeliverRewardRedemptions({
        year: batchYear ? Number(batchYear) : undefined,
        month: batchMonth ? Number(batchMonth) : undefined,
      });
      toast({ title: "Đã chạy giao hàng loạt" });
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
      toast({
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

  useEffect(() => {
    if (!linkDialogOpen) {
      return;
    }

    void loadHomeworkOptions();
  }, [linkDialogOpen]);

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
            description="Tạo nhiệm vụ mới, cập nhật phạm vi áp dụng, xem tiến độ và liên kết bài tập vào nhiệm vụ."
            theme="staff"
            action={
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={openCreateMission} className={primaryButton}>
                  <Plus className="h-4 w-4" />
                  Tạo nhiệm vụ
                </button>
                <button type="button" onClick={openLinkHomeworkDialog} className={ghostButton}>
                  <Link2 className="h-4 w-4" />
                  Liên kết bài tập
                </button>
              </div>
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
                      <StatusPill label={mapMissionScopeLabel(mission.scope)} className="border-amber-200 bg-amber-50 text-amber-700" />
                    </div>
                    {mission.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{mission.description}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
                      <span>Bắt đầu: {formatDateTime(mission.startAt)}</span>
                      <span>Kết thúc: {formatDateTime(mission.endAt)}</span>
                      <span>Thưởng: {formatNumber(mission.rewardStars)} sao • {formatNumber(mission.rewardExp)} XP</span>
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
              <label className="mb-2 block text-sm font-semibold text-gray-700">Học sinh</label>
              <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} className={inputClass}>
                <option value="">Chọn học sinh</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.dropdownLabel || student.label}</option>)}
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard theme="staff" icon={<Star className="h-5 w-5" />} label="Số sao hiện tại" value={formatNumber(studentBalance)} accent="from-amber-500 via-orange-500 to-red-500" />
                    <MetricCard theme="staff" icon={<Trophy className="h-5 w-5" />} label="Cấp độ" value={`Cấp ${formatNumber(studentLevel?.level)}`} hint={`XP: ${formatNumber(studentLevel?.xp)}`} accent="from-violet-500 via-fuchsia-500 to-pink-500" />
                    <MetricCard theme="staff" icon={<CheckCheck className="h-5 w-5" />} label="Streak hiện tại" value={`${formatNumber(studentStreak?.currentStreak)} ngày`} hint={`Kỷ lục ${formatNumber(studentStreak?.maxStreak)} ngày`} accent="from-emerald-500 via-teal-500 to-cyan-500" />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-5">
                      <h3 className="text-lg font-bold text-gray-900">Điều chỉnh sao</h3>
                      <div className="mt-4 space-y-3">
                        <input value={studentAction.starAmount} onChange={(event) => setStudentAction((current) => ({ ...current, starAmount: event.target.value }))} className={inputClass} inputMode="numeric" placeholder="Số sao" />
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
                        <input value={studentAction.xpAmount} onChange={(event) => setStudentAction((current) => ({ ...current, xpAmount: event.target.value }))} className={inputClass} inputMode="numeric" placeholder="Số XP" />
                        <input value={studentAction.xpReason} onChange={(event) => setStudentAction((current) => ({ ...current, xpReason: event.target.value }))} className={inputClass} placeholder="Lý do" />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void runStudentAction("addXp")} disabled={busyAction === "addXp"} className={primaryButton}><Plus className="h-4 w-4" />Cộng XP</button>
                          <button type="button" onClick={() => void runStudentAction("deductXp")} disabled={busyAction === "deductXp"} className={ghostButton}><Coins className="h-4 w-4" />Trừ XP</button>
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
            description="Quản lý vật phẩm đổi thưởng, giá sao, số lượng tồn và trạng thái hiển thị."
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
                        <span>Tồn kho: {formatNumber(item.quantity)}</span>
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
          </div>
        </Panel>
      ) : null}

      <DialogShell open={missionDialogOpen} onClose={() => setMissionDialogOpen(false)} title={missionForm.id ? "Cập nhật nhiệm vụ" : "Tạo nhiệm vụ mới"} description="Điền đúng phạm vi và phần thưởng để nhiệm vụ bám theo quy tắc backend." theme="staff">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-gray-700">Tiêu đề</label><input value={missionForm.title} onChange={(event) => setMissionForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-gray-700">Mô tả</label><textarea value={missionForm.description} onChange={(event) => setMissionForm((current) => ({ ...current, description: event.target.value }))} className={textareaClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Phạm vi</label><select value={missionForm.scope} onChange={(event) => setMissionForm((current) => ({ ...current, scope: event.target.value as MissionScope, targetClassId: "", targetStudentId: "", targetGroupIds: [] }))} className={inputClass}><option value="Student">Học sinh</option><option value="Class">Lớp</option><option value="Group">Nhóm</option></select></div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Loại nhiệm vụ</label><select value={missionForm.missionType} onChange={(event) => setMissionForm((current) => ({ ...current, missionType: event.target.value as MissionType }))} className={inputClass}><option value="Custom">Tùy chỉnh</option><option value="HomeworkStreak">Chuỗi bài tập</option><option value="ReadingStreak">Chuỗi đọc</option><option value="NoUnexcusedAbsence">Không vắng mặt không phép</option></select></div>
          {missionForm.scope === "Student" ? <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-gray-700">Học sinh áp dụng</label><select value={missionForm.targetStudentId} onChange={(event) => setMissionForm((current) => ({ ...current, targetStudentId: event.target.value }))} className={inputClass}><option value="">Chọn học sinh</option>{students.map((student) => <option key={student.id} value={student.id}>{student.dropdownLabel || student.label}</option>)}</select>{selectedMissionTargetStudent ? <p className="mt-2 text-xs text-gray-500">{selectedMissionTargetStudent.helperText || selectedMissionTargetStudent.studentId || "Học sinh đã chọn"}</p> : null}</div> : null}
          {missionForm.scope === "Class" ? <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-gray-700">Lớp áp dụng</label><select value={missionForm.targetClassId} onChange={(event) => setMissionForm((current) => ({ ...current, targetClassId: event.target.value }))} className={inputClass}><option value="">Chọn lớp</option>{classOptions.map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} - ` : ""}{item.title || item.name || item.id}</option>)}</select></div> : null}
          {missionForm.scope === "Group" ? <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-gray-700">Nhóm áp dụng</label><div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-red-200 bg-red-50/40 p-3">{students.map((student) => { const checked = missionForm.targetGroupIds.includes(student.id); return <label key={student.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${checked ? "border-red-300 bg-white" : "border-transparent bg-white/70 hover:border-red-200"}`}><input type="checkbox" checked={checked} onChange={() => toggleMissionGroupStudent(student.id)} className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-200" /><span className="min-w-0"><span className="block text-sm font-semibold text-gray-900">{student.label}</span><span className="mt-0.5 block text-xs text-gray-500">{student.helperText || student.studentId || student.id}</span></span></label>; })}{students.length === 0 ? <p className="text-sm text-gray-500">Chưa có danh sách học sinh để chọn.</p> : null}</div>{selectedMissionGroupStudents.length > 0 ? <p className="mt-2 text-xs text-gray-500">Đã chọn {selectedMissionGroupStudents.length} học sinh.</p> : null}</div> : null}
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Bắt đầu</label><input type="datetime-local" value={missionForm.startAt} onChange={(event) => setMissionForm((current) => ({ ...current, startAt: event.target.value }))} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Kết thúc</label><input type="datetime-local" value={missionForm.endAt} onChange={(event) => setMissionForm((current) => ({ ...current, endAt: event.target.value }))} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Sao thưởng</label><input value={missionForm.rewardStars} onChange={(event) => setMissionForm((current) => ({ ...current, rewardStars: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">XP thưởng</label><input value={missionForm.rewardExp} onChange={(event) => setMissionForm((current) => ({ ...current, rewardExp: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setMissionDialogOpen(false)} className={ghostButton}>Đóng</button><button type="button" onClick={() => void submitMission()} disabled={busyAction === "submit-mission"} className={primaryButton}>{busyAction === "submit-mission" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Lưu nhiệm vụ</button></div>
      </DialogShell>

      <DialogShell open={rewardDialogOpen} onClose={() => setRewardDialogOpen(false)} title={rewardForm.id ? "Cập nhật vật phẩm" : "Tạo vật phẩm mới"} description="Số sao đổi phải lớn hơn 0 và số lượng không được âm." theme="staff">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-gray-700">Tên vật phẩm</label><input value={rewardForm.title} onChange={(event) => setRewardForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-gray-700">Mô tả</label><textarea value={rewardForm.description} onChange={(event) => setRewardForm((current) => ({ ...current, description: event.target.value }))} className={textareaClass} /></div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Ảnh vật phẩm</label>
            <input ref={rewardImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void handleRewardImageChange(event)} />
            {rewardForm.imageUrl ? (
              <div className="overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-white to-red-50/30">
                <div className="aspect-[16/8] w-full bg-red-50">
                  <img src={rewardImagePreviewUrl || rewardForm.imageUrl} alt="Ảnh vật phẩm" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-red-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    <span className="max-w-[420px] truncate">{rewardForm.imageUrl}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => rewardImageInputRef.current?.click()} disabled={imageUploading} className={ghostButton}>
                      {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Đổi ảnh
                    </button>
                    <button type="button" onClick={() => setRewardForm((current) => ({ ...current, imageUrl: "" }))} disabled={imageUploading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                      <Trash2 className="h-4 w-4" />
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => rewardImageInputRef.current?.click()} disabled={imageUploading} className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-red-200 bg-gradient-to-br from-white to-red-50/30 px-6 py-10 text-center transition hover:border-red-400 hover:bg-red-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                {imageUploading ? <Loader2 className="h-8 w-8 animate-spin text-gray-500" /> : <Upload className="h-8 w-8 text-gray-500" />}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{imageUploading ? "Đang tải ảnh lên..." : "Chọn ảnh từ máy"}</p>
                  <p className="mt-1 text-xs text-gray-500">Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 10MB.</p>
                </div>
              </button>
            )}
          </div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Số sao đổi</label><input value={rewardForm.costStars} onChange={(event) => setRewardForm((current) => ({ ...current, costStars: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-gray-700">Số lượng</label><input value={rewardForm.quantity} onChange={(event) => setRewardForm((current) => ({ ...current, quantity: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={rewardForm.isActive} onChange={(event) => setRewardForm((current) => ({ ...current, isActive: event.target.checked }))} />Hiển thị trên cửa hàng</label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setRewardDialogOpen(false)} className={ghostButton} disabled={imageUploading}>Đóng</button><button type="button" onClick={() => void submitRewardItem()} disabled={busyAction === "submit-reward" || imageUploading} className={primaryButton}>{busyAction === "submit-reward" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Lưu vật phẩm</button></div>
      </DialogShell>

      <DialogShell open={progressDialog.open} onClose={() => setProgressDialog({ mission: null, items: [], open: false })} title={progressDialog.mission?.title || "Tiến độ nhiệm vụ"} description="Danh sách tiến độ hiện có theo nhiệm vụ được chọn." theme="staff">
        <div className="space-y-3">
          {progressDialog.items.map((item) => <div key={item.id} className="rounded-2xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-gray-900">{item.studentName || item.studentProfileId}</p><p className="mt-1 text-sm text-gray-500">Tiến độ: {formatNumber(item.progressValue)} • {formatNumber(item.progressPercentage)}%</p></div><StatusPill label={mapProgressStatusLabel(item.status)} className={getMissionProgressClasses(item.status)} /></div></div>)}
          {progressDialog.items.length === 0 ? <EmptyState title="Chưa có tiến độ nhiệm vụ" description="Nhiệm vụ này chưa phát sinh tiến độ hoặc backend chưa ghi nhận dữ liệu." icon={<Target className="h-5 w-5" />} theme="staff" /> : null}
        </div>
      </DialogShell>

      <DialogShell open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} title="Liên kết bài tập với nhiệm vụ" description="Dùng khi cần gắn một bài tập hiện có vào nhiệm vụ đang chạy." theme="staff">
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Bài tập</label>
            <select value={linkForm.homeworkId} onChange={(event) => setLinkForm((current) => ({ ...current, homeworkId: event.target.value }))} className={inputClass} disabled={homeworkOptionsLoading || homeworkOptions.length === 0}>
              <option value="">
                {homeworkOptionsLoading ? "Đang tải danh sách bài tập..." : homeworkOptions.length === 0 ? "Không có bài tập để chọn" : "Chọn bài tập"}
              </option>
              {homeworkOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}{item.classTitle ? ` • ${item.classTitle}` : ""}
                </option>
              ))}
            </select>
            {selectedHomeworkOption ? <p className="mt-2 text-xs text-gray-500">{selectedHomeworkOption.classTitle ? `${selectedHomeworkOption.classTitle}` : "Bài tập đã chọn"}{selectedHomeworkOption.dueAt ? ` • Hạn nộp: ${formatDateTime(selectedHomeworkOption.dueAt)}` : ""}</p> : null}
            {homeworkOptionsError ? <p className="mt-2 text-xs text-rose-600">{homeworkOptionsError}</p> : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Nhiệm vụ</label>
            <select value={linkForm.missionId} onChange={(event) => setLinkForm((current) => ({ ...current, missionId: event.target.value }))} className={inputClass} disabled={missions.length === 0}>
              <option value="">{missions.length === 0 ? "Không có nhiệm vụ để chọn" : "Chọn nhiệm vụ"}</option>
              {missions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} • {mapMissionScopeLabel(item.scope)}
                </option>
              ))}
            </select>
            {selectedMissionOption ? <p className="mt-2 text-xs text-gray-500">{mapMissionTypeLabel(selectedMissionOption.missionType)} • {mapMissionScopeLabel(selectedMissionOption.scope)}{selectedMissionOption.startAt ? ` • Bắt đầu: ${formatDateTime(selectedMissionOption.startAt)}` : ""}</p> : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setLinkDialogOpen(false)} className={ghostButton}>Đóng</button><button type="button" onClick={() => void submitLinkHomework()} disabled={busyAction === "link-homework"} className={primaryButton}>{busyAction === "link-homework" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Liên kết</button></div>
      </DialogShell>

      <DialogShell open={Boolean(redemptionDetail)} onClose={() => setRedemptionDetail(null)} title={redemptionDetail?.itemName || "Chi tiết yêu cầu đổi thưởng"} description="Thông tin chi tiết của yêu cầu đổi quà để staff và người học tiện theo dõi." theme="staff">
        {redemptionDetail ? <div className="grid gap-3 text-sm text-gray-600"><div><span className="font-semibold text-gray-900">Trạng thái:</span> {mapRedemptionStatusLabel(redemptionDetail.status)}</div><div><span className="font-semibold text-gray-900">Học sinh:</span> {redemptionDetail.studentName || redemptionDetail.studentProfileId}</div><div><span className="font-semibold text-gray-900">Chi nhánh:</span> {redemptionDetail.branchName || "Chưa có"}</div><div><span className="font-semibold text-gray-900">Số lượng:</span> {formatNumber(redemptionDetail.quantity)}</div><div><span className="font-semibold text-gray-900">Tạo lúc:</span> {formatDateTime(redemptionDetail.createdAt)}</div><div><span className="font-semibold text-gray-900">Xử lý lúc:</span> {formatDateTime(redemptionDetail.handledAt)}</div><div><span className="font-semibold text-gray-900">Giao lúc:</span> {formatDateTime(redemptionDetail.deliveredAt)}</div><div><span className="font-semibold text-gray-900">Nhận lúc:</span> {formatDateTime(redemptionDetail.receivedAt)}</div></div> : null}
      </DialogShell>
    </div>
  );
}

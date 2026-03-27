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
import { useToast } from "@/hooks/use-toast";
import { isUploadSuccess, uploadFile } from "@/lib/api/fileService";
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
  targetGroup: string;
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

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const textareaClass = `${inputClass} min-h-[112px]`;
const ghostButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60";

const missionSeed: MissionFormState = {
  title: "",
  description: "",
  scope: "Student",
  targetClassId: "",
  targetGroup: "",
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
    { id: "missions" as const, label: "Mission" },
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
  const [redemptionDetail, setRedemptionDetail] = useState<RewardRedemption | null>(null);
  const [studentAction, setStudentAction] = useState({ starAmount: "", starReason: "", xpAmount: "", xpReason: "" });
  const [batchYear, setBatchYear] = useState("");
  const [batchMonth, setBatchMonth] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const rewardImageInputRef = useRef<HTMLInputElement>(null);

  const selectedStudent = useMemo(
    () => students.find((item) => item.id === selectedStudentId) ?? null,
    [selectedStudentId, students]
  );

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
      targetGroup: mission.targetGroup ?? "",
      missionType: mission.missionType,
      startAt: toDatetimeLocal(mission.startAt),
      endAt: toDatetimeLocal(mission.endAt),
      rewardStars: mission.rewardStars ? String(mission.rewardStars) : "",
      rewardExp: mission.rewardExp ? String(mission.rewardExp) : "",
    });
    setMissionDialogOpen(true);
  }

  async function submitMission() {
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
        targetGroup:
          missionForm.scope === "Group"
            ? missionForm.targetGroup.trim() || undefined
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
        title: missionForm.id ? "Đã cập nhật mission" : "Đã tạo mission mới",
      });
      setMissionDialogOpen(false);
      setMissionForm(missionSeed);
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể lưu mission",
        description: normalizeProblemMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function removeMission(id: string) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mission này?")) return;
    try {
      setBusyAction(`delete-mission-${id}`);
      await deleteMission(id);
      toast({ title: "Đã xóa mission" });
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể xóa mission",
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
        title: "Không thể tải tiến độ mission",
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
    try {
      setBusyAction("link-homework");
      await linkHomeworkToMission(
        linkForm.homeworkId.trim(),
        linkForm.missionId.trim()
      );
      toast({ title: "Đã liên kết homework với mission" });
      setLinkDialogOpen(false);
      setLinkForm({ homeworkId: "", missionId: "" });
    } catch (error) {
      toast({
        title: "Không thể liên kết homework",
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
      toast({ title: "Đã chạy batch deliver" });
      await loadBaseData();
    } catch (error) {
      toast({
        title: "Không thể batch deliver",
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

  return (
    <div className="space-y-6 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(180deg,_#f8fafc,_#f1f5f9)] p-4 md:p-6">
      <Panel className="border-amber-200/70 bg-white/90">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700"><Sparkles className="h-4 w-4" />Gamification cho {title.toLowerCase()}</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Mission, sao, XP và đổi thưởng trong một workspace</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">Tạo mission, theo dõi tiến độ, cộng trừ sao và XP, quản lý kho quà, đồng thời xử lý các redemption đang chờ.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:w-[520px]">
            <MetricCard icon={<Target className="h-5 w-5" />} label="Mission hiện có" value={formatNumber(missions.length)} accent="from-slate-700 via-slate-900 to-black" />
            <MetricCard icon={<Gift className="h-5 w-5" />} label="Đơn đổi quà mở" value={formatNumber(redemptions.filter((item) => item.status !== "Received" && item.status !== "Cancelled").length)} accent="from-violet-500 via-fuchsia-500 to-pink-500" />
          </div>
        </div>
      </Panel>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={tabs} />

      {loading ? <Panel className="py-14"><div className="flex items-center justify-center gap-3 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /><span>Đang tải dữ liệu gamification...</span></div></Panel> : null}
      {!loading && pageError ? <Panel className="border-rose-200 bg-rose-50"><div className="flex items-start gap-3 text-rose-700"><AlertCircle className="mt-0.5 h-5 w-5" /><div><h2 className="text-lg font-semibold">Không thể tải dữ liệu</h2><p className="mt-1 text-sm">{pageError}</p></div></div></Panel> : null}

      {!loading && !pageError && activeTab === "missions" ? (
        <Panel>
          <SectionTitle
            title="Quản lý mission"
            description="Tạo mission mới, cập nhật phạm vi áp dụng, xem tiến độ và liên kết homework vào mission."
            action={
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={openCreateMission} className={primaryButton}>
                  <Plus className="h-4 w-4" />
                  Tạo mission
                </button>
                <button type="button" onClick={() => setLinkDialogOpen(true)} className={ghostButton}>
                  <Link2 className="h-4 w-4" />
                  Link homework
                </button>
              </div>
            }
          />
          <div className="space-y-4">
            {missions.map((mission) => (
              <div key={mission.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{mission.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                      <StatusPill label={mapMissionTypeLabel(mission.missionType)} className="border-slate-200 bg-white text-slate-700" />
                      <StatusPill label={mapMissionScopeLabel(mission.scope)} className="border-amber-200 bg-amber-50 text-amber-700" />
                    </div>
                    {mission.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{mission.description}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
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
                      <button type="button" onClick={() => void removeMission(mission.id)} disabled={busyAction === `delete-mission-${mission.id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60">
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {missions.length === 0 ? <EmptyState title="Chưa có mission" description="Tạo mission đầu tiên để bắt đầu các luồng gamification cho học sinh." icon={<Target className="h-5 w-5" />} /> : null}
          </div>
        </Panel>
      ) : null}

      {!loading && !pageError && activeTab === "students" ? (
        <Panel>
          <SectionTitle title="Sao, XP và streak theo học sinh" description="Chọn học sinh để xem số sao, cấp độ, streak điểm danh và lịch sử giao dịch sao." />
          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Học sinh</label>
              <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} className={inputClass}>
                <option value="">Chọn học sinh</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
              </select>
              <button type="button" onClick={() => selectedStudentId && void loadStudentSnapshot(selectedStudentId)} className={`${ghostButton} mt-3 w-full`}>Làm mới dữ liệu</button>
              <div className="mt-5 rounded-3xl border border-white bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white"><UserRound className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedStudent?.label ?? "Chưa chọn học sinh"}</p>
                    <p className="text-sm text-slate-500">{selectedStudent?.id ?? "Hãy chọn một hồ sơ để thao tác"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {studentLoading ? <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />Đang tải snapshot học sinh...</div> : null}
              {!studentLoading && selectedStudentId ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <MetricCard icon={<Star className="h-5 w-5" />} label="Số sao hiện tại" value={formatNumber(studentBalance)} accent="from-amber-500 via-orange-500 to-red-500" />
                    <MetricCard icon={<Trophy className="h-5 w-5" />} label="Cấp độ" value={`Cấp ${formatNumber(studentLevel?.level)}`} hint={`XP: ${formatNumber(studentLevel?.xp)}`} accent="from-violet-500 via-fuchsia-500 to-pink-500" />
                    <MetricCard icon={<CheckCheck className="h-5 w-5" />} label="Streak hiện tại" value={`${formatNumber(studentStreak?.currentStreak)} ngày`} hint={`Kỷ lục ${formatNumber(studentStreak?.maxStreak)} ngày`} accent="from-emerald-500 via-teal-500 to-cyan-500" />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-bold text-slate-900">Điều chỉnh sao</h3>
                      <div className="mt-4 space-y-3">
                        <input value={studentAction.starAmount} onChange={(event) => setStudentAction((current) => ({ ...current, starAmount: event.target.value }))} className={inputClass} inputMode="numeric" placeholder="Số sao" />
                        <input value={studentAction.starReason} onChange={(event) => setStudentAction((current) => ({ ...current, starReason: event.target.value }))} className={inputClass} placeholder="Lý do" />
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void runStudentAction("addStars")} disabled={busyAction === "addStars"} className={primaryButton}><Plus className="h-4 w-4" />Cộng sao</button>
                          <button type="button" onClick={() => void runStudentAction("deductStars")} disabled={busyAction === "deductStars"} className={ghostButton}><Coins className="h-4 w-4" />Trừ sao</button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-bold text-slate-900">Điều chỉnh XP</h3>
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
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-bold text-slate-900">Giao dịch sao gần nhất</h3>
                      <div className="mt-4 space-y-3">
                        {transactions.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-white bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-slate-900">{item.reason || "Không có lý do"}</p>
                              <p className={`text-sm font-bold ${item.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{item.amount >= 0 ? "+" : ""}{formatNumber(item.amount)}</p>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Balance sau giao dịch: {formatNumber(item.balanceAfter)} • {formatDateTime(item.createdAt)}</p>
                          </div>
                        ))}
                        {transactions.length === 0 ? <EmptyState title="Chưa có giao dịch sao" description="Sau khi cộng hoặc trừ sao, lịch sử sẽ hiển thị tại đây." icon={<Star className="h-5 w-5" />} /> : null}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-bold text-slate-900">Điểm danh gần nhất</h3>
                      <div className="mt-4 space-y-3">
                        {(studentStreak?.recentStreaks ?? []).map((item) => (
                          <div key={item.id} className="rounded-2xl border border-white bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-slate-900">{formatDate(item.attendanceDate)}</p>
                              <p className="text-sm font-semibold text-amber-600">+{formatNumber(item.rewardStars)} sao</p>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Streak {formatNumber(item.currentStreak)} ngày • +{formatNumber(item.rewardExp)} XP</p>
                          </div>
                        ))}
                        {(studentStreak?.recentStreaks ?? []).length === 0 ? <EmptyState title="Chưa có lịch sử streak" description="Dữ liệu điểm danh của học sinh sẽ hiển thị tại đây." icon={<CheckCheck className="h-5 w-5" />} /> : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              {!studentLoading && !selectedStudentId ? <EmptyState title="Chưa chọn học sinh" description="Chọn một hồ sơ học sinh ở cột bên trái để thao tác sao, XP và streak." icon={<UserRound className="h-5 w-5" />} /> : null}
            </div>
          </div>
        </Panel>
      ) : null}

      {!loading && !pageError && canManageStore && activeTab === "rewardStore" ? (
        <Panel>
          <SectionTitle
            title="Kho quà thưởng"
            description="Quản lý vật phẩm đổi thưởng, giá sao, số lượng tồn và trạng thái hiển thị."
            action={
              <button type="button" onClick={openCreateReward} className={primaryButton}>
                <Plus className="h-4 w-4" />
                Tạo vật phẩm
              </button>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {rewardItems.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.description || "Chưa có mô tả"}</p>
                  </div>
                  <StatusPill label={item.isActive ? "Đang mở" : "Đang ẩn"} className={item.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
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
            ))}
            {rewardItems.length === 0 ? <EmptyState title="Chưa có vật phẩm" description="Hãy tạo vật phẩm đầu tiên để học sinh có thể đổi thưởng." icon={<Package className="h-5 w-5" />} /> : null}
          </div>
        </Panel>
      ) : null}

      {!loading && !pageError && activeTab === "redemptions" ? (
        <Panel>
          <SectionTitle
            title="Reward redemption"
            description="Theo dõi yêu cầu đổi thưởng, xem chi tiết và xử lý các trạng thái Requested, Approved, Delivered."
            action={
              canManageStore ? (
                <div className="flex flex-wrap gap-2">
                  <input value={batchYear} onChange={(event) => setBatchYear(event.target.value)} className="w-28 rounded-2xl border border-slate-200 px-3 py-2 text-sm" inputMode="numeric" placeholder="Năm" />
                  <input value={batchMonth} onChange={(event) => setBatchMonth(event.target.value)} className="w-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm" inputMode="numeric" placeholder="Tháng" />
                  <button type="button" onClick={() => void runBatchDeliver()} disabled={busyAction === "batch-deliver"} className={primaryButton}>Batch deliver</button>
                </div>
              ) : undefined
            }
          />
          <div className="space-y-4">
            {redemptions.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{item.itemName}</h3>
                      <StatusPill label={mapRedemptionStatusLabel(item.status)} className={getRedemptionStatusClasses(item.status)} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-500">
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
            {redemptions.length === 0 ? <EmptyState title="Chưa có đơn đổi thưởng" description="Khi học sinh gửi yêu cầu đổi quà, danh sách sẽ hiển thị tại đây." icon={<Gift className="h-5 w-5" />} /> : null}
          </div>
        </Panel>
      ) : null}

      <DialogShell open={missionDialogOpen} onClose={() => setMissionDialogOpen(false)} title={missionForm.id ? "Cập nhật mission" : "Tạo mission mới"} description="Điền đúng phạm vi và phần thưởng để mission bám theo rule backend.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề</label><input value={missionForm.title} onChange={(event) => setMissionForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</label><textarea value={missionForm.description} onChange={(event) => setMissionForm((current) => ({ ...current, description: event.target.value }))} className={textareaClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Scope</label><select value={missionForm.scope} onChange={(event) => setMissionForm((current) => ({ ...current, scope: event.target.value as MissionScope }))} className={inputClass}><option value="Student">Student</option><option value="Class">Class</option><option value="Group">Group</option></select></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Mission type</label><select value={missionForm.missionType} onChange={(event) => setMissionForm((current) => ({ ...current, missionType: event.target.value as MissionType }))} className={inputClass}><option value="Custom">Custom</option><option value="HomeworkStreak">Homework streak</option><option value="ReadingStreak">Reading streak</option><option value="NoUnexcusedAbsence">No unexcused absence</option></select></div>
          {missionForm.scope === "Class" ? <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Lớp áp dụng</label><select value={missionForm.targetClassId} onChange={(event) => setMissionForm((current) => ({ ...current, targetClassId: event.target.value }))} className={inputClass}><option value="">Chọn lớp</option>{classOptions.map((item) => <option key={item.id} value={item.id}>{item.code ? `${item.code} - ` : ""}{item.title || item.name || item.id}</option>)}</select></div> : null}
          {missionForm.scope === "Group" ? <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Nhóm áp dụng</label><input value={missionForm.targetGroup} onChange={(event) => setMissionForm((current) => ({ ...current, targetGroup: event.target.value }))} className={inputClass} /></div> : null}
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Bắt đầu</label><input type="datetime-local" value={missionForm.startAt} onChange={(event) => setMissionForm((current) => ({ ...current, startAt: event.target.value }))} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Kết thúc</label><input type="datetime-local" value={missionForm.endAt} onChange={(event) => setMissionForm((current) => ({ ...current, endAt: event.target.value }))} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Reward stars</label><input value={missionForm.rewardStars} onChange={(event) => setMissionForm((current) => ({ ...current, rewardStars: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Reward XP</label><input value={missionForm.rewardExp} onChange={(event) => setMissionForm((current) => ({ ...current, rewardExp: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setMissionDialogOpen(false)} className={ghostButton}>Đóng</button><button type="button" onClick={() => void submitMission()} disabled={busyAction === "submit-mission"} className={primaryButton}>{busyAction === "submit-mission" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Lưu mission</button></div>
      </DialogShell>

      <DialogShell open={rewardDialogOpen} onClose={() => setRewardDialogOpen(false)} title={rewardForm.id ? "Cập nhật vật phẩm" : "Tạo vật phẩm mới"} description="Cost stars phải lớn hơn 0 và quantity không được âm.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Tên vật phẩm</label><input value={rewardForm.title} onChange={(event) => setRewardForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</label><textarea value={rewardForm.description} onChange={(event) => setRewardForm((current) => ({ ...current, description: event.target.value }))} className={textareaClass} /></div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Ảnh vật phẩm</label>
            <input ref={rewardImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => void handleRewardImageChange(event)} />
            {rewardForm.imageUrl ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <div className="aspect-[16/8] w-full bg-slate-100">
                  <img src={rewardForm.imageUrl} alt="Ảnh vật phẩm" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <ImageIcon className="h-4 w-4" />
                    <span className="max-w-[420px] truncate">{rewardForm.imageUrl}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => rewardImageInputRef.current?.click()} disabled={imageUploading} className={ghostButton}>
                      {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Đổi ảnh
                    </button>
                    <button type="button" onClick={() => setRewardForm((current) => ({ ...current, imageUrl: "" }))} disabled={imageUploading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60">
                      <Trash2 className="h-4 w-4" />
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => rewardImageInputRef.current?.click()} disabled={imageUploading} className="flex w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-white disabled:opacity-60">
                {imageUploading ? <Loader2 className="h-8 w-8 animate-spin text-slate-500" /> : <Upload className="h-8 w-8 text-slate-500" />}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{imageUploading ? "Đang tải ảnh lên..." : "Chọn ảnh từ máy"}</p>
                  <p className="mt-1 text-xs text-slate-500">Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 10MB.</p>
                </div>
              </button>
            )}
          </div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Cost stars</label><input value={rewardForm.costStars} onChange={(event) => setRewardForm((current) => ({ ...current, costStars: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label><input value={rewardForm.quantity} onChange={(event) => setRewardForm((current) => ({ ...current, quantity: event.target.value }))} inputMode="numeric" className={inputClass} /></div>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={rewardForm.isActive} onChange={(event) => setRewardForm((current) => ({ ...current, isActive: event.target.checked }))} />Hiển thị trên cửa hàng active</label>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setRewardDialogOpen(false)} className={ghostButton} disabled={imageUploading}>Đóng</button><button type="button" onClick={() => void submitRewardItem()} disabled={busyAction === "submit-reward" || imageUploading} className={primaryButton}>{busyAction === "submit-reward" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Lưu vật phẩm</button></div>
      </DialogShell>

      <DialogShell open={progressDialog.open} onClose={() => setProgressDialog({ mission: null, items: [], open: false })} title={progressDialog.mission?.title || "Tiến độ mission"} description="Danh sách progress hiện có theo mission được chọn.">
        <div className="space-y-3">
          {progressDialog.items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.studentName || item.studentProfileId}</p><p className="mt-1 text-sm text-slate-500">Tiến độ: {formatNumber(item.progressValue)} • {formatNumber(item.progressPercentage)}%</p></div><StatusPill label={mapProgressStatusLabel(item.status)} className={getMissionProgressClasses(item.status)} /></div></div>)}
          {progressDialog.items.length === 0 ? <EmptyState title="Chưa có mission progress" description="Mission chưa phát sinh progress hoặc backend chưa ghi nhận dữ liệu cho mission này." icon={<Target className="h-5 w-5" />} /> : null}
        </div>
      </DialogShell>

      <DialogShell open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} title="Liên kết homework với mission" description="Dùng khi cần gắn một homework hiện có vào mission đang chạy.">
        <div className="grid gap-4">
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Homework ID</label><input value={linkForm.homeworkId} onChange={(event) => setLinkForm((current) => ({ ...current, homeworkId: event.target.value }))} className={inputClass} /></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Mission ID</label><input value={linkForm.missionId} onChange={(event) => setLinkForm((current) => ({ ...current, missionId: event.target.value }))} className={inputClass} /></div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setLinkDialogOpen(false)} className={ghostButton}>Đóng</button><button type="button" onClick={() => void submitLinkHomework()} disabled={busyAction === "link-homework"} className={primaryButton}>{busyAction === "link-homework" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Liên kết</button></div>
      </DialogShell>

      <DialogShell open={Boolean(redemptionDetail)} onClose={() => setRedemptionDetail(null)} title={redemptionDetail?.itemName || "Chi tiết redemption"} description="Thông tin snapshot của yêu cầu đổi quà, dùng cho staff và learner follow-up.">
        {redemptionDetail ? <div className="grid gap-3 text-sm text-slate-600"><div><span className="font-semibold text-slate-900">Trạng thái:</span> {mapRedemptionStatusLabel(redemptionDetail.status)}</div><div><span className="font-semibold text-slate-900">Học sinh:</span> {redemptionDetail.studentName || redemptionDetail.studentProfileId}</div><div><span className="font-semibold text-slate-900">Chi nhánh:</span> {redemptionDetail.branchName || "Chưa có"}</div><div><span className="font-semibold text-slate-900">Số lượng:</span> {formatNumber(redemptionDetail.quantity)}</div><div><span className="font-semibold text-slate-900">Tạo lúc:</span> {formatDateTime(redemptionDetail.createdAt)}</div><div><span className="font-semibold text-slate-900">Handled at:</span> {formatDateTime(redemptionDetail.handledAt)}</div><div><span className="font-semibold text-slate-900">Delivered at:</span> {formatDateTime(redemptionDetail.deliveredAt)}</div><div><span className="font-semibold text-slate-900">Received at:</span> {formatDateTime(redemptionDetail.receivedAt)}</div></div> : null}
      </DialogShell>
    </div>
  );
}

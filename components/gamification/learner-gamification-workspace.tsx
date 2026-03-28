"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Flame,
  Gift,
  Loader2,
  Medal,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useSelectedStudentProfile } from "@/hooks/useSelectedStudentProfile";
import {
  checkInAttendanceStreak,
  confirmRewardRedemptionReceived,
  getMissionProgress,
  getMyAttendanceStreak,
  getMyLevel,
  getMyRewardRedemptions,
  getMyStarBalance,
  listActiveRewardStoreItems,
  listMissions,
  requestRewardRedemption,
} from "@/lib/api/gamificationService";
import type { Mission, MissionProgress, RewardRedemption, RewardStoreItem } from "@/types/gamification";
import {
  DialogShell,
  EmptyState,
  MetricCard,
  Panel,
  SectionTitle,
  StatusPill,
  Tabs,
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
  resolveActiveStudentProfile,
} from "./shared";

export type LearnerTab = "overview" | "missions" | "streak" | "stars" | "xp" | "level" | "rewards";

export function LearnerGamificationWorkspace({
  initialTab = "overview",
  portalLabel,
}: {
  initialTab?: LearnerTab;
  portalLabel: "Học viên" | "Phụ huynh";
}) {
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { selectedProfile } = useSelectedStudentProfile();
  const [activeTab, setActiveTab] = useState<LearnerTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<RewardStoreItem[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [starBalance, setStarBalance] = useState(0);
  const [levelInfo, setLevelInfo] = useState<{ level: number; xp: number; xpRequiredForNextLevel: number } | null>(null);
  const [streakInfo, setStreakInfo] = useState<{ currentStreak: number; maxStreak: number; lastAttendanceDate?: string | null; recentStreaks: any[] } | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
  const [redeemItem, setRedeemItem] = useState<RewardStoreItem | null>(null);
  const [redeemQuantity, setRedeemQuantity] = useState(1);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const activeStudent = useMemo(
    () => resolveActiveStudentProfile(user?.profiles, selectedProfile, user?.selectedProfile),
    [selectedProfile, user?.profiles, user?.selectedProfile]
  );

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  async function loadData() {
    setLoading(true);
    setPageError(null);
    const [m, r, rd, sb, lv, st] = await Promise.allSettled([
      listMissions({ pageNumber: 1, pageSize: 50 }),
      listActiveRewardStoreItems({ page: 1, pageSize: 50 }),
      getMyRewardRedemptions({ page: 1, pageSize: 20 }),
      getMyStarBalance(),
      getMyLevel(),
      getMyAttendanceStreak(),
    ]);
    if (m.status === "fulfilled") setMissions(m.value.items);
    if (r.status === "fulfilled") setRewards(r.value.items);
    if (rd.status === "fulfilled") setRedemptions(rd.value.items);
    if (sb.status === "fulfilled") setStarBalance(sb.value.balance);
    if (lv.status === "fulfilled") setLevelInfo(lv.value);
    if (st.status === "fulfilled") setStreakInfo(st.value);
    if ([m, r, rd, sb, lv, st].every((item) => item.status === "rejected")) {
      setPageError("Không thể tải dữ liệu gamification trong thời điểm này.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!userLoading) void loadData();
  }, [userLoading]);

  const tabs = [
    { id: "overview" as const, label: "Tổng quan" },
    { id: "missions" as const, label: "Nhiệm vụ" },
    { id: "streak" as const, label: "Điểm danh" },
    { id: "stars" as const, label: "Sao" },
    { id: "xp" as const, label: "XP" },
    { id: "level" as const, label: "Cấp độ" },
    { id: "rewards" as const, label: "Đổi thưởng" },
  ];

  async function handleCheckIn() {
    try {
      setBusyAction("checkin");
      const result = await checkInAttendanceStreak();
      toast({ title: result.isNewStreak ? "Điểm danh thành công" : "Bạn đã điểm danh hôm nay", description: `+${result.rewardStars} sao • +${result.rewardExp} XP` });
      await loadData();
    } catch (error) {
      toast({ title: "Không thể điểm danh", description: normalizeProblemMessage(error), variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  }

  async function openMissionProgress(mission: Mission) {
    if (!activeStudent?.id) {
      toast({ title: "Thiếu ngữ cảnh học sinh", description: portalLabel === "Phụ huynh" ? "Vui lòng chọn học viên ở thanh bên." : "Vui lòng chọn hồ sơ học viên." });
      return;
    }
    try {
      setBusyAction(`mission-${mission.id}`);
      const result = await getMissionProgress(mission.id, { studentProfileId: activeStudent.id, pageNumber: 1, pageSize: 20 });
      setSelectedMission(mission);
      setMissionProgress(result.progresses.items);
    } catch (error) {
      toast({ title: "Không thể tải tiến độ nhiệm vụ", description: normalizeProblemMessage(error), variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  }

  async function redeem() {
    if (!redeemItem) return;
    try {
      setBusyAction(`redeem-${redeemItem.id}`);
      await requestRewardRedemption({ itemId: redeemItem.id, quantity: redeemQuantity });
      toast({ title: "Đã gửi yêu cầu đổi thưởng", description: `Yêu cầu đổi "${redeemItem.title}" đã được tạo.` });
      setRedeemItem(null);
      setRedeemQuantity(1);
      await loadData();
    } catch (error) {
      toast({ title: "Không thể đổi thưởng", description: normalizeProblemMessage(error), variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  }

  async function confirmReceived(id: string) {
    try {
      setBusyAction(`confirm-${id}`);
      await confirmRewardRedemptionReceived(id);
      toast({ title: "Đã xác nhận nhận quà", description: "Trạng thái đơn đổi thưởng đã được cập nhật." });
      await loadData();
    } catch (error) {
      toast({ title: "Không thể xác nhận nhận quà", description: normalizeProblemMessage(error), variant: "destructive" });
    } finally {
      setBusyAction(null);
    }
  }

  const pendingRedemptions = redemptions.filter((x) => ["Requested", "Approved", "Delivered"].includes(x.status));

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Card */}
      <div className="rounded-[32px] border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl shadow-purple-500/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="h-4 w-4" />Gamification cho {portalLabel.toLowerCase()}
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-400 to-purple-600">
              Hành trình tích sao và chinh phục nhiệm vụ
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-purple-200">
              {activeStudent?.displayName ? `Đang theo dõi hồ sơ: ${activeStudent.displayName}.` : "Theo dõi nhiệm vụ, streak điểm danh, sao, XP và yêu cầu đổi quà tại một nơi."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={busyAction === "checkin"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:scale-105 hover:shadow-purple-500/50 disabled:opacity-60 disabled:hover:scale-100"
          >
            {busyAction === "checkin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
            Điểm danh hôm nay
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<Star className="h-5 w-5" />} label="Số sao hiện có" value={formatNumber(starBalance)} hint="Dùng để đổi quà" accent="from-purple-500 via-pink-500 to-rose-500" />
          <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="XP hiện tại" value={formatNumber(levelInfo?.xp)} hint={`Còn ${formatNumber(levelInfo?.xpRequiredForNextLevel)} XP để lên cấp`} accent="from-cyan-500 via-blue-500 to-purple-600" />
          <MetricCard icon={<Trophy className="h-5 w-5" />} label="Cấp độ" value={`Cấp ${formatNumber(levelInfo?.level)}`} hint="Tăng theo tổng XP" accent="from-violet-500 via-fuchsia-500 to-pink-500" />
          <MetricCard icon={<Flame className="h-5 w-5" />} label="Streak hiện tại" value={`${formatNumber(streakInfo?.currentStreak)} ngày`} hint={`Kỷ lục: ${formatNumber(streakInfo?.maxStreak)} ngày`} accent="from-orange-500 via-amber-500 to-yellow-500" />
        </div>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} tabs={tabs} />

      {loading ? <Panel className="py-14"><div className="flex items-center justify-center gap-3 text-white"><Loader2 className="h-5 w-5 animate-spin" /><span>Đang tải dữ liệu gamification...</span></div></Panel> : null}
      {!loading && pageError ? <Panel className="border-rose-500/30 bg-rose-500/10"><div className="flex items-start gap-3 text-rose-400"><AlertCircle className="mt-0.5 h-5 w-5" /><div><h2 className="text-lg font-semibold text-white">Không thể tải dữ liệu</h2><p className="mt-1 text-sm text-rose-300">{pageError}</p></div></div></Panel> : null}

      {/* Overview Tab */}
      {!loading && !pageError && activeTab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Panel>
            <SectionTitle title="Tổng quan nhanh" description="Mission đang mở, đơn đổi quà đang xử lý và phần thưởng check-in gần đây." />
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard icon={<Target className="h-5 w-5" />} label="Mission đang mở" value={formatNumber(missions.length)} accent="from-slate-600 via-purple-700 to-slate-800" />
              <MetricCard icon={<ShoppingBag className="h-5 w-5" />} label="Đơn đổi quà" value={formatNumber(pendingRedemptions.length)} accent="from-violet-500 via-fuchsia-500 to-pink-500" />
              <MetricCard icon={<Medal className="h-5 w-5" />} label="Điểm danh gần nhất" value={formatDate(streakInfo?.lastAttendanceDate)} accent="from-emerald-500 via-teal-500 to-cyan-500" />
            </div>
            <div className="mt-5 space-y-3">
              {missions.slice(0, 3).map((mission) => (
                <div key={mission.id} className="flex items-start justify-between gap-3 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-slate-900/90 p-4">
                  <div><p className="font-semibold text-white">{mission.title}</p><p className="mt-1 text-sm text-purple-300">{mapMissionTypeLabel(mission.missionType)} • {mapMissionScopeLabel(mission.scope)}</p></div>
                  <button type="button" onClick={() => void openMissionProgress(mission)} className="rounded-xl border border-purple-500/30 bg-slate-800/50 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-500/20">Xem tiến độ</button>
                </div>
              ))}
              {missions.length === 0 ? <EmptyState title="Chưa có mission" description="Khi trung tâm tạo mission phù hợp, danh sách sẽ hiển thị tại đây." icon={<Target className="h-5 w-5" />} /> : null}
            </div>
          </Panel>
          <Panel>
            <SectionTitle title="Thưởng gần đây" description="Những lần điểm danh mới nhất sẽ cộng sao và XP trực tiếp vào hồ sơ." />
            {(streakInfo?.recentStreaks ?? []).length ? (
              <div className="space-y-3">
                {streakInfo!.recentStreaks.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-slate-900/90 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-white">Điểm danh ngày {formatDate(item.attendanceDate)}</p><p className="mt-1 text-sm text-purple-300">Streak: {item.currentStreak} ngày</p></div><div className="text-right"><p className="font-semibold text-yellow-400">+{item.rewardStars} sao</p><p className="text-sm font-medium text-cyan-400">+{item.rewardExp} XP</p></div></div></div>
                ))}
              </div>
            ) : <EmptyState title="Chưa có phần thưởng gần đây" description="Hãy điểm danh mỗi ngày để bắt đầu nhận thưởng." icon={<Medal className="h-5 w-5" />} />}
          </Panel>
        </div>
      ) : null}

      {/* Missions / Streak / Stars / XP / Level Tabs */}
      {!loading && !pageError && ["missions", "streak", "stars", "xp", "level"].includes(activeTab) ? (
        <Panel>
          {activeTab === "missions" ? (
            <>
              <SectionTitle title="Danh sách nhiệm vụ" description="Theo dõi mission đang áp dụng và xem chi tiết tiến độ." />
              {missions.length ? missions.map((mission) => (
                <div key={mission.id} className="mb-4 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-slate-900/90 p-5 last:mb-0">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-white">{mission.title}</h3><p className="mt-1 text-sm text-purple-300">{mapMissionTypeLabel(mission.missionType)} • {mapMissionScopeLabel(mission.scope)}</p>{mission.description ? <p className="mt-3 text-sm leading-6 text-purple-400">{mission.description}</p> : null}</div><button type="button" onClick={() => void openMissionProgress(mission)} disabled={busyAction === `mission-${mission.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500/20 disabled:opacity-60">{busyAction === `mission-${mission.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}Xem tiến độ</button></div>
                </div>
              )) : <EmptyState title="Chưa có mission" description="Khi có mission mới được giao, danh sách sẽ hiển thị ở đây." icon={<Target className="h-5 w-5" />} />}
            </>
          ) : null}
          {activeTab === "streak" ? (
            <>
              <SectionTitle title="Attendance Streak" description="Mỗi ngày điểm danh thành công sẽ tăng streak và nhận thêm thưởng sao, XP." />
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard icon={<Flame className="h-5 w-5" />} label="Streak hiện tại" value={`${formatNumber(streakInfo?.currentStreak)} ngày`} />
                <MetricCard icon={<Medal className="h-5 w-5" />} label="Streak cao nhất" value={`${formatNumber(streakInfo?.maxStreak)} ngày`} accent="from-orange-500 via-amber-500 to-yellow-500" />
                <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Check-in gần nhất" value={formatDate(streakInfo?.lastAttendanceDate)} accent="from-emerald-500 via-teal-500 to-cyan-500" />
              </div>
            </>
          ) : null}
          {activeTab === "stars" ? <SectionTitle title="Sao hiện có" description={`Bạn đang có ${formatNumber(starBalance)} sao và đã tạo ${formatNumber(redemptions.length)} đơn đổi thưởng.`} /> : null}
          {activeTab === "xp" ? <SectionTitle title="XP hiện tại" description={`Tổng XP: ${formatNumber(levelInfo?.xp)} • Còn ${formatNumber(levelInfo?.xpRequiredForNextLevel)} XP để lên cấp.`} /> : null}
          {activeTab === "level" ? <SectionTitle title="Cấp độ hiện tại" description={`Level hiện tại: Cấp ${formatNumber(levelInfo?.level)}.`} /> : null}
        </Panel>
      ) : null}

      {/* Rewards Tab */}
      {!loading && !pageError && activeTab === "rewards" ? (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Panel>
            <SectionTitle title="Cửa hàng phần thưởng" description="Chỉ các vật phẩm active mới hiển thị cho learner." />
            {rewards.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {rewards.map((item) => {
                  const disabled = item.quantity <= 0 || starBalance < item.costStars;
                  return (
                    <div key={item.id} className="overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-sm shadow-lg">
                      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-white">{item.title}</h3>
                            <p className="mt-1 text-sm text-purple-300">{item.description || "Vật phẩm thưởng đang có trong cửa hàng."}</p>
                          </div>
                          <span className="rounded-full bg-slate-800/50 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-200">Còn {formatNumber(item.quantity)}</span>
                        </div>
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-slate-900/90 px-4 py-3 border border-purple-500/20">
                          <p className="text-xs uppercase tracking-wide text-purple-400">Giá đổi</p>
                          <p className="mt-1 text-xl font-black text-yellow-400">{formatNumber(item.costStars)} sao</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setRedeemItem(item); setRedeemQuantity(1); }}
                          disabled={disabled}
                          className={disabled ? "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-700/50 px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed" : "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-105 shadow-lg shadow-purple-500/30"}
                        >
                          <Gift className="h-4 w-4" />
                          {item.quantity <= 0 ? "Đã hết quà" : starBalance < item.costStars ? "Không đủ sao" : "Đổi quà ngay"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState title="Cửa hàng đang trống" description="Hiện chưa có vật phẩm active nào để đổi." icon={<Gift className="h-5 w-5" />} />}
          </Panel>
          <Panel>
            <SectionTitle title="Lịch sử đổi thưởng" description="Theo dõi tiến độ phê duyệt, giao quà và xác nhận đã nhận." />
            {redemptions.length ? redemptions.map((item) => (
              <div key={item.id} className="mb-3 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-slate-900/90 p-4 last:mb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{item.itemName}</h3>
                    <p className="mt-1 text-sm text-purple-300">SL {item.quantity} • {formatDateTime(item.createdAt)}</p>
                    <p className="mt-1 text-sm text-purple-300">Sao đã trừ: {formatNumber(item.starsDeducted)}</p>
                  </div>
                  <StatusPill label={mapRedemptionStatusLabel(item.status)} className={getRedemptionStatusClasses(item.status)} />
                </div>
                {item.status === "Delivered" ? (
                  <button
                    type="button"
                    onClick={() => void confirmReceived(item.id)}
                    disabled={busyAction === `confirm-${item.id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-105 disabled:opacity-60"
                  >
                    {busyAction === `confirm-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Xác nhận đã nhận quà
                  </button>
                ) : null}
              </div>
            )) : <EmptyState title="Chưa có yêu cầu đổi thưởng" description="Sau khi bạn đổi quà, danh sách xử lý sẽ hiển thị ở đây." icon={<ShoppingCart className="h-5 w-5" />} />}
          </Panel>
        </div>
      ) : null}

      {/* Mission Progress Dialog */}
      <DialogShell open={Boolean(selectedMission)} title={selectedMission?.title ?? "Tiến độ mission"} description="Tiến độ theo hồ sơ học sinh đang được chọn." onClose={() => { setSelectedMission(null); setMissionProgress([]); }}>
        {missionProgress.length ? missionProgress.map((item) => (
          <div key={item.id} className="mb-3 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-slate-900/90 p-5 last:mb-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white">{item.studentName || activeStudent?.displayName || "Học sinh đang chọn"}</h4>
                <p className="mt-1 text-sm text-purple-300">Tiến độ: {formatNumber(item.progressValue)} • {formatNumber(item.progressPercentage)}%</p>
                <p className="mt-1 text-sm text-purple-300">Hoàn tất lúc: {formatDateTime(item.completedAt)}</p>
              </div>
              <StatusPill label={mapProgressStatusLabel(item.status)} className={getMissionProgressClasses(item.status)} />
            </div>
          </div>
        )) : <EmptyState title="Chưa có tiến độ" description="Mission này chưa có bản ghi progress cho hồ sơ đang chọn." icon={<Target className="h-5 w-5" />} />}
      </DialogShell>

      {/* Redeem Dialog */}
      <DialogShell open={Boolean(redeemItem)} title={`Đổi thưởng: ${redeemItem?.title ?? ""}`} description="Hệ thống sẽ trừ sao và giữ tồn kho ngay khi tạo yêu cầu." onClose={() => { setRedeemItem(null); setRedeemQuantity(1); }} widthClass="max-w-xl">
        {redeemItem ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-slate-900/90 p-5">
              <h4 className="text-lg font-bold text-white">{redeemItem.title}</h4>
              <p className="mt-2 text-sm leading-6 text-purple-300">{redeemItem.description || "Không có mô tả chi tiết cho vật phẩm này."}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Số lượng muốn đổi</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, redeemItem.quantity)}
                value={redeemQuantity}
                onChange={(event) => setRedeemQuantity(Math.max(1, Number(event.target.value || 1)))}
                className="w-full rounded-2xl border border-purple-500/30 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-purple-400/60"
              />
            </div>
            <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
              Tổng sao sẽ bị trừ ngay: <span className="font-bold">{formatNumber(redeemItem.costStars * redeemQuantity)} sao</span>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setRedeemItem(null); setRedeemQuantity(1); }}
                className="rounded-2xl border border-purple-500/30 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500/20"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void redeem()}
                disabled={busyAction === `redeem-${redeemItem.id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-105 disabled:opacity-60"
              >
                {busyAction === `redeem-${redeemItem.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                Xác nhận đổi thưởng
              </button>
            </div>
          </div>
        ) : null}
      </DialogShell>
    </div>
  );
}

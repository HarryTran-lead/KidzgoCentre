import {
  CLASS_ENDPOINTS,
  GAMIFICATION_ENDPOINTS,
  MISSION_ENDPOINTS,
} from "@/constants/apiURL";
import { del, get, patch, post, put } from "@/lib/axios";
import type {
  AttendanceCheckInResult,
  AttendanceStreakInfo,
  BatchDeliverParams,
  BatchDeliverResult,
  ClassOptionLite,
  LevelInfo,
  Mission,
  MissionListParams,
  MissionProgressParams,
  MissionProgressResponse,
  PaginatedItems,
  RedemptionStatus,
  RewardRedemption,
  RewardRedemptionCancelRequest,
  RewardRedemptionListParams,
  RewardRedemptionRequest,
  RewardStoreItem,
  RewardStoreItemRequest,
  RewardStoreItemUpdateRequest,
  RewardStoreListParams,
  StarBalance,
  StarMutationRequest,
  StarMutationResult,
  StarTransactionsParams,
  StarTransactionsResult,
  UpsertMissionRequest,
  XpMutationRequest,
  XpMutationResult,
} from "@/types/gamification";

type AnyRecord = Record<string, any>;

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in (response as AnyRecord)) {
    return (response as AnyRecord).data as T;
  }
  return response as T;
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
}

function normalizePaged<T>(
  source: unknown,
  preferredKeys: string[] = []
): PaginatedItems<T> {
  const payload = source as AnyRecord | undefined;
  const candidates: AnyRecord[] = [];

  if (payload && typeof payload === "object") {
    candidates.push(payload);

    for (const key of preferredKeys) {
      const preferred = payload[key];
      if (preferred && typeof preferred === "object") {
        candidates.push(preferred as AnyRecord);
      }
    }

    if (payload.data && typeof payload.data === "object") {
      candidates.push(payload.data as AnyRecord);
      for (const key of preferredKeys) {
        const preferred = (payload.data as AnyRecord)[key];
        if (preferred && typeof preferred === "object") {
          candidates.push(preferred as AnyRecord);
        }
      }
    }
  }

  const match =
    candidates.find(
      (candidate) =>
        Array.isArray(candidate.items) ||
        (typeof candidate.pageNumber === "number" && typeof candidate.totalCount === "number")
    ) ?? {};

  return {
    items: toArray<T>(match.items),
    pageNumber: Number(match.pageNumber ?? 1),
    pageSize:
      typeof match.pageSize === "number" ? Number(match.pageSize) : undefined,
    totalPages: Number(match.totalPages ?? 1),
    totalCount: Number(match.totalCount ?? toArray<T>(match.items).length),
  };
}

function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  ) as Partial<T>;
}

function normalizeMission(source: unknown): Mission {
  const payload = unwrapData<AnyRecord>(source);
  return (payload?.mission ?? payload) as Mission;
}

function normalizeRewardStoreItem(source: unknown): RewardStoreItem {
  const payload = unwrapData<AnyRecord>(source);
  return (payload?.item ?? payload) as RewardStoreItem;
}

function normalizeRewardRedemption(source: unknown): RewardRedemption {
  const payload = unwrapData<AnyRecord>(source);
  return (payload?.redemption ?? payload) as RewardRedemption;
}

function normalizeStarBalance(source: unknown): StarBalance {
  const payload = unwrapData<AnyRecord>(source);
  return payload as StarBalance;
}

function normalizeLevelInfo(source: unknown): LevelInfo {
  const payload = unwrapData<AnyRecord>(source);
  return payload as LevelInfo;
}

function normalizeAttendanceStreak(source: unknown): AttendanceStreakInfo {
  const payload = unwrapData<AnyRecord>(source);
  return {
    ...(payload as AttendanceStreakInfo),
    recentStreaks: toArray(payload?.recentStreaks),
  };
}

function normalizeStarTransactions(source: unknown): StarTransactionsResult {
  const payload = unwrapData<AnyRecord>(source);
  return {
    transactions: toArray(payload?.transactions),
    totalCount: Number(payload?.totalCount ?? 0),
    page: Number(payload?.page ?? 1),
    pageSize: Number(payload?.pageSize ?? 20),
    totalPages: Number(payload?.totalPages ?? 1),
  };
}

function mapClassOptions(items: unknown[]): ClassOptionLite[] {
  const classMap = new Map<string, ClassOptionLite>();

  for (const item of items) {
    const row = item as AnyRecord;
    const id = String(row.id ?? row.classId ?? "").trim();
    if (!id || classMap.has(id)) {
      continue;
    }

    classMap.set(id, {
      id,
      code: String(row.code ?? row.classCode ?? "").trim() || undefined,
      title:
        String(row.title ?? row.classTitle ?? row.name ?? "").trim() || undefined,
      name:
        String(row.name ?? row.className ?? row.title ?? "").trim() || undefined,
    });
  }

  return Array.from(classMap.values());
}

export async function getMissionClassOptions(): Promise<ClassOptionLite[]> {
  try {
    const response = await get<any>(CLASS_ENDPOINTS.GET_ALL, {
      params: { pageNumber: 1, pageSize: 200 },
    });

    const payload = unwrapData<AnyRecord>(response);
    const paged = normalizePaged<AnyRecord>(payload, ["classes", "data"]);
    if (paged.items.length > 0) {
      return mapClassOptions(paged.items);
    }

    return mapClassOptions(
      toArray(payload?.items).length > 0
        ? toArray(payload?.items)
        : toArray(payload?.classes)
    );
  } catch (error) {
    console.error("getMissionClassOptions error:", error);
    return [];
  }
}

export async function listMissions(
  params: MissionListParams = {}
): Promise<PaginatedItems<Mission>> {
  const response = await get<any>(MISSION_ENDPOINTS.BASE, {
    params: cleanParams(params),
  });

  const payload = unwrapData<AnyRecord>(response);
  return normalizePaged<Mission>(payload, ["missions"]);
}

export async function getMissionById(id: string): Promise<Mission> {
  const response = await get<any>(MISSION_ENDPOINTS.BY_ID(id));
  return normalizeMission(response);
}

export async function createMission(
  payload: UpsertMissionRequest
): Promise<Mission> {
  const response = await post<any>(MISSION_ENDPOINTS.BASE, payload);
  return normalizeMission(response);
}

export async function updateMission(
  id: string,
  payload: UpsertMissionRequest
): Promise<Mission> {
  const response = await put<any>(MISSION_ENDPOINTS.BY_ID(id), payload);
  return normalizeMission(response);
}

export async function deleteMission(id: string): Promise<void> {
  await del(MISSION_ENDPOINTS.BY_ID(id));
}

export async function getMissionProgress(
  id: string,
  params: MissionProgressParams = {}
): Promise<MissionProgressResponse> {
  const response = await get<any>(MISSION_ENDPOINTS.PROGRESS(id), {
    params: cleanParams(params),
  });
  const payload = unwrapData<AnyRecord>(response);

  return {
    mission: payload?.mission,
    progresses: normalizePaged(payload, ["progresses"]),
  };
}

export async function addStars(
  payload: StarMutationRequest
): Promise<StarMutationResult> {
  const response = await post<any>(GAMIFICATION_ENDPOINTS.STARS_ADD, payload);
  return unwrapData<StarMutationResult>(response);
}

export async function deductStars(
  payload: StarMutationRequest
): Promise<StarMutationResult> {
  const response = await post<any>(GAMIFICATION_ENDPOINTS.STARS_DEDUCT, payload);
  return unwrapData<StarMutationResult>(response);
}

export async function getStarTransactions(
  params: StarTransactionsParams
): Promise<StarTransactionsResult> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.STARS_TRANSACTIONS, {
    params: cleanParams(params),
  });
  return normalizeStarTransactions(response);
}

export async function getStarBalance(studentProfileId: string): Promise<StarBalance> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.STARS_BALANCE, {
    params: { studentProfileId },
  });
  return normalizeStarBalance(response);
}

export async function getMyStarBalance(): Promise<StarBalance> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.STARS_BALANCE_ME);
  return normalizeStarBalance(response);
}

export async function addXp(
  payload: XpMutationRequest
): Promise<XpMutationResult> {
  const response = await post<any>(GAMIFICATION_ENDPOINTS.XP_ADD, payload);
  return unwrapData<XpMutationResult>(response);
}

export async function deductXp(
  payload: XpMutationRequest
): Promise<XpMutationResult> {
  const response = await post<any>(GAMIFICATION_ENDPOINTS.XP_DEDUCT, payload);
  return unwrapData<XpMutationResult>(response);
}

export async function getLevel(studentProfileId: string): Promise<LevelInfo> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.LEVEL, {
    params: { studentProfileId },
  });
  return normalizeLevelInfo(response);
}

export async function getMyLevel(): Promise<LevelInfo> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.LEVEL_ME);
  return normalizeLevelInfo(response);
}

export async function getAttendanceStreak(
  studentProfileId: string
): Promise<AttendanceStreakInfo> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.ATTENDANCE_STREAK, {
    params: { studentProfileId },
  });
  return normalizeAttendanceStreak(response);
}

export async function getMyAttendanceStreak(): Promise<AttendanceStreakInfo> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.ATTENDANCE_STREAK_ME);
  return normalizeAttendanceStreak(response);
}

export async function checkInAttendanceStreak(): Promise<AttendanceCheckInResult> {
  const response = await post<any>(GAMIFICATION_ENDPOINTS.ATTENDANCE_STREAK_CHECK_IN);
  return unwrapData<AttendanceCheckInResult>(response);
}

export async function listRewardStoreItems(
  params: RewardStoreListParams = {}
): Promise<PaginatedItems<RewardStoreItem>> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.REWARD_STORE_ITEMS, {
    params: cleanParams(params),
  });
  const payload = unwrapData<AnyRecord>(response);
  return normalizePaged<RewardStoreItem>(payload, ["items"]);
}

export async function listActiveRewardStoreItems(
  params: Omit<RewardStoreListParams, "isActive"> = {}
): Promise<PaginatedItems<RewardStoreItem>> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.REWARD_STORE_ACTIVE, {
    params: cleanParams(params),
  });
  const payload = unwrapData<AnyRecord>(response);
  return normalizePaged<RewardStoreItem>(payload, ["items"]);
}

export async function getRewardStoreItem(id: string): Promise<RewardStoreItem> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.REWARD_STORE_ITEM_BY_ID(id));
  return normalizeRewardStoreItem(response);
}

export async function createRewardStoreItem(
  payload: RewardStoreItemRequest
): Promise<RewardStoreItem> {
  const response = await post<any>(GAMIFICATION_ENDPOINTS.REWARD_STORE_ITEMS, payload);
  return normalizeRewardStoreItem(response);
}

export async function updateRewardStoreItem(
  id: string,
  payload: RewardStoreItemUpdateRequest
): Promise<RewardStoreItem> {
  const response = await put<any>(
    GAMIFICATION_ENDPOINTS.REWARD_STORE_ITEM_BY_ID(id),
    payload
  );
  return normalizeRewardStoreItem(response);
}

export async function deleteRewardStoreItem(id: string): Promise<{ id?: string }> {
  const response = await del<any>(GAMIFICATION_ENDPOINTS.REWARD_STORE_ITEM_BY_ID(id));
  return unwrapData<{ id?: string }>(response);
}

export async function toggleRewardStoreItemStatus(
  id: string
): Promise<{ id: string; isActive: boolean }> {
  const response = await patch<any>(
    GAMIFICATION_ENDPOINTS.REWARD_STORE_TOGGLE_STATUS(id)
  );
  return unwrapData<{ id: string; isActive: boolean }>(response);
}

export async function requestRewardRedemption(
  payload: RewardRedemptionRequest
): Promise<RewardRedemption> {
  const response = await post<any>(GAMIFICATION_ENDPOINTS.REWARD_REDEMPTIONS, payload);
  return normalizeRewardRedemption(response);
}

export async function listRewardRedemptions(
  params: RewardRedemptionListParams = {}
): Promise<PaginatedItems<RewardRedemption>> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.REWARD_REDEMPTIONS, {
    params: cleanParams(params),
  });
  const payload = unwrapData<AnyRecord>(response);
  return normalizePaged<RewardRedemption>(payload, ["redemptions"]);
}

export async function getRewardRedemption(id: string): Promise<RewardRedemption> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.REWARD_REDEMPTION_BY_ID(id));
  return normalizeRewardRedemption(response);
}

export async function getMyRewardRedemptions(
  params: { status?: RedemptionStatus; page?: number; pageSize?: number } = {}
): Promise<PaginatedItems<RewardRedemption>> {
  const response = await get<any>(GAMIFICATION_ENDPOINTS.REWARD_REDEMPTIONS_ME, {
    params: cleanParams(params),
  });
  const payload = unwrapData<AnyRecord>(response);
  return normalizePaged<RewardRedemption>(payload, ["redemptions"]);
}

export async function approveRewardRedemption(id: string): Promise<RewardRedemption> {
  const response = await patch<any>(
    GAMIFICATION_ENDPOINTS.REWARD_REDEMPTION_APPROVE(id)
  );
  return normalizeRewardRedemption(response);
}

export async function cancelRewardRedemption(
  id: string,
  payload: RewardRedemptionCancelRequest = {}
): Promise<RewardRedemption> {
  const response = await patch<any>(
    GAMIFICATION_ENDPOINTS.REWARD_REDEMPTION_CANCEL(id),
    payload
  );
  return normalizeRewardRedemption(response);
}

export async function markRewardRedemptionDelivered(
  id: string
): Promise<RewardRedemption> {
  const response = await patch<any>(
    GAMIFICATION_ENDPOINTS.REWARD_REDEMPTION_MARK_DELIVERED(id)
  );
  return normalizeRewardRedemption(response);
}

export async function confirmRewardRedemptionReceived(
  id: string
): Promise<RewardRedemption> {
  const response = await patch<any>(
    GAMIFICATION_ENDPOINTS.REWARD_REDEMPTION_CONFIRM_RECEIVED(id)
  );
  return normalizeRewardRedemption(response);
}

export async function batchDeliverRewardRedemptions(
  params: BatchDeliverParams = {}
): Promise<BatchDeliverResult> {
  const response = await patch<any>(
    GAMIFICATION_ENDPOINTS.REWARD_REDEMPTION_BATCH_DELIVER,
    undefined,
    {
      params: cleanParams(params),
    }
  );
  return unwrapData<BatchDeliverResult>(response);
}

export async function linkHomeworkToMission(
  homeworkId: string,
  missionId: string
): Promise<{ homeworkId: string; missionId: string; missionTitle?: string }> {
  const response = await post<any>(`/api/homework/${homeworkId}/link-mission`, {
    missionId,
  });
  return unwrapData(response);
}

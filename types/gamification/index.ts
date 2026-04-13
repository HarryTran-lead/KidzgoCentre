import type { ApiResponse } from "../apiResponse";

export type MissionScope = "Class" | "Student" | "Group";
export type MissionType =
  | "HomeworkStreak"
  | "NoUnexcusedAbsence"
  | "Custom";

export type MissionProgressStatus =
  | "Assigned"
  | "InProgress"
  | "Completed"
  | "Expired";

export type RedemptionStatus =
  | "Requested"
  | "Approved"
  | "Delivered"
  | "Received"
  | "Cancelled";

export type ScopeOption = "all" | "own";

export interface PaginatedItems<T> {
  items: T[];
  pageNumber: number;
  pageSize?: number;
  totalPages: number;
  totalCount: number;
}

export interface ClassOptionLite {
  id: string;
  code?: string;
  title?: string;
  name?: string;
}

export interface GamificationSettingsConfig {
  checkInRewardStars: number;
  checkInRewardExp: number;
}

export interface Mission {
  id: string;
  title: string;
  description?: string | null;
  scope: MissionScope;
  targetClassId?: string | null;
  targetStudentId?: string | null;
  targetClassCode?: string | null;
  targetClassTitle?: string | null;
  targetGroup?: string[] | string | null;
  missionType: MissionType;
  startAt?: string | null;
  endAt?: string | null;
  rewardStars?: number | null;
  rewardExp?: number | null;
  totalRequired?: number | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
}

export interface MissionProgress {
  id: string;
  missionId: string;
  studentProfileId: string;
  studentName?: string | null;
  status: MissionProgressStatus;
  progressValue?: number | null;
  progressPercentage?: number | null;
  completedAt?: string | null;
  verifiedBy?: string | null;
  verifiedByName?: string | null;
}

export interface MissionProgressResponse {
  mission?: Pick<Mission, "id" | "title">;
  progresses: PaginatedItems<MissionProgress>;
}

export interface MissionListParams {
  scope?: MissionScope;
  targetClassId?: string;
  targetStudentId?: string;
  targetGroup?: string | string[];
  missionType?: MissionType;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface MissionProgressParams {
  studentProfileId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface UpsertMissionRequest {
  title: string;
  description?: string;
  scope: MissionScope;
  targetClassId?: string;
  targetStudentId?: string;
  targetGroup?: string[];
  missionType: MissionType;
  startAt?: string;
  endAt?: string;
  rewardStars?: number;
  rewardExp?: number;
  totalRequired?: number;
}

export interface StarTransaction {
  id: string;
  studentProfileId: string;
  amount: number;
  reason?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  balanceAfter: number;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
}

export interface StarBalance {
  studentProfileId: string;
  balance: number;
}

export interface StarMutationRequest {
  studentProfileId: string;
  amount: number;
  reason?: string;
}

export interface StarMutationResult {
  studentProfileId: string;
  amount: number;
  newBalance: number;
  transactionId?: string | null;
}

export interface StarTransactionsParams {
  studentProfileId: string;
  page?: number;
  pageSize?: number;
}

export interface StarTransactionsResult {
  transactions: StarTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface XpMutationRequest {
  studentProfileId: string;
  amount: number;
  reason?: string;
}

export interface XpMutationResult {
  studentProfileId: string;
  amount: number;
  newXp: number;
  newLevel: number;
  levelUp?: boolean;
  levelDown?: boolean;
}

export interface LevelInfo {
  studentProfileId: string;
  level: number;
  xp: number;
  xpRequiredForNextLevel: number;
}

export interface AttendanceStreakRecord {
  id: string;
  attendanceDate: string;
  currentStreak: number;
  rewardStars: number;
  rewardExp: number;
  createdAt?: string | null;
}

export interface AttendanceStreakInfo {
  studentProfileId: string;
  currentStreak: number;
  maxStreak: number;
  lastAttendanceDate?: string | null;
  recentStreaks: AttendanceStreakRecord[];
}

export interface AttendanceCheckInResult {
  studentProfileId: string;
  attendanceDate: string;
  currentStreak: number;
  maxStreak: number;
  rewardStars: number;
  rewardExp: number;
  isNewStreak: boolean;
}

export interface RewardStoreItem {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  costStars: number;
  quantity: number;
  isActive: boolean;
  createdAt?: string | null;
  isDeleted?: boolean;
}

export interface RewardStoreListParams {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RewardStoreItemRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  costStars: number;
  quantity: number;
  isActive: boolean;
}

export interface RewardStoreItemUpdateRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  costStars?: number;
  quantity?: number;
  isActive?: boolean;
}

export interface RewardRedemption {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  studentProfileId: string;
  studentName?: string | null;
  branchName?: string | null;
  status: RedemptionStatus;
  handledBy?: string | null;
  handledByName?: string | null;
  handledAt?: string | null;
  deliveredAt?: string | null;
  receivedAt?: string | null;
  createdAt?: string | null;
  starsDeducted?: number | null;
  remainingStars?: number | null;
  cancellationReason?: string | null;
}

export interface RewardRedemptionListParams {
  studentProfileId?: string;
  itemId?: string;
  status?: RedemptionStatus;
  page?: number;
  pageSize?: number;
}

export interface RewardRedemptionRequest {
  itemId: string;
  quantity?: number;
}

export interface RewardRedemptionCancelRequest {
  reason?: string;
}

export interface BatchDeliverParams {
  year?: number;
  month?: number;
}

export interface BatchDeliverResult {
  deliveredCount: number;
  deliveredRedemptionIds: string[];
  deliveredAt: string;
}

export type MissionApiResponse<T> = ApiResponse<T>;
export type GamificationApiResponse<T> = ApiResponse<T>;

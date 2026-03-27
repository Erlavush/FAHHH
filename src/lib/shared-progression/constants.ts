import type {
  SharedActivityClaimMode,
  SharedRoomActivityClaim,
  SharedRoomActivityId,
  SharedRoomProgressionState
} from "../sharedProgressionTypes";

export const ROOM_LEVEL_XP_THRESHOLDS = [0, 20, 55, 95, 140, 190] as const;
export const DESK_PC_XP_OFFSET = 4;
export const DAILY_RITUAL_BONUS_COINS = 12;
export const DAILY_RITUAL_BONUS_XP = 16;
export const SHARED_ROOM_ACTIVITY_IDS = [
  "pc_snake",
  "pc_block_stacker",
  "pc_runner",
  "cozy_rest"
] as const satisfies readonly SharedRoomActivityId[];

export interface SharedRitualStatusView {
  title: string;
  body: string;
  tone: "presence" | "attention" | "success";
  streakCount: number;
  ritualComplete: boolean;
  selfCompleted: boolean;
  partnerCompleted: boolean;
}

export interface SharedDeskPcCompletionProgressionResult {
  progression: SharedRoomProgressionState;
  dailyRitualStatus: "waiting" | "completed";
  dailyRitualBonusCoins: number;
  dailyRitualBonusXp: number;
  streakCount: number;
}

export interface SharedActivityClaimStatus {
  dayKey: string;
  activityId: SharedRoomActivityId;
  claimMode: SharedActivityClaimMode;
  payoutAvailable: boolean;
  selfClaimed: boolean;
  coupleClaimed: boolean;
  claim: SharedRoomActivityClaim | null;
}

export interface SharedActivityCompletionProgressionResult {
  progression: SharedRoomProgressionState;
  payoutGranted: boolean;
  paidToday: boolean;
  claimStatus: SharedActivityClaimStatus;
}
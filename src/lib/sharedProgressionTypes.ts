export interface SharedPlayerDeskPcActivityProgress {
  bestScore: number;
  gamesPlayed: number;
  lastRewardCoins: number;
  lastScore: number;
  lastCompletedAt: string | null;
  totalCoinsEarned: number;
}

export interface SharedPlayerDeskPcProgress {
  bestScore: number;
  gamesPlayed: number;
  lastRewardCoins: number;
  lastScore: number;
  lastCompletedAt: string | null;
  totalCoinsEarned: number;
  appsByActivityId?: Record<string, SharedPlayerDeskPcActivityProgress>;
}

export interface SharedPlayerProgression {
  playerId: string;
  coins: number;
  xp: number;
  level: number;
  deskPc: SharedPlayerDeskPcProgress;
  updatedAt: string;
}

export interface SharedCoupleRitualContribution {
  source: "desk_pc";
  completedAt: string;
  score: number;
  rewardCoins: number;
}

export interface SharedCoupleRitualDay {
  dayKey: string;
  completionsByPlayerId: Record<string, SharedCoupleRitualContribution>;
  completedAt: string | null;
  bonusAppliedAt: string | null;
}

export type SharedRoomActivityId = "pc_snake" | "pc_block_stacker" | "pc_pacman" | "cozy_rest";

export type SharedActivityClaimMode = "per_player" | "couple";

export interface SharedCoupleVisitDay {
  dayKey: string;
  visitedByPlayerId: Record<string, string>;
  countedAt: string | null;
}

export interface SharedFeaturedActivityDay {
  dayKey: string;
  activityId: SharedRoomActivityId;
  selectedAt: string;
}

export interface SharedRoomActivityRewardClaim {
  claimedAt: string;
  rewardCoins: number;
  rewardXp: number;
  score: number;
}

export interface SharedRoomActivityClaim {
  activityId: SharedRoomActivityId;
  claimMode: SharedActivityClaimMode;
  perPlayerClaimsByPlayerId: Record<string, SharedRoomActivityRewardClaim>;
  coupleClaim: SharedRoomActivityRewardClaim | null;
}

export type SharedRoomActivityClaimDay = Partial<Record<SharedRoomActivityId, SharedRoomActivityClaim>>;

export interface SharedCoupleProgression {
  streakCount: number;
  longestStreakCount: number;
  lastCompletedDayKey: string | null;
  togetherDaysCount: number;
  bestTogetherDaysCount: number;
  lastTogetherDayKey: string | null;
  visitDay: SharedCoupleVisitDay;
  featuredActivity: SharedFeaturedActivityDay | null;
  activityClaimsByDayKey: Record<string, SharedRoomActivityClaimDay>;
  ritual: SharedCoupleRitualDay;
  updatedAt: string;
}

export interface SharedRoomProgressionState {
  version: 1;
  players: Record<string, SharedPlayerProgression>;
  couple: SharedCoupleProgression;
  migratedFromSharedCoins: number | null;
}


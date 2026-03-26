export interface SharedPlayerDeskPcProgress {
  bestScore: number;
  gamesPlayed: number;
  lastRewardCoins: number;
  lastScore: number;
  lastCompletedAt: string | null;
  totalCoinsEarned: number;
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

export interface SharedCoupleProgression {
  streakCount: number;
  longestStreakCount: number;
  lastCompletedDayKey: string | null;
  ritual: SharedCoupleRitualDay;
  updatedAt: string;
}

export interface SharedRoomProgressionState {
  version: 1;
  players: Record<string, SharedPlayerProgression>;
  couple: SharedCoupleProgression;
  migratedFromSharedCoins: number | null;
}

import { ROOM_LEVEL_XP_THRESHOLDS } from "../lib/sharedProgression";
import type { SharedPlayerDeskPcProgress } from "../lib/sharedProgressionTypes";

export function getPlayerXpNextLevel(level: number): number {
  const thresholdIndex = Math.min(
    Math.max(1, Math.floor(level)),
    ROOM_LEVEL_XP_THRESHOLDS.length - 1
  );

  return ROOM_LEVEL_XP_THRESHOLDS[thresholdIndex];
}

export function toPcMinigameProgress(
  deskPc: SharedPlayerDeskPcProgress | null | undefined
) {
  return {
    bestScore: deskPc?.bestScore ?? 0,
    lastScore: deskPc?.lastScore ?? 0,
    gamesPlayed: deskPc?.gamesPlayed ?? 0,
    totalCoinsEarned: deskPc?.totalCoinsEarned ?? 0,
    lastRewardCoins: deskPc?.lastRewardCoins ?? 0,
    lastCompletedAt: deskPc?.lastCompletedAt ? Date.parse(deskPc.lastCompletedAt) : null
  };
}

export interface PcMinigameProgress {
  bestScore: number;
  lastScore: number;
  gamesPlayed: number;
  totalCoinsEarned: number;
  lastRewardCoins: number;
  lastCompletedAt: number | null;
}

export interface PcMinigameResult {
  score: number;
  rewardCoins: number;
  completedAt: number;
}

export const PC_MINIGAME_SESSION_MS = 25_000;
export const PC_MINIGAME_COOLDOWN_MS = 60_000;

export function createDefaultPcMinigameProgress(): PcMinigameProgress {
  return {
    bestScore: 0,
    lastScore: 0,
    gamesPlayed: 0,
    totalCoinsEarned: 0,
    lastRewardCoins: 0,
    lastCompletedAt: null
  };
}

export function getPcMinigameRewardCoins(score: number): number {
  const normalizedScore = Math.max(0, Math.floor(score));
  if (normalizedScore === 0) {
    return 0;
  }

  return Math.min(24, 2 + Math.floor(normalizedScore / 2));
}

export function getPcMinigameCooldownRemaining(
  lastCompletedAt: number | null,
  now = Date.now()
): number {
  if (lastCompletedAt === null || !Number.isFinite(lastCompletedAt)) {
    return 0;
  }

  return Math.max(0, lastCompletedAt + PC_MINIGAME_COOLDOWN_MS - now);
}

export function formatPcMinigameCooldown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function applyPcMinigameResult(
  progress: PcMinigameProgress,
  result: PcMinigameResult
): PcMinigameProgress {
  const normalizedScore = Math.max(0, Math.floor(result.score));
  const normalizedRewardCoins = Math.max(0, Math.floor(result.rewardCoins));
  const completedAt =
    typeof result.completedAt === "number" && Number.isFinite(result.completedAt)
      ? result.completedAt
      : Date.now();

  return {
    bestScore: Math.max(progress.bestScore, normalizedScore),
    lastScore: normalizedScore,
    gamesPlayed: progress.gamesPlayed + 1,
    totalCoinsEarned: progress.totalCoinsEarned + normalizedRewardCoins,
    lastRewardCoins: normalizedRewardCoins,
    lastCompletedAt: completedAt
  };
}

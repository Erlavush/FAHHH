export type PcDeskActivityId = "pc_snake" | "pc_block_stacker" | "pc_runner";

export interface PcMinigameProgress {
  bestScore: number;
  lastScore: number;
  gamesPlayed: number;
  totalCoinsEarned: number;
  lastRewardCoins: number;
  lastCompletedAt: number | null;
}

export interface PcDeskRunResult {
  activityId: PcDeskActivityId;
  score: number;
  rewardCoins: number;
  completedAt: number;
}

export type PcMinigameResult = Omit<PcDeskRunResult, "activityId"> & { activityId?: PcDeskActivityId };

export interface PcDeskAppDefinition {
  id: PcDeskActivityId;
  label: "Snake" | "Block Stacker" | "Runner";
  executableName: string;
  desktopIcon: string;
  intro: string;
  accentTone: "green" | "amber" | "cyan";
}

const PC_DESK_APP_DEFINITIONS: readonly PcDeskAppDefinition[] = [
  {
    id: "pc_snake",
    label: "Snake",
    executableName: "SNAKE.EXE",
    desktopIcon: "~",
    intro: "Guide the neon ribbon toward byte-fruit and keep the score climbing.",
    accentTone: "green"
  },
  {
    id: "pc_block_stacker",
    label: "Block Stacker",
    executableName: "STACKER.EXE",
    desktopIcon: "#",
    intro: "Catch clean lines, avoid jams, and keep the stack from getting messy.",
    accentTone: "amber"
  },
  {
    id: "pc_runner",
    label: "Runner",
    executableName: "RUNNER.EXE",
    desktopIcon: ">",
    intro: "Sprint through the dusk track, clear hazards, and keep the pace alive.",
    accentTone: "cyan"
  }
] as const;

export const PC_MINIGAME_SESSION_MS = 25_000;

export function createDefaultPcDeskProgress(): PcMinigameProgress {
  return {
    bestScore: 0,
    lastScore: 0,
    gamesPlayed: 0,
    totalCoinsEarned: 0,
    lastRewardCoins: 0,
    lastCompletedAt: null
  };
}

export function createDefaultPcMinigameProgress(): PcMinigameProgress {
  return createDefaultPcDeskProgress();
}

export function getPcDeskAppDefinitions(): PcDeskAppDefinition[] {
  return PC_DESK_APP_DEFINITIONS.map((definition) => ({ ...definition }));
}

export function getPcDeskRewardCoins(activityId: PcDeskActivityId, score: number): number {
  const normalizedScore = Math.max(0, Math.floor(score));

  switch (activityId) {
    case "pc_block_stacker":
      return Math.min(24, 4 + Math.floor(normalizedScore / 4));
    case "pc_runner":
      return Math.min(20, 2 + Math.floor(normalizedScore / 6));
    case "pc_snake":
    default:
      return Math.min(18, 2 + Math.floor(normalizedScore / 4));
  }
}

export function getPcMinigameRewardCoins(score: number): number {
  return getPcDeskRewardCoins("pc_snake", score);
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


